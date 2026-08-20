export const PROJECT_TEMPLATES = [
  { id: 'blank', name: '빈 지형', description: '깔끔한 지형 캔버스.', preset: 'highlands' },
  { id: 'island', name: '섬', description: '바다, 해변, 드라마틱한 중심부가 있는 섬.', preset: 'archipelago' },
  { id: 'mountain', name: '산맥', description: '날카로운 봉우리, 눈, 계곡.', preset: 'alpine' },
  {
    id: 'geological-hybrid',
    name: '지질 하이브리드',
    description: '풍화된 단구, 뒤틀린 산괴, 바위 능선, 편집 가능한 세밀한 지질학적 디테일.',
    preset: 'alpine',
    noiseStackPreset: 'geologicalHybrid',
    icon: 'layers',
  },
  { id: 'desert', name: '사막', description: '사구, 마른 분지, 따뜻한 빛.', preset: 'dunes' },
];

export function getProjectTemplate(id) {
  return PROJECT_TEMPLATES.find((template) => template.id === id) ?? PROJECT_TEMPLATES[0];
}

// Preview images are render artifacts rather than project data. Version their
// cache independently so a shader/transition fix cannot keep serving an older
// flat render for a procedural template.
export function projectTemplatePreviewCacheKey(id) {
  return `terrain-template-preview:procedural-v4:${id}`;
}
