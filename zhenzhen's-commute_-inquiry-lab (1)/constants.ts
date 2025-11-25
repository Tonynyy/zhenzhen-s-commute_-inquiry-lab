import { LevelConfig, NodeType, NodeCategory, ChatMessage } from './types';

export const INITIAL_NODES: Record<string, any> = {
  departure: {
    id: 'departure',
    label: '出发时间',
    type: NodeType.INPUT,
    category: NodeCategory.TIME,
    value: '07:30', // Changed from 08:00 to force user to set it
    x: 50,
    y: 100,
    description: '真真离开家的时间'
  },
  arrival: {
    id: 'arrival',
    label: '到校时间',
    type: NodeType.OUTPUT,
    category: NodeCategory.RESULT,
    value: '--:--',
    x: 600,
    y: 100,
    description: '最终到达学校的时刻'
  },
  distance: {
    id: 'distance',
    label: '上学距离',
    type: NodeType.INPUT,
    category: NodeCategory.PHYSICS,
    value: 0, // Zero init, requires user input
    unit: 'km',
    x: 50,
    y: 250,
    description: '家到学校的路程'
  },
  speed: {
    id: 'speed',
    label: '行车速度',
    type: NodeType.INPUT,
    category: NodeCategory.PHYSICS,
    value: 0, // Zero init, requires user input
    unit: 'km/h',
    x: 50,
    y: 350,
    description: '平均行车速度'
  },
  travelTime: {
    id: 'travelTime',
    label: '行车用时',
    type: NodeType.CALC,
    category: NodeCategory.PHYSICS,
    value: 0,
    unit: 'min',
    x: 350,
    y: 300,
    description: '距离 / 速度'
  },
  lights: {
    id: 'lights',
    label: '红绿灯耗时',
    type: NodeType.INPUT,
    category: NodeCategory.ENVIRONMENT,
    value: 2, // Fixed 2 minutes
    unit: 'min',
    x: 350,
    y: 450,
    description: '红绿灯造成的固定延时'
  },
  weather: {
    id: 'weather',
    label: '天气情况',
    type: NodeType.INPUT,
    category: NodeCategory.ENVIRONMENT,
    value: '晴天',
    options: ['晴天', '下雨', '暴雪'],
    x: 50,
    y: 450,
    description: '天气会影响车速'
  },
  congestion: {
    id: 'congestion',
    label: '交通拥堵',
    type: NodeType.INPUT,
    category: NodeCategory.ENVIRONMENT,
    value: '通畅',
    options: ['通畅', '拥堵'],
    x: 50,
    y: 550,
    description: '学校附近的拥堵情况'
  }
};

const LEVEL_CLUES: Record<number, ChatMessage[]> = {
  1: [
    { id: '1-1', question: '真真，你通常几点出门？', answer: '我一般早上 8:00 准时从家出发。（请记得修改【出发时间】为 8:00！）' },
    { id: '1-2', question: '路上要花多久？', answer: '通常需要 20 到 21 分钟。也就是出发时间加上这段耗时等于到校时间。（提示：请连接 出发时间 -> 到校时间，系统会模拟这段基础耗时）' },
  ],
  2: [
    { id: '2-1', question: '上学距离有多远？', answer: '我家离学校大概 7 公里。（请在【上学距离】中输入 7）' },
    { id: '2-2', question: '爸爸开车速度是多少？', answer: '爸爸开车比较稳，平均速度大概 20 km/h。（请在【行车速度】中输入 20）' },
    { id: '2-3', question: '这些因素怎么连接？', answer: '路程除以速度等于时间。请连接：距离 -> 行车用时，速度 -> 行车用时。最后记得：行车用时 -> 到校时间。' },
  ],
  3: [
    { id: '3-1', question: '红绿灯有什么影响？', answer: '红绿灯会固定增加我们的行程时间。请连接：红绿灯耗时 -> 行车用时。' },
    { id: '3-2', question: '红绿灯会耽误多久？', answer: '这条路上的红绿灯设置比较规律，通常固定耽误 2 分钟左右。' },
  ],
  4: [
    { id: '4-1', question: '下雨天有什么影响？', answer: '下雨天路滑，爸爸会开得慢一些，速度是平时的80%。(请你自己算一下 20 x 0.8 是多少，然后修改【行车速度】的数值！)' },
    { id: '4-2', question: '除了改速度，模型怎么连？', answer: '逻辑上是天气改变了速度。所以请连接：天气情况 -> 行车速度。' },
  ],
  5: [
    { id: '5-1', question: '为什么有时候会堵车？', answer: '这跟出门时间有关！如果 7:55 以后才出门，校门口就会非常拥堵；如果早点走就很通畅。' },
    { id: '5-2', question: '那怎么连接模型？', answer: '因为出发时间决定了拥堵，而拥堵又增加了行车用时。请连接：出发时间 -> 交通拥堵，以及 交通拥堵 -> 行车用时。' },
  ]
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: "基础：出发时间",
    question: "真真8:00出发，忽略路程，8:30前是否能到？",
    decisionPrompt: "你认为真真能准时到达吗？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival],
    requiredConnections: ['departure-arrival'],
    correctAnswer: "能",
    options: ["能", "不能"],
    clues: LEVEL_CLUES[1]
  },
  {
    id: 2,
    title: "进阶：路程与速度",
    question: "询问真真获得距离和速度。真真最有可能什么时候到达学校？",
    decisionPrompt: "根据模拟结果，最可能的到达时间是？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival, INITIAL_NODES.distance, INITIAL_NODES.speed, INITIAL_NODES.travelTime],
    requiredConnections: ['departure-arrival', 'distance-travelTime', 'speed-travelTime', 'travelTime-arrival'],
    correctAnswer: "8:21",
    options: ["8:20", "8:21", "8:22"], // 7km / 20km/h = 21min. 8:21 arrival.
    clues: LEVEL_CLUES[2]
  },
  {
    id: 3,
    title: "变量：红绿灯",
    question: "加入红绿灯耗时(固定2分钟)，真真最有可能的到达时间区间是？",
    decisionPrompt: "加入红绿灯后，最可能的到达时间是？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival, INITIAL_NODES.distance, INITIAL_NODES.speed, INITIAL_NODES.travelTime, INITIAL_NODES.lights],
    requiredConnections: ['lights-travelTime'],
    // Base 21m. Lights: +2m. Total ~23m -> 8:23
    correctAnswer: "8:22 - 8:23",
    options: ["8:20 - 8:21", "8:22 - 8:23", "8:24 - 8:25"], 
    clues: LEVEL_CLUES[3]
  },
  {
    id: 4,
    title: "环境：天气影响",
    question: "若遇到【下雨】天，速度变慢(平时80%)，真真最有可能的到达时间？",
    decisionPrompt: "下雨天，真真最可能几点到达？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival, INITIAL_NODES.distance, INITIAL_NODES.speed, INITIAL_NODES.travelTime, INITIAL_NODES.lights, INITIAL_NODES.weather],
    requiredConnections: ['weather-speed'],
    // Math: Speed MUST BE MANUALLY SET TO 16. Distance 7. Time=26.25m. Lights +2m. Total ~28.25m. Arrival ~8:28.
    // Sim Noise Tweak: ensure it doesn't hit 29.
    correctAnswer: "8:27 - 8:28",
    options: ["8:25 - 8:26", "8:27 - 8:28", "8:29 - 8:30"], 
    clues: LEVEL_CLUES[4]
  },
  {
    id: 5,
    title: "复杂：交通拥堵",
    question: "拥堵受出发时间影响。若【下雨】且【8:00出发】，8:30前能到吗？",
    decisionPrompt: "综合所有因素，8:30前能到吗？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival, INITIAL_NODES.distance, INITIAL_NODES.speed, INITIAL_NODES.travelTime, INITIAL_NODES.lights, INITIAL_NODES.weather, INITIAL_NODES.congestion],
    requiredConnections: ['departure-congestion', 'congestion-travelTime'], 
    // Departure 8:00 -> Congested (+7~9 mins). Speed 16 -> Slow (+5 mins). Base 21. Lights +2. Total: ~35-38m. Arrival ~8:35 - 8:38.
    correctAnswer: "不能",
    options: ["能", "不能"], 
    clues: LEVEL_CLUES[5]
  },
  {
    id: 6,
    title: "结论：最终时间",
    question: "根据上一关的拥堵情况，真真最有可能几点到学校？（精确时间）",
    decisionPrompt: "综合所有因素，最可能几点到？",
    availableNodes: [INITIAL_NODES.departure, INITIAL_NODES.arrival, INITIAL_NODES.distance, INITIAL_NODES.speed, INITIAL_NODES.travelTime, INITIAL_NODES.lights, INITIAL_NODES.weather, INITIAL_NODES.congestion],
    requiredConnections: ['departure-congestion', 'congestion-travelTime'], 
    // Logic: Base(21) + Lights(2) + RainPenalty(5.25) + Congestion(7~9) = 35.25 ~ 37.25 min travel.
    // Arrival: 8:35, 8:36, 8:37, 8:38 (depending on noise).
    // Correct Answer Range MUST cover these possibilities.
    correctAnswer: "8:35 - 8:38",
    options: ["8:30 - 8:34", "8:35 - 8:38", "8:39 - 8:42"], 
    clues: LEVEL_CLUES[5] // Reuse clues
  }
];