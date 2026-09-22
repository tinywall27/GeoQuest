import type { LabDefinition, LabInput, LabResult } from './labTypes';

const verifiedAt = '2026-09-22';
function choice(input: LabInput, key: string, allowed: readonly number[]): number {
  const value = input[key];
  if (value === undefined || !allowed.includes(value)) throw new RangeError(`不支持的参数：${key}`);
  return value;
}

export function mapModel(input: LabInput) {
  const denominator = choice(input, 'scale', [10000, 25000, 50000]);
  const distanceKm = choice(input, 'distance', [0.5, 1, 2]);
  const widthKm = 20 * denominator / 100000;
  return { denominator, distanceKm, mapCm: distanceKm * 100000 / denominator, widthKm, areaKm2: widthKm ** 2 / 2 };
}
function MapDiagram({ input }: { input: LabInput; result: LabResult }) {
  const model = mapModel(input);
  const end = 70 + model.mapCm * 20;
  return <figure className="selected-figure">
    <svg viewBox="0 0 560 310" role="img" aria-label={`虚构直线路段，图上长 ${model.mapCm} 厘米，代表 ${model.distanceKm} 千米；虚拟图幅宽 20 厘米。`}>
      <rect x="70" y="40" width="400" height="200" fill="#edf5e8" stroke="#476b43" />
      <text x="80" y="70" fill="#25382b">虚构平面图 · 1:{model.denominator}</text>
      <path d={`M70 145 H${end}`} stroke="#a13f29" strokeWidth="6" />
      <circle cx="70" cy="145" r="6" fill="#25382b" /><circle cx={end} cy="145" r="6" fill="#25382b" />
      <text x="70" y="125" textAnchor="middle">A</text><text x={end} y="170" textAnchor="middle">B</text>
      <text x="270" y="212" textAnchor="middle">AB：图上 {model.mapCm} cm = 实地 {model.distanceKm} km</text>
      <path d="M70 255 H470 M70 250 V260 M470 250 V260" stroke="#25382b" />
      <text x="270" y="281" textAnchor="middle">虚拟纸面宽 20 cm，覆盖宽 {model.widthKm} km</text>
    </svg>
    <figcaption>虚拟纸面按固定宽 20 cm 计算；屏幕会缩放，请读标注，不用实体尺量屏幕。图幅高固定为 10 cm，面积按同尺度的 20 × 10 cm 矩形计算。</figcaption>
  </figure>;
}

export function coordinateModel(input: LabInput) {
  const longitude = choice(input, 'longitude', [-60, -30, 0, 30, 60]);
  const latitude = choice(input, 'latitude', [-60, -30, 0, 30, 60]);
  const longitudeText = longitude === 0 ? '0°（本初子午线）' : `${Math.abs(longitude)}°${longitude > 0 ? 'E' : 'W'}`;
  const latitudeText = latitude === 0 ? '0°（赤道）' : `${Math.abs(latitude)}°${latitude > 0 ? 'N' : 'S'}`;
  return { longitude, latitude, longitudeText, latitudeText, x: 280 + longitude * 3, y: 165 - latitude * 1.8 };
}
function CoordinateDiagram({ input }: { input: LabInput; result: LabResult }) {
  const model = coordinateModel(input);
  const ticks = [-60, -30, 0, 30, 60];
  return <figure className="selected-figure">
    <svg viewBox="0 0 560 350" role="img" aria-label={`抽象经纬网 P 点：纬度 ${model.latitudeText}，经度 ${model.longitudeText}。`}>
      <rect x="100" y="57" width="360" height="216" fill="#eef6fa" />
      {ticks.map(value => <g key={`lon${value}`}>
        <path d={`M${280 + value * 3} 57 V273`} stroke={value === 0 ? '#324b63' : '#9eafbc'} strokeWidth={value === 0 ? 2 : 1} />
        <text x={280 + value * 3} y="298" textAnchor="middle">{value === 0 ? '0°' : `${Math.abs(value)}°${value > 0 ? 'E' : 'W'}`}</text>
      </g>)}
      {ticks.map(value => <g key={`lat${value}`}>
        <path d={`M100 ${165 - value * 1.8} H460`} stroke={value === 0 ? '#324b63' : '#9eafbc'} strokeWidth={value === 0 ? 2 : 1} />
        <text x="88" y={170 - value * 1.8} textAnchor="end">{value === 0 ? '0°' : `${Math.abs(value)}°${value > 0 ? 'N' : 'S'}`}</text>
      </g>)}
      <circle cx={model.x} cy={model.y} r="8" fill="#a13f29" />
      <text x={model.x + 12} y={model.y - 12} fill="#702414">P</text>
      <text x="280" y="25" textAnchor="middle">抽象经纬网 · 上北下南</text>
      <text x="284" y="48" fontSize="13">本初子午线</text>
      <text x="462" y="169" fontSize="13">赤道</text>
      <text x="280" y="332" textAnchor="middle">先纬度 {model.latitudeText}，再经度 {model.longitudeText}</text>
    </svg>
    <figcaption>此图只练习读角度与方向，不含任何陆地或国界。矩形网格不是地球真实形状，不可用格子边长推算地表距离。</figcaption>
  </figure>;
}

const northTemperature = [4, 6, 10, 16, 21, 25, 28, 27, 23, 17, 11, 6] as const;
const warmRain = [20, 25, 40, 60, 90, 140, 180, 160, 100, 60, 35, 25] as const;
export function climateModel(input: LabInput) {
  const warmMonth = choice(input, 'warmMonth', [7, 1]);
  const wetSeason = choice(input, 'wetSeason', [0, 1]);
  const shift = warmMonth === 7 ? 0 : 6;
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    temperature: northTemperature[(index + shift) % 12]!,
    rain: warmRain[(index + shift + wetSeason * 6) % 12]!,
  }));
  const min = Math.min(...months.map(month => month.temperature));
  const max = Math.max(...months.map(month => month.temperature));
  const total = months.reduce((sum, month) => sum + month.rain, 0);
  return { months, min, max, range: max - min, total, warmMonth, wetMonth: months.find(month => month.rain === 180)!.month };
}
function ClimateDiagram({ input }: { input: LabInput; result: LabResult }) {
  const model = climateModel(input);
  const points = model.months.map((month, index) => `${66 + index * 36},${250 - month.temperature * 6}`).join(' ');
  return <figure className="selected-figure">
    <svg viewBox="0 0 560 325" role="img" aria-label={`原创模拟气候图，最热月 ${model.warmMonth} 月，年温差 ${model.range} 摄氏度，年降水量 ${model.total} 毫米；各月值见下表。`}>
      <text x="48" y="24" fill="#9a341f">气温 °C（折线）</text><text x="490" y="24" textAnchor="end" fill="#195b8e">降水 mm（柱）</text>
      {[0, 10, 20, 30].map(value => <g key={value}>
        <path d={`M48 ${250 - value * 6} H480`} stroke="#c9d2d5" />
        <text x="38" y={255 - value * 6} textAnchor="end">{value}</text>
      </g>)}
      {[0, 50, 100, 150, 200].map(value => <text key={value} x="491" y={255 - value * 0.9}>{value}</text>)}
      <path d="M48 70 V250 H480 V70" fill="none" stroke="#25382b" />
      {model.months.map((month, index) => <g key={month.month}>
        <rect x={55 + index * 36} y={250 - month.rain * 0.9} width="22" height={month.rain * 0.9} fill="#377ca6" />
        <text x={66 + index * 36} y="274" textAnchor="middle">{month.month}</text>
      </g>)}
      <polyline points={points} fill="none" stroke="#a13f29" strokeWidth="3" />
      {model.months.map((month, index) => <circle key={month.month} cx={66 + index * 36} cy={250 - month.temperature * 6} r="4" fill="#a13f29" />)}
      <text x="265" y="303" textAnchor="middle">月份 · 固定左轴 0–30°C / 右轴 0–200 mm</text>
    </svg>
    <figcaption>原创模拟的多年平均月值，不对应真实城市、年份或气候预测。两轴固定且单位不同，不能直接比较柱顶与折线高低。</figcaption>
    <details><summary>逐月数据表（与图共用同一数据）</summary>
      <table><caption>模拟气候月值</caption><thead><tr><th scope="col">月份</th><th scope="col">月均温 / °C</th><th scope="col">月降水量 / mm</th></tr></thead>
        <tbody>{model.months.map(month => <tr key={month.month}><th scope="row">{month.month} 月</th><td>{month.temperature}</td><td>{month.rain}</td></tr>)}</tbody></table>
    </details>
  </figure>;
}

export const readingLabs: LabDefinition[] = [
  {
    id: 'GQ-T001', slug: 'map-choice-lab', title: '地图选择与比例尺', volume: 'G7A', chapter: '地图的阅读',
    question: '同样大小的图幅，怎样选择能看清局部又能覆盖任务范围的比例尺？',
    goal: '能换算图上与实地距离；在相同图幅前提下，用覆盖范围解释比例尺的选择。',
    prerequisites: '保守假设：会厘米、米与千米换算；可能只比较分母大小。先用一道单位换算检查，未掌握时保留换算提示。',
    misconception: '把分母大当成比例尺大，或认为换比例尺会改变同一路段的实地长度。',
    steps: ['教师投屏示范：保留 20 cm 图幅与 1 km 路段，把千米统一换成厘米再计算图上长。', '个人纸笔预测：只把 1:10000 改为 1:25000，记录图上长、覆盖宽；教师操作后核对并解释。', '收起示范和结果，独立完成两题；教师检查单位、计算及选图理由，再决定是否需要同类练习。'],
    example: '1 km = 100000 cm。1:10000 时图上长 100000÷10000 = 10 cm；改成 1:25000 后为 4 cm。20 cm 图幅覆盖宽从 2 km 变成 5 km，实地路段始终 1 km。',
    transfer: '延后用同样问法检查：0.5 km 路段在 1:25000 图上长多少？学生独立写 2 cm，并说明单位换算。',
    controls: [{ key: 'scale', label: '比例尺', options: [10000, 25000, 50000].map(value => ({ value, label: `1:${value}` })) }, { key: 'distance', label: '实地直线路段长度', options: [0.5, 1, 2].map(value => ({ value, label: `${value} km` })) }],
    defaults: { scale: 10000, distance: 1 }, comparison: { label: '只缩小比例尺至 1:25000', input: { scale: 25000, distance: 1 } },
    evaluate(input) {
      const model = mapModel(input);
      return { metrics: [{ label: 'AB 图上长度', value: model.mapCm, unit: 'cm', digits: 1 }, { label: '固定图幅覆盖宽度', value: model.widthKm, unit: 'km', digits: 1 }, { label: '矩形图幅覆盖面积', value: model.areaKm2, unit: 'km²' }], message: `同一路段实地长 ${model.distanceKm} km；当前图幅覆盖宽 ${model.widthKm} km。选图时同时检查范围与所需细节；本图不模拟地图综合。` };
    },
    Diagram: MapDiagram,
    questions: [{ prompt: '独立情景 A：实地 2 km，比例尺 1:50000，图上直线长多少？', options: ['4 cm', '40 cm', '0.4 cm'], correct: 0, explanation: '2 km = 200000 cm；200000÷50000 = 4 cm。' }, { prompt: '独立情景 B：固定 20 cm 宽图幅，要完整覆盖东西跨度 8 km 的区域。以下哪幅能覆盖？', options: ['1:10000，覆盖 2 km', '1:25000，覆盖 5 km', '1:50000，覆盖 10 km'], correct: 2, explanation: '20×50000 cm = 10 km，能覆盖 8 km；另外两幅宽度不足。还应按实际任务另核验地图内容和细节。' }],
    method: '固定虚拟图幅宽 20 cm；图上厘米 = 实地千米×100000÷比例尺分母；覆盖宽 = 20×分母÷100000。图幅高固定 10 cm，覆盖面积为覆盖宽×覆盖宽÷2。',
    limitations: ['原创虚构直线路段，无现实导航用途。图示矩形的虚拟纸面宽高固定为 20×10 cm。', '同图幅比较范围，不模拟投影变形、道路曲折或制图取舍；不能由比例尺直接保证某地物一定被绘出。', '15 分钟教师投屏、学生纸笔的教学设想；尚未经真实师生试教，独立完成情况须由教师核验。'],
    sources: [{ title: 'Map Scales', publisher: 'U.S. Geological Survey', url: 'https://www.usgs.gov/publications/map-scales', verifiedAt }, { title: 'Topographic Mapping', publisher: 'U.S. Geological Survey', url: 'https://www.usgs.gov/educational-resources/topographic-mapping', verifiedAt }],
  },
  {
    id: 'GQ-T002', slug: 'earth-evidence-grid', title: '经纬网定位证据', volume: 'G7A', chapter: '地球与经纬网',
    question: '怎样用两条相交的角度线，把一个点的位置说清楚？',
    goal: '能读出带 N/S、E/W 的经纬度，并说明只改变一个坐标时点沿什么线移动。',
    prerequisites: '保守假设：认识方向与角度；可能混淆经纬线延伸方向和坐标变化方向。先口头定位赤道与本初子午线。',
    misconception: '认为纬线向东西延伸，所以纬度表示东西位置；把 30°W 写成 30°E，或给 0°强加 N/S。',
    steps: ['教师示范先找纬线，再找经线，写 P 点的纬度、经度及方向字母。', '同类练习：保持经度 30°E，只把纬度 30°N 改为 30°S；先画预期位置再核对。', '遮住示范坐标，个人独立完成新点定位及移动方向题；教师按两坐标与方向字母逐项核验。'],
    example: 'P 在赤道以北 30°的纬线与本初子午线以东 30°的经线相交，写作（30°N，30°E）。只把纬度改成 30°S：经度仍为 30°E，点沿同一经线向南移动。',
    transfer: '延后以相同问法给点（60°N，30°W），让学生独立画交点并标方向；不同时加入时差或距离计算。',
    controls: [{ key: 'latitude', label: '纬度', options: [-60, -30, 0, 30, 60].map(value => ({ value, label: value === 0 ? '0° 赤道' : `${Math.abs(value)}°${value > 0 ? 'N 北纬' : 'S 南纬'}` })) }, { key: 'longitude', label: '经度', options: [-60, -30, 0, 30, 60].map(value => ({ value, label: value === 0 ? '0° 本初子午线' : `${Math.abs(value)}°${value > 0 ? 'E 东经' : 'W 西经'}` })) }],
    defaults: { latitude: 30, longitude: 30 }, comparison: { label: '只把纬度改为 30°S', input: { latitude: -30, longitude: 30 } },
    evaluate(input) {
      const model = coordinateModel(input);
      return { metrics: [{ label: '纬度（北正南负）', value: model.latitude, unit: '°' }, { label: '经度（东正西负）', value: model.longitude, unit: '°' }], message: `P 点坐标：（${model.latitudeText}，${model.longitudeText}）。经纬度表示角度；正负号是本页计算约定。` };
    },
    Diagram: CoordinateDiagram,
    questions: [{ prompt: '独立情景 A：P 在赤道以南 30°、本初子午线以西 60°，坐标是哪一组（纬度，经度）？', options: ['（30°N，60°W）', '（30°S，60°W）', '（60°S，30°E）'], correct: 1, explanation: '南纬用 S，西经用 W；题目要求纬度在前、经度在后。' }, { prompt: '独立情景 B：从（30°N，30°W）到（60°N，30°W），哪项保持不变？', options: ['纬度，沿纬线向东', '纬度，沿经线向南', '经度，沿同一经线向北'], correct: 2, explanation: '两点经度同为 30°W，纬度从北纬 30°增到北纬 60°，沿同一经线向北。' }],
    method: '横坐标按经度、纵坐标按纬度作线性展示；仅提供 −60°到 60°、间隔 30°的离散读图。0°单独命名，不标为南北纬或东西经。',
    limitations: ['原创抽象坐标网，不是现实地图，不含真实边界；矩形格子不能用于判断真实面积、球面距离或两条经线的间距。', '东经/西经不等同于教材中的东/西半球划分；本课不讨论半球分界、极点、180°经线与跨日界线。', '15 分钟投屏纸笔设想，学情未经观察；真实试教与教师地理表述审核仍待完成。'],
    sources: [{ title: 'What is latitude?', publisher: 'NOAA National Ocean Service', url: 'https://oceanservice.noaa.gov/facts/latitude.html', verifiedAt }, { title: 'What is longitude?', publisher: 'NOAA National Ocean Service', url: 'https://oceanservice.noaa.gov/facts/longitude.html', verifiedAt }],
  },
  {
    id: 'GQ-T013', slug: 'climate-chart', title: '气候图判读与证据', volume: 'G7A', chapter: '世界的气候',
    question: '怎样用月份、气温和降水三个证据描述季节特点，而不只凭图形猜名称？',
    goal: '能分别读两轴，求年温差与年降水量，并依据最热月和多雨月份判断雨热同期或不同期。',
    prerequisites: '保守假设：会读折线和柱形图、加减法；可能把月均温的最大值误称为全年最高日温，或混读左右轴。',
    misconception: '把单月降水量当成年降水量；把柱比线高解释为降水数值大于气温，忽略不同单位。',
    steps: ['教师投屏先指月份和两轴，示范读取 1 月与 7 月月均温，再用最大月均温减最小月均温。', '个人先预测：保持气温季节和轴范围，只把多雨期从暖季改到冷季；记录最湿月与年总量。', '收起示范与计算结果，独立完成温差题和降水题；教师追问“读哪根轴、是否把 12 个月都算上”。'],
    example: '默认情景 1 月 4°C、7 月 28°C，年温差为 28−4 = 24°C。把 12 个月降水相加得 935 mm；7 月最多，为 180 mm。切换冷季多雨只重排降水月份，年总量不变，最湿月变为 1 月。',
    transfer: '延后提供不同数值但相同双轴格式：最暖月 26°C、最冷月 8°C；独立写 18°C，并说明这不是单日温差。',
    controls: [{ key: 'warmMonth', label: '最热月情景', options: [{ value: 7, label: '7 月最热' }, { value: 1, label: '1 月最热' }] }, { key: 'wetSeason', label: '多雨期情景', options: [{ value: 0, label: '暖季多雨' }, { value: 1, label: '冷季多雨' }] }],
    defaults: { warmMonth: 7, wetSeason: 0 }, comparison: { label: '只改为冷季多雨', input: { warmMonth: 7, wetSeason: 1 } },
    evaluate(input) {
      const model = climateModel(input);
      return { metrics: [{ label: '最高月均温', value: model.max, unit: '°C' }, { label: '最低月均温', value: model.min, unit: '°C' }, { label: '年温差', value: model.range, unit: '°C' }, { label: '年降水量', value: model.total, unit: 'mm' }, { label: '最热月', value: model.warmMonth, unit: '月' }, { label: '最湿月', value: model.wetMonth, unit: '月' }], message: `最热月 ${model.warmMonth} 月，最湿月 ${model.wetMonth} 月；此情景为雨热${model.warmMonth === model.wetMonth ? '同期' : '不同期'}。先描述证据，本页不据此自动判定真实气候类型。只改多雨期时气温不变；改最热月时两组月值一起平移半年，年总量和温差保持不变。` };
    },
    Diagram: ClimateDiagram,
    questions: [{ prompt: '独立情景 A：另一组完整年记录中，最高月均温 26°C、最低月均温 6°C，年温差是多少？', options: ['32°C', '20°C', '6°C'], correct: 1, explanation: '年温差 = 最高月均温−最低月均温 = 26−6 = 20°C；不是把二者相加。' }, { prompt: '独立情景 B：另一组模拟数据，1–6 月每月降水 30 mm，7–12 月每月 90 mm，全年降水量是多少？', options: ['90 mm', '120 mm', '720 mm'], correct: 2, explanation: '必须覆盖 12 个月：6×30 + 6×90 = 180 + 540 = 720 mm。' }],
    method: '原创的 12 个月模拟平均值。最热月情景通过循环平移 6 个月改变季节；多雨期情景再将降水平移 6 个月。统计与 SVG、数据表共用 climateModel，温度轴恒定 0–30°C，降水轴恒定 0–200 mm。',
    limitations: ['数据是人为构造的多年平均月值练习，无真实地点、统计期或预测能力；外部来源只核验变量与读图原理，不是这组数据的来源。', '这些温度和降水组合只练习读图；不能代表某种气候所有特征，也不能仅凭最热月断定全部真实地点的半球。', '不推断降水成因，不把季节相关当成因果。15 分钟投屏纸笔设想，未经真实师生试教，教师须核验学生是否独立读轴。'],
    sources: [{ title: 'Historic station data — monthly climate variables', publisher: 'Met Office', url: 'https://www.metoffice.gov.uk/research/climate/maps-and-data/historic-station-data', verifiedAt }, { title: 'Climate', publisher: 'Met Office', url: 'https://weather.metoffice.gov.uk/climate', verifiedAt }],
  },
];
