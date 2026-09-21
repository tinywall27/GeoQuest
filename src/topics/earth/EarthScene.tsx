import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {earthState,cross} from "./earthModel";
export interface EarthSceneProps {orbit:number;tilt:number;latitude:number;hour:number;view:"light"|"observer"|"north";reset:number}
export default function EarthScene(props:EarthSceneProps){
  const hostRef=useRef<HTMLDivElement>(null),updateRef=useRef<((p:EarthSceneProps)=>void)|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{queueMicrotask(()=>setFailed(true));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.dataset.earth="ready";renderer.domElement.setAttribute("role","img");renderer.domElement.setAttribute("aria-label","三维地球光照模型，黄色为赤道，青色为观测纬线，P 为观测点；可用视角按钮代替拖动");host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.05,40);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=3.5;controls.maxDistance=9;
    const render=()=>renderer.render(scene,camera);controls.addEventListener("change",render);
    const spin=new THREE.Group();scene.add(spin);
    const sunUniform={value:new THREE.Vector3(0,0,1)},latitudeUniform={value:Math.sin(40*Math.PI/180)};
    const material=new THREE.ShaderMaterial({
      uniforms:{sun:sunUniform,latitude:latitudeUniform},
      vertexShader:`varying vec3 worldNormal; varying vec3 localNormal; varying vec3 worldPosition;
        void main(){localNormal=normal;worldNormal=normalize(mat3(modelMatrix)*normal);worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}`,
      fragmentShader:`uniform vec3 sun;uniform float latitude;varying vec3 worldNormal;varying vec3 localNormal;varying vec3 worldPosition;
        void main(){vec3 n=normalize(worldNormal);float facing=dot(n,sun);float day=smoothstep(-.008,.008,facing);
        vec3 night=vec3(.012,.033,.074);vec3 lit=vec3(.045,.29,.40)*(.64+.36*max(facing,0.));vec3 color=mix(night,lit,day);
        float lon=atan(localNormal.z,localNormal.x);float lat=asin(clamp(localNormal.y,-1.,1.));
        float grid=max(1.-smoothstep(.012,.036,abs(sin(lon*12.))),1.-smoothstep(.012,.036,abs(sin(lat*12.))));
        color=mix(color,vec3(.30,.58,.63)*(.25+.75*day),grid*.42);
        float eq=1.-smoothstep(.006,.013,abs(localNormal.y));color=mix(color,vec3(.92,.58,.12)*(.4+.6*day),eq);
        float parallel=1.-smoothstep(.005,.012,abs(localNormal.y-latitude));color=mix(color,vec3(.23,.82,.85)*(.4+.6*day),parallel);
        float rim=pow(1.-max(dot(n,normalize(cameraPosition-worldPosition)),0.),4.);color+=vec3(.04,.11,.17)*rim;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    });
    const sphereGeo=new THREE.SphereGeometry(1,96,64);spin.add(new THREE.Mesh(sphereGeo,material));
    const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
    const axisMat=new THREE.LineBasicMaterial({color:0xf6dab1});const axisLine=new THREE.Line(lineGeo,axisMat);scene.add(axisLine);
    const markerGeo=new THREE.SphereGeometry(.035,16,12),markerMat=new THREE.MeshBasicMaterial({color:0xffd280});const marker=new THREE.Mesh(markerGeo,markerMat);scene.add(marker);
    const textures:THREE.Texture[]=[],sprites:THREE.Sprite[]=[];
    function label(text:string,color:string){
      const c=document.createElement("canvas");c.width=128;c.height=64;const ctx=c.getContext("2d")!;
      ctx.fillStyle=color;ctx.font="bold 42px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,64,32);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(.52,.26,1);scene.add(sprite);sprites.push(sprite);return sprite;
    }
    const north=label("N","#ffe0ad"),south=label("S","#ffe0ad"),point=label("P","#fff1cd");
    const arrows=Array.from({length:3},()=>{const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),.75,0xf8c85a,.15,.09);scene.add(arrow);return arrow;});
    let oldView="",oldOrbit=-1,oldTilt=-1,oldReset=-1;
    updateRef.current=p=>{
      const data=earthState(p.orbit,p.tilt,p.latitude,p.hour),sun=new THREE.Vector3(...data.sun),axis=new THREE.Vector3(...data.axis),observer=new THREE.Vector3(...data.observer);
      sunUniform.value.copy(sun);latitudeUniform.value=Math.sin(p.latitude*Math.PI/180);
      spin.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),-p.tilt*Math.PI/180).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),data.spinAngle));
      const positions=lineGeo.getAttribute("position");positions.setXYZ(0,-axis.x*1.36,-axis.y*1.36,-axis.z*1.36);positions.setXYZ(1,axis.x*1.36,axis.y*1.36,axis.z*1.36);positions.needsUpdate=true;lineGeo.computeBoundingSphere();
      north.position.copy(axis).multiplyScalar(1.48);south.position.copy(axis).multiplyScalar(-1.48);
      marker.position.copy(observer).multiplyScalar(1.035);point.position.copy(observer).multiplyScalar(1.16);
      const perpendicular=new THREE.Vector3(...cross(data.axis,data.sun)).normalize();
      arrows.forEach((arrow,i)=>{arrow.position.copy(sun).multiplyScalar(2.25).addScaledVector(perpendicular,(i-1)*.35);arrow.setDirection(sun.clone().negate());});
      if(p.view==="observer"||p.view!==oldView||p.orbit!==oldOrbit||p.tilt!==oldTilt||p.reset!==oldReset){
        if(p.view==="observer")camera.position.copy(observer).multiplyScalar(5.3).addScaledVector(axis,.15);
        else if(p.view==="north")camera.position.copy(axis).multiplyScalar(5.7).addScaledVector(sun,.02);
        else camera.position.copy(sun).multiplyScalar(2.1).addScaledVector(perpendicular,4.8).addScaledVector(axis,1.8);
        camera.up.set(0,1,0);controls.target.set(0,0,0);controls.update();
      }
      oldView=p.view;oldOrbit=p.orbit;oldTilt=p.tilt;oldReset=p.reset;
      renderer.domElement.dataset.light=data.light;render();
    };
    const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(20*Math.PI/180)/Math.min(1,camera.aspect)));camera.updateProjectionMatrix();renderer.setSize(width,height);render();};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const lost=(e:Event)=>{e.preventDefault();setFailed(true);};renderer.domElement.addEventListener("webglcontextlost",lost);
    return()=>{observer.disconnect();controls.dispose();sphereGeo.dispose();material.dispose();lineGeo.dispose();axisMat.dispose();markerGeo.dispose();markerMat.dispose();textures.forEach(t=>t.dispose());sprites.forEach(s=>s.material.dispose());arrows.forEach(a=>a.dispose());renderer.domElement.removeEventListener("webglcontextlost",lost);renderer.dispose();renderer.domElement.remove();updateRef.current=null;};
  },[]);
  useEffect(()=>{updateRef.current?.(props);},[props]);
  return <div className="earth-canvas" ref={hostRef}>{failed&&<div className="earth-fallback" role="status"><strong>当前设备无法显示三维地球</strong><p>公转示意、太阳高度曲线、昼长条和证据记录仍可完成探究。</p></div>}</div>;
}
