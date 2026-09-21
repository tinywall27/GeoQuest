import type { ReactNode } from "react";
import {
  BinocularsIcon,
  FlagIcon,
  MapTrifoldIcon,
  StarIcon,
} from "@phosphor-icons/react";
import "./field-labs.css";

export type EvidenceItem = {
  label: string;
  value: string;
  detail?: string;
  tone?: "green" | "blue" | "amber" | "coral";
  icon?: ReactNode;
};

type FieldLabFrameProps = {
  className?: string;
  step?: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  prompt: string;
  notice: string;
  decor?: ReactNode;
  children: ReactNode;
};

const steps = [
  { label: "观察与标记", Icon: MapTrifoldIcon },
  { label: "动手实验", Icon: BinocularsIcon },
  { label: "形成解释", Icon: FlagIcon },
] as const;

export function FieldLabFrame({
  className = "",
  step = 2,
  eyebrow,
  title,
  prompt,
  notice,
  decor,
  children,
}: FieldLabFrameProps): React.JSX.Element {
  return (
    <div className={`field-lab ${className}`.trim()}>
      <header className="field-lab__mission-head">
        <div>
          <span className="field-lab__tape">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="field-lab__prompt"><StarIcon aria-hidden="true" weight="fill" />{prompt}</p>
        </div>
        <div className={`field-lab__mission-tools ${decor ? "has-decor" : ""}`}>
          <ol className="field-lab__steps" aria-label={`探索步骤，当前第 ${step} 步`}>
            {steps.map(({ label, Icon }, index) => {
              const itemStep = (index + 1) as 1 | 2 | 3;
              return (
                <li
                  key={label}
                  className={itemStep === step ? "is-active" : itemStep < step ? "is-done" : ""}
                  aria-current={itemStep === step ? "step" : undefined}
                >
                  <span><Icon aria-hidden="true" weight={itemStep === step ? "fill" : "regular"} /></span>
                  <small>{itemStep}</small>
                  <strong>{label}</strong>
                </li>
              );
            })}
          </ol>
          {decor ? <div className="field-lab__decor">{decor}</div> : null}
        </div>
      </header>
      <p className="field-lab__notice">{notice}</p>
      {children}
    </div>
  );
}

export function EvidenceBackpack({
  title = "证据背包",
  summary,
  items,
  actions,
}: {
  title?: string;
  summary: string;
  items: EvidenceItem[];
  actions?: ReactNode;
}): React.JSX.Element {
  return (
    <section className="evidence-pack" aria-labelledby="evidence-pack-title">
      <h3 className="field-visually-hidden">我的证据卡</h3>
      <div className="evidence-pack__head">
        <div>
          <span className="field-lab__tape field-lab__tape--blue" id="evidence-pack-title">{title}</span>
          <p>{summary}</p>
        </div>
        {actions ? <div className="evidence-pack__actions">{actions}</div> : null}
      </div>
      <ul className="evidence-pack__grid">
        {items.map((item) => (
          <li key={item.label} data-tone={item.tone ?? "green"}>
            <span className="evidence-pack__icon" aria-hidden="true">{item.icon}</span>
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FieldSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  minLabel,
  maxLabel,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}): React.JSX.Element {
  const update = (next: number) => {
    if (!Number.isFinite(next)) return;
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <label className="field-slider">
      <span className="field-slider__head">
        <strong>{label}</strong>
        <output>{Number.isInteger(value) ? value : value.toFixed(1)}{unit}</output>
      </span>
      <span className="field-slider__inputs">
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
        />
        <input
          className="field-slider__number"
          type="number"
          aria-label={`${label}数值输入`}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
        />
      </span>
      {minLabel || maxLabel ? (
        <span className="field-slider__scale" aria-hidden="true">
          <span>{minLabel}</span><span>{maxLabel}</span>
        </span>
      ) : null}
    </label>
  );
}

export function FieldButton({
  children,
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
}): React.JSX.Element {
  return (
    <button {...props} className={`field-button field-button--${variant} ${props.className ?? ""}`.trim()}>
      {children}
    </button>
  );
}
