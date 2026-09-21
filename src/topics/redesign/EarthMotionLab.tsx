import { useEffect, useRef, useState } from "react";
import {
  ArrowsClockwiseIcon,
  ClockIcon,
  GlobeHemisphereEastIcon,
  SunHorizonIcon,
} from "@phosphor-icons/react";
import {
  daylightDurationForSolarDay,
  localTimeDifferenceForSolarDay,
  solarDeclinationAtOrbit,
  solarNoonAltitude,
} from "../models";
import {
  EvidenceBackpack,
  FieldButton,
  FieldLabFrame,
  FieldSlider,
} from "./FieldLabFrame";

type ExperimentVariable = "tilt" | "rotation" | "direction";
type RotationDirection = "eastward" | "westward";

const orbitLabels = [
  { angle: 0, label: "春分" },
  { angle: 90, label: "夏至" },
  { angle: 180, label: "秋分" },
  { angle: 270, label: "冬至" },
] as const;

function downloadRecord(evidence: Record<string, string | number>) {
  const payload = JSON.stringify({ topic: "GQ-T003", evidence }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "GQ-T003-earth-motion-evidence.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function drawEarthLab(
  canvas: HTMLCanvasElement,
  values: {
    orbit: number;
    tilt: number;
    latitude: number;
    solarDayHours: number;
    direction: RotationDirection;
    daylight: number;
    declination: number;
    noonAltitude: number;
  },
) {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const width = bounds.width;
  const height = bounds.height;
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, width, height);

  context.fillStyle = "#103947";
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 42; index += 1) {
    const x = ((index * 83) % 997) / 997 * width;
    const y = ((index * 47) % 389) / 389 * height * 0.72;
    context.beginPath();
    context.fillStyle = index % 4 === 0 ? "rgba(255,244,202,.7)" : "rgba(255,255,255,.35)";
    context.arc(x, y, index % 3 === 0 ? 1.2 : 0.75, 0, Math.PI * 2);
    context.fill();
  }

  const sunX = width * 0.2;
  const sunY = height * 0.39;
  const orbitCenterX = width * 0.58;
  const orbitCenterY = height * 0.38;
  const orbitRadiusX = width * 0.31;
  const orbitRadiusY = height * 0.25;

  context.save();
  context.setLineDash([7, 7]);
  context.strokeStyle = "rgba(244,224,173,.58)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.ellipse(orbitCenterX, orbitCenterY, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  context.beginPath();
  context.fillStyle = "#f1c54b";
  context.shadowColor = "rgba(241,197,75,.62)";
  context.shadowBlur = 28;
  context.arc(sunX, sunY, Math.max(22, width * 0.037), 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#fff4c7";
  context.font = "700 12px system-ui";
  context.textAlign = "center";
  context.fillText("太阳", sunX, sunY + Math.max(39, width * 0.06));

  const orbitRadians = (values.orbit * Math.PI) / 180;
  const earthX = orbitCenterX + Math.cos(orbitRadians) * orbitRadiusX;
  const earthY = orbitCenterY - Math.sin(orbitRadians) * orbitRadiusY;
  const earthRadius = Math.max(25, width * 0.04);
  const lightAngle = Math.atan2(sunY - earthY, sunX - earthX);

  context.save();
  context.strokeStyle = "rgba(251,234,174,.35)";
  context.lineWidth = 1.2;
  for (let ray = -2; ray <= 2; ray += 1) {
    const offset = ray * earthRadius * 0.33;
    const normalX = -Math.sin(lightAngle) * offset;
    const normalY = Math.cos(lightAngle) * offset;
    context.beginPath();
    context.moveTo(sunX + normalX, sunY + normalY);
    context.lineTo(earthX + normalX, earthY + normalY);
    context.stroke();
  }
  context.restore();

  context.save();
  context.beginPath();
  context.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = "#2f92aa";
  context.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);
  context.translate(earthX, earthY);
  context.rotate(lightAngle);
  context.fillStyle = "#122b38";
  context.fillRect(0, -earthRadius, earthRadius, earthRadius * 2);
  context.fillStyle = "rgba(126,180,109,.9)";
  context.beginPath();
  context.ellipse(-earthRadius * 0.24, -earthRadius * 0.2, earthRadius * 0.28, earthRadius * 0.15, 0.3, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(-earthRadius * 0.12, earthRadius * 0.3, earthRadius * 0.18, earthRadius * 0.27, -0.45, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.beginPath();
  context.strokeStyle = "#bde8ef";
  context.lineWidth = 2;
  context.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
  context.stroke();

  const axisRadians = ((values.tilt - 90) * Math.PI) / 180;
  const axisLength = earthRadius * 1.55;
  context.beginPath();
  context.strokeStyle = "#f6dd9c";
  context.lineWidth = 2.4;
  context.moveTo(earthX - Math.cos(axisRadians) * axisLength, earthY - Math.sin(axisRadians) * axisLength);
  context.lineTo(earthX + Math.cos(axisRadians) * axisLength, earthY + Math.sin(axisRadians) * axisLength);
  context.stroke();

  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.font = "800 12px system-ui";
  context.fillText(`地轴 ${values.tilt.toFixed(1)}°`, earthX, earthY + earthRadius + 28);

  context.font = "700 11px system-ui";
  for (const item of orbitLabels) {
    const radians = (item.angle * Math.PI) / 180;
    const x = orbitCenterX + Math.cos(radians) * orbitRadiusX;
    const y = orbitCenterY - Math.sin(radians) * orbitRadiusY;
    context.fillStyle = Math.abs(item.angle - values.orbit) < 12 ? "#ffd865" : "rgba(255,255,255,.66)";
    context.fillText(item.label, x, y - 36);
  }

  const timelineX = width * 0.07;
  const timelineY = height * 0.82;
  const timelineWidth = width * 0.86;
  const timelineHeight = Math.max(23, height * 0.055);
  const daylightRatio = values.daylight / values.solarDayHours;
  const dawn = (1 - daylightRatio) / 2;
  context.fillStyle = "rgba(7,28,40,.72)";
  context.fillRect(timelineX, timelineY, timelineWidth, timelineHeight);
  context.fillStyle = "#f1c54b";
  context.fillRect(timelineX + timelineWidth * dawn, timelineY, timelineWidth * daylightRatio, timelineHeight);
  context.strokeStyle = "rgba(255,255,255,.42)";
  context.strokeRect(timelineX, timelineY, timelineWidth, timelineHeight);
  context.fillStyle = "#fff";
  context.textAlign = "left";
  context.font = "700 11px system-ui";
  context.fillText(`观测纬度 ${values.latitude}° · 昼长 ${values.daylight.toFixed(1)} / ${values.solarDayHours} 小时`, timelineX, timelineY - 9);
  context.textAlign = "center";
  context.fillStyle = "#20343a";
  context.fillText("白昼", timelineX + timelineWidth / 2, timelineY + timelineHeight * 0.7);
  context.fillStyle = "rgba(255,255,255,.75)";
  context.textAlign = "right";
  context.fillText(values.direction === "eastward" ? "自西向东自转" : "自东向西自转", timelineX + timelineWidth, timelineY + timelineHeight + 18);
}

export default function EarthMotionLab(): React.JSX.Element {
  const [variable, setVariable] = useState<ExperimentVariable>("tilt");
  const [orbit, setOrbit] = useState(90);
  const [latitude, setLatitude] = useState(40);
  const [tilt, setTilt] = useState(23.4);
  const [solarDayHours, setSolarDayHours] = useState(24);
  const [direction, setDirection] = useState<RotationDirection>("eastward");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectVariable = (next: ExperimentVariable) => {
    setVariable(next);
    setTilt(23.4);
    setSolarDayHours(24);
    setDirection("eastward");
  };

  const declination = solarDeclinationAtOrbit(orbit, tilt);
  const baselineDeclination = solarDeclinationAtOrbit(orbit, 23.4);
  const daylight = daylightDurationForSolarDay(latitude, declination, solarDayHours);
  const baselineDaylight = daylightDurationForSolarDay(latitude, baselineDeclination, 24);
  const noonAltitude = solarNoonAltitude(latitude, declination);
  const timeDifference = localTimeDifferenceForSolarDay(90, 120, solarDayHours);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawEarthLab(canvas, {
      orbit,
      tilt,
      latitude,
      solarDayHours,
      direction,
      daylight,
      declination,
      noonAltitude,
    });
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [orbit, tilt, latitude, solarDayHours, direction, daylight, declination, noonAltitude]);

  const variableLabel = {
    tilt: "地轴倾角",
    rotation: "自转周期",
    direction: "自转方向",
  }[variable];

  const difference = daylight - baselineDaylight;
  const mechanism = variable === "tilt"
    ? Math.abs(tilt - 23.4) < 0.05
      ? "当前值与基准相同；拖动倾角开始比较。"
      : tilt === 0
        ? "倾角为 0° 时，直射点停在赤道，季节性的昼长差异明显减弱。"
        : `倾角改变了太阳直射纬度，本地点昼长比基准${difference >= 0 ? "增加" : "减少"}${Math.abs(difference).toFixed(1)}小时。`
    : variable === "rotation"
      ? `白昼占一天的比例近似不变，但一个昼夜被拉伸为 ${solarDayHours} 小时。`
      : direction === "westward"
        ? "反向自转会改变太阳的升落方向和地方时先后，但不会单独制造四季。"
        : "当前仍为自西向东自转；东边地点先进入同一地方时。";

  const evidence = {
    实验变量: variableLabel,
    观测位置: `${latitude}°N · ${orbitLabels.reduce((nearest, item) => Math.abs(item.angle - orbit) < Math.abs(nearest.angle - orbit) ? item : nearest).label}附近`,
    太阳直射纬度: `${declination.toFixed(1)}°`,
    正午太阳高度: `${noonAltitude.toFixed(1)}°`,
    白昼时长: `${daylight.toFixed(1)} 小时`,
    机制解释: mechanism,
  };

  return (
    <FieldLabFrame
      className="earth-field-lab"
      eyebrow="GQ-T003 · 地球实验手帐"
      title="任务 2 / 3：改变一种运动条件"
      prompt="先建立基准，再一次只改一个变量"
      notice="原创二维教学模型。自转周期采用教学近似；天体大小、距离与速度不按比例。"
    >
      <div className="field-workspace">
        <section className="field-stage earth-stage" aria-label="地球公转、光照与昼长联动模型">
          <canvas
            ref={canvasRef}
            className="field-canvas"
            role="img"
            aria-label={`地球位于轨道 ${orbit} 度，地轴倾角 ${tilt} 度，${latitude} 度北纬白昼 ${daylight.toFixed(1)} 小时`}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              const delta = event.key === "ArrowRight" ? 5 : -5;
              setOrbit((value) => (value + delta + 360) % 360);
            }}
          />
          <div className="earth-stage__legend" aria-hidden="true">
            <span>光照方向</span><span>昼夜分界</span><span>纬度昼弧</span>
          </div>
          <p className="field-stage__caption">拖动轨道位置或按画布左右方向键，观察光照和昼长同步变化。</p>
        </section>

        <section className="field-panel" aria-label="地球运动实验控制台">
          <div className="field-panel__head">
            <h3>单变量实验</h3><span>实时联动</span>
          </div>
          <div className="field-control-tabs" aria-label="选择实验变量">
            {([
              ["tilt", "地轴倾角"],
              ["rotation", "自转周期"],
              ["direction", "自转方向"],
            ] as const).map(([key, label]) => (
              <button key={key} className="field-tab" type="button" aria-pressed={variable === key} onClick={() => selectVariable(key)}>{label}</button>
            ))}
          </div>

          <FieldSlider label="轨道位置" value={orbit} min={0} max={355} step={5} unit="°" minLabel="春分 0°" maxLabel="冬至 270°" onChange={setOrbit} />
          <FieldSlider label="观测纬度" value={latitude} min={0} max={70} step={1} unit="°N" minLabel="赤道" maxLabel="高纬" onChange={setLatitude} />

          {variable === "tilt" ? (
            <FieldSlider label="地轴倾角" value={tilt} min={0} max={45} step={0.1} unit="°" minLabel="无倾角" maxLabel="强倾角" onChange={setTilt} />
          ) : null}
          {variable === "rotation" ? (
            <FieldSlider label="一个太阳日（教学近似）" value={solarDayHours} min={12} max={48} step={1} unit="h" minLabel="转得较快" maxLabel="转得较慢" onChange={setSolarDayHours} />
          ) : null}
          {variable === "direction" ? (
            <div className="field-chip-row" aria-label="选择自转方向">
              <button className="field-chip" type="button" aria-pressed={direction === "eastward"} onClick={() => setDirection("eastward")}>自西向东（当前）</button>
              <button className="field-chip" type="button" aria-pressed={direction === "westward"} onClick={() => setDirection("westward")}>自东向西（反事实）</button>
            </div>
          ) : null}

          <div className="field-metrics" aria-live="polite">
            <div><small>白昼</small><strong>{daylight.toFixed(1)} h</strong></div>
            <div><small>直射纬度</small><strong>{declination.toFixed(1)}°</strong></div>
            <div><small>正午太阳高度</small><strong>{noonAltitude.toFixed(1)}°</strong></div>
          </div>
          <p className="field-feedback" aria-live="polite">{mechanism}</p>
          <p className="model-boundary">地方时示例：90°E 与 120°E 相差约 {timeDifference.toFixed(1)} 小时。自转周期变化只作方向性比较，不用于现实天文预测。</p>
          <FieldButton variant="quiet" type="button" onClick={() => { selectVariable("tilt"); setOrbit(90); setLatitude(40); }}>回到当前地球基准</FieldButton>
        </section>
      </div>

      <EvidenceBackpack
        summary="把当前画面里的现象整理成一条可以复核的解释。"
        items={[
          { label: "本轮只改变", value: variableLabel, detail: variable === "tilt" ? `${tilt.toFixed(1)}°` : variable === "rotation" ? `${solarDayHours} 小时` : direction === "eastward" ? "自西向东" : "自东向西", tone: "amber", icon: <ArrowsClockwiseIcon weight="duotone" /> },
          { label: "光照证据", value: `直射 ${declination.toFixed(1)}°`, detail: `正午太阳高度 ${noonAltitude.toFixed(1)}°`, tone: "blue", icon: <SunHorizonIcon weight="duotone" /> },
          { label: "昼长证据", value: `${daylight.toFixed(1)} 小时`, detail: `基准 ${baselineDaylight.toFixed(1)} 小时`, tone: "green", icon: <ClockIcon weight="duotone" /> },
          { label: "结论边界", value: "解释方向，不做预测", detail: "模型忽略真实轨道偏心率与大气折射", tone: "coral", icon: <GlobeHemisphereEastIcon weight="duotone" /> },
        ]}
        actions={<>
          <FieldButton type="button" onClick={() => downloadRecord(evidence)}>下载实验记录</FieldButton>
          <FieldButton type="button" variant="quiet" onClick={() => window.print()}>打印手帐</FieldButton>
        </>}
      />
    </FieldLabFrame>
  );
}
