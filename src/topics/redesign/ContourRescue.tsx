import { useEffect, useRef, useState } from "react";
import {
  BinocularsIcon,
  CompassIcon,
  EyeIcon,
  MountainsIcon,
  PathIcon,
  WarningDiamondIcon,
} from "@phosphor-icons/react";
import {
  EvidenceBackpack,
  FieldButton,
  FieldLabFrame,
  FieldSlider,
} from "./FieldLabFrame";

type Point = readonly [number, number];

type RescueRoute = {
  id: "A" | "B" | "C";
  name: string;
  color: string;
  points: readonly [Point, Point, ...Point[]];
  valleyCrossings: number;
  lineOfSight: boolean;
  terrain: string;
  segments: readonly { title: string; note: string }[];
};

type RouteAnalysis = {
  distance: number;
  climb: number;
  maxSlope: number;
  score: number;
  profile: number[];
};

const mapWidthMetres = 3_500;
const mapHeightMetres = 2_300;

const routes = [
  {
    id: "A",
    name: "鞍部绕行线",
    color: "#1f704b",
    points: [[0.08, 0.84], [0.2, 0.77], [0.35, 0.75], [0.5, 0.68], [0.58, 0.5], [0.68, 0.36], [0.78, 0.25]],
    valleyCrossings: 0,
    lineOfSight: true,
    terrain: "缓坡—鞍部—山脊侧翼",
    segments: [
      { title: "起点至缓坡", note: "等高线较疏，持续上升但坡度温和。" },
      { title: "穿过鞍部", note: "从两座山体之间通过，避免翻越高点。" },
      { title: "接近目标", note: "沿山脊侧翼上行，视线连续。" },
    ],
  },
  {
    id: "B",
    name: "谷地直达线",
    color: "#a9551e",
    points: [[0.08, 0.84], [0.3, 0.65], [0.5, 0.49], [0.66, 0.35], [0.78, 0.25]],
    valleyCrossings: 2,
    lineOfSight: false,
    terrain: "谷地—陡坡—沟口",
    segments: [
      { title: "沿谷底前进", note: "路线较直接，但地势低且视线受阻。" },
      { title: "两次跨沟", note: "图上可见 V 形等高线，雨后风险会增大。" },
      { title: "末段急升", note: "等高线突然变密，体力消耗集中。" },
    ],
  },
  {
    id: "C",
    name: "高脊观察线",
    color: "#1f688e",
    points: [[0.08, 0.84], [0.12, 0.64], [0.2, 0.47], [0.34, 0.34], [0.5, 0.23], [0.65, 0.19], [0.78, 0.25]],
    valleyCrossings: 0,
    lineOfSight: true,
    terrain: "山脊—高点—山顶侧坡",
    segments: [
      { title: "快速登脊", note: "早段坡度较大，很快获得开阔视野。" },
      { title: "沿高脊绕行", note: "方向清楚，但路程和累计爬升都较大。" },
      { title: "下降至目标", note: "末段需要控制下坡速度。" },
    ],
  },
] as const satisfies readonly RescueRoute[];

function terrainHeight(x: number, y: number): number {
  const gaussian = (cx: number, cy: number, widthX: number, widthY: number, amplitude: number) => (
    amplitude * Math.exp(-(((x - cx) ** 2) / widthX + ((y - cy) ** 2) / widthY))
  );
  const base = 355 + x * 115 - y * 24;
  const targetMassif = gaussian(0.78, 0.25, 0.2, 0.16, 425);
  const westernHill = gaussian(0.27, 0.36, 0.038, 0.06, 215);
  const middleHill = gaussian(0.53, 0.63, 0.054, 0.037, 190);
  const ridge = gaussian(0.48, 0.39, 0.16, 0.009, 92);
  const valley = gaussian(0.45, 0.57, 0.014, 0.05, -175);
  return Math.max(300, Math.min(900, base + targetMassif + westernHill + middleHill + ridge + valley));
}

function samplePolyline(points: readonly Point[], sampleCount = 72): { x: number; y: number; distance: number }[] {
  const segmentLengths = points.slice(1).map((point, index) => {
    const previous = points[index]!;
    return Math.hypot(
      (point[0] - previous[0]) * mapWidthMetres,
      (point[1] - previous[1]) * mapHeightMetres,
    );
  });
  const total = segmentLengths.reduce((sum, length) => sum + length, 0);
  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const target = (index / (sampleCount - 1)) * total;
    let accumulated = 0;
    let segment = 0;
    while (segment < segmentLengths.length - 1 && accumulated + segmentLengths[segment]! < target) {
      accumulated += segmentLengths[segment]!;
      segment += 1;
    }
    const local = segmentLengths[segment] === 0 ? 0 : (target - accumulated) / segmentLengths[segment]!;
    const start = points[segment]!;
    const end = points[segment + 1]!;
    samples.push({
      x: start[0] + (end[0] - start[0]) * local,
      y: start[1] + (end[1] - start[1]) * local,
      distance: target,
    });
  }
  return samples;
}

function analyseRoute(route: RescueRoute): RouteAnalysis {
  const samples = samplePolyline(route.points);
  const profile = samples.map((sample) => terrainHeight(sample.x, sample.y));
  let climb = 0;
  let maxSlope = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const elevationChange = profile[index]! - profile[index - 1]!;
    const horizontal = samples[index]!.distance - samples[index - 1]!.distance;
    if (elevationChange > 0) climb += elevationChange;
    maxSlope = Math.max(maxSlope, Math.atan2(Math.abs(elevationChange), horizontal) * 180 / Math.PI);
  }
  const distance = samples.at(-1)?.distance ?? 0;
  const score = maxSlope * 2.2 + climb / 18 + route.valleyCrossings * 26 + (route.lineOfSight ? 0 : 18) + distance / 700;
  return {
    distance: distance / 1000,
    climb,
    maxSlope,
    score,
    profile,
  };
}

const analyses = Object.fromEntries(routes.map((route) => [route.id, analyseRoute(route)])) as Record<RescueRoute["id"], RouteAnalysis>;

function pointAlongRoute(route: RescueRoute, progress: number): Point {
  const samples = samplePolyline(route.points, 201);
  const point = samples[Math.round((progress / 100) * (samples.length - 1))];
  return [point!.x, point!.y];
}

function closestDistanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  return Math.hypot(point[0] - (start[0] + dx * t), point[1] - (start[1] + dy * t));
}

function contourSegments(level: number, columns = 64, rows = 44): [Point, Point][] {
  const segments: [Point, Point][] = [];
  const crossing = (edge: number, x: number, y: number, values: readonly number[]): Point => {
    const edgeCorners = [[0, 1], [1, 2], [3, 2], [0, 3]] as const;
    const coordinates: readonly Point[] = [
      [x / columns, y / rows],
      [(x + 1) / columns, y / rows],
      [(x + 1) / columns, (y + 1) / rows],
      [x / columns, (y + 1) / rows],
    ];
    const [fromIndex, toIndex] = edgeCorners[edge]!;
    const from = coordinates[fromIndex]!;
    const to = coordinates[toIndex]!;
    const difference = values[toIndex]! - values[fromIndex]!;
    const ratio = difference === 0 ? 0.5 : (level - values[fromIndex]!) / difference;
    return [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
  };
  const lookup: Record<number, readonly (readonly [number, number])[]> = {
    1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]],
    5: [[3, 2], [0, 1]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]],
    9: [[0, 2]], 10: [[0, 3], [1, 2]], 11: [[1, 2]], 12: [[3, 1]],
    13: [[0, 1]], 14: [[3, 0]],
  };
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const values = [
        terrainHeight(x / columns, y / rows),
        terrainHeight((x + 1) / columns, y / rows),
        terrainHeight((x + 1) / columns, (y + 1) / rows),
        terrainHeight(x / columns, (y + 1) / rows),
      ] as const;
      const state = values.reduce((sum, value, index) => sum + (value >= level ? 1 << index : 0), 0);
      for (const pair of lookup[state] ?? []) {
        segments.push([crossing(pair[0], x, y, values), crossing(pair[1], x, y, values)]);
      }
    }
  }
  return segments;
}

const contours = Array.from({ length: 12 }, (_, index) => 350 + index * 50).map((level) => ({ level, segments: contourSegments(level) }));

function prepareCanvas(canvas: HTMLCanvasElement) {
  const bounds = canvas.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * density);
  canvas.height = Math.round(bounds.height * density);
  const context = canvas.getContext("2d");
  context?.setTransform(density, 0, 0, density, 0, 0);
  return { context, width: bounds.width, height: bounds.height };
}

function drawRescueMap(canvas: HTMLCanvasElement, selected: RescueRoute, progress: number) {
  const { context, width, height } = prepareCanvas(canvas);
  if (!context || width === 0 || height === 0) return;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,250,229,.1)";
  context.fillRect(0, 0, width, height);

  for (const contour of contours) {
    context.beginPath();
    context.strokeStyle = contour.level % 100 === 0 ? "rgba(78,67,45,.62)" : "rgba(89,76,51,.36)";
    context.lineWidth = contour.level % 100 === 0 ? 1.25 : 0.72;
    for (const [start, end] of contour.segments) {
      context.moveTo(start[0] * width, start[1] * height);
      context.lineTo(end[0] * width, end[1] * height);
    }
    context.stroke();
  }

  context.font = "700 10px system-ui";
  context.fillStyle = "rgba(56,48,34,.75)";
  context.fillText("500", width * 0.18, height * 0.31);
  context.fillText("700", width * 0.72, height * 0.18);
  context.fillText("600", width * 0.51, height * 0.69);

  for (const route of routes) {
    context.beginPath();
    route.points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x * width, y * height);
      else context.lineTo(x * width, y * height);
    });
    context.strokeStyle = "rgba(255,255,255,.94)";
    context.lineWidth = route.id === selected.id ? 8 : 6;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    context.strokeStyle = route.color;
    context.lineWidth = route.id === selected.id ? 4.5 : 2.4;
    context.globalAlpha = route.id === selected.id ? 1 : 0.75;
    context.stroke();
    context.globalAlpha = 1;

    const labelPoint = route.points[Math.min(2, route.points.length - 1)]!;
    context.beginPath();
    context.fillStyle = route.color;
    context.arc(labelPoint[0] * width, labelPoint[1] * height, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "white";
    context.font = "900 11px system-ui";
    context.textAlign = "center";
    context.fillText(route.id, labelPoint[0] * width, labelPoint[1] * height + 4);
  }

  const start = routes[0].points[0];
  const target = routes[0].points[routes[0].points.length - 1]!;
  for (const [point, label, color] of [[start, "S", "#203a3e"], [target, "T", "#d24f3c"]] as const) {
    context.beginPath();
    context.fillStyle = "white";
    context.arc(point[0] * width, point[1] * height, 15, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.fillStyle = color;
    context.arc(point[0] * width, point[1] * height, 11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "white";
    context.font = "900 10px system-ui";
    context.fillText(label, point[0] * width, point[1] * height + 3.5);
  }

  const observation = pointAlongRoute(selected, progress);
  context.beginPath();
  context.fillStyle = "#fff7d6";
  context.strokeStyle = "#203a3e";
  context.lineWidth = 3;
  context.arc(observation[0] * width, observation[1] * height, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawProfile(canvas: HTMLCanvasElement, route: RescueRoute, analysis: RouteAnalysis, progress: number) {
  const { context, width, height } = prepareCanvas(canvas);
  if (!context || width === 0 || height === 0) return;
  context.clearRect(0, 0, width, height);
  const padding = { left: 31, right: 10, top: 14, bottom: 22 };
  const minimum = Math.floor(Math.min(...analysis.profile) / 50) * 50;
  const maximum = Math.ceil(Math.max(...analysis.profile) / 50) * 50;
  context.strokeStyle = "#cbbd9f";
  context.lineWidth = 1;
  for (let grid = 0; grid <= 3; grid += 1) {
    const y = padding.top + (height - padding.top - padding.bottom) * grid / 3;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }
  context.beginPath();
  analysis.profile.forEach((elevation, index) => {
    const x = padding.left + (width - padding.left - padding.right) * index / (analysis.profile.length - 1);
    const y = height - padding.bottom - ((elevation - minimum) / Math.max(1, maximum - minimum)) * (height - padding.top - padding.bottom);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = route.color;
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.stroke();
  const currentIndex = Math.round((progress / 100) * (analysis.profile.length - 1));
  const currentX = padding.left + (width - padding.left - padding.right) * currentIndex / (analysis.profile.length - 1);
  const currentY = height - padding.bottom - ((analysis.profile[currentIndex]! - minimum) / Math.max(1, maximum - minimum)) * (height - padding.top - padding.bottom);
  context.beginPath();
  context.fillStyle = "#fff7d6";
  context.strokeStyle = route.color;
  context.lineWidth = 2;
  context.arc(currentX, currentY, 5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#6a746f";
  context.font = "700 9px system-ui";
  context.textAlign = "left";
  context.fillText(`${minimum}m`, 1, height - padding.bottom + 3);
  context.fillText("起点", padding.left, height - 5);
  context.textAlign = "right";
  context.fillText("目标", width - padding.right, height - 5);
}

export default function ContourRescue(): React.JSX.Element {
  const [routeId, setRouteId] = useState<RescueRoute["id"]>("A");
  const [progress, setProgress] = useState(38);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const profileRef = useRef<HTMLCanvasElement>(null);
  const selected = routes.find((route) => route.id === routeId) ?? routes[0];
  const analysis = analyses[selected.id];
  const bestScore = Math.min(...routes.map((route) => analyses[route.id].score));
  const comparison = analysis.score === bestScore
    ? "在这张虚构地形图和给定指标下，这条路线相对稳妥。"
    : selected.id === "B"
      ? "路程较短，但跨沟、视线受阻和末段陡坡同时出现。"
      : "视线较好，但累计爬升和路程都高于 A 线。";

  useEffect(() => {
    const map = mapRef.current;
    const profile = profileRef.current;
    if (!map || !profile) return;
    const draw = () => {
      drawRescueMap(map, selected, progress);
      drawProfile(profile, selected, analysis, progress);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(map);
    observer.observe(profile);
    return () => observer.disconnect();
  }, [selected, analysis, progress]);

  const selectRoute = (id: RescueRoute["id"]) => {
    setRouteId(id);
    setProgress(38);
  };

  return (
    <FieldLabFrame
      className="rescue-field-lab"
      eyebrow="GQ-T006 · 山地救援手帐"
      title="任务 2 / 3：为救援队选择路线"
      prompt="读等高线，也要比较路程、爬升、沟谷与视线"
      notice="虚构高程网格，等高距 50 米。结论只表示图示条件下“相对稳妥”，不是现实救援建议。"
      decor={<img src="/assets/field-notebook/rescue-field-kit.webp" alt="救援野外工具：指北针、地图和急救包" />}
    >
      <div className="field-workspace">
        <section className="field-stage route-map-stage" aria-label="虚构等高线山地与三条候选救援路线">
          <canvas
            ref={mapRef}
            className="field-canvas"
            role="img"
            tabIndex={0}
            aria-label={`当前选择 ${selected.id} 线${selected.name}，观察点位于路线 ${progress}%`}
            onPointerDown={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const point: Point = [(event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height];
              const nearest = routes
                .map((route) => ({ route, distance: Math.min(...route.points.slice(1).map((end, index) => closestDistanceToSegment(point, route.points[index]!, end))) }))
                .sort((left, right) => left.distance - right.distance)[0];
              if (nearest && nearest.distance < 0.065) selectRoute(nearest.route.id);
            }}
            onKeyDown={(event) => {
              if (["1", "2", "3"].includes(event.key)) selectRoute(routes[Number(event.key) - 1]!.id);
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setProgress((value) => Math.max(0, Math.min(100, value + (event.key === "ArrowRight" ? 5 : -5))));
              }
            }}
          />
          <p className="field-stage__caption">直接点选彩色路线；键盘按 1/2/3 换线，方向键移动观察点。</p>
        </section>

        <section className="field-panel" aria-label="救援路线证据对比台">
          <div className="field-panel__head"><h3>候选路线</h3><span>由模型实时计算</span></div>
          <ul className="route-list">
            {routes.map((route) => {
              const item = analyses[route.id];
              return (
                <li key={route.id}>
                  <button
                    type="button"
                    className="route-choice"
                    style={{ "--route-color": route.color } as React.CSSProperties}
                    aria-pressed={route.id === selected.id}
                    onClick={() => selectRoute(route.id)}
                  >
                    <span className="route-choice__letter">{route.id}</span>
                    <span><strong>{route.name}</strong><small>{item.distance.toFixed(1)} km · 爬升 {Math.round(item.climb)} m</small></span>
                    <span className="route-choice__score">风险 {Math.round(item.score)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <FieldSlider label="沿路线观察" value={progress} min={0} max={100} step={1} unit="%" minLabel="起点" maxLabel="目标" onChange={setProgress} />
          <canvas
            ref={profileRef}
            className="route-profile-canvas"
            role="img"
            aria-label={`${selected.id} 线高程剖面，累计爬升 ${Math.round(analysis.climb)} 米，最大坡度 ${analysis.maxSlope.toFixed(1)} 度`}
          />
          <div className="field-metrics" aria-live="polite">
            <div><small>路程</small><strong>{analysis.distance.toFixed(1)}km</strong></div>
            <div><small>累计爬升</small><strong>{Math.round(analysis.climb)}m</strong></div>
            <div><small>最大坡度</small><strong>{analysis.maxSlope.toFixed(1)}°</strong></div>
          </div>
          <p className="field-feedback" aria-live="polite">{comparison}</p>
        </section>
      </div>

      <div className="route-evidence-row">
        <section className="route-segment-card" aria-labelledby="segment-title">
          <div className="field-panel__head"><h3 id="segment-title">分段读图</h3><span>{selected.terrain}</span></div>
          <ol className="route-segments">
            {selected.segments.map((segment) => <li key={segment.title}><strong>{segment.title}</strong><small>{segment.note}</small></li>)}
          </ol>
        </section>
        <aside className="route-missing-card">
          <WarningDiamondIcon aria-hidden="true" weight="duotone" />
          <div><strong>地图还没有告诉我们什么？</strong><p>天气、道路通行、落石、队员体力与通信条件都未进入模型，现实行动必须继续核实。</p></div>
        </aside>
      </div>

      <EvidenceBackpack
        summary="把“路线选择”写成可复核的证据链，而不是只报一个答案。"
        items={[
          { label: "地形判断", value: selected.terrain, detail: "依据等高线疏密、弯曲方向和路线位置", tone: "blue", icon: <MountainsIcon weight="duotone" /> },
          { label: "量化证据", value: `${analysis.distance.toFixed(1)}km / ${Math.round(analysis.climb)}m`, detail: `最大坡度 ${analysis.maxSlope.toFixed(1)}°`, tone: "green", icon: <PathIcon weight="duotone" /> },
          { label: "视线与沟谷", value: `${selected.lineOfSight ? "视线连续" : "视线受阻"} · 跨沟 ${selected.valleyCrossings} 次`, detail: "地图证据之一，不等同于完整风险", tone: "amber", icon: selected.lineOfSight ? <EyeIcon weight="duotone" /> : <BinocularsIcon weight="duotone" /> },
          { label: "相对结论", value: selected.id === "A" ? "A 线相对稳妥" : `${selected.id} 线不是当前首选`, detail: comparison, tone: "coral", icon: <CompassIcon weight="duotone" /> },
        ]}
        actions={<FieldButton type="button" variant="quiet" onClick={() => window.print()}>打印救援手帐</FieldButton>}
      />
    </FieldLabFrame>
  );
}
