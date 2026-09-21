import {type FarmResult} from './farmModel';
export function FarmChart({base,result,period}:{base:FarmResult;result:FarmResult;period:number}){
 const x=(d:number)=>48+d/180*624,y=(n:number)=>165-n/80*120;
 const rain=(r:FarmResult,i:number)=>r.days.slice(i*10,i*10+10).reduce((s,d)=>s+d.rain,0);
 const demand=(r:FarmResult,i:number)=>r.days.slice(i*10,i*10+10).reduce((s,d)=>s+d.deficit,0);
 const tpath=result.days.filter((_,i)=>i%10===0).map((d,i)=>`${i?'L':'M'}${x(d.day+5)},${243-(d.temperature-5)*2}`).join('');
 return <svg className="farm-chart" viewBox="0 0 720 355" role="img" aria-label={`共同时间轴0至179天，雨量按十天汇总；基准与当前总量均${result.rain.toFixed(0)}毫米；当前播种第${result.input.sow}天，生长结束第${result.harvest}天，选中第${period*10}至${period*10+9}天`}>
 <rect x={x(result.input.sow)} y="40" width={x(result.harvest)-x(result.input.sow)} height="213" fill="#c9d4a6" opacity=".35"/>
 <rect x={x(period*10)} y="40" width={x(10)-x(0)} height="285" fill="#8b6339" opacity=".10"/>
 {[0,40,80].map(v=><g key={v}><path d={`M48 ${y(v)}H672`} stroke="#ccd6d0"/><text x="40" y={y(v)+4} textAnchor="end">{v}</text></g>)}
 <text x="48" y="22">雨量 mm / 10 天</text><text x="340" y="22">浅绿：当前作物生长期</text>
 {Array.from({length:18},(_,i)=><g key={i}><rect x={x(i*10)+4} y={y(rain(base,i))} width="10" height={165-y(rain(base,i))} fill="#537c94"/><rect x={x(i*10)+17} y={y(rain(result,i))} width="10" height={165-y(rain(result,i))} fill="#a36a28"/></g>)}
 <text x="48" y="194">温度 °C（共同温度条件）</text><path d={tpath} stroke="#736640" strokeWidth="2.5" fill="none"/>
 {[5,15,25].map(v=><text key={v} x="40" y={243-(v-5)*2+4} textAnchor="end">{v}</text>)}<path d="M48 223H672" stroke="#736640" strokeDasharray="4 4"/><text x="495" y="216" className="farm-plot-small">15°C 教学阈值</text>
 <text x="48" y="275">当前供水缺口 mm / 10 天</text>
 {Array.from({length:18},(_,i)=><rect key={i} x={x(i*10)+4} y={325-demand(result,i)} width="24" height={demand(result,i)} fill="#a3583a"/>)}
 {[0,40].map(v=><text key={v} x="40" y={329-v} textAnchor="end">{v}</text>)}<path d="M48 325H672" stroke="#adbdad"/>{[0,30,60,90,120,150,180].map(d=><text key={d} x={x(d)} y="347" textAnchor="middle">{d}</text>)}
 </svg>;
}
export function FarmScene(){return <svg className="farm-intro-scene" viewBox="0 0 700 270" role="img" aria-label="原创农田示意，雨季、播种期和有限灌溉共同影响作物供水，不对应真实地区">
 <path d="M40 150L340 55L653 160L348 255Z" fill="#dccb91" stroke="#9d8d52"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${83+i*49} ${139-i*16}L${388+i*49} ${241-i*16}`} stroke="#8b9655" strokeWidth="3"/>)}
 {Array.from({length:24},(_,i)=>{const x=120+(i%6)*65,y=142+Math.floor(i/6)*20;return <path key={i} d={`M${x} ${y}v-25m0 13-7-9m7 4 7-9`} fill="none" stroke="#526f40" strokeWidth="3"/>;})}
 <path d="M495 105q48-50 82 0q38 0 30 25H483q-16-20 12-25" fill="#adc7cd"/>{[500,530,560,590].map(x=><path key={x} d={`M${x} 140l-8 22`} stroke="#487d96" strokeWidth="2"/>)}
 <text x="45" y="36">同一场雨，遇到不同的播期。</text><text x="45" y="61">先看雨热，再核对供水。</text>
 </svg>;}
