// Performance settings content (search + sub-tabs + body), shared by the
// Performance drawer panel. Extracted from the old SettingsModal so the same
// controls live in one place.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ControlSection from '../ui/ControlSection.jsx';
import { SliderCtl, ToggleRow, SelectRow } from '../controls.jsx';
import {
  PERF_PRESETS, PERF_LIMITS, getPerfPresetKeys,
  resolveLodSegments, resolveLodDistances, estimateTriangles,
} from '../../engine/render/PerformanceSettings.js';
import {
  detectRendererCapabilities,
  labelGpuPreference,
} from '../../engine/render/RendererCapabilities.js';

const lim = (key, label, step, opts = {}) => ({
  key, label, step, min: PERF_LIMITS[key].min, max: PERF_LIMITS[key].max, ...opts,
});

const PERF_SLIDERS = {
  renderScale: lim('renderScale', '렌더 스케일', 0.05, { digits: 2, unit: '×' }),
  resolutionScale: lim('resolutionScale', '지형 해상도', 0.05, { digits: 2, unit: '×' }),
  lodDistanceScale: lim('lodDistanceScale', 'LOD 거리 스케일', 0.05, { digits: 2, unit: '×' }),
  viewRadius: lim('viewRadius', '청크 로드 반경', 1, { unit: 'chunks' }),
  maxCreatesPerFrame: lim('maxCreatesPerFrame', '청크 빌드 / 프레임', 1, {
    unit: 'chunks',
    info: 'Caps how many chunks are created per frame for Infinite World streaming and new Tile cells. Set to 0 to build all pending chunks instantly.',
  }),
  cullingAggressiveness: lim('cullingAggressiveness', '컬링 공격성', 0.1, { digits: 1 }),
  waterReflection: lim('waterReflection', '물 반사', 0.05, { digits: 2, unit: '×' }),
  waterDetail: lim('waterDetail', '물 디테일', 0.05, { digits: 2, unit: '×' }),
  waterWaves: lim('waterWaves', '파도 복잡도', 0.05, { digits: 2, unit: '×' }),
  waterDistance: lim('waterDistance', '물 거리', 0.05, { digits: 2, unit: '×' }),
  fogDistance: lim('fogDistance', '안개 거리', 0.05, { digits: 2, unit: '×' }),
  terrainDetailOpacity: lim('terrainDetailOpacity', '디테일 불투명도', 0.05, { digits: 2, unit: 'x' }),
  terrainDetailScale: lim('terrainDetailScale', '디테일 텍스처 스케일', 0.01, { digits: 2, unit: 'x' }),
  terrainDetailStrength: lim('terrainDetailStrength', '디테일 세기', 0.05, { digits: 2, unit: 'x' }),
  terrainDetailNormal: lim('terrainDetailNormal', '디테일 노멀 강도', 0.05, { digits: 2, unit: 'x' }),
  terrainMicroDetail: lim('terrainMicroDetail', '미세 디테일', 0.05, { digits: 2, unit: 'x' }),
  terrainMacroVariation: lim('terrainMacroVariation', '매크로 변화', 0.05, { digits: 2, unit: 'x' }),
  terrainDetailNear: lim('terrainDetailNear', '전체 디테일 거리', 5, { unit: 'm' }),
  terrainDetailFar: lim('terrainDetailFar', '디테일 페이드 거리', 5, { unit: 'm' }),
  terrainRockSlope: lim('terrainRockSlope', '바위 경사 혼합', 0.01, { digits: 2 }),
  terrainRockSharpness: lim('terrainRockSharpness', '바위 혼합 너비', 0.01, { digits: 2 }),
  terrainShoreRange: lim('terrainShoreRange', '해안선 범위', 1, { unit: 'm' }),
  terrainShoreWetness: lim('terrainShoreWetness', '해안선 습윤도', 0.05, { digits: 2, unit: 'x' }),
  cloudSteps: lim('cloudSteps', '레이마칭 단계', 4),
  cloudLightSteps: lim('cloudLightSteps', '그림자 단계', 1),
  cloudOctaves: lim('cloudOctaves', '기본 노이즈 옥타브', 1),
  cloudDetailOctaves: lim('cloudDetailOctaves', '디테일 노이즈 옥타브', 1),
  cloudMaxDistance: lim('cloudMaxDistance', '최대 거리', 0.5, { digits: 1, unit: '×' }),
};

const WATER_QUALITY_OPTIONS = [
  { value: 0, label: '낮음' },
  { value: 1, label: '중간' },
  { value: 2, label: '높음' },
];

const TERRAIN_DETAIL_OPTIONS = [
  { value: 0, label: '꺼짐' },
  { value: 1, label: '낮음' },
  { value: 2, label: '중간' },
  { value: 3, label: '높음' },
];

const GPU_PREFERENCE_OPTIONS = [
  { value: 'default', label: '기본' },
  { value: 'high-performance', label: '고성능' },
  { value: 'low-power', label: '저전력' },
];

const RESOLUTION_DENOISE_OPTIONS = [
  { value: 'clean', label: '깨끗한 디노이즈' },
  { value: 'pixelated', label: '픽셀화 디노이즈' },
];

const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'lod', label: 'LOD' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'water', label: '물' },
  { id: 'fog', label: '안개' },
  { id: 'clouds', label: '구름' },
];

function LodMultiSlider({ segments, onChange }) {
  const trackRef = useRef(null);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const { min, max } = PERF_LIMITS.lodSegment;
  const lmin = Math.log2(min);
  const lmax = Math.log2(max);
  const toPos = (v) => ((Math.log2(v) - lmin) / (lmax - lmin)) * 100;

  const startDrag = (e, i) => {
    e.preventDefault();
    const rect = trackRef.current.getBoundingClientRect();
    const move = (ev) => {
      const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const target = Math.pow(2, lmin + x * (lmax - lmin));
      const cur = segmentsRef.current;
      const factor = target / cur[i];
      onChange(cur.map((s) => Math.round(Math.min(max, Math.max(min, s * factor)))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="ctl">
      <div className="ctl-top">
        <label>LOD 해상도</label>
        <span className="ctl-val lod-multi-val">{segments.join(' / ')}</span>
      </div>
      <div className="lod-multi-track" ref={trackRef}>
        {segments.map((seg, i) => (
          <div
            key={i}
            className="lod-multi-thumb"
            style={{ left: `${toPos(seg)}%` }}
            onPointerDown={(e) => startDrag(e, i)}
            title={`LOD${i}: ${seg} segments`}
          >
            <span className="lod-multi-tag">L{i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerfSlider({ perf, id, onPerfSetting, settingId }) {
  const def = PERF_SLIDERS[id];
  return <SliderCtl def={def} value={perf[def.key]} onChange={(v) => onPerfSetting(def.key, v)} settingId={settingId} />;
}

function SettingGroup({ tab, label, keywords, search, activeTab, settingId, children }) {
  const haystack = `${label} ${keywords} ${tab}`.toLowerCase();
  const q = search.trim().toLowerCase();
  const visible = q ? haystack.includes(q) : tab === activeTab;
  if (!visible) return null;
  return (
    <div className="settings-field" data-setting-tab={tab} data-setting-label={label} data-setting-id={settingId}>
      {q && <span className="settings-field-tab">{TABS.find((t) => t.id === tab)?.label}</span>}
      {children}
    </div>
  );
}

function SettingNote({ tab, text, search, activeTab }) {
  const q = search.trim().toLowerCase();
  if (q || tab !== activeTab) return null;
  return <p className="settings-note">{text}</p>;
}

function CapabilityRow({ label, value, title }) {
  return (
    <div className="gpu-cap-row">
      <span>{label}</span>
      <strong title={title || String(value)}>{value}</strong>
    </div>
  );
}

function GpuRendererSection({ perf, rendererInfo, onPerfSetting }) {
  const fallbackCaps = useMemo(() => detectRendererCapabilities(), []);
  const caps = rendererInfo?.capabilities || fallbackCaps;
  const webgpuSupported = !!caps.webgpu?.supported;
  const backendOptions = [
    { value: 'auto', label: '자동' },
    { value: 'webgl', label: 'WebGL' },
    {
      value: 'webgpu',
      label: webgpuSupported ? 'WebGPU' : 'WebGPU 사용 불가',
      disabled: !webgpuSupported,
    },
  ];
  const activeGpuPreference = rendererInfo?.activeGpuPreference || 'default';
  const reloadRequired = !!rendererInfo?.reloadRequired;
  const gpuInfo = caps.gpuInfoAvailable
    ? caps.detectedGpu
    : (caps.gpuInfoReason || 'GPU 정보가 브라우저에 의해 숨겨짐');

  return (
    <ControlSection
      id="perf-gpu-renderer"
      title="GPU / 렌더러"
      defaultOpen
      settingId="performance.section.gpu"
    >
      <div className="gpu-renderer-section">
        <SelectRow
          label="렌더러 백엔드"
          value={perf.rendererBackend}
          options={backendOptions}
          onChange={(v) => onPerfSetting('rendererBackend', v)}
          info="Auto uses the safest available renderer. WebGPU requires browser support and may fall back in this build."
          settingId="performance.rendererBackend"
        />
        <SelectRow
          label="GPU 선호"
          value={perf.gpuPreference}
          options={GPU_PREFERENCE_OPTIONS}
          onChange={(v) => onPerfSetting('gpuPreference', v)}
          info="브라우저 힌트일 뿐입니다. 브라우저나 OS가 이 설정을 무시할 수 있습니다."
          settingId="performance.gpuPreference"
        />
        <ToggleRow
          label="워커 렌더러"
          value={!!perf.useWorker}
          onChange={(v) => onPerfSetting('useWorker', v)}
          info="Experimental seam for moving rendering to OffscreenCanvas later. This build keeps the in-thread renderer active."
          settingId="performance.useWorker"
        />
        <div className="gpu-cap-list">
          <CapabilityRow label="감지된 렌더러" value={rendererInfo?.activeBackendLabel || caps.detectedRenderer} />
          <CapabilityRow label="감지된 GPU" value={gpuInfo} title={caps.detectedGpu} />
          <CapabilityRow label="GPU Timing" value={caps.gpuTiming?.supported ? '사용 가능' : '사용 불가'} />
          <CapabilityRow label="전력 환경설정" value={labelGpuPreference(activeGpuPreference)} />
          <CapabilityRow label="워커 렌더러" value={rendererInfo?.workerActive ? '활성' : '비활성'} />
          {perf.rendererBackend === 'webgpu' && !webgpuSupported && (
            <CapabilityRow label="WebGPU" value={caps.webgpu?.reason || '사용 불가'} />
          )}
        </div>
        {reloadRequired ? (
          <div className="gpu-apply-row">
            <span>GPU 변경 사항을 적용하려면 새로고침 필요</span>
            <button type="button" className="action-btn gpu-apply-btn" onClick={() => window.location.reload()}>
              Reload &amp; Apply
            </button>
          </div>
        ) : (
          <p className="gpu-footnote">브라우저가 GPU 기본 설정 힌트를 무시할 수 있습니다.</p>
        )}
      </div>
    </ControlSection>
  );
}

// Terrain texture / close-range material sliders — surfaced in the Terrain
// panel's Surface > Properties tab (extracted from the old Performance
// panel's "지형" tab, since these describe material look, not budget).
export function SurfacePropertiesSettings({ perf, onPerfSetting }) {
  if (!perf) return <p className="settings-empty">Performance settings are loading…</p>;
  const groupProps = { search: '', activeTab: 'terrain' };

  return (
    <div className="perf-settings">
      <div className="perf-settings-body">
        <SettingGroup tab="terrain" label="Terrain Detail Quality" keywords="terrain material detail close walk first person texture quality" {...groupProps}>
          <SelectRow label="Terrain Detail Quality" value={perf.terrainDetailQuality} options={TERRAIN_DETAIL_OPTIONS} onChange={(v) => onPerfSetting('terrainDetailQuality', parseInt(v, 10))} settingId="performance.terrainDetailQuality" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="디테일 불투명도" keywords="terrain detail opacity master mix amount overall fade blend close" {...groupProps}>
          <PerfSlider perf={perf} id="terrainDetailOpacity" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailOpacity" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="디테일 텍스처 스케일" keywords="terrain close texture scale grain noise world space" {...groupProps}>
          <PerfSlider perf={perf} id="terrainDetailScale" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailScale" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="디테일 세기" keywords="terrain albedo biome detail close strength" {...groupProps}>
          <PerfSlider perf={perf} id="terrainDetailStrength" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailStrength" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="디테일 노멀 강도" keywords="terrain normal material lighting bump close" {...groupProps}>
          <PerfSlider perf={perf} id="terrainDetailNormal" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailNormal" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="Micro & Macro Detail" keywords="terrain micro grain macro variation weathering patches biome speckle close up" {...groupProps}>
          <PerfSlider perf={perf} id="terrainMicroDetail" onPerfSetting={onPerfSetting} settingId="performance.terrainMicroDetail" />
          <PerfSlider perf={perf} id="terrainMacroVariation" onPerfSetting={onPerfSetting} settingId="performance.terrainMacroVariation" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="거리 디테일 페이드" keywords="terrain detail fade near far walk distance shimmer" {...groupProps}>
          <PerfSlider perf={perf} id="terrainDetailNear" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailNear" />
          <PerfSlider perf={perf} id="terrainDetailFar" onPerfSetting={onPerfSetting} settingId="performance.terrainDetailFar" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="Slope Rock Blending" keywords="terrain slope rock cliff material blend" {...groupProps}>
          <PerfSlider perf={perf} id="terrainRockSlope" onPerfSetting={onPerfSetting} settingId="performance.terrainRockSlope" />
          <PerfSlider perf={perf} id="terrainRockSharpness" onPerfSetting={onPerfSetting} settingId="performance.terrainRockSharpness" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="Triplanar Detail" keywords="terrain triplanar cliff steep stretch projection" {...groupProps}>
          <ToggleRow label="Triplanar Detail" value={perf.terrainTriplanar !== false} onChange={(v) => onPerfSetting('terrainTriplanar', v)} settingId="performance.terrainTriplanar" />
        </SettingGroup>

        <SettingGroup tab="terrain" label="해안선 디테일" keywords="terrain shoreline shore wet sand mud coast water edge" {...groupProps}>
          <PerfSlider perf={perf} id="terrainShoreRange" onPerfSetting={onPerfSetting} settingId="performance.terrainShoreRange" />
          <PerfSlider perf={perf} id="terrainShoreWetness" onPerfSetting={onPerfSetting} settingId="performance.terrainShoreWetness" />
        </SettingGroup>
      </div>
    </div>
  );
}

export default function PerfSettings({ perf, rendererInfo, onPerfPreset, onPerfSetting, onPerfReset, settingsTarget, onSettingsTargetHandled }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const presetOptions = useMemo(() => [
    ...getPerfPresetKeys().map((k) => ({ value: k, label: PERF_PRESETS[k].label })),
    { value: 'custom', label: '사용자 지정' },
  ], []);

  if (!perf) return <p className="settings-empty">Performance settings are loading…</p>;

  const segments = resolveLodSegments(perf);
  const distances = resolveLodDistances(perf);
  const estTris = estimateTriangles(perf);
  const isSearching = search.trim().length > 0;

  useEffect(() => {
    if (settingsTarget?.tabId && settingsTarget.tabId !== activeTab) {
      setActiveTab(settingsTarget.tabId);
    }
  }, [settingsTarget?.tabId, activeTab]);

  useEffect(() => {
    if (!settingsTarget?.settingId) return;
    if (settingsTarget.tabId && settingsTarget.tabId !== activeTab) return;
    const target = document.querySelector(`[data-setting-id="${settingsTarget.settingId}"]`);
    if (!target) return;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.classList.add('setting-target-flash');
    const timer = window.setTimeout(() => target.classList.remove('setting-target-flash'), 1200);
    onSettingsTargetHandled?.();
    return () => window.clearTimeout(timer);
  }, [settingsTarget, activeTab, onSettingsTargetHandled]);

  const setLodDistance = (i, v) => {
    const next = [...perf.lodDistances];
    next[i] = v;
    onPerfSetting('lodDistances', next);
  };

  const groupProps = { search, activeTab };
  const body = renderSettings({ perf, rendererInfo, presetOptions, segments, distances, estTris, setLodDistance, onPerfPreset, onPerfSetting, onPerfReset, groupProps });

  return (
    <div className="perf-settings">
      <div className="settings-search-wrap">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="settings-search-input"
          placeholder="Search settings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="settings-search-clear" onClick={() => setSearch('')} aria-label="검색 지우기">✕</button>
        )}
      </div>

      {!isSearching && (
        <div className="panel-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`panel-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="perf-settings-body">
        {isSearching && <p className="settings-search-hint">검색 결과</p>}
        {body}
      </div>
    </div>
  );
}

function renderSettings({
  perf, rendererInfo, presetOptions, segments, distances, estTris,
  setLodDistance, onPerfPreset, onPerfSetting, onPerfReset, groupProps,
}) {
  return (
    <>
      <SettingGroup tab="overview" label="성능 프리셋" keywords="프리셋 품질 프로필" {...groupProps}>
        <SelectRow label="프리셋" value={perf.preset} options={presetOptions} onChange={onPerfPreset} settingId="performance.preset" />
      </SettingGroup>

      <SettingGroup tab="overview" label="GPU 렌더러" keywords="gpu 렌더러 백엔드 webgl webgpu 전력 환경 전용 저전력 타이밍" {...groupProps}>
        <GpuRendererSection perf={perf} rendererInfo={rendererInfo} onPerfSetting={onPerfSetting} />
      </SettingGroup>

      <SettingGroup tab="overview" label="자동 성능 모드" keywords="자동 동적 fps" {...groupProps}>
        <ToggleRow label="자동 성능 모드" value={perf.autoPerf} onChange={(v) => onPerfSetting('autoPerf', v)} settingId="performance.autoPerf" />
      </SettingGroup>

      <SettingGroup tab="overview" label="유휴 시 일시 정지" keywords="온디맨드 정적 스튜디오 다시 그리기 유휴 배터리 열 전력" {...groupProps}>
        <ToggleRow label="유휴 시 일시 정지" value={perf.onDemandStudio} onChange={(v) => onPerfSetting('onDemandStudio', v)} settingId="performance.onDemandStudio" />
      </SettingGroup>

      <SettingNote tab="overview" text="Pause When Idle stops redrawing the studio board when nothing moves — big GPU/battery/heat saving on weak machines." {...groupProps} />


      <SettingGroup tab="overview" label="렌더 스케일" keywords="resolution pixel dpr scale" {...groupProps}>
        <PerfSlider perf={perf} id="renderScale" onPerfSetting={onPerfSetting} settingId="performance.renderScale" />
      </SettingGroup>

      <SettingGroup tab="overview" label="해상도 재구성" keywords="해상도 업스케일 디노이즈 클린 픽셀화 최근접 ps1" {...groupProps}>
        <SelectRow
          label="해상도 재구성"
          value={perf.resolutionDenoiseMode || 'clean'}
          options={RESOLUTION_DENOISE_OPTIONS}
          onChange={(v) => onPerfSetting('resolutionDenoiseMode', v)}
          settingId="performance.resolutionDenoiseMode"
        />
      </SettingGroup>

      <SettingNote tab="overview" text="Clean Denoise reconstructs reduced resolution while preserving edges. Pixelated Denoise keeps hard source pixels for a retro look." {...groupProps} />

      <SettingNote tab="overview" text={`Worst-case visible triangles: ~${(estTris / 1e6).toFixed(2)}M`} {...groupProps} />

      <SettingGroup tab="lod" label="지형 해상도" keywords="메시 디테일 세그먼트" {...groupProps}>
        <PerfSlider perf={perf} id="resolutionScale" onPerfSetting={onPerfSetting} settingId="performance.resolutionScale" />
      </SettingGroup>

      <SettingGroup tab="lod" label="LOD 거리 스케일" keywords="레벨 디테일 거리" {...groupProps}>
        <PerfSlider perf={perf} id="lodDistanceScale" onPerfSetting={onPerfSetting} settingId="performance.lodDistanceScale" />
      </SettingGroup>

      <SettingGroup tab="lod" label="LOD 해상도" keywords="세그먼트 메시 lod0 lod1 lod2 lod3" {...groupProps}>
        <div data-setting-id="performance.lodSegments">
          <LodMultiSlider segments={perf.lodSegments} onChange={(next) => onPerfSetting('lodSegments', next)} />
        </div>
      </SettingGroup>

      <SettingNote tab="lod" text={`Effective segments: ${segments.join(' / ')}`} {...groupProps} />

      {perf.lodDistances.map((d, i) => (
        <SettingGroup key={`lod-dist-${i}`} tab="lod" label={`LOD ${i} → ${i + 1} Distance`} keywords={`lod distance threshold chunk level ${i}`} {...groupProps}>
          <SliderCtl
            def={{ label: `LOD${i}→${i + 1} Distance`, min: PERF_LIMITS.lodDistance.min, max: PERF_LIMITS.lodDistance.max, step: 0.5, digits: 1, unit: '× 청크' }}
            value={d}
            onChange={(v) => setLodDistance(i, v)}
            settingId={`performance.lodDistance.${i}`}
          />
        </SettingGroup>
      ))}

      <SettingNote tab="lod" text={`Effective distances: ${distances.map((d) => d.toFixed(1)).join(' / ')} × chunk size`} {...groupProps} />

      <SettingGroup tab="lod" label="청크 병합" keywords="merge chunk group draw call batch far distant tile macro proxy combine" {...groupProps}>
        <ToggleRow
          label="청크 병합"
          value={perf.terrainMerge !== false}
          onChange={(v) => onPerfSetting('terrainMerge', v)}
          info="Collapses far Tile-mode chunks into fewer larger meshes once they pass the lowest LOD band. Cuts draw calls / CPU with no change to the silhouette."
          settingId="performance.terrainMerge"
        />
      </SettingGroup>

      <SettingGroup tab="lod" label="병합 거리" keywords="merge fold distance quadtree aggressiveness near far block size threshold" {...groupProps}>
        <SliderCtl
          def={{ label: '병합 거리', min: PERF_LIMITS.terrainMergeDistance.min, max: PERF_LIMITS.terrainMergeDistance.max, step: 0.5, digits: 1, unit: '× 차단' }}
          value={perf.terrainMergeDistance ?? 4}
          onChange={(v) => onPerfSetting('terrainMergeDistance', v)}
          settingId="performance.terrainMergeDistance"
        />
      </SettingGroup>

      <SettingNote tab="lod" text="A quadtree block folds into one mesh once the camera is farther than its width × this. Higher = keep detail (split) longer; lower = fold sooner for more savings." {...groupProps} />

      <SettingGroup tab="lod" label="병합 밀도" keywords="merge density resolution quads detail far mesh quality" {...groupProps}>
        <SliderCtl
          def={{ label: '병합 밀도', min: PERF_LIMITS.terrainMergeQuads.min, max: PERF_LIMITS.terrainMergeQuads.max, step: 1, unit: 'quads/chunk' }}
          value={perf.terrainMergeQuads ?? 8}
          onChange={(v) => onPerfSetting('terrainMergeQuads', Math.round(v))}
          settingId="performance.terrainMergeQuads"
        />
      </SettingGroup>

      <SettingNote tab="lod" text="Merge Density 8 matches the lowest chunk LOD. Lower it for extra savings at the cost of a slightly coarser folded silhouette." {...groupProps} />

      <SettingGroup tab="lod" label="Full Board Merge" keywords="macro proxy single mesh whole tile board zoom out far extreme distance root fold" {...groupProps}>
        <ToggleRow
          label="Full Board Merge"
          value={perf.terrainMacroProxy !== false}
          onChange={(v) => onPerfSetting('terrainMacroProxy', v)}
          info="Allow the whole board to fold into a single mesh at extreme distance (the top of the quadtree). Off keeps it split one level below."
          settingId="performance.terrainMacroProxy"
        />
      </SettingGroup>

      <SettingGroup tab="streaming" label="청크 로드 반경" keywords="view radius streaming load" {...groupProps}>
        <PerfSlider perf={perf} id="viewRadius" onPerfSetting={onPerfSetting} settingId="performance.viewRadius" />
      </SettingGroup>

      <SettingGroup tab="streaming" label="Chunk Builds Per Frame" keywords="create spawn streaming budget tile new cells add chunks" {...groupProps}>
        <PerfSlider perf={perf} id="maxCreatesPerFrame" onPerfSetting={onPerfSetting} settingId="performance.maxCreatesPerFrame" />
      </SettingGroup>

      <SettingGroup tab="streaming" label="삼각형 예산" keywords="triangles limit budget mesh" {...groupProps}>
        <SliderCtl
          def={{ label: '삼각형 예산', min: 0.1, max: 3, step: 0.1, digits: 1, unit: 'M' }}
          value={perf.triangleBudget / 1e6}
          onChange={(v) => onPerfSetting('triangleBudget', Math.round(v * 1e6))}
          settingId="performance.triangleBudget"
        />
      </SettingGroup>

      <SettingGroup tab="streaming" label="컬링 공격성" keywords="frustum behind camera cull" {...groupProps}>
        <PerfSlider perf={perf} id="cullingAggressiveness" onPerfSetting={onPerfSetting} settingId="performance.cullingAggressiveness" />
      </SettingGroup>

      <SettingGroup tab="water" label="물 품질" keywords="shader reflection detail waves" {...groupProps}>
        <SelectRow label="물 품질" value={perf.waterQuality} options={WATER_QUALITY_OPTIONS} onChange={(v) => onPerfSetting('waterQuality', parseInt(v, 10))} settingId="performance.waterQuality" />
      </SettingGroup>

      <SettingGroup tab="water" label="물 반사" keywords="specular glint sun" {...groupProps}>
        <PerfSlider perf={perf} id="waterReflection" onPerfSetting={onPerfSetting} settingId="performance.waterReflection" />
      </SettingGroup>

      <SettingGroup tab="water" label="물 디테일" keywords="ripple octave shader" {...groupProps}>
        <PerfSlider perf={perf} id="waterDetail" onPerfSetting={onPerfSetting} settingId="performance.waterDetail" />
      </SettingGroup>

      <SettingGroup tab="water" label="파도 복잡도" keywords="waves animation ocean" {...groupProps}>
        <PerfSlider perf={perf} id="waterWaves" onPerfSetting={onPerfSetting} settingId="performance.waterWaves" />
      </SettingGroup>

      <SettingGroup tab="water" label="수중 효과" keywords="underwater submerged camera dive fog tint" {...groupProps}>
        <ToggleRow label="수중 효과" value={perf.underwaterEffect !== false} onChange={(v) => onPerfSetting('underwaterEffect', v)} settingId="performance.underwaterEffect" />
      </SettingGroup>

      <SettingGroup tab="water" label="물 거리" keywords="extent range fade" {...groupProps}>
        <PerfSlider perf={perf} id="waterDistance" onPerfSetting={onPerfSetting} settingId="performance.waterDistance" />
      </SettingGroup>

      <SettingGroup tab="fog" label="안개 거리" keywords="horizon haze atmosphere visibility" {...groupProps}>
        <PerfSlider perf={perf} id="fogDistance" onPerfSetting={onPerfSetting} settingId="performance.fogDistance" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="Fallback Mode" keywords="clouds performance quality fallback mode" {...groupProps}>
        <SelectRow label="Fallback Mode" value={perf.cloudFallback} options={[{ value: 'none', label: '전체' }, { value: 'lite', label: 'Lite (weak GPU)' }, { value: 'off', label: '꺼짐' }]} onChange={(v) => onPerfSetting('cloudFallback', v)} settingId="performance.cloudFallback" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="레이마칭 단계" keywords="clouds step raymarch resolution quality steps" {...groupProps}>
        <PerfSlider perf={perf} id="cloudSteps" onPerfSetting={onPerfSetting} settingId="performance.cloudSteps" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="Self-Shadowing" keywords="clouds shadow self lighting" {...groupProps}>
        <ToggleRow label="Self-Shadowing" value={perf.cloudSelfShadow !== false} onChange={(v) => onPerfSetting('cloudSelfShadow', v)} settingId="performance.cloudSelfShadow" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="Fast Shadows" keywords="clouds shadow analytic cheap performance fast self lighting" {...groupProps}>
        <ToggleRow label="Fast Shadows (analytic)" value={!!perf.cloudLightMode} onChange={(v) => onPerfSetting('cloudLightMode', v)} settingId="performance.cloudLightMode" />
      </SettingGroup>

      <SettingNote tab="clouds" text="Fast Shadows replaces the secondary shadow march with a cheap 2-tap approximation — big win when Self-Shadowing is on, near-identical look." {...groupProps} />

      <SettingGroup tab="clouds" label="그림자 단계" keywords="clouds shadow lighting steps" {...groupProps}>
        <PerfSlider perf={perf} id="cloudLightSteps" onPerfSetting={onPerfSetting} settingId="performance.cloudLightSteps" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="거리 단계 LOD" keywords="clouds distance lod steps raymarch performance far" {...groupProps}>
        <ToggleRow label="거리 단계 LOD" value={!!perf.cloudStepLOD} onChange={(v) => onPerfSetting('cloudStepLOD', v)} settingId="performance.cloudStepLOD" />
      </SettingGroup>

      <SettingNote tab="clouds" text="Distance Step LOD marches fewer samples as the camera pulls away from the surface." {...groupProps} />


      <SettingGroup tab="clouds" label="기본 노이즈 옥타브" keywords="clouds octaves noise fbm base" {...groupProps}>
        <PerfSlider perf={perf} id="cloudOctaves" onPerfSetting={onPerfSetting} settingId="performance.cloudOctaves" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="디테일 노이즈 옥타브" keywords="clouds octaves detail noise fbm" {...groupProps}>
        <PerfSlider perf={perf} id="cloudDetailOctaves" onPerfSetting={onPerfSetting} settingId="performance.cloudDetailOctaves" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="Erosion (Worley Noise)" keywords="clouds erosion cellular worley detail" {...groupProps}>
        <ToggleRow label="Erosion (Worley Noise)" value={perf.cloudUseErosion !== false} onChange={(v) => onPerfSetting('cloudUseErosion', v)} settingId="performance.cloudUseErosion" />
      </SettingGroup>

      <SettingGroup tab="clouds" label="최대 거리" keywords="clouds max distance visibility culling" {...groupProps}>
        <PerfSlider perf={perf} id="cloudMaxDistance" onPerfSetting={onPerfSetting} settingId="performance.cloudMaxDistance" />
      </SettingGroup>
    </>
  );
}
