// ============================================================================
// PerformanceOverlay — expanded engine diagnostics panel.
// Reads a merged snapshot from usePerfOverlay; purely presentational.
// ============================================================================

import React, { useState } from 'react';
import { computeWarnings } from './warnings.js';
import { buildDiagnosticsText, buildDiagnosticsObject } from './diagnostics.js';
import PerfSparkline from './PerfSparkline.jsx';

function fmtNum(n) {
  if (n == null) return '–';
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
const fmtMs = (v) => (v == null ? '–' : `${v.toFixed(1)} ms`);
const mb = (b) => (b == null ? '–' : `${(b / 1048576).toFixed(0)} MB`);

function fpsTone(fps) {
  if (fps > 0 && fps < 30) return 'crit';
  if (fps > 0 && fps < 45) return 'warn';
  return 'good';
}

function Row({ label, value, warn }) {
  return (
    <div className="perf-row">
      <span className="perf-row-label">{label}</span>
      <span className={`perf-row-value${warn ? ' warn' : ''}`}>{value}</span>
    </div>
  );
}

function Section({ id, title, collapsed, onToggle, children }) {
  return (
    <div className="perf-section">
      <button type="button" className="perf-section-head" onClick={() => onToggle(id)}>
        <span className={`perf-caret${collapsed ? ' closed' : ''}`}>
          <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden><path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </span>
        {title}
      </button>
      {!collapsed && <div className="perf-section-body">{children}</div>}
    </div>
  );
}

function GraphCard({ label, hint, children }) {
  return (
    <div className="perf-graph-card">
      <div className="perf-graph-card-head">
        <span className="perf-graph-card-label">{label}</span>
        {hint && <span className="perf-graph-card-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function PerformanceOverlay({
  snapshot, history, settings, onClose, onToggleSection, onSetShowWarnings,
}) {
  const [copied, setCopied] = useState('');
  if (!snapshot) {
    return (
      <div className="perf-overlay perf-overlay-loading" role="dialog" aria-label="성능 오버레이">
        <div className="perf-overlay-head">
          <span className="perf-title">성능 우선</span>
          <button type="button" className="perf-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="perf-loading-body">
          <span className="perf-loading-dot" />
          Collecting metrics…
        </div>
      </div>
    );
  }

  const { fps, frame, render, gpu, memory, sections, tasks, diag } = snapshot;
  const collapsed = settings.collapsed || {};
  const warnings = computeWarnings(snapshot);
  const tone = fpsTone(fps);

  const copy = async (kind) => {
    const text = kind === 'json'
      ? JSON.stringify(buildDiagnosticsObject(snapshot), null, 2)
      : buildDiagnosticsText(snapshot);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(''), 1500);
    } catch { setCopied('err'); setTimeout(() => setCopied(''), 1500); }
  };

  const cam = diag?.camera;
  const cull = diag?.culling || {};
  const lod = diag?.lod?.counts || [];

  return (
    <div className="perf-overlay" role="dialog" aria-label="성능 오버레이">
      <div className="perf-overlay-head">
        <span className="perf-title">성능 우선</span>
        <div className="perf-head-actions">
          <button type="button" className={`perf-chip${copied === 'text' ? ' ok' : ''}`} onClick={() => copy('text')}>
            {copied === 'text' ? '복사됨' : '복사'}
          </button>
          <button type="button" className={`perf-chip${copied === 'json' ? ' ok' : ''}`} onClick={() => copy('json')}>
            {copied === 'json' ? '복사됨' : 'JSON'}
          </button>
          <button type="button" className="perf-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
      </div>

      <div className="perf-overlay-body">
        {/* Hero + live graphs */}
        <div className="perf-hero">
          <div className="perf-hero-metrics">
            <div className={`perf-hero-fps perf-hero-${tone}`}>
              <span className="perf-hero-value">{fps}</span>
              <span className="perf-hero-unit">fps</span>
            </div>
            <div className="perf-hero-secondary">
              <div className="perf-hero-stat">
                <span className="perf-hero-stat-label">프레임</span>
                <span className={`perf-hero-stat-value${frame?.avg > 22 ? ' warn' : ''}`}>{fmtMs(frame?.avg)}</span>
              </div>
              <div className="perf-hero-stat">
                <span className="perf-hero-stat-label">드로우</span>
                <span className="perf-hero-stat-value">{render?.calls ?? '–'}</span>
              </div>
              <div className="perf-hero-stat">
                <span className="perf-hero-stat-label">Tris</span>
                <span className="perf-hero-stat-value">{fmtNum(render?.triangles)}</span>
              </div>
            </div>
          </div>

          <GraphCard label="Frame rate" hint="~24 s">
            <PerfSparkline
              data={history?.fps}
              color="var(--success)"
              fill="rgba(34, 197, 94, 0.12)"
              minY={0}
              maxY={Math.max(60, ...(history?.fps || []))}
              reference={60}
              referenceLabel="60 fps"
              unit=" fps"
            />
          </GraphCard>

          <GraphCard label="프레임 시간" hint="CPU ms">
            <PerfSparkline
              data={history?.frameMs}
              color="var(--accent)"
              fill="var(--accent-bg)"
              minY={0}
              maxY={Math.max(33, ...(history?.frameMs || []))}
              reference={16.67}
              referenceLabel="16.7 ms"
              unit=" 밀리초"
            />
          </GraphCard>

          <div className="perf-graph-duo">
            <GraphCard label="드로우 콜">
              <PerfSparkline
                data={history?.drawCalls}
                color="var(--accent)"
                fill="var(--accent-bg)"
                minY={0}
              />
            </GraphCard>
            <GraphCard label="삼각형" hint="×1000">
              <PerfSparkline
                data={history?.triangles}
                color="var(--text-muted)"
                fill="rgba(163, 163, 163, 0.1)"
                minY={0}
                unit="K"
              />
            </GraphCard>
          </div>
        </div>

        <Section id="summary" title="Summary" collapsed={collapsed.summary} onToggle={onToggleSection}>
          <Row label="FPS" value={fps} warn={fps > 0 && fps < 45} />
          <Row label="Avg FPS" value={snapshot.fpsAvg} />
          <Row label="프레임" value={fmtMs(frame?.avg)} warn={frame?.avg > 22} />
          <Row label="Frame min/max" value={`${fmtMs(frame?.min)} / ${fmtMs(frame?.max)}`} />
          <Row label="최빈값" value={diag?.mode || '–'} />
          <Row label="상태" value={diag?.state || '–'} />
          <Row label="품질 우선" value={diag?.qualityPreset || '–'} />
          <Row label="Pixel ratio" value={diag?.pixelRatio?.toFixed(2) ?? '–'} warn={diag?.pixelRatio > 2.5} />
          <Row label="Render size" value={diag?.drawingBuffer ? `${diag.drawingBuffer.w}×${diag.drawingBuffer.h}` : '–'} />
          <Row label="카메라" value={cam ? `${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}, ${cam.z.toFixed(0)}` : '–'} />
        </Section>

        <Section id="rendering" title="렌더링 중" collapsed={collapsed.rendering} onToggle={onToggleSection}>
          {render ? (
            <>
              <Row label="드로우 콜" value={render.calls} warn={render.calls > 1500} />
              <Row label="삼각형" value={fmtNum(render.triangles)} warn={render.triangles > 3e6} />
              <Row label="점들" value={render.points} />
              <Row label="Lines" value={render.lines} />
              <Row label="지오메트리" value={render.geometries} />
              <Row label="텍스처" value={render.textures} warn={render.textures > 120} />
              <Row label="Programs" value={render.programs} />
              <Row label="그림자" value={diag?.shadowsEnabled ? 'on' : 'off'} />
              <Row label="수중 패스" value={diag?.postProcessing?.underwater ? 'active' : 'inactive'} />
            </>
          ) : <Row label="렌더러" value="collecting…" />}
        </Section>

        <Section id="timing" title="프레임 타이밍 (CPU)" collapsed={collapsed.timing} onToggle={onToggleSection}>
          {sections && sections.length ? sections.map((s) => (
            <Row key={s.name} label={s.name} value={`${s.avg.toFixed(2)} ms (max ${s.max.toFixed(1)})`} warn={s.avg > 8} />
          )) : <Row label="섹션 데이터 없음" value="…" />}
        </Section>

        <Section id="gpu" title="GPU / 렌더러" collapsed={collapsed.gpu} onToggle={onToggleSection}>
          <Row label="Renderer backend" value={diag?.renderer?.requestedBackendLabel || 'â€“'} />
          <Row label="활성 렌더러" value={diag?.renderer?.activeBackendLabel || 'â€“'} warn={diag?.renderer?.reloadRequired} />
          <Row label="GPU preference" value={diag?.renderer?.requestedGpuPreferenceLabel || 'â€“'} />
          <Row label="Applied preference" value={diag?.renderer?.activeGpuPreferenceLabel || 'â€“'} warn={diag?.renderer?.reloadRequired} />
          <Row label="감지된 GPU" value={diag?.renderer?.capabilities?.detectedGpu || diag?.gpuName || 'â€“'} warn={diag?.renderer?.capabilities?.gpuInfoAvailable === false} />
          <Row label="WebGPU support" value={diag?.renderer?.capabilities?.webgpu?.supported ? 'available' : 'unavailable'} />
          {gpu && gpu.supported ? (
            <>
              <Row label="프레임 GPU" value={fmtMs(gpu.frameMs)} />
              <Row label="Per-pass" value="whole-frame only" />
              {gpu.disjoint && <Row label="메모" value="분리됨 — 결과 신뢰할 수 없음" warn />}
            </>
          ) : <Row label="GPU 타이밍" value="이 브라우저/디바이스에서 사용할 수 없음" />}
          {diag?.renderer?.reloadRequired && <Row label="필수 적용" value="렌더러 새로 고침" warn />}
        </Section>

        <Section id="memory" title="메모리" collapsed={collapsed.memory} onToggle={onToggleSection}>
          {memory && memory.supported ? (
            <>
              <Row label="JS 힙 사용량" value={mb(memory.usedJSHeap)} warn={memory.usedJSHeap / memory.jsHeapLimit > 0.85} />
              <Row label="JS heap total" value={mb(memory.totalJSHeap)} />
              <Row label="JS 힙 한도" value={mb(memory.jsHeapLimit)} />
            </>
          ) : <Row label="메모리 API" value="unavailable" />}
          <Row label="텍스처" value={render?.textures ?? '–'} />
          <Row label="지오메트리" value={render?.geometries ?? '–'} />
        </Section>

        <Section id="loading" title="불러오는 중" collapsed={collapsed.loading} onToggle={onToggleSection}>
          {tasks && tasks.length ? tasks.map((t) => (
            <Row
              key={t.id}
              label={t.name}
              value={`${t.status}${t.progress != null ? ` ${Math.round(t.progress * 100)}%` : ''}${t.elapsed ? ` · ${(t.elapsed / 1000).toFixed(1)}s` : ''}`}
              warn={t.status === 'failed'}
            />
          )) : <Row label="활성 작업 없음" value="idle" />}
        </Section>

        <Section id="terrain" title="지형" collapsed={collapsed.terrain} onToggle={onToggleSection}>
          {diag && renderTerrain(diag)}
        </Section>

        <Section id="culling" title="컬링 & LOD" collapsed={collapsed.culling} onToggle={onToggleSection}>
          <Row label="전체 청크" value={cull.total ?? '–'} />
          <Row label="표시됨" value={cull.visible ?? '–'} />
          <Row label="Culled" value={cull.culled ?? '–'} />
          {lod.map((c, i) => <Row key={i} label={`LOD${i}`} value={c} />)}
        </Section>

        <Section id="props" title="Terrain Props" collapsed={collapsed.props} onToggle={onToggleSection}>
          {diag?.props ? (
            <>
              <Row label="Quality tier" value={diag.props.quality ?? '–'} />
              <Row label="Grass / flowers" value={`${fmtNum(diag.props.instances?.grass || 0)} / ${fmtNum(diag.props.instances?.flowers || 0)}`} />
              <Row label="Rocks / trees" value={`${fmtNum(diag.props.instances?.rocks || 0)} / ${fmtNum(diag.props.instances?.trees || 0)}`} />
              <Row label="드로우 콜" value={diag.props.drawCalls ?? 0} warn={diag.props.drawCalls > 9} />
              <Row label="삼각형" value={fmtNum(diag.props.triangles || 0)} warn={diag.props.triangles > 65000} />
              <Row label="Sectors / queued" value={`${diag.props.sectors || 0} / ${diag.props.queuedSectors || 0}`} />
              <Row label="Last update" value={fmtMs(diag.props.buildMs)} warn={diag.props.buildMs > 8} />
              <Row label="표면 읽기" value={diag.props.surfaceReadbacks || 0} />
            </>
          ) : <Row label="소품" value="unavailable" />}
        </Section>

        <Section id="clouds" title="구름" collapsed={collapsed.clouds} onToggle={onToggleSection}>
          {diag?.clouds && (
            <>
              <Row label="활성화됨" value={diag.clouds.enabled ? 'yes' : 'no'} />
              <Row label="최빈값" value={diag.clouds.mode} />
              <Row label="레이어" value={diag.clouds.layers} />
              <Row label="레이마칭 단계" value={diag.clouds.steps} warn={diag.clouds.steps > 64} />
              <Row label="라이트 단계" value={diag.clouds.lightSteps} />
              <Row label="옥타브" value={`${diag.clouds.octaves} + ${diag.clouds.detailOctaves} detail`} />
              <Row label="범위" value={fmtMaybe(diag.clouds.coverage)} />
              <Row label="밀도" value={fmtMaybe(diag.clouds.density)} />
              <Row label="바람 / 진화" value={`${fmtMaybe(diag.clouds.windSpeed)} / ${fmtMaybe(diag.clouds.evolveSpeed)}`} />
              <Row label="컬링" value={diag.clouds.cullingMode} />
              <Row label="LOD" value={diag.clouds.lod} />
              <Row label="업데이트 시간" value={fmtMs(diag.clouds.time)} />
            </>
          )}
        </Section>

        <Section id="water" title="물" collapsed={collapsed.water} onToggle={onToggleSection}>
          {diag?.water && (
            <>
              <Row label="활성화됨" value={diag.water.enabled ? 'yes' : 'no'} />
              <Row label="최빈값" value={diag.water.mode} />
              <Row label="품질 우선" value={diag.water.quality} />
              <Row label="반사" value={fmtMaybe(diag.water.reflection)} />
              <Row label="디테일" value={fmtMaybe(diag.water.detail)} />
              <Row label="물결" value={fmtMaybe(diag.water.waves)} />
              <Row label="해수면" value={fmtMaybe(diag.water.seaLevel)} />
              <Row label="수중" value={diag.water.underwater ? 'active' : 'inactive'} />
              {diag.water.performanceCost && (() => {
                const cost = diag.water.performanceCost;
                const surface = cost.surface || {};
                const refraction = cost.refraction || {};
                const reflectionPass = cost.reflection || {};
                return (
                  <>
                    <Row
                      label="표면 지오메트리"
                      value={`${surface.mode || '–'} · ${fmtNum(surface.vertices || 0)} verts · ${fmtNum(surface.triangles || 0)} tris`}
                    />
                    <Row
                      label="표면 CPU 제출"
                      value={fmtMs(surface.surfaceSubmitAvgMs)}
                    />
                    <Row
                      label="표면 GPU"
                      value={gpu?.supported
                        ? `${fmtMs(gpu.frameMs)} whole frame`
                        : '전체 프레임 타이머 사용 불가'}
                    />
                    <Row
                      label="불투명 굴절"
                      value={`${fmtMs(refraction.captureMs)} · ${fmtPassResolution(refraction)}`}
                    />
                    <Row
                      label="평면 반사"
                      value={`${fmtMs(reflectionPass.captureMs)} · ${fmtPassResolution(reflectionPass)}`}
                    />
                    <Row
                      label="물 타겟 메모리"
                      value={mb(cost.renderTargetMemoryBytes || 0)}
                    />
                    <Row
                      label="추가 씬 렌더"
                      value={cost.additionalSceneRenders ?? 0}
                    />
                  </>
                );
              })()}
            </>
          )}
        </Section>

        <Section id="underwater" title="수중" collapsed={collapsed.underwater} onToggle={onToggleSection}>
          {diag?.underwater && (
            <>
              <Row label="활성" value={diag.underwater.active ? 'yes' : 'no'} />
              <Row label="최빈값" value={diag.underwater.mode} />
              {diag.underwater.fellBackToLite && (
                <Row label="요청됨" value={`${diag.underwater.requestedMode} → lite`} />
              )}
              <Row label="혼합" value={fmtMaybe(diag.underwater.blend, 2)} />
              <Row label="이하 깊이" value={fmtMaybe(diag.underwater.depth, 1)} />
              <Row label="반사광" value={diag.underwater.causticsEnabled ? 'on' : 'off'} />
              <Row label="광선" value={diag.underwater.lightShaftsEnabled ? 'on' : 'off'} />
              <Row label="파티클" value={diag.underwater.particlesEnabled ? 'on' : 'off'} />
              <Row label="비용 추정" value={diag.underwater.costEstimate} />
              {diag.underwater.postProcessApplies === false && (
                <Row label="Post-process" value="해당 없음 (행성)" />
              )}
              {diag.underwater.depthTextureAvailable === false && (
                <Row label="깊이 텍스처" value="unavailable" />
              )}
            </>
          )}
        </Section>

        {settings.showWarnings && (
          <Section id="warnings" title={`Warnings (${warnings.length})`} collapsed={collapsed.warnings} onToggle={onToggleSection}>
            {warnings.length ? warnings.map((w, i) => (
              <div key={i} className={`perf-warn perf-warn-${w.level}`}>
                <span className="perf-warn-level">{w.level}</span>
                <span className="perf-warn-label">{w.label}</span>
              </div>
            )) : <Row label="경고 없음" value="모두 정상" />}
          </Section>
        )}

        <div className="perf-prefs">
          <label><input type="checkbox" checked={!!settings.showWarnings} onChange={(e) => onSetShowWarnings(e.target.checked)} /> 경고</label>
        </div>
      </div>
    </div>
  );
}

function fmtMaybe(v) {
  if (v == null) return '–';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

function fmtPassResolution(pass) {
  return pass?.resolution
    ? `${pass.resolution.width}×${pass.resolution.height}`
    : 'not allocated';
}

function renderTerrain(diag) {
  const t = diag.terrain || {};
  if (diag.mode === 'infinite') {
    return (
      <>
        <Row label="Chunk size" value={fmtMaybe(t.chunkSize)} />
        <Row label="View radius" value={fmtMaybe(t.viewRadius)} />
        <Row label="Render distance" value={fmtMaybe(t.renderDistance)} />
        <Row label="LOD thresholds" value={(t.lodThresholds || []).map((x) => x.toFixed(0)).join(', ') || '–'} />
        <Row label="Last chunk gen" value={t.lastChunkGenMs != null ? `${t.lastChunkGenMs.toFixed(1)} ms` : '–'} />
      </>
    );
  }
  if (diag.mode === 'planet') {
    return (
      <>
        <Row label="Planet radius" value={fmtMaybe(t.planetRadius)} />
        <Row label="Face grid" value={fmtMaybe(t.faceGrid)} />
        <Row label="베이크된 높이 텍스처" value={t.bakedHeightTex ? 'yes' : 'no'} />
        <Row label="마지막 재구축" value={t.lastRebuildMs != null ? `${t.lastRebuildMs.toFixed(1)} ms` : '–'} />
      </>
    );
  }
  return (
    <>
      <Row label="해상도" value={fmtMaybe(t.resolution)} />
      <Row label="Board size" value={fmtMaybe(t.boardSize)} />
      <Row label="타일" value={fmtMaybe(t.tiles)} />
      <Row label="Height scale" value={fmtMaybe(t.heightScale)} />
      <Row label="옥타브" value={fmtMaybe(t.octaves)} />
      <Row label="노이즈 레이어" value={fmtMaybe(t.noiseLayers)} />
      <Row label="베이크된 높이 텍스처" value={t.bakedHeightTex ? 'yes' : 'no'} />
      <Row label="마지막 베이크" value={t.lastBakeMs != null ? `${t.lastBakeMs.toFixed(1)} ms` : '–'} />
    </>
  );
}
