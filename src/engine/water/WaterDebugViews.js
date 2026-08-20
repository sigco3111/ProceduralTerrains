// ============================================================================
// WaterDebugViews — debug overlay helpers for the water pipeline.
// ============================================================================

import { setWaterDebugMode } from './RealisticWaterMaterial.js';

export const WATER_DEBUG_VIEWS = [
  { value: 'off', label: '꺼짐' },
  { value: 'depth', label: '깊이 맵' },
  { value: 'shoreline', label: '해안선 마스크' },
  { value: 'foam', label: '거품 마스크' },
  { value: 'mask', label: 'Water Mask' },
  { value: 'normal', label: '표면 법선' },
  { value: 'opticalDepth', label: '광학 깊이' },
  { value: 'transmittance', label: '투과율' },
  { value: 'fresnel', label: '프레넬' },
  { value: 'reflection', label: '하늘 반사' },
  { value: 'refraction', label: '투과 / 굴절' },
  { value: 'opacity', label: '최종 불투명도' },
];

export function applyWaterDebugToMaterials(materials, debugView) {
  for (const mat of materials) {
    if (mat?.uniforms?.uDebugMode) setWaterDebugMode(mat, debugView);
  }
}

export function waterDebugActive(debugView) {
  return debugView && debugView !== 'off';
}
