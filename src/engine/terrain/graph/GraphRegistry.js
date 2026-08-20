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
  { value: 'eroded', label: 'Eroded' },
  { value: 'old', label: 'Old' },
  { value: 'alpine', label: 'Alpine' },
  { value: 'strata', label: '지층' },
];

const MOUNTAIN_BULK_OPTIONS = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '높음' },
];

const CANYON_STYLE_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'eroded', label: 'Eroded' },
  { value: 'eroded2', label: 'Eroded 2' },
  { value: 'strata', label: '지층' },
  { value: 'both', label: 'Both' },
];

const DUNE_TYPE_OPTIONS = [
  { value: 'transverse', label: 'Transverse' },
  { value: 'barchan', label: 'Barchan' },
  { value: 'seif', label: 'Seif' },
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
    number('seedOffset', 'Seed Offset', -999, 999, 1, 0),
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
    number('scale', '스케일', 0.1, 20, 0.05, 1, { section: 'Fractal' }),
    number('octaves', '옥타브', 1, 8, 1, 6, { structural: true, section: 'Fractal' }),
    number('persistence', '지속성', 0.15, 0.85, 0.01, 0.5, { section: 'Fractal' }),
    number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2, { section: 'Fractal' }),
    number('erosion', '침식', 0, 1, 0.01, 0.08, { section: 'Character' }),
    number('warp', 'Self Warp', 0, 1.5, 0.01, 0.12, { section: 'Character' }),
  ];
  return {
    id: 'deterministicNoise', label: 'Deterministic Noise', category: '기본', color: 'green',
    description: 'A seeded fractal source that produces the same terrain for the same seed on every build.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector,
    defaults: Object.fromEntries(inspector.map((field) => [field.key, field.default])),
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('source'), cpuEvaluator: execute('source'),
    noiseType: 'fbm', seedParam: 'seed',
  };
}

const terrainNode = ({ id, label, description, color = 'green', inspector }) => ({
  id, label, description, category: 'Landforms', color,
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
      select('bulk', 'Bulk', MOUNTAIN_BULK_OPTIONS, 'medium', { section: '산', tier: 'essential', control: 'segmented', help: 'Controls how much high-altitude mass survives later erosion.' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.62, { section: '산', tier: 'essential', help: 'Sets the mountain footprint.' }),
      number('height', '높이', 0, 2.5, 0.01, 1.25, { section: '산', tier: 'essential', help: 'Controls vertical relief before output normalization.' }),
      { key: 'reduceDetails', label: 'Reduce Details', type: 'boolean', default: false, section: '산', tier: 'essential', help: 'Keeps the primitive broad when later nodes will provide the surface detail.' },
      number('seed', '시드', 0, 999999, 1, 1201, { section: '변형', control: 'seed', help: 'Generates a deterministic variation of the same settings.' }),
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
      number('width', 'Range Width', 0.1, 2, 0.01, 0.42, { section: '형태' }),
      number('length', 'Range Length', 0.4, 5, 0.01, 2.4, { section: '형태' }),
      number('sharpness', 'Ridge Sharpness', 0.5, 4, 0.01, 1.8, { section: '표면' }),
      number('roughness', 'Breakup', 0, 1.5, 0.01, 0.65, { section: '표면' }),
      number('octaves', 'Detail Octaves', 1, 8, 1, 6, { structural: true, section: '표면' }),
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
      number('sharpness', 'Crest Sharpness', 0.5, 6, 0.01, 2.2, { section: '형태' }),
      number('breakup', 'Crest Breakup', 0, 4, 0.01, 1.3, { section: '표면' }),
      number('roughness', '거칠기', 0, 1, 0.01, 0.45, { section: '표면' }),
      number('octaves', 'Detail Octaves', 1, 8, 1, 5, { structural: true, section: '표면' }),
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
      number('radius', 'Island Radius', 0.2, 4, 0.01, 1.35, { section: '형태' }),
      number('coast', 'Coast Falloff', 0.02, 0.8, 0.01, 0.28, { section: '형태' }),
      number('plateau', '고원', 0, 1, 0.01, 0.32, { section: '표면' }),
      number('roughness', 'Interior Roughness', 0, 1, 0.01, 0.72, { section: '표면' }),
      number('octaves', 'Detail Octaves', 1, 8, 1, 6, { structural: true, section: '표면' }),
      number('persistence', '지속성', 0.15, 0.85, 0.01, 0.5, { section: '표면' }),
      number('lacunarity', '틈새도', 1.5, 3.5, 0.01, 2, { section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 4401, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'singleCrater', label: '분화구', color: 'amber',
    description: 'Cuts one impact bowl with a raised rim and seeded surface damage for combining into a base terrain.',
    inspector: [
      number('depth', '깊이', 0, 2, 0.01, 0.75, { section: 'Impact' }),
      number('scale', '스케일', 0.1, 4, 0.01, 0.85, { section: 'Impact' }),
      number('radius', '반지름', 0.2, 2, 0.01, 0.9, { section: 'Impact' }),
      number('rimHeight', 'Rim Height', 0, 1, 0.01, 0.42, { section: 'Rim' }),
      number('rimWidth', 'Rim Width', 0.03, 0.6, 0.01, 0.18, { section: 'Rim' }),
      number('roughness', '데미지', 0, 1, 0.01, 0.2, { section: '표면' }),
      number('octaves', 'Detail Octaves', 1, 8, 1, 4, { structural: true, section: '표면' }),
      number('seed', '시드', 0, 999999, 1, 5501, { section: '변형' }),
    ],
  }),
  terrainNode({
    id: 'canyon', label: '협곡', color: 'amber',
    description: 'Builds a drainage-led canyon with a meandering slot, broad valley shoulders, branching gullies, eroded walls, and optional strata.',
    inspector: [
      select('style', '스타일', CANYON_STYLE_OPTIONS, 'both', { section: 'Structure', tier: 'essential', control: 'segmented', help: 'Selects clean, eroded, stratified, or combined wall character.' }),
      number('scale', '스케일', 0.15, 4, 0.01, 0.72, { section: 'Structure', tier: 'essential' }),
      number('slot', 'Slot', 0.05, 1.5, 0.01, 0.34, { section: 'Carving', tier: 'essential', help: 'Controls the tight deepest cut at the canyon floor.' }),
      number('valley', '계곡', 0.2, 4, 0.01, 1.65, { section: 'Carving', tier: 'essential', help: 'Controls the width of the broader canyon shoulders.' }),
      number('surrounding', 'Surrounding', 0, 1, 0.01, 0.72, { section: 'Carving', help: 'Blends the carved channel into the surrounding plateau.' }),
      number('depth', '깊이', 0, 2.5, 0.01, 1.12, { section: 'Carving', tier: 'essential' }),
      number('structuralWarp', 'Structural Warp', 0, 2, 0.01, 0.68, { section: 'Formation', help: '배수 경로를 깨지 않고 큰 굴곡 추가.' }),
      number('formation', 'Formation', 0, 1, 0.01, 0.62, { section: 'Formation', help: 'Controls wall breakup and tributary gullies.' }),
      number('detailWarp', 'Detail Warp', 0, 1, 0.01, 0.34, { section: 'Formation' }),
      number('alternateStyle', 'Alternate Style', 0, 1, 0.01, 0.28, { section: 'Formation' }),
      number('seed', '시드', 0, 999999, 1, 6101, { section: '변형', control: 'seed' }),
    ],
  }),
  terrainNode({
    id: 'duneSea', label: 'Dune Sea', color: 'amber',
    description: 'Creates broad wind-shaped dune fields with asymmetric slip faces, macro undulation, controlled chaos, and fine sand ripples.',
    inspector: [
      select('duneType', 'Dune Type', DUNE_TYPE_OPTIONS, 'barchan', { section: 'Dune Sea', tier: 'essential', control: 'segmented' }),
      select('chaos', 'Chaos', AMOUNT_OPTIONS, 'medium', { section: 'Dune Sea', tier: 'essential', control: 'segmented' }),
      select('undulation', 'Undulation', AMOUNT_OPTIONS, 'medium', { section: 'Dune Sea', tier: 'essential', control: 'segmented' }),
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
  { value: 'mix', label: 'Mix' },
];

const MATH_OPTIONS = [
  ['add', '추가'], ['subtract', '빼기'], ['multiply', '곱하기'], ['divide', '나누기'],
  ['power', '세기'], ['absolute', '절대'], ['negate', 'Negate'], ['invert', '반전'], ['clamp', 'Clamp'],
].map(([value, label]) => ({ value, label }));

const definitions = [
  {
    id: 'currentTerrain', label: 'Current Terrain', category: '소스', color: 'green',
    description: 'A frozen compatibility snapshot of the Noise Stack that was active when Nodes was opened.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector: [], defaults: {},
    structuralParams: ['stack'], uniformSlots: (node) => activeLayers(node?.params?.stack || { layers: [] }).length,
    glslCompiler: execute('currentTerrain'), cpuEvaluator: execute('currentTerrain'),
    hiddenFromPalette: true, singleton: true,
  },
  {
    id: 'classicTerrain', label: 'Classic Terrain', category: '소스', color: 'green',
    description: 'The original biome-aware terrain generator, driven by the global Terrain controls.',
    executionKind: 'analytical', inputs: [], outputs: [output()], inspector: [], defaults: {},
    structuralParams: [], uniformSlots: () => 0,
    glslCompiler: execute('classicTerrain'), cpuEvaluator: execute('classicTerrain'), hiddenFromPalette: true,
  },
  deterministicNoiseDefinition(),
  ...SOURCE_TYPES.map(sourceDefinition),
  ...LANDFORM_DEFINITIONS,
  {
    id: 'domainWarp', label: 'Organic Warp', category: '변환', color: 'cyan',
    description: 'Uses a seeded vector field to bend terrain into broad organic forms without directional tearing.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('scale', '크기', 0.1, 8, 0.05, 1, { section: 'Vector Field', tier: 'essential', help: 'Sets the size of the broad bends.' }),
      number('strength', '세기', 0, 4, 0.01, 0.7, { section: 'Vector Field', tier: 'essential', help: 'Controls displacement without changing elevation directly.' }),
      number('perturbation', 'Perturbation', 0, 1, 0.01, 0.28, { section: 'Vector Field', tier: 'essential', help: 'Breaks symmetry in the vector field.' }),
      number('octaves', 'Complexity', 1, 6, 1, 4, { structural: true, section: '디테일' }),
      number('roughness', '거칠기', 0.2, 0.8, 0.01, 0.5, { section: '디테일' }),
      number('seedOffset', '시드', -999, 999, 1, 0, { section: '변형' }),
    ],
    defaults: { strength: 0.7, scale: 1, perturbation: 0.28, octaves: 4, roughness: 0.5, seedOffset: 0 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('domainWarp'), cpuEvaluator: execute('domainWarp'),
  },
  {
    id: 'shaper', label: 'Shaper', category: '조정', color: 'violet',
    description: 'Adds or removes large-scale body before erosion while retaining the source terrain\'s fine structure.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('shape', '형태', -1, 1, 0.01, 0.38, { section: '매스', tier: 'essential', help: 'Positive values bulk up peaks; negative values carve mass away.' }),
      number('strength', '세기', 0, 1, 0.01, 0.8, { section: '매스', tier: 'essential' }),
      number('featureScale', 'Body Scale', 5, 150, 1, 42, { section: '스케일', tier: 'essential', digits: 0, help: 'Sets the neighborhood used to build the large-scale body.' }),
      number('detailPreservation', 'Preserve Fine Details', 0, 1, 0.01, 0.82, { section: '디테일', help: 'Restores the source microstructure after mass shaping.' }),
    ],
    defaults: { shape: 0.38, strength: 0.8, featureScale: 42, detailPreservation: 0.82 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('shaper'), cpuEvaluator: execute('shaper'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'riverCarve', label: 'River Carve', category: 'Simulate', color: 'cyan',
    description: 'Cuts a continuous meandering river, converging tributaries, and a softly graded floodplain into an existing terrain.',
    executionKind: 'analytical', inputs: [input('source', '지형')], outputs: [output()],
    inspector: [
      number('water', 'Headwater Flow', 0, 2, 0.01, 0.88, { section: '강', tier: 'essential', help: 'Controls how strongly tributaries feed the main channel.' }),
      number('width', 'River Width', 0.02, 1.2, 0.01, 0.16, { section: '강', tier: 'essential' }),
      number('depth', 'River Depth', 0, 1.5, 0.01, 0.34, { section: '강', tier: 'essential' }),
      number('downcutting', 'Downcutting', 0, 2, 0.01, 0.72, { section: 'Carving', tier: 'essential', help: 'Controls how deeply water cuts through rock and soil.' }),
      number('valleyWidth', 'River Valley Width', 0.5, 5, 0.05, 2.4, { section: 'Carving', tier: 'essential', help: 'Widens the surrounding valley without widening the water channel.' }),
      number('headwaters', 'Headwaters', 1, 8, 1, 5, { section: '네트워크', digits: 0 }),
      number('direction', 'Flow Direction', 0, 6.283, 0.01, 1.05, { section: '네트워크' }),
      number('meander', 'Meander', 0, 3, 0.01, 0.92, { section: '네트워크' }),
      number('seed', '시드', 0, 999999, 1, 8101, { section: '변형', control: 'seed' }),
    ],
    defaults: { water: 0.88, width: 0.16, depth: 0.34, downcutting: 0.72, valleyWidth: 2.4, headwaters: 5, direction: 1.05, meander: 0.92, seed: 8101 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('riverCarve'), cpuEvaluator: execute('riverCarve'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'combine', label: 'Combine', category: 'Combine', color: 'blue',
    description: 'Combines two terrain signals using the Noise Stack blend operations or Mix.',
    executionKind: 'analytical', inputs: [input('a', 'A'), input('b', 'B')], outputs: [output()],
    inspector: [select('operation', 'Operation', BLEND_OPTIONS, 'add'), number('mix', 'Mix', 0, 1, 0.01, 0.5)],
    defaults: { operation: 'add', mix: 0.5 }, structuralParams: ['operation'], uniformSlots: () => 1,
    glslCompiler: execute('combine'), cpuEvaluator: execute('combine'),
  },
  {
    id: 'math', label: 'Math', category: '조정', color: 'violet',
    description: 'Applies a scalar math operation to a terrain signal.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      select('operation', 'Operation', MATH_OPTIONS, 'multiply'),
      number('value', '값', -8, 8, 0.01, 1),
      number('min', '최소', -4, 4, 0.01, 0),
      number('max', '최대', -4, 4, 0.01, 1),
    ],
    defaults: { operation: 'multiply', value: 1, min: 0, max: 1 }, structuralParams: ['operation'], uniformSlots: () => 1,
    glslCompiler: execute('math'), cpuEvaluator: execute('math'),
  },
  {
    id: 'remap', label: 'Remap', category: '조정', color: 'violet',
    description: 'Maps an input range to a new output range.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('inMin', 'Input Min', -4, 4, 0.01, 0), number('inMax', 'Input Max', -4, 4, 0.01, 1),
      number('outMin', 'Output Min', -4, 4, 0.01, 0), number('outMax', 'Output Max', -4, 4, 0.01, 1),
      { key: 'clamp', label: 'Clamp', type: 'boolean', default: true, structural: true },
    ],
    defaults: { inMin: 0, inMax: 1, outMin: 0, outMax: 1, clamp: true }, structuralParams: ['clamp'], uniformSlots: () => 1,
    glslCompiler: execute('remap'), cpuEvaluator: execute('remap'),
  },
  {
    id: 'terrace', label: 'Terrace', category: '조정', color: 'amber',
    description: 'Quantizes terrain into controllable stepped plateaus.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('count', 'Terrace Count', 2, 40, 1, 12),
      number('smoothness', '매끄러움', 0.02, 1, 0.01, 0.5),
      number('strength', '세기', 0, 1, 0.01, 1),
    ],
    defaults: { count: 12, smoothness: 0.5, strength: 1 }, structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('terrace'), cpuEvaluator: execute('terrace'),
  },
  {
    id: 'stratify', label: 'Stratify', category: '표면', color: 'amber',
    description: 'Cuts localized, broken, non-linear rock layers into the source instead of quantizing the whole terrain into terraces.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('spacing', 'Spacing', 0.02, 0.4, 0.005, 0.11, { section: '레이어', tier: 'essential', digits: 3, help: 'Distance between geological bands.' }),
      number('intensity', '강도', 0, 1, 0.01, 0.42, { section: '레이어', tier: 'essential', help: 'How strongly layers affect exposed rock.' }),
      number('shape', 'Layer Shape', 0, 1, 0.01, 0.62, { section: '레이어', tier: 'essential', help: 'Moves from soft beds to sharper broken strata.' }),
      number('tilt', '기울기', -1, 1, 0.01, 0.16, { section: 'Orientation' }),
      number('direction', '방향', 0, 6.283, 0.01, 0.7, { section: 'Orientation' }),
      number('octaves', 'Breakup Octaves', 1, 6, 1, 4, { structural: true, section: 'Breakup' }),
      number('seed', '시드', 0, 999999, 1, 7603, { section: '변형', control: 'seed' }),
    ],
    defaults: { spacing: 0.11, intensity: 0.42, shape: 0.62, tilt: 0.16, direction: 0.7, octaves: 4, seed: 7603 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('stratify'), cpuEvaluator: execute('stratify'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'geologyDetail', label: 'Geology Detail', category: '표면', color: 'amber',
    description: 'Adds multi-scale rock structure, broken strata, and restrained ridge detail without flattening the base landform.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('strength', 'Detail Strength', 0, 0.45, 0.005, 0.1, { section: 'Rock Structure' }),
      number('scale', 'Detail Scale', 0.25, 12, 0.05, 3.2, { section: 'Rock Structure' }),
      number('roughness', 'Ridge Breakup', 0, 1, 0.01, 0.58, { section: 'Rock Structure' }),
      number('strata', '지층', 0, 1, 0.01, 0.24, { section: 'Stratification' }),
      number('strataScale', 'Layer Frequency', 1, 32, 0.25, 11, { section: 'Stratification' }),
      number('octaves', 'Detail Octaves', 2, 7, 1, 5, { structural: true, section: 'Fractal' }),
      number('persistence', '지속성', 0.2, 0.8, 0.01, 0.48, { section: 'Fractal' }),
      number('lacunarity', '틈새도', 1.5, 3.2, 0.01, 2.15, { section: 'Fractal' }),
      number('seed', '시드', 0, 999999, 1, 7103, { section: '변형' }),
    ],
    defaults: { strength: 0.1, scale: 3.2, roughness: 0.58, strata: 0.24, strataScale: 11, octaves: 5, persistence: 0.48, lacunarity: 2.15, seed: 7103 },
    structuralParams: ['octaves'], uniformSlots: () => 1,
    glslCompiler: execute('geologyDetail'), cpuEvaluator: execute('geologyDetail'),
  },
  {
    id: 'thermalErosion', label: 'Thermal Erosion', category: 'Simulate', color: 'amber',
    description: 'Relaxes slopes above a talus angle, moves loose material downslope, and balances settling against sediment removal.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('duration', '지속 시간', 1, 40, 1, 12, { section: '일반', tier: 'essential', digits: 0, help: 'Increases the amount of slope relaxation.' }),
      number('strength', '세기', 0, 1, 0.01, 0.58, { section: '일반', tier: 'essential' }),
      number('featureScale', 'Feature Scale', 2, 160, 1, 30, { section: '일반', tier: 'essential', digits: 0, help: 'Controls the size of talus and scree features.' }),
      number('talusAngle', 'Talus Angle', 15, 60, 0.5, 35, { section: '재질', digits: 1, unit: '°', help: 'Material moves when the local slope exceeds this angle.' }),
      number('anisotropy', '이방성', 0, 1, 0.01, 0.16, { section: '재질', help: '재료 흐름에 방향 편향 추가.' }),
      number('settling', 'Settling', 0, 1, 0.01, 0.72, { section: 'Sediment' }),
      number('sedimentRemoval', 'Sediment Removal', 0, 1, 0.01, 0.18, { section: 'Sediment' }),
      number('seed', '시드', 0, 999999, 1, 9103, { section: '변형', control: 'seed' }),
    ],
    defaults: { duration: 12, strength: 0.58, featureScale: 30, talusAngle: 35, anisotropy: 0.16, settling: 0.72, sedimentRemoval: 0.18, seed: 9103 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('thermalErosion'), cpuEvaluator: execute('thermalErosion'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'naturalErosion', label: 'Natural Erosion', category: 'Simulate', color: 'cyan',
    description: 'Softens unstable crests, deposits material in shallow basins, and carves fine drainage channels using an analytical neighborhood pass.',
    executionKind: 'analytical', inputs: [input('source', '소스')], outputs: [output()],
    inspector: [
      number('strength', '풍화', 0, 1, 0.01, 0.38, { section: '침식' }),
      number('radius', 'Talus Radius', 2, 180, 1, 34, { section: '침식', digits: 0 }),
      number('talus', 'Talus Preservation', 0, 1, 0.01, 0.62, { section: '침식' }),
      number('channels', 'Channel Carving', 0, 1, 0.01, 0.28, { section: 'Drainage' }),
      number('channelScale', 'Channel Scale', 0.25, 8, 0.05, 1.4, { section: 'Drainage' }),
      number('deposition', 'Deposition', 0, 1, 0.01, 0.22, { section: 'Drainage' }),
      number('seed', '시드', 0, 999999, 1, 8209, { section: '변형' }),
    ],
    defaults: { strength: 0.38, radius: 34, talus: 0.62, channels: 0.28, channelScale: 1.4, deposition: 0.22, seed: 8209 },
    structuralParams: [], uniformSlots: () => 1,
    glslCompiler: execute('naturalErosion'), cpuEvaluator: execute('naturalErosion'),
  },
  {
    id: 'terrainGradient', label: 'Terrain Gradient', category: 'Colorize', color: 'rose',
    description: 'Maps rendered elevation through a curated satellite-style gradient with large-scale mineral and vegetation variation.',
    executionKind: 'analytical', inputs: [], outputs: [colorOutput()], preview: 'gradient',
    inspector: [
      select('preset', 'Terrain Family', TERRAIN_GRADIENT_OPTIONS, 'alpine', { section: '그라데이션' }),
      number('lowPoint', 'Lowland End', 0.05, 0.5, 0.01, 0.28, { section: 'Elevation Bands' }),
      number('highPoint', 'Highland Start', 0.3, 0.82, 0.01, 0.62, { section: 'Elevation Bands' }),
      number('summitPoint', 'Summit / Snow', 0.58, 1, 0.01, 0.86, { section: 'Elevation Bands' }),
      number('variation', 'Natural Variation', 0, 0.5, 0.01, 0.16, { section: '표면 디테일' }),
      number('macroScale', 'Patch Scale', 0.05, 2, 0.01, 0.42, { section: '표면 디테일' }),
    ],
    defaults: { preset: 'alpine', lowPoint: 0.28, highPoint: 0.62, summitPoint: 0.86, variation: 0.16, macroScale: 0.42 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('terrainGradient'), cpuEvaluator: execute('terrainGradient'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'slopeTint', label: 'Slope Rock', category: 'Colorize', color: 'rose',
    description: 'Exposes believable rock on steep faces while keeping flatter ledges and valleys tied to the incoming terrain color.',
    executionKind: 'analytical', inputs: [colorInput('base', 'Base Color')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      color('rockColor', 'Rock Color', '#6f6b63', { section: '바위' }),
      number('slopeStart', 'Exposure Start', 0.04, 0.8, 0.01, 0.2, { section: '바위' }),
      number('slopeEnd', 'Full Exposure', 0.08, 1, 0.01, 0.56, { section: '바위' }),
      number('strength', 'Rock Amount', 0, 1, 0.01, 0.72, { section: '바위' }),
      number('variation', 'Mineral Variation', 0, 0.5, 0.01, 0.12, { section: '표면 디테일' }),
      number('scale', 'Mineral Scale', 0.05, 4, 0.01, 0.78, { section: '표면 디테일' }),
    ],
    defaults: { rockColor: '#6f6b63', slopeStart: 0.2, slopeEnd: 0.56, strength: 0.72, variation: 0.12, scale: 0.78 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('slopeTint'), cpuEvaluator: execute('slopeTint'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'moistureTint', label: '수분 색조', category: 'Colorize', color: 'rose',
    description: 'Uses the terrain climate field to introduce dry soil and damp vegetation variation at geographic scale.',
    executionKind: 'analytical', inputs: [colorInput('base', 'Base Color')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      color('dryColor', 'Dry Tint', '#8c7458', { section: '기후' }),
      color('wetColor', 'Wet Tint', '#314a39', { section: '기후' }),
      number('amount', 'Climate Amount', 0, 1, 0.01, 0.3, { section: '기후' }),
      number('balance', 'Wet / Dry Balance', 0.1, 0.9, 0.01, 0.5, { section: '기후' }),
      number('softness', 'Transition', 0.02, 0.5, 0.01, 0.18, { section: '기후' }),
    ],
    defaults: { dryColor: '#8c7458', wetColor: '#314a39', amount: 0.3, balance: 0.5, softness: 0.18 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('moistureTint'), cpuEvaluator: execute('moistureTint'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'colorGrade', label: 'Color Grade', category: 'Colorize', color: 'rose',
    description: 'Finishes the terrain albedo with restrained saturation, contrast, exposure, and warm/cool balance.',
    executionKind: 'analytical', inputs: [colorInput('base', 'Base Color')], outputs: [colorOutput()], preview: 'color',
    inspector: [
      number('saturation', '채도', 0, 2, 0.01, 0.92, { section: 'Grade' }),
      number('contrast', '대비', 0.5, 1.8, 0.01, 1.04, { section: 'Grade' }),
      number('exposure', '노출', 0.5, 1.5, 0.01, 0.96, { section: 'Grade' }),
      number('warmth', 'Warmth', -1, 1, 0.01, 0.02, { section: 'Grade' }),
    ],
    defaults: { saturation: 0.92, contrast: 1.04, exposure: 0.96, warmth: 0.02 },
    structuralParams: [], uniformSlots: () => 0, colorUniformSlots: () => 1,
    glslCompiler: execute('colorGrade'), cpuEvaluator: execute('colorGrade'),
    terrainOnly: true, workspaceModes: ['terrain'],
  },
  {
    id: 'terrainOutput', label: 'Terrain Output', category: '출력', color: 'output',
    description: 'Connect height and optional surface color here. Unconnected height stays flat; unconnected color uses the project palette.',
    executionKind: 'analytical', inputs: [input('height', '높이', false), colorInput('color', '색상', false)], outputs: [],
    inspector: [
      { key: 'normalize', label: 'Normalize Output', type: 'boolean', default: false },
      number('outMin', 'Output Min', -4, 4, 0.01, 0),
      number('outMax', 'Output Max', -4, 4, 0.01, 1.35),
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
