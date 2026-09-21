import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  DropIcon,
  LeafIcon,
  NotebookIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import {
  detailedErosionBaseline,
  detailedErosionModel,
  type DetailedErosionInput,
  type DetailedErosionPractice,
} from "../models";
import {
  EvidenceBackpack,
  FieldButton,
  FieldLabFrame,
  FieldSlider,
} from "./FieldLabFrame";

type ErosionVariable = keyof DetailedErosionInput;

const variableLabels: Record<ErosionVariable, string> = {
  rainIntensity: "降雨强度",
  slopeDegrees: "坡度",
  vegetationCover: "植被覆盖",
  practice: "保土措施",
};

const practiceLabels: Record<DetailedErosionPractice, string> = {
  downslope: "顺坡耕作",
  contour: "等高耕作",
  terrace: "梯田",
  grass: "草带拦截",
};

function hasChanged(variable: ErosionVariable, values: DetailedErosionInput): boolean {
  return values[variable] !== detailedErosionBaseline[variable];
}

function drawErosionScene(
  canvas: HTMLCanvasElement,
  input: DetailedErosionInput,
  time: number,
  reducedMotion: boolean,
) {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * density);
  canvas.height = Math.round(bounds.height * density);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(density, 0, 0, density, 0, 0);
  const width = bounds.width;
  const height = bounds.height;
  const result = detailedErosionModel(input);
  const slopeRise = height * (0.27 + (input.slopeDegrees - 5) / 30 * 0.26);
  const leftY = height * 0.33;
  const rightY = leftY + slopeRise;
  const skyHeight = height * 0.72;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#cce7ed";
  context.fillRect(0, 0, width, skyHeight);
  context.fillStyle = "rgba(255,255,255,.55)";
  context.beginPath();
  context.ellipse(width * 0.18, height * 0.14, width * 0.12, height * 0.038, 0, 0, Math.PI * 2);
  context.ellipse(width * 0.3, height * 0.12, width * 0.14, height * 0.045, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.moveTo(0, leftY);
  context.lineTo(width, rightY);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = "#b88948";
  context.fill();

  const normalX = -(rightY - leftY) / width;
  const normalLength = Math.hypot(normalX, 1);
  const nx = normalX / normalLength;
  const ny = -1 / normalLength;
  const soilBands = [0.12, 0.25, 0.39];
  for (const depth of soilBands) {
    context.beginPath();
    context.moveTo(0, leftY + height * depth);
    context.lineTo(width, rightY + height * depth);
    context.strokeStyle = "rgba(91,53,25,.24)";
    context.lineWidth = 2;
    context.stroke();
  }

  const plantCount = Math.round(3 + input.vegetationCover / 7);
  for (let index = 0; index < plantCount; index += 1) {
    const ratio = (index + 0.6) / plantCount;
    const x = ratio * width;
    const ground = leftY + (rightY - leftY) * ratio;
    const heightVariation = 10 + ((index * 17) % 11);
    context.strokeStyle = "#2d7747";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, ground);
    context.lineTo(x + nx * heightVariation, ground + ny * heightVariation);
    context.stroke();
    context.fillStyle = "#4b9959";
    context.beginPath();
    context.ellipse(x + nx * heightVariation - 3, ground + ny * heightVariation + 3, 5, 2.3, -0.55, 0, Math.PI * 2);
    context.fill();
  }

  if (input.practice === "contour" || input.practice === "terrace" || input.practice === "grass") {
    const count = input.practice === "terrace" ? 5 : 7;
    for (let index = 1; index <= count; index += 1) {
      const ratio = index / (count + 1);
      const x = ratio * width;
      const ground = leftY + (rightY - leftY) * ratio;
      context.beginPath();
      context.strokeStyle = input.practice === "grass" ? "#2b7a47" : "#765129";
      context.lineWidth = input.practice === "grass" ? 7 : 4;
      context.moveTo(x - 16, ground - (rightY - leftY) * 16 / width);
      context.lineTo(x + 16, ground + (rightY - leftY) * 16 / width);
      context.stroke();
      if (input.practice === "terrace") {
        context.beginPath();
        context.moveTo(x - 32, ground - 3);
        context.lineTo(x + 12, ground - 3);
        context.stroke();
      }
    }
  }

  const rainCount = Math.round(12 + input.rainIntensity * 0.48);
  const phase = reducedMotion ? 0.35 : (time / 900) % 1;
  context.strokeStyle = `rgba(37,111,151,${0.28 + input.rainIntensity / 150})`;
  context.lineWidth = input.rainIntensity > 58 ? 2 : 1.3;
  for (let index = 0; index < rainCount; index += 1) {
    const x = ((index * 73) % 997) / 997 * width;
    const offset = (((index * 37) % 101) / 101 + phase) % 1;
    const y = offset * (leftY + (rightY - leftY) * (x / width));
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - 4, y + 11 + input.rainIntensity / 13);
    context.stroke();
  }

  const flowCount = Math.max(2, Math.round(result.runoff / 12));
  for (let index = 0; index < flowCount; index += 1) {
    const ratio = (index + 0.35) / flowCount;
    const startX = ratio * width * 0.75;
    const startY = leftY + (rightY - leftY) * (startX / width) + 3 + index % 3 * 3;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(startX + width * 0.13, startY + height * 0.08, Math.min(width, startX + width * 0.26), startY + height * 0.13);
    context.strokeStyle = `rgba(61,117,140,${0.3 + result.runoff / 160})`;
    context.lineWidth = 1.5 + result.runoff / 34;
    context.stroke();
  }

  const sedimentCount = Math.max(3, Math.round(result.erosion / 5));
  context.fillStyle = `rgba(111,66,31,${0.36 + result.erosion / 180})`;
  for (let index = 0; index < sedimentCount; index += 1) {
    const x = width * (0.62 + ((index * 29) % 37) / 100);
    const y = rightY + height * (0.09 + ((index * 19) % 17) / 100);
    context.beginPath();
    context.arc(x, Math.min(height - 8, y), 1.4 + (index % 3) * 0.5, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(255,250,240,.9)";
  context.fillRect(13, height - 64, 174, 49);
  context.fillStyle = "#284047";
  context.font = "800 11px system-ui";
  context.fillText(`坡面径流 ${result.runoff}`, 24, height - 42);
  context.fillText(`相对侵蚀 ${result.erosion}`, 24, height - 24);
}

function deltaPhrase(current: number, baseline: number, label: string): string {
  const difference = current - baseline;
  if (difference === 0) return `${label}与基准相同`;
  return `${label}比基准${difference > 0 ? "增加" : "减少"} ${Math.abs(difference)}`;
}

export default function LoessSoilWater(): React.JSX.Element {
  const [variable, setVariable] = useState<ErosionVariable>("rainIntensity");
  const [values, setValues] = useState<DetailedErosionInput>(detailedErosionBaseline);
  const [completed, setCompleted] = useState<Set<ErosionVariable>>(() => new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseline = useMemo(() => detailedErosionModel(detailedErosionBaseline), []);
  const result = detailedErosionModel(values);
  const freeMode = completed.size === 4;
  const changed = hasChanged(variable, values);

  const selectVariable = (next: ErosionVariable) => {
    setVariable(next);
    if (!freeMode) setValues({ ...detailedErosionBaseline });
  };

  const update = <Key extends ErosionVariable>(key: Key, value: DetailedErosionInput[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    const shouldReduceMotion = () => (
      media.matches || document.documentElement.dataset.reducedMotion === "true"
    );
    const draw = (time: number) => {
      const reduced = shouldReduceMotion();
      drawErosionScene(canvas, values, time, reduced);
      if (!reduced) animationFrame = window.requestAnimationFrame(draw);
    };
    const restart = () => {
      window.cancelAnimationFrame(animationFrame);
      draw(0);
    };
    restart();
    const resize = new ResizeObserver(() => drawErosionScene(canvas, values, 0, shouldReduceMotion()));
    resize.observe(canvas);
    const settingsObserver = new MutationObserver(restart);
    settingsObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduced-motion"] });
    media.addEventListener("change", restart);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      resize.disconnect();
      settingsObserver.disconnect();
      media.removeEventListener("change", restart);
    };
  }, [values]);

  const record = () => {
    if (!changed && !freeMode) return;
    setCompleted((current) => new Set([...current, variable]));
  };

  const reset = () => {
    setVariable("rainIntensity");
    setValues({ ...detailedErosionBaseline });
    setCompleted(new Set());
  };

  const selectedValue = variable === "practice" ? practiceLabels[values.practice] : `${values[variable]}${variable === "rainIntensity" ? " mm/h" : variable === "slopeDegrees" ? "°" : "%"}`;
  const direction = result.erosion === baseline.erosion ? "暂未出现变化" : result.erosion > baseline.erosion ? "侵蚀风险上升" : "侵蚀风险下降";

  return (
    <FieldLabFrame
      className="erosion-field-lab"
      eyebrow="GQ-T065 · 黄土坡面实验手帐"
      title="任务 2 / 3：追踪雨水带走黄土的过程"
      prompt="先做四轮单变量比较，再尝试组合治理方案"
      notice="原创相对侵蚀模型，借鉴 RUSLE 的因子思路。数值仅表示相对变化，不预测真实泥沙量。"
    >
      <div className="field-workspace">
        <section className="field-stage erosion-stage" aria-label="黄土坡面降雨、径流与侵蚀联动模型">
          <canvas
            ref={canvasRef}
            className="field-canvas"
            role="img"
            aria-label={`降雨强度 ${values.rainIntensity} 毫米每小时，坡度 ${values.slopeDegrees} 度，植被覆盖 ${values.vegetationCover}%，${practiceLabels[values.practice]}，相对侵蚀指数 ${result.erosion}`}
          />
          <div className="erosion-stage__legend" aria-hidden="true"><span>雨滴输入</span><span>坡面径流</span><span>泥沙搬运</span></div>
          <p className="field-stage__caption">动画速度与颗粒数量用于显示趋势；开启“减少动态”后会自动切换为静态画面。</p>
        </section>

        <section className="field-panel" aria-label="黄土侵蚀实验控制台">
          <div className="field-panel__head"><h3>{freeMode ? "自由组合实验" : "四轮控制变量实验"}</h3><span>{completed.size} / 4 已记录</span></div>
          <div className="trial-progress" aria-label={`已完成 ${completed.size} 个单变量实验`}>
            {(Object.keys(variableLabels) as ErosionVariable[]).map((key) => <span key={key} className={completed.has(key) ? "is-done" : ""} title={variableLabels[key]} />)}
          </div>
          <div className="field-control-tabs" aria-label="选择实验变量">
            {(Object.entries(variableLabels) as [ErosionVariable, string][]).map(([key, label]) => (
              <button key={key} type="button" className="field-tab" aria-pressed={variable === key} onClick={() => selectVariable(key)}>{label}</button>
            ))}
          </div>

          {(freeMode || variable === "rainIntensity") ? <FieldSlider label="降雨强度" value={values.rainIntensity} min={10} max={80} step={1} unit=" mm/h" minLabel="小雨" maxLabel="强降雨" onChange={(value) => update("rainIntensity", value)} /> : null}
          {(freeMode || variable === "slopeDegrees") ? <FieldSlider label="坡度" value={values.slopeDegrees} min={5} max={35} step={1} unit="°" minLabel="缓坡" maxLabel="陡坡" onChange={(value) => update("slopeDegrees", value)} /> : null}
          {(freeMode || variable === "vegetationCover") ? <FieldSlider label="植被覆盖" value={values.vegetationCover} min={0} max={90} step={1} unit="%" minLabel="裸地" maxLabel="高覆盖" onChange={(value) => update("vegetationCover", value)} /> : null}
          {(freeMode || variable === "practice") ? (
            <div className="field-chip-row" aria-label="选择保土措施">
              {(Object.entries(practiceLabels) as [DetailedErosionPractice, string][]).map(([key, label]) => (
                <button key={key} type="button" className="field-chip" aria-pressed={values.practice === key} onClick={() => update("practice", key)}>{label}</button>
              ))}
            </div>
          ) : null}

          <p className="precision-note">滑杆是连续的，便于看清趋势；刻度并不代表模型具有同等精度。</p>
          <div className="erosion-compare" aria-live="polite">
            <div><small>基准相对侵蚀</small><strong>{baseline.erosion}</strong></div>
            <div><small>当前相对侵蚀</small><strong>{result.erosion}</strong></div>
          </div>
          <p className="field-feedback" aria-live="polite">{direction}：{deltaPhrase(result.erosion, baseline.erosion, "相对侵蚀指数")}。</p>
          <div className="field-actions">
            {!freeMode ? <FieldButton type="button" variant="primary" disabled={!changed} onClick={record}>记录这轮观察</FieldButton> : null}
            <FieldButton type="button" variant="quiet" onClick={reset}>重新开始</FieldButton>
          </div>
          <p className="model-boundary">记录规则：每轮只改一个条件。完成四轮后才解锁组合实验，避免把相关变化误当成单一原因。</p>
        </section>
      </div>

      <EvidenceBackpack
        summary={freeMode ? "四轮控制变量证据已齐，可以组合条件验证治理思路。" : `当前正在比较：${variableLabels[variable]}。改变后记录，完成 ${completed.size}/4 轮。`}
        items={[
          { label: "本轮变量", value: variableLabels[variable], detail: `当前值：${selectedValue}`, tone: "amber", icon: <NotebookIcon weight="duotone" /> },
          { label: "径流证据", value: `${result.runoff}（相对值）`, detail: deltaPhrase(result.runoff, baseline.runoff, "坡面径流"), tone: "blue", icon: <DropIcon weight="duotone" /> },
          { label: "侵蚀证据", value: `${result.erosion}（相对指数）`, detail: direction, tone: "coral", icon: <ArrowDownIcon weight="duotone" /> },
          { label: "保护效果", value: `${result.protection} / 100`, detail: `植被 ${values.vegetationCover}% · ${practiceLabels[values.practice]}`, tone: "green", icon: values.vegetationCover >= 50 ? <LeafIcon weight="duotone" /> : <ShieldCheckIcon weight="duotone" /> },
        ]}
        actions={<FieldButton type="button" variant="quiet" onClick={() => window.print()}>打印实验手帐</FieldButton>}
      />
    </FieldLabFrame>
  );
}
