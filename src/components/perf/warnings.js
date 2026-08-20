// ============================================================================
// Performance warning system. Pure function: takes a merged snapshot and
// returns a list of { level, label } where level ∈ 'info' | 'warning' |
// 'critical'. Threshold-based, no side effects, no logging. The overlay
// renders these as compact rows — never as popups/alerts.
// ============================================================================

export const WARN_THRESHOLDS = {
  fpsWarning: 45,
  fpsCritical: 30,
  frameWarning: 22,      // ms
  frameCritical: 33,     // ms
  drawCalls: 1500,
  triangles: 3_000_000,
  textures: 120,
  heapRatio: 0.85,       // used / limit
  chunks: 400,
  cloudSteps: 64,
  pixelRatio: 2.5,
  exportSeconds: 30,
};

export function computeWarnings(snap, T = WARN_THRESHOLDS) {
  const out = [];
  if (!snap) return out;
  const add = (level, label) => out.push({ level, label });

  const { fps, frame, render, gpu, memory, diag, tasks } = snap;

  // --- frame rate / time ---
  if (fps > 0 && fps < T.fpsCritical) add('critical', `FPS critical: ${fps}`);
  else if (fps > 0 && fps < T.fpsWarning) add('warning', `FPS low: ${fps}`);

  if (frame && frame.avg > T.frameCritical) add('critical', `Frame time ${frame.avg.toFixed(1)}ms (>${T.frameCritical}ms)`);
  else if (frame && frame.avg > T.frameWarning) add('warning', `Frame time ${frame.avg.toFixed(1)}ms`);

  // --- renderer load ---
  if (render) {
    if (render.calls > T.drawCalls) add('warning', `High draw calls: ${render.calls}`);
    if (render.triangles > T.triangles) add('warning', `High triangle count: ${fmtNum(render.triangles)}`);
    if (render.textures > T.textures) add('warning', `Many textures loaded: ${render.textures}`);
  }

  // --- memory ---
  if (memory && memory.supported && memory.jsHeapLimit) {
    const ratio = memory.usedJSHeap / memory.jsHeapLimit;
    if (ratio > T.heapRatio) add('critical', `JS heap usage high: ${(ratio * 100).toFixed(0)}%`);
  } else if (memory && !memory.supported) {
    add('info', '메모리 API 사용 불가');
  }

  // --- gpu timing ---
  if (gpu && !gpu.supported) add('info', '이 기기에서 GPU 타이밍을 사용할 수 없음');

  // --- scene / mode specific ---
  if (diag) {
    if (diag.pixelRatio > T.pixelRatio) add('warning', `Pixel ratio high: ${diag.pixelRatio.toFixed(2)}`);

    const renderer = diag.renderer || {};
    const caps = renderer.capabilities || {};
    if (renderer.requestedGpuPreference && renderer.requestedGpuPreference !== 'default') {
      add('info', `${renderer.requestedGpuPreferenceLabel || 'GPU'} preference requested; browser may ignore it`);
    }
    if (renderer.requestedBackend === 'webgpu' && caps.webgpu && !caps.webgpu.supported) {
      add('warning', 'WebGPU가 선택되었지만 사용 불가, WebGL로 폴백');
    } else if (renderer.requestedBackend === 'webgpu' && renderer.activeBackend !== 'webgpu') {
      add('info', 'WebGPU가 선택되었지만 이 빌드는 WebGL을 사용 중입니다');
    }
    if (caps.gpuInfoAvailable === false) {
      add('info', '브라우저가 디버그 렌더러 정보를 차단하여 GPU 이름을 사용할 수 없음');
    }
    if (renderer.reloadRequired) add('info', '렌더러 환경설정 변경은 재로드가 필요합니다');

    const total = diag.culling?.total ?? 0;
    if (total > T.chunks) add('warning', `Many chunks active: ${total}`);

    if (diag.clouds?.enabled) {
      if (diag.clouds.steps > T.cloudSteps) add('warning', `Cloud raymarch steps high: ${diag.clouds.steps}`);
      if (diag.clouds.lod === 'none') add('info', '클라우드 LOD 비활성화');
      add('info', `Cloud culling: ${diag.clouds.cullingMode}`);
    }

    if (diag.water?.enabled) {
      if (/realistic|volumetric/i.test(diag.water.mode || '')) add('info', `${diag.water.mode} water may be expensive`);
    }

    const uw = diag.underwater;
    if (uw && uw.active) {
      if (uw.mode === 'high') add('warning', '고급 수중 모드 활성');
      else add('info', '라이트 수중 모드 활성');
      if (uw.fellBackToLite) add('info', '고급 수중 효과가 요청됨 — Lite (레거시 물)로 폴백');
      if (uw.causticsEnabled) add('info', '수중 굴절광 활성화');
      if (uw.lightShaftsEnabled) add('warning', '수중 빛 기둥 활성화');
      if (uw.particlesEnabled) add('info', '수중 파티클 활성화');
      if (uw.depthTextureAvailable === false) add('warning', '깊이 텍스처 사용 불가 — 단순화된 수중 안개');
    }
  }

  // --- long-running tasks ---
  if (Array.isArray(tasks)) {
    for (const t of tasks) {
      if (t.status === 'running' && t.elapsed > T.exportSeconds * 1000) {
        add('warning', `${t.name} running ${(t.elapsed / 1000).toFixed(0)}s`);
      }
      if (t.status === 'failed') add('critical', `${t.name} failed`);
    }
  }

  return out;
}

function fmtNum(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
