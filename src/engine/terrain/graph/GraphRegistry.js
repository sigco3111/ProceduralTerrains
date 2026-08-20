import { BLEND_LABELS } from '../noise/blendModes.js';
import { activeLayers } from '../noise/NoiseStack.js';
import { getNoiseType } from '../noise/noiseTypes.js';
import { TERRAIN_GRADIENT_OPTIONS } from './TerrainGradientPresets.js';

export const ANALYTIC_HEIGHT = 'analytic-height';
export const ANALYTIC_COLOR = 'analytic-color';
export const GRAPH_CAPACITY = 12;
export const GRAPH_COLOR_CAPACITY = 8;

const input = (id, label, required = true, type = ANALYTIC_HEIGHT) => ({ id, label, type, required });
const output = (id = 'height', label = '높이', type = ANALYTIC_HEIGHT) => ({ id, label, type });
const colorInput = (id = 'color', label = '색상', required = true) => input(id, label, required, ANALYTIC_COLOR);
const colorOutput = (id = 'color', label = '색상') => output(id, label, ANALYTIC_COLOR);
const number = (key, label, min, max, step, value, extra = {}) => ({
  key, label, type: 'number', min, max, step, default: value, ...extra,
});
const color = (key, label, value, extra = {}) => ({ key, label, type: 'color', default: value, ...extra });
const select = (key, label, options, value, extra = {}) => ({
  key, label, type: 'enum', options, default: value, structural: true, ...extra,
});
const execute = (kind) => (context) => context[kind]();

const SOURCE_TYPES = ['fbm', 'ridged', 'billow', 'value', 'white', 'constant', 'voronoi', 'crater', 'dune', 'flow'];

const MOUNTAIN_STYLE_OPTIONS = [
  { value: 'basic', label: '기본' },
  { value: 'eroded', label: '침식됨' },
  { value: 'old', label: '오래된' },
  { value: 'alpine', label: '고산' },
  { value: 'strata', label: '지층' },
];

const MOUNTAIN_BULK_OPTIONS = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '높음' },
];

const CANYON_STYLE_OPTIONS = [
  { value: 'classic', label: '클래식' },
  { value: 'eroded', label: '침식됨' },
  { value: 'eroded2', label: '침식 2' },
  { value: 'strata', label: '지층' },
  { value: 'both', label: '둘 다' },
];

const DUNE_TYPE_OPTIONS = [
  { value: 'transverse', label: '횡단' },
  { value: 'barchan', label: '바르한' },
  { value: 'seif', label: '세이프' },
  { value: 'star', label: '별' },
];

const AMOUNT_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '높음' },
];

function sourceDefinition(type) {
  const noise = getNoiseType(type);
  const inspector = [
    number('strength', '세기', -2, 2, 0.01, noise.defaultStrength ?? 1),
    number('seedOffset', '시드 오프셋', -999, 999, 1, 0),
    ...(noise.params || []).map((param) => ({ type: param.type || 'number', ...param })),
  ];
  return {
    id: type,
    label: type === 'crater' ? '분화구 지대' : noise.label,
    description: noise.desc,
    category: '노이즈',
    executionKind: 'analytical',
    inputs: [], outputs: [output()],
    inspector,
    defaults: Object.fromEntries(inspector.map((field) => [field.key, field.default])),
    structuralParams: inspector.filter((field) => field.structural).map((field) => field.key),
    uniformSlots: () => 1,
    glslCompiler: execute('source'), cpuEvaluator: execute('source'),
    noiseType: type,
    color: type === 'ridged' || type === 'crater' ? 'amber' : 'green',
  };
}

function deterministicNoiseDefinition() {
  const inspector = [
    number('strength', '진폭', 0, 2, 0.01, 0.8, { section: '출력' }),
    number('seed', '시드', 0, 999999, 1, 1337, { section: '변형' }),
    number('scale', '스케일', 0.1, 20, 0.05, 1, { section: '프랙탈' }),
    number('octaves', '옥타브', 1, 8, 1, 6, { structural: true, section: '프랙탈' }),
    number('persistence', '지속성', 0.15, 0.85, 0.01, 0.5, { section: '프랙탈' }),
    number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2, { section: '프랙탈' }),
    number('erosion', '침식', 0, 1, 0.01, 0.08, { section: '문자' }),
    number('warp', '자체 뒤틀림', 0, 1.5, 0.01, 0.12, { section: '문자' }),
  ];
  return {
    id: 'deterministicNoise', label: '결정론적 노이즈', category: '기본', color: 'green',
    description: 'A seeded fractal source that produces the same terrain for the same seed on every build.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector,
    defaults: Object.fromEntries(inspector.map((field) => [field.key, field.default])),
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('source'), cpuEvaluator: execute('source'),
    noiseType: 'fbm', seedParam: 'seed',
  };
}

const terrainNode = ({ id, label, description, color = 'green', inspector }) => ({
  id, label, description, category: '지형 형태', color,
  executionKind: 'analytical', inputs: [], outputs: [output()], inspector,
  defaults: Object.fromEntries(inspector.map((field) => [field.key, field.default])),
  structuralParams: inspector.filter((field) => field.structural).map((field) => field.key),
  uniformSlots: () => 1, glslCompiler: execute(id), cpuEvaluator: execute(id),
  terrainOnly: true, workspaceModes: ['terrain'], landform: true,
});

const LANDFORM_DEFINITIONS = [
  terrainNode({
    id: 'mountain', label: '산',
    description: 'Builds a seeded multi-peak massif from organically distorted cellular structure, with branching ridges, drainage valleys, and natural foothills.',
    inspector: [
      select('style', '스타일', MOUNTAIN_STYLE_OPTIONS, 'alpine', { section: '산', tier: 'essential', control: 'segmented', help: 'Changes the geological character without rebuilding the whole graph.' }),
      select('bulk', '대량', MOUNTAIN_BULK_OPTIONS, 'medium', { section: '산', tier: 'essential', control: 'segmented', help: 'Controls how much high-altitude mass survives later erosion.' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.62, { section: '산', tier: 'essential', help: 'Sets the mountain footprint.' }),
      number('height', '높이', 0, 2.5, 0.01, 1.25, { section: '산', tier: 'essential', help: 'Controls vertical relief before output normalization.' }),
      { key: 'reduceDetails', label: '디테일 줄이기', type: 'boolean', default: false, section: '산', tier: 'essential', help: 'Keeps the primitive broad when later nodes will provide the surface detail.' },
      number('seed', '시드', 0, 999999, 1, 1201, { section: '변형', control: 'seed', help: '동일한 설정의 결정론적 변형을 생성합니다.' }),
      number('x', 'X', -2, 2, 0.01, 0, { section: 'Placement' }),
      number('y', 'Y', -2, 2, 0.01, 0, { section: 'Placement' }),
    ],
  }),
  terrainNode({
    id: 'mountainRange', label: '산맥',
    description: 'Builds a connected mountain chain with direction, span, ridge width, and seeded variation.',
    inspector: [
      number('height', '높이', 0, 2.5, 0.01, 1.2, { section: '형태' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.65, { section: '형태' }),
      number('direction', '방향', 0, 6.283, 0.01, 0.7, { section: '형태' }),
      number('width', '범위 폭', 0.1, 2, 0.01, 0.42, { section: '형태' }),
      number('length', '범위 길이', 0.4, 5, 0.01, 2.4, { section: '형태' }),
      number('sharpness', '능선 선명도', 0.5, 4, 0.01, 1.8, { section: '표면' }),
      number('roughness', '해체', 0, 1.5, 0.01, 0.65, { section: '표면' }),
      number('octaves', '디테일 옥타브', 1, 8, 1, 6, { structural: true, section: '표면' }),
      number('persistence', '지속성', 0.15, 0.85, 0.01, 0.5, { section: '표면' }),
      number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2.1, { section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 2201, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'ridge', label: '산등성이', color: 'amber',
    description: 'Creates a long directional ridge with adjustable width, crest sharpness, and natural breakup.',
    inspector: [
      number('height', '높이', 0, 2.5, 0.01, 0.95, { section: '형태' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.8, { section: '형태' }),
      number('direction', '방향', 0, 6.283, 0.01, 1.15, { section: '형태' }),
      number('width', '너비', 0.05, 1.5, 0.01, 0.28, { section: '형태' }),
      number('sharpness', '꼭대기 선명도', 0.5, 6, 0.01, 2.2, { section: '형태' }),
      number('breakup', '마루 분해', 0, 4, 0.01, 1.3, { section: '표면' }),
      number('roughness', '거칠기', 0, 1, 0.01, 0.45, { section: '표면' }),
      number('octaves', '디테일 옥타브', 1, 8, 1, 5, { structural: true, section: '표면' }),
      number('persistence', '지속성', 0.15, 0.85, 0.01, 0.48, { section: '표면' }),
      number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2.05, { section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 3301, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'island', label: '섬', color: 'cyan',
    description: 'Generates a finite island with a seeded interior, plateau control, and a softened coastline.',
    inspector: [
      number('height', '높이', 0, 2.5, 0.01, 1.05, { section: '형태' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.7, { section: '형태' }),
      number('radius', '섬 반경', 0.2, 4, 0.01, 1.35, { section: '형태' }),
      number('coast', '해안 폴오프', 0.02, 0.8, 0.01, 0.28, { section: '형태' }),
      number('plateau', '고원', 0, 1, 0.01, 0.32, { section: '표면' }),
      number('roughness', '내부 거칠기', 0, 1, 0.01, 0.72, { section: '표면' }),
      number('octaves', '디테일 옥타브', 1, 8, 1, 6, { structural: true, section: '표면' }),
      number('persistence', '지속성', 0.15, 0.85, 0.01, 0.5, { section: '표면' }),
      number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2, { section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 4401, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'singleCrater', label: '분화구', color: 'amber',
    description: 'Cuts one impact bowl with a raised rim and seeded surface damage for combining into a base terrain.',
    inspector: [
      number('depth', '깊이', 0, 2, 0.01, 0.75, { section: '충격' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.85, { section: '충격' }),
      number('radius', '반지름', 0.2, 2, 0.01, 0.9, { section: '충격' }),
      number('rimHeight', '림 높이', 0, 1, 0.01, 0.42, { section: '림' }),
      number('rimWidth', '림 너비', 0.03, 0.6, 0.01, 0.18, { section: '림' }),
      number('roughness', '데미지', 0, 1, 0.01, 0.2, { section: '표면' }),
      number('octaves', '디테일 옥타브', 1, 8, 1, 4, { structural: true, section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 5501, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'canyon', label: '협곡', color: 'amber',
    description: 'Builds a drainage-led canyon with a meandering slot, broad valley shoulders, branching gullies, eroded walls, and optional strata.',
    inspector: [
      select('style', '스타일', CANYON_STYLE_OPTIONS, 'both', { section: '구조', tier: 'essential', control: 'segmented', help: '깔끔한, 침식된, 층상의, 또는 결합된 벽 특성을 선택합니다.' }),
      number('scale', '스케일', 0.15, 4, 0.01, 0.72, { section: '구조', tier: 'essential' }),
      number('slot', '슬롯', 0.05, 1.5, 0.01, 0.34, { section: '조각', tier: 'essential', help: '캐년 바닥의 가장 깊고 좁은 절개를 제어합니다.' }),
      number('valley', '계곡', 0.2, 4, 0.01, 1.65, { section: '조각', tier: 'essential', help: '더 넓은 협곡 어깨의 폭을 제어합니다.' }),
      number('surrounding', '주변', 0, 1, 0.01, 0.72, { section: '조각', help: '깎인 채널을 주변 고원에 혼합합니다.' }),
      number('depth', '깊이', 0, 2.5, 0.01, 1.12, { section: '조각', tier: 'essential' }),
      number('structuralWarp', '구조 왜곡', 0, 2, 0.01, 0.68, { section: '지층', help: '배수 경로를 깨지 않고 큰 굴곡 추가.' }),
      number('formation', '지층', 0, 1, 0.01, 0.62, { section: '지층', help: '벽 해체와 지류 협곡을 제어합니다.' }),
      number('detailWarp', '디테일 워프', 0, 1, 0.01, 0.34, { section: '지층' }),
      number('alternateStyle', '대체 스타일', 0, 1, 0.01, 0.28, { section: '지층' }),
      number('seed', '시드', 0, 999999, 1, 6101, { section: '변형', control: 'seed' }),
    ],
  }),
  terrainNode({
    id: 'duneSea', label: '사구 바다', color: 'amber',
    description: 'Creates broad wind-shaped dune fields with asymmetric slip faces, macro undulation, controlled chaos, and fine sand ripples.',
    inspector: [
      select('duneType', '사구 유형', DUNE_TYPE_OPTIONS, 'barchan', { section: '사구 바다', tier: 'essential', control: 'segmented' }),
      select('chaos', '카오스', AMOUNT_OPTIONS, 'medium', { section: '사구 바다', tier: 'essential', control: 'segmented' }),
      select('undulation', '물결 진동', AMOUNT_OPTIONS, 'medium', { section: '사구 바다', tier: 'essential', control: 'segmented' }),
      number('scale', '스케일', 0.15, 6, 0.01, 1.05, { section: '형태', tier: 'essential' }),
      number('direction', '방향', 0, 6.283, 0.01, 0.72, { section: '바람', tier: 'essential' }),
      number('height', '높이', 0, 2.5, 0.01, 0.82, { section: '형태', tier: 'essential' }),
      number('softness', '부드러움', 0, 1, 0.01, 0.46, { section: '프로필' }),
      number('sharpness', '선예도', 0.3, 5, 0.01, 2.15, { section: '프로필' }),
      number('seed', '시드', 0, 999999, 1, 7101, { section: '변형', control: 'seed' }),
    ],
  }),
];

const BLEND_OPTIONS = [
  ...Object.entries(BLEND_LABELS).map(([value, label]) => ({ value, label })),
  { value: 'mix', label: '믹스' },
];

const MATH_OPTIONS = [
  ['add', '추가'], ['subtract', '빼기'], ['multiply', '곱하기'], ['divide', '나누기'],
  ['power', '세기'], ['absolute', '절대'], ['negate', '반전'], ['invert', '반전'], ['clamp', '클램프'],
].map(([value, label]) => ({ value, label }));

const definitions = [
  {
    id: 'currentTerrain', label: '현재 지형', category: '소스', color: 'green',
    description: 'A frozen compatibility snapshot of the Noise Stack that was active when Nodes was opened.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector: [], defaults: {},
    structuralParams: ['stack'], uniformSlots: (node) => activeLayers(node?.params?.stack || { layers: [] }).length,
    glslCompiler: execute('currentTerrain'), cpuEvaluator: execute('currentTerrain'),
    hiddenFromPalette: true, singleton: true,
  },
  {
    id: 'classicTerrain', label: '클래식 지형', category: '소스', color: 'green',
    description: 'The original biome-aware terrain generator, driven by the global Terrain controls.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector: [], defaults: {},
    structuralParams: [], uniformSlots: () => 0,
    glslCompiler: execute('classicTerrain'), cpuEvaluator: execute('classicTerrain'), hiddenFromPalette: true,
  },
  deterministicNoiseDefinition(),
  ...SOURCE_TYPES.map(sourceDefinition),
  ...LANDFORM_DEFINITIONS,
  {
    id: 'domainWarp', label: '유기적 워프', category: '변환', color: 'cyan',
    description: 'Uses a seeded vector field to bend terrain into broad organic forms without directional tearing.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('scale', '크기', 0.1, 8, 0.05, 1, { section: '벡터장', tier: 'essential', help: '넓은 굴곡의 크기를 설정합니다.' }),
      number('strength', '세기', 0, 4, 0.01, 0.7, { section: '벡터장', tier: 'essential', help: '표고를 직접 변경하지 않고 변위를 제어합니다.' }),
      number('perturbation', '요동', 0, 1, 0.01, 0.28, { section: '벡터장', tier: 'essential', help: '벡터 필드의 대칭을 깹니다.' }),
      number('octaves', '복잡도', 1, 6, 1, 4, { structural: true, section: '디테일' }),
      number('roughness', '거칠기', 0.2, 0.8, 0.01, 0.5, { section: '디테일' }),
      number('seedOffset', '시드', -999, 999, 1, 0, { section: '변형' }),
    ],
    defaults: { strength: 0.7, scale: 1, perturbation: 0.28, octaves: 4, roughness: 0.5, seedOffset: 0 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('domainWarp'), cpuEvaluator: execute('domainWarp'),
  },
  {
    id: 'shaper', label: '셰이퍼', category: '조정', color: 'violet',
    description: 'Adds or removes large-scale body before erosion while retaining the source terrain\'의 미세 구조.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('shape', '형태', -1, 1, 0.01, 0.38, { section: '매스', tier: 'essential', help: '양수 값은 봉우리를 키우고, 음수 값은 질량을 깎아냅니다.' }),
      number('strength', '세기', 0, 1, 0.01, 0.8, { section: '매스', tier: 'essential' }),
      number('featureScale', '바디 스케일', 5, 150, 1, 42, { section: '스케일', tier: 'essential', digits: 0, help: '대규모 본체를 구성하는 데 사용되는 이웃 영역을 설정합니다.' }),
      number('detailPreservation', '미세 디테일 보존', 0, 1, 0.01, 0.82, { section: '디테일', help: '대량 셰이핑 후 원본 미세구조를 복원합니다.' }),
    ],
    defaults: { shape: 0.38, strength: 0.8, featureScale: 42, detailPreservation: 0.82 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('shaper'), cpuEvaluator: execute('shaper'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'riverCarve', label: '강 깎기', category: '시뮬레이트', color: 'cyan',
    description: 'Cuts a continuous meandering river, converging tributaries, and a softly graded floodplain into an existing terrain.',
    executionKind: 'analytical', inputs: [input('source', '지형')], outputs: [output()],
    inspector: [
      number('water', '수원 흐름', 0, 2, 0.01, 0.88, { section: '강', tier: 'essential', help: 'Controls how strongly tributaries feed the main channel.' }),
      number('width', '강 폭', 0.02, 1.2, 0.01, 0.16, { section: '강', tier: 'essential' }),
      number('depth', '강 깊이', 0, 1.5, 0.01, 0.34, { section: '강', tier: 'essential' }),
      number('downcutting', '하방 침식', 0, 2, 0.01, 0.72, { section: '조각', tier: 'essential', help: '물이 암석과 토양을 얼마나 깊게 파고드는지 조절합니다.' }),
      number('valleyWidth', '강 계곡 너비', 0.5, 5, 0.05, 2.4, { section: '조각', tier: 'essential', help: '물 채널을 넓히지 않고 주변 계곡을 넓힙니다.' }),
      number('headwaters', '수원', 1, 8, 1, 5, { section: '네트워크', digits: 0 }),
      number('direction', '흐름 방향', 0, 6.283, 0.01, 1.05, { section: '네트워크' }),
      number('meander', '만곡', 0, 3, 0.01, 0.92, { section: '네트워크' }),
      number('seed', '시드', 0, 999999, 1, 8101, { section: '변형', control: 'seed' }),
    ],
    defaults: { water: 0.88, width: 0.16, depth: 0.34, downcutting: 0.72, valleyWidth: 2.4, headwaters: 5, direction: 1.05, meander: 0.92, seed: 8101 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('riverCarve'), cpuEvaluator: execute('riverCarve'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'combine', label: '결합', category: '결합', color: 'blue',
    description: '노이즈 스택 블렌드 연산 또는 �스를 사용하여 두 지형 신호를 결합합니다.',
    executionKind: 'analytical', inputs: [input('a', 'A'), input('b', 'B')], outputs: [output()],
    inspector: [select('operation', '작업', BLEND_OPTIONS, 'add'), number('mix', '믹스', 0, 1, 0.01, 0.5)],
    defaults: { operation: 'add', mix: 0.5 }, structuralParams: ['operation'], uniformSlots: () => 1,
    glslCompiler: execute('combine'), cpuEvaluator: execute('combine'),
  },
  {
    id: 'math', label: '수학', category: '조정', color: 'violet',
    description: '지형 신호에 스칼라 수학 연산을 적용합니다.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      select('operation', '작업', MATH_OPTIONS, 'multiply'),
      number('value', '값', -8, 8, 0.01, 1),
      number('min', '최소', -4, 4, 0.01, 0),
      number('max', '최대', -4, 4, 0.01, 1),
    ],
    defaults: { operation: 'multiply', value: 1, min: 0, max: 1 }, structuralParams: ['operation'], uniformSlots: () => 1,
    glslCompiler: execute('math'), cpuEvaluator: execute('math'),
  },
  {
    id: 'remap', label: '리매핑', category: '조정', color: 'violet',
    description: '입력 범위를 새 출력 범위로 매핑합니다.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('inMin', '입력 최솟값', -4, 4, 0.01, 0), number('inMax', '입력 최대', -4, 4, 0.01, 1),
      number('outMin', '출력 최소', -4, 4, 0.01, 0), number('outMax', '최대 출력', -4, 4, 0.01, 1),
      { key: 'clamp', label: '클램프', type: 'boolean', default: true, structural: true },
    ],
    defaults: { inMin: 0, inMax: 1, outMin: 0, outMax: 1, clamp: true }, structuralParams: ['clamp'], uniformSlots: () => 1,
    glslCompiler: execute('remap'), cpuEvaluator: execute('remap'),
  },
  {
    id: 'terrace', label: '테라스', category: '조정', color: 'amber',
    description: '지형을 제어 가능한 단계형 고원으로 양자화합니다.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('count', '계단 수', 2, 40, 1, 12),
      number('smoothness', '매끄러움', 0.02, 1, 0.01, 0.5),
      number('strength', '세기', 0, 1, 0.01, 1),
    ],
    defaults: { count: 12, smoothness: 0.5, strength: 1 }, structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('terrace'), cpuEvaluator: execute('terrace'),
  },
  {
    id: 'stratify', label: '층화', category: '표면', color: 'amber',
    description: 'Cuts localized, broken, non-linear rock layers into the source instead of quantizing the whole terrain into terraces.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('spacing', '간격', 0.02, 0.4, 0.005, 0.11, { section: '레이어', tier: 'essential', digits: 3, help: '지질학적 밴드 사이의 거리.' }),
      number('intensity', '강도', 0, 1, 0.01, 0.42, { section: '레이어', tier: 'essential', help: '레이어가 노출된 바위에 미치는 영향의 강도.' }),
      number('shape', '레이어 셰이프', 0, 1, 0.01, 0.62, { section: '레이어', tier: 'essential', help: '부드러운 층에서 더 날카롭게 깬 지층으로 이동합니다.' }),
      number('tilt', '기울기', -1, 1, 0.01, 0.16, { section: '방향' }),
      number('direction', '방향', 0, 6.283, 0.01, 0.7, { section: '방향' }),
      number('octaves', '분리 옥타브', 1, 6, 1, 4, { structural: true, section: '해체' }),
      number('seed', '시드', 0, 999999, 1, 7603, { section: '변형', control: 'seed' }),
    ],
    defaults: { spacing: 0.11, intensity: 0.42, shape: 0.62, tilt: 0.16, direction: 0.7, octaves: 4, seed: 7603 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('stratify'), cpuEvaluator: execute('stratify'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'geologyDetail', label: '지질 디테일', category: '표면', color: 'amber',
    description: 'Adds multi-scale rock structure, broken strata, and restrained ridge detail without flattening the base landform.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('strength', '디테일 세기', 0, 0.45, 0.005, 0.1, { section: '바위 구조' }),
      number('scale', '디테일 스케일', 0.25, 12, 0.05, 3.2, { section: '바위 구조' }),
      number('roughness', '능선 분리', 0, 1, 0.01, 0.58, { section: '바위 구조' }),
      number('strata', '지층', 0, 1, 0.01, 0.24, { section: '층화' }),
      number('strataScale', '레이어 빈도', 1, 32, 0.25, 11, { section: '층화' }),
      number('octaves', '디테일 옥타브', 2, 7, 1, 5, { structural: true, section: '프랙탈' }),
      number('persistence', '지속성', 0.2, 0.8, 0.01, 0.48, { section: '프랙탈' }),
      number('lacunarity', '틈새도', 1.5, 3.2, 0.01, 2.15, { section: '프랙탈' }),
      number('seed', '시드', 0, 999999, 1, 7103, { section: '변형' }),
    ],
    defaults: { strength: 0.1, scale: 3.2, roughness: 0.58, strata: 0.24, strataScale: 11, octaves: 5, persistence: 0.48, lacunarity: 2.15, seed: 7103 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('geologyDetail'), cpuEvaluator: execute('geologyDetail'),
  },
  {
    id: 'thermalErosion', label: '열 침식', category: '시뮬레이트', color: 'amber',
    description: 'Relaxes slopes above a talus angle, moves loose material downslope, and balances settling against sediment removal.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('duration', '지속 시간', 1, 40, 1, 12, { section: '일반', tier: 'essential', digits: 0, help: '경사 완화 양을 증가시킵니다.' }),
      number('strength', '세기', 0, 1, 0.01, 0.58, { section: '일반', tier: 'essential' }),
      number('featureScale', '피처 스케일', 2, 160, 1, 30, { section: '일반', tier: 'essential', digits: 0, help: '암괴 및 산사태 지형의 크기를 조절합니다.' }),
      number('talusAngle', '테일러스 각도', 15, 60, 0.5, 35, { section: '재질', digits: 1, unit: '°', help: 'Material moves when the local slope exceeds this angle.' }),
      number('anisotropy', '이방성', 0, 1, 0.01, 0.16, { section: '재질', help: '재료 흐름에 방향 편향 추가.' }),
      number('settling', '정착 중', 0, 1, 0.01, 0.72, { section: '퇴적물' }),
      number('sedimentRemoval', '퇴적물 제거', 0, 1, 0.01, 0.18, { section: '퇴적물' }),
      number('seed', '시드', 0, 999999, 1, 9103, { section: '변형', control: 'seed' }),
    ],
    defaults: { duration: 12, strength: 0.58, featureScale: 30, talusAngle: 35, anisotropy: 0.16, settling: 0.72, sedimentRemoval: 0.18, seed: 9103 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('thermalErosion'), cpuEvaluator: execute('thermalErosion'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'naturalErosion', label: '자연 침식', category: '시뮬레이트', color: 'cyan',
    description: 'Softens unstable crests, deposits material in shallow basins, and carves fine drainage channels using an analytical neighborhood pass.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('strength', '풍화', 0, 1, 0.01, 0.38, { section: '침식' }),
      number('radius', '쇄석 반경', 2, 180, 1, 34, { section: '침식', digits: 0 }),
      number('talus', '타러스 보존', 0, 1, 0.01, 0.62, { section: '침식' }),
      number('channels', '채널 조각', 0, 1, 0.01, 0.28, { section: '배수' }),
      number('channelScale', '채널 스케일', 0.25, 8, 0.05, 1.4, { section: '배수' }),
      number('deposition', '퇴적', 0, 1, 0.01, 0.22, { section: '배수' }),
      number('seed', '시드', 0, 999999, 1, 8209, { section: '변형' }),
    ],
    defaults: { strength: 0.38, radius: 34, talus: 0.62, channels: 0.28, channelScale: 1.4, deposition: 0.22, seed: 8209 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('naturalErosion'), cpuEvaluator: execute('naturalErosion'),
  },
  {
    id: 'terrainGradient', label: '지형 그라데이션', category: '컬러라이즈', color: 'rose',
    description: 'Maps rendered elevation through a curated satellite-style gradient with large-scale mineral and vegetation variation.',
    executionKind: 'analytical', inputs: [], outputs: [colorOutput()], preview: 'gradient',
    inspector: [
      select('preset', '지형 패밀리', TERRAIN_GRADIENT_OPTIONS, 'alpine', { section: '그라데이션' }),
      number('lowPoint', '저지대 끝', 0.05, 0.5, 0.01, 0.28, { section: '고도 밴드' }),
      number('highPoint', '고지대 시작', 0.3, 0.82, 0.01, 0.62, { section: '고도 밴드' }),
      number('summitPoint', '정상 / 설산', 0.58, 1, 0.01, 0.86, { section: '고도 밴드' }),
      number('variation', '자연스러운 변화', 0, 0.5, 0.01, 0.16, { section: '표면 디테일' }),
      number('macroScale', '패치 스케일', 0.05, 2, 0.01, 0.42, { section: '표면 디테일' }),
    ],
    defaults: { preset: 'alpine', lowPoint: 0.28, highPoint: 0.62, summitPoint: 0.86, variation: 0.16, macroScale: 0.42 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('terrainGradient'), cpuEvaluator: execute('terrainGradient'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'slopeTint', label: '경사 바위', category: '컬러라이즈', color: 'rose',
    description: 'Exposes believable rock on steep faces while keeping flatter ledges and valleys tied to the incoming terrain color.',
    executionKind: 'analytical', inputs: [colorInput('base', '기본 색상')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      color('rockColor', '바위 색상', '#6f6b63', { section: '바위' }),
      number('slopeStart', '노출 시작', 0.04, 0.8, 0.01, 0.2, { section: '바위' }),
      number('slopeEnd', '전체 노출', 0.08, 1, 0.01, 0.56, { section: '바위' }),
      number('strength', '바위 양', 0, 1, 0.01, 0.72, { section: '바위' }),
      number('variation', '광물 변화', 0, 0.5, 0.01, 0.12, { section: '표면 디테일' }),
      number('scale', '광물 스케일', 0.05, 4, 0.01, 0.78, { section: '표면 디테일' }),
    ],
    defaults: { rockColor: '#6f6b63', slopeStart: 0.2, slopeEnd: 0.56, strength: 0.72, variation: 0.12, scale: 0.78 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('slopeTint'), cpuEvaluator: execute('slopeTint'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'moistureTint', label: '수분 색조', category: '컬러라이즈', color: 'rose',
    description: 'Uses the terrain climate field to introduce dry soil and damp vegetation variation at geographic scale.',
    executionKind: 'analytical', inputs: [colorInput('base', '기본 색상')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      color('dryColor', '건조한 색조', '#8c7458', { section: '기후' }),
      color('wetColor', '젖은 틴트', '#314a39', { section: '기후' }),
      number('amount', '기후 양', 0, 1, 0.01, 0.3, { section: '기후' }),
      number('balance', '습식 / 건식 균형', 0.1, 0.9, 0.01, 0.5, { section: '기후' }),
      number('softness', '전환', 0.02, 0.5, 0.01, 0.18, { section: '기후' }),
    ],
    defaults: { dryColor: '#8c7458', wetColor: '#314a39', amount: 0.3, balance: 0.5, softness: 0.18 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('moistureTint'), cpuEvaluator: execute('moistureTint'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'colorGrade', label: '컬러 그레이드', category: '컬러라이즈', color: 'rose',
    description: 'Finishes the terrain albedo with restrained saturation, contrast, exposure, and warm/cool balance.',
    executionKind: 'analytical', inputs: [colorInput('base', '기본 색상')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      number('saturation', '채도', 0, 2, 0.01, 0.92, { section: '그레이드' }),
      number('contrast', '대비', 0.5, 1.8, 0.01, 1.04, { section: '그레이드' }),
      number('exposure', '노출', 0.5, 1.5, 0.01, 0.96, { section: '그레이드' }),
      number('warmth', '따뜻함', -1, 1, 0.01, 0.02, { section: '그레이드' }),
    ],
    defaults: { saturation: 0.92, contrast: 1.04, exposure: 0.96, warmth: 0.02 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('colorGrade'), cpuEvaluator: execute('colorGrade'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'terrainOutput', label: '지형 출력', category: '출력', color: 'output',
    description: 'Connect height and optional surface color here. Unconnected height stays flat; unconnected color uses the project palette.',
    executionKind: 'analytical', inputs: [input('height', '높이', false), colorInput('color', '색상', false)], outputs: [],
    inspector: [
      { key: 'normalize', label: '출력 정규화', type: 'boolean', default: false },
      number('outMin', '출력 최소', -4, 4, 0.01, 0),
      number('outMax', '최대 출력', -4, 4, 0.01, 1.35),
    ],
    defaults: { normalize: false, outMin: 0, outMax: 1.35 }, structuralParams: [], uniformSlots: () => 0,
    glslCompiler: execute('terrainOutput'), cpuEvaluator: execute('terrainOutput'),
    hiddenFromPalette: true, singleton: true, permanent: true,
  },
];

const registry = new Map(definitions.map((definition) => [definition.id, Object.freeze(definition)]));

export function getGraphNodeDefinition(type) { return registry.get(type) || null; }
export function listGraphNodeDefinitions({ includeHidden = false, mode = null } = {}) {
  return definitions.filter((definition) => (includeHidden || !definition.hiddenFromPalette)
    && (!mode || !definition.workspaceModes || definition.workspaceModes.includes(mode)));
}
export function nodeDefaults(type) {
  const definition = getGraphNodeDefinition(type);
  return definition ? structuredClone(definition.defaults) : {};
}
