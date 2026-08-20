import { PANEL_ICONS } from '../icons/panelIcons.jsx';

// Lightweight panel metadata lives separately from the panel implementations so
// the startup bundle does not pull every settings panel into the landing page.
export const PANEL_META = {
  terrain: { label: '지형', title: '지형', desc: '모양과 표면 생성.', icon: PANEL_ICONS.terrain },
  noiseLayers: { label: '레이어', title: '노이즈 레이어', desc: '노이즈 레이어를 쌓아 지형 모양을 만듭니다.', icon: PANEL_ICONS.noiseLayers },
  world: { label: '세계', title: '세계', desc: '레이아웃, 타일, 청크, 그리드.', icon: PANEL_ICONS.world },
  planet: {
    label: '행성',
    title: '행성',
    desc: '구형 세계 스타일과 요약.',
    studioLabel: '색상',
    studioTitle: '색상',
    studioDesc: '바이옴 팔레트 및 지형 머티리얼 색상.',
    icon: PANEL_ICONS.planet,
    modes: ['planet', 'studio', 'infinite'],
  },
  biomes: { label: '생태계들', title: '생태계들', desc: '기후 분포 및 마스크.', icon: PANEL_ICONS.biomes },
  water: { label: '물', title: '물', desc: 'Ocean surface, quality modes and volumetric settings.', icon: PANEL_ICONS.water },
  props: { label: '소품', title: '소품', desc: 'Biome-aware grass, flowers, rocks and trees.', icon: PANEL_ICONS.props },
  clouds: { label: '구름', title: '구름', desc: '볼류메트릭 구름 레이어.', icon: PANEL_ICONS.clouds },
  visuals: { label: '비주얼', title: '비주얼', desc: '타일의 포스트 이펙트, HDR 하늘, 지형 표면 마감을 처리합니다.', icon: PANEL_ICONS.visuals, modes: ['studio'] },
  skybox: { label: '하늘', title: '하늘', desc: 'Sky environment, time of day and atmosphere.', icon: PANEL_ICONS.skybox },
  lighting: { label: '조명', title: '조명', desc: '태양, 대기 및 안개.', icon: PANEL_ICONS.lighting },
  export: { label: '내보내기', title: '내보내기', desc: '메시와 텍스처 내보내기.', icon: PANEL_ICONS.export },
  performance: { label: '성능 우선', title: '성능 우선', desc: 'GPU, 물, 안개, 구름 예산.', icon: PANEL_ICONS.performance },
  debug: { label: '디버그', title: '디버그', desc: '실시간 통계 및 진단.', icon: PANEL_ICONS.debug },
  splines: { label: '스플라인', title: '스플라인', desc: '편집 가능한 도로와 강입니다.', icon: PANEL_ICONS.splines, modes: ['studio'] },
  history: { label: '기록', title: '기록', desc: '제작자 체크포인트 및 동작.', icon: PANEL_ICONS.history },
};

// Shared left-toolbar order. Keep this list mode-agnostic: each mode filters
// its available panels from the same sequence.
export const PANEL_ORDER = ['terrain', 'noiseLayers', 'water', 'clouds', 'props', 'visuals', 'skybox', 'lighting', 'biomes', 'planet', 'world', 'performance', 'debug', 'export', 'splines'];

export function panelAvailable(id, worldMode) {
  const meta = PANEL_META[id];
  if (!meta) return false;
  return !meta.modes || meta.modes.includes(worldMode);
}

export function getPanelDisplay(id, worldMode) {
  const meta = PANEL_META[id];
  if (!meta) return { label: id, title: id, desc: '' };
  if (worldMode !== 'planet' && meta.studioLabel) {
    return {
      label: meta.studioLabel,
      title: meta.studioTitle ?? meta.studioLabel,
      desc: meta.studioDesc ?? meta.desc,
    };
  }
  return { label: meta.label, title: meta.title, desc: meta.desc };
}
