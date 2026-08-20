export const PROJECT_TEMPLATES = [
  { id: 'blank', name: '빈 지형', description: '깔끔한 지형 캔버스.', preset: 'highlands' },
  { id: 'island', name: '섬', description: 'Ocean, beaches, and a dramatic core.', preset: 'archipelago' },
  { id: 'mountain', name: 'Mountain range', description: 'Sharp peaks, snow, and valleys.', preset: 'alpine' },
  {
    id: 'geological-hybrid',
    name: '지질 하이브리드',
    description: 'Weathered terraces, warped massifs, rock ridges, and fine editable geological detail.',
    preset: 'alpine',
    noiseStackPreset: 'geologicalHybrid',
    icon: 'layers',
  },
  { id: 'desert', name: '사막', description: 'Dunes, dry basins, and warm light.', preset: 'dunes' },
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
