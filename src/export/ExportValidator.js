const MAX_TEXTURE_RESOLUTION = 4096;
const MAX_MESH_RESOLUTION = 1024;

export function validateExport(options = {}, context = {}) {
  const checks = [];
  const add = (status, message) => checks.push({ status, message });
  const texRes = Number(options.texRes) || 0;
  const meshRes = Number(options.meshRes) || 0;

  if (context.worldMode === 'planet' && options.exportPresetId && options.exportPresetId !== 'custom') {
    add('warning', 'Engine presets currently package studio terrain exports; planet export keeps its native layout.');
  }
  if (!(Number(context.boardSize) > 0)) add('error', '지형 스케일이 잘못되었습니다.');
  else add('success', `Terrain scale valid (${Math.round(context.boardSize)} m board).`);
  if (!options.includeMesh && !options.exportHeightmap) add('error', '내보낼 지형 메시 또는 높이맵을 선택하세요.');
  if (options.exportHeightmap && ![512, 1024, 2048, 4096].includes(texRes)) add('error', '높이맵 해상도는 512, 1024, 2048 또는 4096이어야 합니다.');
  else if (options.exportHeightmap) add('success', `Heightmap ${texRes} × ${texRes}.`);
  if (texRes > MAX_TEXTURE_RESOLUTION) add('error', '텍스처 해상도가 지원되는 4096 한계를 초과합니다.');
  else if (texRes >= 4096) add('warning', '4K 맵은 상당한 GPU 메모리를 필요로 할 수 있습니다.');
  if (meshRes > MAX_MESH_RESOLUTION) add('error', '메시 밀도가 지원되는 1024 한도를 초과합니다.');
  else if (options.includeMesh) add('success', `Mesh density ${meshRes} × ${meshRes}.`);
  if (options.exportWater && !options.exportWaterMask) add('warning', 'Water is included without a water mask.');
  else if (options.exportWaterMask) add('success', '물 마스크 사용 가능.');
  if (options.exportSplat) add('success', '바이옴 스플랫 맵 사용 가능.');
  return checks;
}

export function hasExportErrors(checks) {
  return checks.some((check) => check.status === 'error');
}
