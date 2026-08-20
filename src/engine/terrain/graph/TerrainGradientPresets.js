export const TERRAIN_GRADIENT_PRESETS = Object.freeze({
  alpine: Object.freeze({
    label: '알파인 위성',
    description: '서늘한 계곡 녹음, 풍화된 돌, 옅은 화강암, 절제된 눈.',
    colors: Object.freeze(['#25362f', '#59634e', '#766f62', '#b7b0a2']),
    points: Object.freeze([0, 0.28, 0.62, 0.86]),
    variation: 0.16,
    macroScale: 0.42,
  }),
  temperate: Object.freeze({
    label: '온대 고지대',
    description: '깊은 숲, 톤 다운된 잔디, 노출된 흙, 이끼 회색 봉우리.',
    colors: Object.freeze(['#1e3128', '#40563b', '#746b52', '#aaa596']),
    points: Object.freeze([0, 0.25, 0.58, 0.88]),
    variation: 0.2,
    macroScale: 0.36,
  }),
  arid: Object.freeze({
    label: '건조 고원',
    description: '먼지가 낀 분지 퇴적물, 황토색 선반, 철분이 풍부한 암석, 햇볕에 바랜 봉우리.',
    colors: Object.freeze(['#6b5844', '#927055', '#8a5841', '#c0aa8b']),
    points: Object.freeze([0, 0.3, 0.63, 0.9]),
    variation: 0.18,
    macroScale: 0.5,
  }),
  volcanic: Object.freeze({
    label: '화산 지대',
    description: '현무암 저지대, 목탄 용암, 산화된 스코리아, 회색 재 능선.',
    colors: Object.freeze(['#171a18', '#2d302c', '#55443a', '#928b7f']),
    points: Object.freeze([0, 0.32, 0.64, 0.9]),
    variation: 0.22,
    macroScale: 0.55,
  }),
  coastal: Object.freeze({
    label: '해안 산맥',
    description: '습한 해안 관목, 밀집한 구릉, 차가운 돌, 구름에 씻긴 높은 바위.',
    colors: Object.freeze(['#34483e', '#4d6049', '#74766c', '#aaa99f']),
    points: Object.freeze([0, 0.27, 0.6, 0.87]),
    variation: 0.18,
    macroScale: 0.38,
  }),
  river: Object.freeze({
    label: '강 계곡',
    description: '어두운 습한 수로, 실트 둑, 톤 다운된 홍수터 식생, 시원한 풍화된 고지.',
    colors: Object.freeze(['#183a38', '#536448', '#81745a', '#9b9b91']),
    points: Object.freeze([0, 0.22, 0.58, 0.88]),
    variation: 0.2,
    macroScale: 0.34,
  }),
  canyon: Object.freeze({
    label: '퇴적 협곡',
    description: '그림자가 진 협곡 바닥, 산화된 사암 벽, 창백한 선반, 햇볕에 바랜 가장자리.',
    colors: Object.freeze(['#3a302b', '#76503c', '#a06d48', '#c4a57f']),
    points: Object.freeze([0, 0.24, 0.64, 0.9]),
    variation: 0.22,
    macroScale: 0.48,
  }),
  dunes: Object.freeze({
    label: '바람에 날린 사막',
    description: '차가운 골 그림자, 따뜻한 사구 본체, 회황색 슬립 면, 햇빛 받는 밝은 마루.',
    colors: Object.freeze(['#6a5541', '#a47b50', '#c79a62', '#e0c18e']),
    points: Object.freeze([0, 0.24, 0.62, 0.88]),
    variation: 0.16,
    macroScale: 0.56,
  }),
});

export const TERRAIN_GRADIENT_OPTIONS = Object.freeze(Object.entries(TERRAIN_GRADIENT_PRESETS)
  .map(([value, preset]) => Object.freeze({ value, label: preset.label })));

export function getTerrainGradientPreset(id) {
  return TERRAIN_GRADIENT_PRESETS[id] || TERRAIN_GRADIENT_PRESETS.alpine;
}

export function terrainGradientCss(id) {
  const preset = getTerrainGradientPreset(id);
  return `linear-gradient(90deg, ${preset.colors.map((color, index) => `${color} ${Math.round(preset.points[index] * 100)}%`).join(', ')})`;
}
