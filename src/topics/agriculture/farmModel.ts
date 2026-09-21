export type Crop='maize'|'millet';
export const crops={maize:{label:'玉米示意方案',days:100,demand:[2,4,5,3]},millet:{label:'谷子示意方案',days:80,demand:[1.5,2.5,3,2]}} as const;
export interface FarmInput {delay:number;sow:number;crop:Crop;irrigation:number}
export const farmBase:FarmInput={delay:0,sow:20,crop:'maize',irrigation:0};
export const rainPattern=[0,0,20,30,50,60,70,50,30,10,0,0];
const temperatures=[18,20,23,26,28,29,29,28,26,23,20,18,15,12,10,8,6,5];
export interface FarmDay {day:number;rain:number;temperature:number;demand:number;actual:number;deficit:number;irrigation:number;storage:number;overflow:number;active:boolean}
export function farmModel(input:FarmInput){
 const crop=crops[input.crop];let storage=20,remaining=input.irrigation,totalDemand=0,deficit=0,irrigated=0,overflow=0,rain=0,actual=0,earlyDeficit=0,coldDays=0;
 const days:FarmDay[]=[];
 for(let day=0;day<180;day++){
  const source=day-input.delay,precip=source>=0?(rainPattern[Math.floor(source/10)]??0)/10:0;
  const temperature=temperatures[Math.floor(day/10)]??5,age=day-input.sow,active=age>=0&&age<crop.days;
  const demand=active?crop.demand[Math.min(3,Math.floor(age/(crop.days/4)))]!:0;
  const excess=Math.max(0,storage+precip*.8-60);storage=Math.min(60,storage+precip*.8);
  const irrigation=Math.min(remaining,Math.max(0,demand-storage));remaining-=irrigation;storage+=irrigation;
  const used=Math.min(storage,demand),shortfall=demand-used;storage-=used;
  rain+=precip;totalDemand+=demand;actual+=used;deficit+=shortfall;irrigated+=irrigation;overflow+=excess;
  if(active&&age<20)earlyDeficit+=shortfall;if(active&&temperature<15)coldDays++;
  days.push({day,temperature,rain:precip,demand,actual:used,deficit:shortfall,irrigation,storage,overflow:excess,active});
 }
 return {input:{...input},days,rain,totalDemand,actual,deficit,earlyDeficit,irrigated,overflow,storage,coldDays,harvest:input.sow+crop.days};
}
export type FarmResult=ReturnType<typeof farmModel>;
export const farmKey=(i:FarmInput)=>`${i.delay}:${i.sow}:${i.crop}:${i.irrigation}`;
export function farmPairs(rows:FarmResult[]){
 const base=rows.find(r=>farmKey(r.input)===farmKey(farmBase));
 const candidates=rows.filter(r=>r.input.delay>0&&r.input.sow===20&&r.input.crop==='maize'&&r.input.irrigation===0);
 const responseFor=(late:FarmResult)=>rows.find(r=>r.input.delay===late.input.delay&&[r.input.sow!==20,r.input.crop!=='maize',r.input.irrigation!==0].filter(Boolean).length===1);
 const late=candidates.find(r=>responseFor(r))??candidates[0];
 const response=late?responseFor(late):undefined;
 return {base,late,response};
}
