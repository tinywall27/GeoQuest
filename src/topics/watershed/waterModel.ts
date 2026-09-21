/** Original event model: constant infiltration capacity, uniform 1 km² slope, ideal linear reservoir. */
export const DT = 600;
export const AREA = 1_000_000;
export const CAPACITIES = [0, 3000, 12000] as const;
export interface WaterInput { rain: number; cover: number; capacity: number }
export interface WaterFrame { minute:number; intensity:number; rainfall:number; infiltration:number; runoff:number; inflow:number; outflow:number; storage:number; discharged:number; spill:number }
export interface WaterResult { input:WaterInput; frames:WaterFrame[]; rain:number; infiltration:number; runoff:number; erosion:number; peak:number; peakMinute:number; discharged:number; storage:number; spilled:number }
export const baseline:WaterInput = {rain:30,cover:20,capacity:0};
export function runWater(input:WaterInput):WaterResult {
  const pattern=[12,24,60,48,24,12];
  const infiltrationCapacity=6+18*input.cover/100;
  let rainfall=0,infiltration=0,runoff=0,storage=0,discharged=0,spilled=0,peak=0,peakMinute=0;
  const frames:WaterFrame[]=[{minute:0,intensity:0,rainfall:0,infiltration:0,runoff:0,inflow:0,outflow:0,storage:0,discharged:0,spill:0}];
  for(let i=0;i<48;i++){
    const intensity=(pattern[i]??0)*input.rain/30;
    const rainDepth=intensity/6,infDepth=Math.min(intensity,infiltrationCapacity)/6;
    const volume=(rainDepth-infDepth)*AREA/1000,inflow=volume/DT;
    rainfall+=rainDepth;infiltration+=infDepth;runoff+=volume;
    let output=volume,spill=0;
    if(input.capacity>0){
      // Exact interval balance for dS/dt = I - S/tau, with interval-constant I.
      const tau=3600,decay=Math.exp(-DT/tau);
      const unlimited=storage*decay+inflow*tau*(1-decay);
      output=storage+volume-unlimited;
      spill=Math.max(0,unlimited-input.capacity);
      storage=unlimited-spill;output+=spill;
    }
    discharged+=output;spilled+=spill;
    const outflow=output/DT;
    if(outflow>peak){peak=outflow;peakMinute=(i+1)*10;}
    frames.push({minute:(i+1)*10,intensity,rainfall,infiltration,runoff,inflow,outflow,storage,discharged,spill});
  }
  // A dimensionless teaching response, not RUSLE or a sediment mass prediction.
  const erosion=100*(runoff/20400)*((1-input.cover/100)**2/.64);
  return {input:{...input},frames,rain:rainfall,infiltration,runoff,erosion,peak,peakMinute,discharged,storage,spilled};
}
export const scenarioKey=(i:WaterInput)=>`${i.rain}:${i.cover}:${i.capacity}`;
export const capacityLabel=(c:number)=>c===0?"无滞蓄":`${c/1000} 千m³滞蓄`;
export function evidencePairs(rows:WaterResult[]){
  const low=rows.find(r=>r.input.cover===20&&r.input.capacity===0&&rows.some(s=>s.input.cover===80&&s.input.rain===r.input.rain&&s.input.capacity===0));
  const high=low?rows.find(r=>r.input.cover===80&&r.input.rain===low.input.rain&&r.input.capacity===0):undefined;
  const direct=rows.find(r=>r.input.capacity===0&&rows.some(s=>s.input.capacity>0&&s.input.rain===r.input.rain&&s.input.cover===r.input.cover));
  const retained=direct?rows.find(r=>r.input.capacity>0&&r.input.rain===direct.input.rain&&r.input.cover===direct.input.cover):undefined;
  return {low,high,direct,retained};
}
