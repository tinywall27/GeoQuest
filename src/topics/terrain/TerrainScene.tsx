import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLS, ROWS, WIDTH, DEPTH, heights, contourPoint, elevation, elevationColor, getContours, routeAnalyses, type RouteId } from "./terrainModel";

export interface SceneProps {
  routeId: RouteId;
  progress: number;
  interval: number;
  slice: number;
  showSlice: boolean;
  exaggeration: number;
  view: "perspective" | "top";
  bearing: number;
  cameraReset: number;
}

export default function TerrainScene(props: SceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<((next: SceneProps) => void) | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { queueMicrotask(() => setFailed(true)); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "可旋转的三维山地；也可使用视角按钮和右侧等高线图探索");
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.dataset.terrain = "ready";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .05, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 4;
    controls.maxDistance = 11;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, .65, 0);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    scene.add(new THREE.HemisphereLight(0xe3f1ff, 0x605b3c, 2.1));
    const light = new THREE.DirectionalLight(0xfff1d6, 2.6);
    light.position.set(-3, 7, 4);
    scene.add(light);
    const land = new THREE.Group();
    scene.add(land);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const geo = new THREE.PlaneGeometry(WIDTH / 1000, DEPTH / 1000, COLS - 1, ROWS - 1);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.getAttribute("position");
    const colors: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, heights[i]! / 1000);
      const color = new THREE.Color(elevationColor(heights[i]!));
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, side: THREE.DoubleSide });
    land.add(new THREE.Mesh(geo, material));
    geometries.push(geo); materials.push(material);
    // Close all four edges down to the same base: this is a terrain volume, not a floating sheet.
    const boundary = [
      ...Array.from({length: COLS}, (_, i) => i),
      ...Array.from({length: ROWS - 1}, (_, i) => (i + 1) * COLS + COLS - 1),
      ...Array.from({length: COLS - 1}, (_, i) => ROWS * COLS - 2 - i),
      ...Array.from({length: ROWS - 2}, (_, i) => (ROWS - 2 - i) * COLS),
    ];
    const wallVertices: number[] = [];
    boundary.forEach((a, i) => {
      const b = boundary[(i + 1) % boundary.length]!;
      const p = new THREE.Vector3().fromBufferAttribute(positions, a);
      const q = new THREE.Vector3().fromBufferAttribute(positions, b);
      wallVertices.push(p.x,p.y,p.z, q.x,q.y,q.z, p.x,-.08,p.z, q.x,q.y,q.z, q.x,-.08,q.z, p.x,-.08,p.z);
    });
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(wallVertices, 3));
    wallGeo.computeVertexNormals();
    const wallMat = new THREE.MeshStandardMaterial({color: 0x706f52, roughness: 1, side: THREE.DoubleSide});
    land.add(new THREE.Mesh(wallGeo, wallMat)); geometries.push(wallGeo); materials.push(wallMat);
    const contourGroup = new THREE.Group(); land.add(contourGroup);
    let previousInterval = -1;
    const clearContours = () => {
      for (const child of [...contourGroup.children]) {
        if (child instanceof THREE.Line) { (child.geometry as THREE.BufferGeometry).dispose(); (child.material as THREE.Material).dispose(); }
        contourGroup.remove(child);
      }
    };
    const routeObjects = routeAnalyses.map(route => {
      const points = route.samples.map(p => new THREE.Vector3((p.x - .5) * 4, p.elevation / 1000 + .012, (p.y - .5) * 3));
      const routeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, "centripetal"), 240, .012, 5, false);
      const mat = new THREE.MeshBasicMaterial({color: route.color, transparent: true, opacity: .5});
      const mesh = new THREE.Mesh(routeGeo, mat);
      land.add(mesh); geometries.push(routeGeo); materials.push(mat);
      return mesh;
    });
    const markerGeo = new THREE.SphereGeometry(.045, 16, 12);
    const markerMat = new THREE.MeshBasicMaterial({color: 0xffffff});
    const marker = new THREE.Mesh(markerGeo, markerMat); land.add(marker);
    geometries.push(markerGeo); materials.push(markerMat);
    // Always face the viewer. These small original labels are generated locally.
    for (const [x,y,text] of [[.1,.88,"S"],[.7,.33,"T"]] as const) {
      const canvas = document.createElement("canvas"); canvas.width=64; canvas.height=64;
      const ctx=canvas.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle="#254034"; ctx.beginPath(); ctx.arc(32,32,26,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#ffffff"; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle="#ffffff"; ctx.font="bold 30px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(text,32,33);
      const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
      const mat=new THREE.SpriteMaterial({map:texture,depthTest:false});
      const sprite=new THREE.Sprite(mat); sprite.position.set((x-.5)*4,elevation(x,y)/1000+.12,(y-.5)*3); sprite.scale.set(.19,.19,1);
      land.add(sprite); materials.push(mat); textures.push(texture);
    }
    const planeGeo = new THREE.PlaneGeometry(4.08, 3.08); planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshBasicMaterial({color: 0x77d8d0, transparent:true, opacity:.2, side: THREE.DoubleSide, depthWrite: false});
    const plane = new THREE.Mesh(planeGeo, planeMat); land.add(plane);
    geometries.push(planeGeo); materials.push(planeMat);
    let oldView = "";
    let oldBearing = -999;
    let oldReset = -1;
    updateRef.current = next => {
      land.scale.y = next.exaggeration;
      for (const child of land.children) if (child instanceof THREE.Sprite) child.scale.y = .19 / next.exaggeration;
      if (next.interval !== previousInterval) {
        clearContours(); previousInterval = next.interval;
        for (const contour of getContours(next.interval)) {
          for (const polygon of contour.coordinates) for (const ring of polygon) {
            const points = ring.map(p => { const [x,y] = contourPoint(p); return new THREE.Vector3((x - .5)*4, contour.value/1000+.004, (y-.5)*3); });
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({color: 0x263d30, transparent: true, opacity: .4});
            contourGroup.add(new THREE.Line(lineGeo,lineMat));
          }
        }
      }
      routeObjects.forEach((mesh,i) => { mesh.material.opacity = routeAnalyses[i]!.id === next.routeId ? 1 : .45; mesh.visible = true; });
      const selected = routeAnalyses.find(r => r.id === next.routeId)!;
      const point = selected.samples[Math.round(next.progress / 100 * (selected.samples.length-1))]!;
      marker.position.set((point.x-.5)*4, point.elevation/1000+.055, (point.y-.5)*3);
      marker.scale.y = 1 / next.exaggeration;
      plane.position.y = next.slice / 1000;
      plane.visible = next.showSlice;
      if (next.view !== oldView || next.bearing !== oldBearing || next.cameraReset !== oldReset) {
        oldView = next.view; oldBearing = next.bearing; oldReset = next.cameraReset;
        const angle = next.bearing * Math.PI / 180;
        camera.position.set(next.view === "top" ? 0 : Math.sin(angle)*6.7, next.view === "top" ? 8.5 : 4.6, next.view === "top" ? .001 : Math.cos(angle)*6.7);
        controls.update();
      }
      render();
    };
    const resize = () => {
      const {width, height} = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width/height;
      // Keep the complete terrain in frame on a narrow portrait canvas.
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(19)) / Math.min(1, camera.aspect / 1.15)));
      camera.updateProjectionMatrix(); renderer.setSize(width,height); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      observer.disconnect(); controls.dispose(); clearContours();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t=>t.dispose());
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose(); renderer.domElement.remove(); updateRef.current = null;
    };
  }, []);
  useEffect(() => { updateRef.current?.(props); }, [props]);
  return <div ref={hostRef} className="terrain-canvas">{failed && <div className="terrain-fallback" role="status"><strong>当前设备无法显示三维视图</strong><p>右侧等高线图、路线剖面和全部计算仍然可用。</p></div>}</div>;
}
