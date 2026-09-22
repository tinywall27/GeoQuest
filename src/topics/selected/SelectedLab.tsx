import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperienceMode } from '../../app/ExperienceMode';
import type { LabDefinition, LabInput, LabResult } from './labTypes';
import './selected.css';

type Support = '示范支持' | '方法提示' | '自行操作';
type Evidence = {input: LabInput; result: LabResult; supportAtRecord: Support};
type Attempt = {question: number; choice: number; correct: boolean; priorFeedback: boolean; reviewedSupportDuringAttempt: boolean};
const phases = ['示范与预测', '对照与记录', '独立检验'];
const times = ['0–4 分钟', '4–11 分钟', '11–15 分钟'];
const format = (n: number, digits = 1) => Number.isInteger(n) ? String(n) : n.toFixed(digits);

export default function SelectedLab({lab}: {lab: LabDefinition}) {
 const {isClassroom, setMode} = useExperienceMode();
 const [phase, setPhase] = useState(0);
 const [support, setSupport] = useState<Support>('示范支持');
 const [input, setInput] = useState<LabInput>({...lab.defaults});
 const [records, setRecords] = useState<Evidence[]>([]);
 const [choices, setChoices] = useState<Record<number, number | undefined>>({});
 const [attempts, setAttempts] = useState<Attempt[]>([]);
 const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
 const [prediction, setPrediction] = useState(false);
 const [checkStarted, setCheckStarted] = useState(false);
 const [reviewedSupport, setReviewedSupport] = useState(false);
 const [methodOpen, setMethodOpen] = useState(false);
 const allSubmitted = submitted[0] && submitted[1];
 const result = lab.evaluate(input);
 const changed = lab.controls.filter(c => input[c.key] !== lab.defaults[c.key]);
 const sameRecord = records.some(r => JSON.stringify(r.input) === JSON.stringify(input) && r.supportAtRecord === support);
 function go(next: number) {
  if (next === 2) {setCheckStarted(true); setMethodOpen(false);}
  else if (checkStarted) setReviewedSupport(true);
  setPhase(next);
 }
 function reset() {setPhase(0); setSupport('示范支持'); setInput({...lab.defaults}); setRecords([]); setChoices({}); setAttempts([]); setSubmitted({}); setPrediction(false); setCheckStarted(false); setReviewedSupport(false); setMethodOpen(false);}
 function exportEvidence() {
  const data = {topic: lab.id, version: '1.0.0', dataType: '教学模型或示意情景，非实测', recordMeaning: '模型输出及记录时页面显示的支持，不代表学生已独立计算；作答记录须结合教师纸笔核验', records, attempts, predictionSpoken: prediction};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `${lab.slug}-evidence.json`; a.click(); URL.revokeObjectURL(url);
 }
 function submit(q: number) {
  const choice = choices[q]; if (choice === undefined || submitted[q]) return;
  setAttempts(a => [...a, {question: q + 1, choice, correct: choice === lab.questions[q]!.correct, priorFeedback: a.some(x => x.question === q + 1), reviewedSupportDuringAttempt: reviewedSupport}]);
  setSubmitted(s => ({...s, [q]: true}));
 }
 return <article className={`selected-lab ${isClassroom ? 'selected-classroom' : ''}`}>
  <header className="selected-heading"><div><span>{lab.id} · {lab.volume} · 15 分钟课段</span><h1>{lab.title}</h1><p>{lab.question}</p></div><div className="selected-actions"><Link to="/topics">全部主题</Link><button onClick={() => setMode(isClassroom ? 'exploration' : 'classroom')}>{isClassroom ? '退出课堂' : '课堂展示'}</button><button onClick={reset}>重置本课</button></div></header>
  <nav className="selected-phases" aria-label="教学步骤">{phases.map((p, i) => <button key={p} aria-current={phase === i ? 'step' : undefined} onClick={() => go(i)}><span>0{i + 1}</span>{p}<small>{times[i]}</small></button>)}</nav>
  <section className="selected-task"><span>本步任务</span><h2>{lab.steps[phase]}</h2><p><strong>学会什么：</strong>{lab.goal}</p></section>
  {phase < 2 ? <>
   <div className="selected-support"><label>学习支持<select aria-label="学习支持" value={support} onChange={e => setSupport(e.target.value as Support)}>{(['示范支持', '方法提示', '自行操作'] as const).map(s => <option key={s}>{s}</option>)}</select></label><p>{support === '示范支持' ? lab.example : support === '方法提示' ? `只改变一项条件，记录前后数据，再说明依据。常见误区：${lab.misconception}` : '先独立说出预测，再操作和记录。需要时可主动恢复提示。'}</p></div>
   {phase === 0 && <label className="selected-prediction"><input type="checkbox" checked={prediction} onChange={e => setPrediction(e.target.checked)}/>我已在纸上或口头提出预测与理由</label>}
   <div className="selected-board"><section className="selected-figure" aria-label="模型图与数据"><p className="selected-mobile-hint">图示可左右滑动；数值也可从表格读取。</p>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The horizontal chart viewport must be keyboard-scrollable. */}
    <div className="selected-diagram-scroll" tabIndex={0} role="region" aria-label="模型图，可左右滚动"><lab.Diagram input={input} result={result}/></div><p className="selected-model-label">原创教学模型 / 示意情景；具体规则见下方说明</p></section>
    <aside className="selected-controls" aria-label="实验条件"><h2>当前条件</h2>{lab.controls.map(c => <label key={c.key}>{c.label}<select aria-label={c.label} value={input[c.key]} onChange={e => setInput(s => ({...s, [c.key]: Number(e.target.value)}))}>{c.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>)}
     <div className="selected-presets"><button onClick={() => setInput({...lab.defaults})}>恢复基准条件</button><button onClick={() => setInput({...lab.comparison.input})}>试验：{lab.comparison.label}</button></div>
     <p className="selected-changes">{changed.length ? `相对基准改变 ${changed.length} 项：${changed.map(c => c.label).join('、')}${changed.length > 1 ? '。这组结果不能用于归因某一变量；请先恢复基准，逐项比较。' : '。其余条件保持不变。'}` : '当前为基准条件。记录后再改变一项。'}</p>
     <table className="selected-readings"><caption>当前模型结果</caption><tbody>{result.metrics.map(m => <tr key={m.label}><th scope="row">{m.label}</th><td>{format(m.value, m.digits)} {m.unit}</td></tr>)}</tbody></table><p role="status" className="selected-feedback">{result.message}</p>
     <button className="selected-primary" disabled={sameRecord || records.length >= 12} onClick={() => setRecords(r => [...r, {input: {...input}, result, supportAtRecord: support}])}>{sameRecord ? '已记录当前条件' : '记录条件与结果'}</button>
    </aside></div>
   <section className="selected-evidence"><h2>我的对照记录 <small>{records.length} / 12</small></h2>{records.length ? <div className="selected-table-scroll"><table><caption>条件、结果与支持程度一起记录</caption><thead><tr><th scope="col">条件</th><th scope="col">记录时的页面支持</th><th scope="col">结果</th><th scope="col">操作</th></tr></thead><tbody>{records.map((r, i) => <tr key={i}><td>{lab.controls.map(c => `${c.label}：${c.options.find(o => o.value === r.input[c.key])?.label}`).join('；')}</td><td>{r.supportAtRecord}</td><td>{r.result.metrics.map(m => `${m.label} ${format(m.value, m.digits)} ${m.unit}`).join('；')}</td><td><button aria-label={`移除第 ${i + 1} 条记录`} onClick={() => setRecords(rows => rows.filter((_, n) => n !== i))}>移除</button></td></tr>)}</tbody></table></div> : <p>先记录基准，再记录只改变一项条件的结果。说清比较依据，不只读最终数值。</p>}<p>记录的是模型输出和当时的提示显示，不代表独立计算完成。仅留在当前页面，刷新清除；课堂与探索切换保留同一组数据。</p></section>
  </> : <section className="selected-independent" aria-label="独立检验"><h2>收起模型与提示，再独立作答</h2><p>先在纸上写出依据，再选择。两题均提交后才统一显示参考解释；期间回看提示、看过反馈后的重答分别标记，不能当成无帮助的首次表现。</p>{lab.questions.map((q, i) => <fieldset key={q.prompt}><legend>{i + 1}. {q.prompt}</legend>{q.options.map((option, j) => <label key={option}><input type="radio" name={`question-${i}`} value={j} checked={choices[i] === j} disabled={submitted[i]} onChange={() => setChoices(c => ({...c, [i]: j}))}/>{option}</label>)}<button disabled={choices[i] === undefined || submitted[i]} onClick={() => submit(i)}>提交第 {i + 1} 题</button>{submitted[i] && !allSubmitted && <p role="status">已暂存作答，两题全部提交后统一显示参考。</p>}{submitted[i] && allSubmitted && <div role="status"><strong>{choices[i] === q.correct ? '本题选择与参考一致。' : '本题需要回看依据。'}</strong><p>{q.explanation}</p><p>{attempts.filter(a => a.question === i + 1).length > 1 ? '已看反馈后的重答' : '首次作答；教师还需核对纸笔或口头推理。'}</p><p>{attempts.filter(a => a.question === i + 1).at(-1)?.reviewedSupportDuringAttempt ? "本次提交前曾回看模型或提示。" : "本次提交前未记录到回看提示；仍需教师观察核验。"}</p><button onClick={() => {setSubmitted(s => ({...s, [i]: false})); setChoices(c => ({...c, [i]: undefined}));}}>重新作答（记录已看反馈）</button></div>}</fieldset>)}{allSubmitted && <aside><h3>深入探究</h3><p>{lab.transfer}</p></aside>}<p>间隔后可由教师替换一组等值数值再次检查，不突然增加多个新难点。</p></section>}
  <footer className="selected-footer"><button disabled={!records.length && !attempts.length} onClick={exportEvidence}>导出本课证据 JSON</button><p>不采集身份或自由文本答案，不自动给学生定级。教学效果尚未经真实师生试教验证。</p></footer>
  <details className="selected-method" open={methodOpen} onToggle={e => {const open = e.currentTarget.open; setMethodOpen(open); if (open && checkStarted) setReviewedSupport(true);}}><summary>教师说明、模型边界与来源</summary><h3>课前与组织</h3><p>先备知识：{lab.prerequisites}。默认教师投屏、学生纸笔独立完成；本班学生起点尚需教师判断。可按表现调整节奏，不要求一课撤完支持。</p><p>重点追问：{lab.misconception}</p><h3>模型规则</h3><p>{lab.method}</p><ul>{lab.limitations.map(l => <li key={l}>{l}</li>)}</ul><h3>原理参考</h3><ul>{lab.sources.map(s => <li key={s.url}><a href={s.url}>{s.title}</a> · {s.publisher} · 核验 {s.verifiedAt}</li>)}</ul><p>图形和情景为原创，参考页面仅作原理核对，核心操作不依赖外部网络。教师负责事实、答案、课堂追问与最终评价。</p></details>
 </article>;
}
