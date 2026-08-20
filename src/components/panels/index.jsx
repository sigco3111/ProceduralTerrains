import React, { useEffect, useState } from 'react';
import { Cog, Dices, Eye, RefreshCw } from 'lucide-react';
import SidePanel, { PanelTabs } from './SidePanel.jsx';
import { PANEL_ICONS } from '../icons/panelIcons.jsx';
import { SliderCtl, ToggleRow, SelectRow } from '../controls.jsx';
import { PANEL_META, PANEL_ORDER, panelAvailable, getPanelDisplay } from './panelMeta.js';
export { PANEL_META, PANEL_ORDER, panelAvailable, getPanelDisplay } from './panelMeta.js';
import ImportMapsContent from '../ui/ImportMapsContent.jsx';
import CollapsibleGroup from '../ui/CollapsibleGroup.jsx';
import ControlSection from '../ui/ControlSection.jsx';
import TileMapDebugSection from '../ui/TileMapDebugSection.jsx';
import { TERRAIN_SLIDERS, NOISE_SLIDERS, BIOME_SLIDERS, InfoDot } from './defs.jsx';
import { PRESETS } from '../../engine/presets.js';
import { NOISE_PRESETS } from '../../engine/style/NoisePresets.js';
import { EROSION_PRESETS, EROSION_QUALITY } from '../../engine/terrain/erosion/ErosionPresets.js';
import { formatTimeOfDay } from '../../engine/sky/TimeOfDay.js';
import { APP_VERSION } from '../../constants/app.js';
import { applyExportPreset, EXPORT_PRESET_OPTIONS, getExportPreset } from '../../export/ExportPresetManager.js';
import { hasExportErrors, validateExport } from '../../export/ExportValidator.js';
import PlanetStylePanel from '../PlanetStylePanel.jsx';
import WorldPanelInner from '../ui/WorldPanel.jsx';
import CloudPanelInner from '../ui/CloudPanel.jsx';
import WaterPanelInner from '../ui/WaterPanel.jsx';
import VisualsPanelInner from '../ui/VisualsPanel.jsx';
import PanelResetButton from '../ui/PanelResetButton.jsx';
import EnvironmentPanelInner from '../ui/EnvironmentPanel.jsx';
import PerformanceStats from '../ui/PerformancePanel.jsx';
import PlanetSummaryCard from '../ui/PlanetSummaryCard.jsx';
import { LodPanel, CameraPanel } from '../RightPanels.jsx';
import PerfSettings, { SurfacePropertiesSettings } from './PerfSettings.jsx';
import SurfaceLibraryPanel from '../ui/SurfaceLibraryPanel.jsx';
import PropsAssetLibrary from '../ui/PropsAssetLibrary.jsx';
import NoiseLayersPanel from '../NoiseLayersPanel.jsx';
import SplinesPanel from './SplinesPanel.jsx';
import { AnalysisContent } from './AnalysisPanel.jsx';
import HistoryPanel from './HistoryPanel.jsx';
import { useLiveMetrics } from '../../state/LiveMetricsStore.js';

// ---------------------------------------------------------------- helpers
function SeedRow({ seed, onParam, onRandomizeSeed }) {
  const [text, setText] = useState(String(seed));
  useEffect(() => { setText(String(seed)); }, [seed]);
  const commit = () => {
    const v = parseInt(text, 10);
    if (Number.isFinite(v)) onParam('seed', v >>> 0);
    else setText(String(seed));
  };
  return (
    <div className="seed-row">
      <div className="label-with-icon" data-tooltip="절차적 높이 생성기의 기본 정수" style={{ marginBottom: '5px' }}>
        <span className="setting-label">시드</span><InfoDot />
      </div>
      <div className="seed-input-wrap">
        <input type="text" spellCheck="false" value={text}
          onChange={(e) => setText(e.target.value)} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} />
        <button type="button" className="icon-btn" title="시드 무작위화" onClick={onRandomizeSeed}>
          <Dices size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}

const RandomizeTerrainButton = ({ onRandomize }) => (
  <button type="button" className="action-btn primary" onClick={onRandomize} title="새 시드를 선택하고 지형을 다시 만듭니다">
    <Dices size={14} strokeWidth={1.75} aria-hidden />지형 무작위화</button>
);

const SURFACE_TABS = [
  { id: 'general', label: '일반 설정' },
  { id: 'textures', label: '텍스처' },
];

// Terrain > Surface: procedural material-render sliders (General Settings) and
// the Surface Library (default texture packs, variants, file overrides,
// sphere preview) live in their own sub-tab (Textures).
function SurfaceTab({ ctx }) {
  const [subTab, setSubTab] = useState('general');
  useEffect(() => {
    const target = ctx.settingsTarget;
    if (target?.tabId === 'surface' && target.subTabId && target.subTabId !== subTab) {
      setSubTab(target.subTabId);
    }
  }, [ctx.settingsTarget, subTab]);

  return (
    <>
      <PanelTabs active={subTab} onChange={setSubTab} tabs={SURFACE_TABS} />
      {subTab === 'general' && (
        <SurfacePropertiesSettings perf={ctx.perf} onPerfSetting={ctx.onPerfSetting} />
      )}
      {subTab === 'textures' && <SurfaceLibraryPanel ctx={ctx} />}
    </>
  );
}

// ---------------------------------------------------------------- panels
function TerrainPanel({ ctx }) {
  const realTerrainMode = !!ctx.realTerrainMode;
  const [tab, setTab] = useState(() => realTerrainMode ? 'import' : 'shape');
  const { params, onParam, worldMode } = ctx;
  const isStudio = worldMode === 'studio';
  // Erosion lives as a tab here (Tile mode only). Its bake state is shared
  // between the tab body and the footer's Bake / Reset buttons.
  const erosion = useErosionBake(ctx);
  useEffect(() => {
    const targetTab = ctx.settingsTarget?.tabId;
    if (targetTab && targetTab !== tab) setTab(targetTab);
  }, [ctx.settingsTarget?.tabId, tab]);
  // Leaving Tile mode hides the Erosion tab — fall back to Shape so we never
  // render an unavailable tab.
  useEffect(() => {
    if (!isStudio && tab === 'erosion') setTab('shape');
  }, [isStudio, tab]);
  useEffect(() => {
    if (realTerrainMode && tab !== 'import') setTab('import');
  }, [realTerrainMode, tab]);
  const activeTab = realTerrainMode ? 'import' : tab;
  const onErosionTab = !realTerrainMode && isStudio && activeTab === 'erosion';
  const tabs = realTerrainMode ? [
    { id: 'import', label: 'Import' },
  ] : [
    { id: 'shape', label: 'Shape' },
    { id: 'noise', label: 'Noise' },
    { id: 'surface', label: 'Surface' },
    ...(isStudio ? [{ id: 'erosion', label: 'Erosion' }] : []),
    ...(isStudio ? [{ id: 'import', label: 'Import' }] : []),
  ];
  return (
    <SidePanel title={realTerrainMode ? 'Real terrain' : 'Terrain'} description={realTerrainMode ? 'Geographic elevation, imagery, and buildings.' : 'Shape and surface generation.'} onClose={ctx.onClose}
      footer={onErosionTab
        ? <ErosionTabFooter erosion={erosion} />
        : realTerrainMode ? null : <RandomizeTerrainButton onRandomize={ctx.onRandomizeTerrain} />}>
      {!realTerrainMode && <PanelTabs active={activeTab} onChange={setTab} tabs={tabs} />}
      {activeTab === 'shape' && (
        <>
          <SelectRow label="Preset" value={params.preset} settingId="terrain.preset"
            options={Object.entries(PRESETS).map(([key, p]) => ({ value: key, label: p.label }))}
            onChange={ctx.onPreset} info="Global terrain layout preset." />
          <SeedRow seed={params.seed} onParam={onParam} onRandomizeSeed={ctx.onRandomizeSeed} />
          {TERRAIN_SLIDERS.map((def) => (
            <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => onParam(def.key, v)} settingId={`terrain.${def.key}`} />
          ))}
          <SelectRow label="Edge Falloff" value={params.edgeFalloffMode ?? 'island'}
            options={[{ value: 'island', label: 'Island' }, { value: 'mountains', label: 'Mountains' }]}
            onChange={(v) => onParam('edgeFalloffMode', v)} info="Island fades terrain toward the boundary. Mountains preserves the terrain and adds ridged noise around the outer edge." />
        </>
      )}
      {activeTab === 'noise' && (
        <>
          <SelectRow label="Noise Preset" value={params.noisePreset ?? 'default'} settingId="terrain.noisePreset"
            options={Object.entries(NOISE_PRESETS).map(([key, p]) => ({ value: key, label: p.label }))}
            onChange={ctx.planetStyleProps.onNoisePreset} info="Baseline noise shape configuration." />
          {NOISE_SLIDERS.map((def) => (
            <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => onParam(def.key, v)} settingId={`terrain.${def.key}`} />
          ))}
        </>
      )}
      {activeTab === 'surface' && <SurfaceTab ctx={ctx} />}
      {onErosionTab && <ErosionTabContent ctx={ctx} erosion={erosion} />}
      {activeTab === 'import' && isStudio && <ImportMapsContent ctx={ctx} />}
      {!realTerrainMode && !onErosionTab && (
        <PanelResetButton label="Reset Terrain Settings" onClick={() => ctx.onResetPanel?.('terrain')} settingId="terrain.reset" />
      )}
    </SidePanel>
  );
}

function WorldPanel({ ctx }) {
  return (
    <SidePanel title="World" description="Layout, tiles, chunking and grid." onClose={ctx.onClose}>
      <WorldPanelInner params={ctx.params} worldMode={ctx.worldMode} onParam={ctx.onParam} />
      {ctx.worldMode === 'studio' && <TilesContent ctx={ctx} />}
      <PanelResetButton label="Reset World Settings" onClick={() => ctx.onResetPanel?.('world')} settingId="world.reset" />
    </SidePanel>
  );
}

function PlanetPanel({ ctx }) {
  const isPlanet = ctx.worldMode === 'planet';
  const { title, desc } = getPanelDisplay('planet', ctx.worldMode);
  return (
    <SidePanel title={title} description={desc} onClose={ctx.onClose}>
      {isPlanet && (
        <>
          <WorldPanelInner params={ctx.params} worldMode="planet" onParam={ctx.onParam} />
          <PlanetStylePanel {...ctx.planetStyleProps} settingsTarget={ctx.settingsTarget} embedded />
          <PlanetSummaryCard params={ctx.params} />
        </>
      )}
      {!isPlanet && (
        <PlanetStylePanel {...ctx.planetStyleProps} settingsTarget={ctx.settingsTarget} embedded paletteOnly />
      )}
      <PanelResetButton label="Reset Planet / Colors Settings" onClick={() => ctx.onResetPanel?.('planet')} settingId="planet.reset" />
    </SidePanel>
  );
}

const EROSION_MAIN = [
  { key: 'erosionStrength', label: 'Strength', min: 0, max: 1, step: 0.01, digits: 2, info: 'Master blend of the eroded result over the base terrain (0 = none).' },
  { key: 'erosionDroplets', label: 'Droplets', min: 0, max: 200000, step: 5000, digits: 0, info: 'Rain droplets in the hydraulic pass. More = deeper valleys/ravines, slower bake.' },
  { key: 'erosionLifetime', label: 'Droplet Lifetime', min: 5, max: 80, step: 1, digits: 0, info: 'Max steps each droplet travels before evaporating.' },
  { key: 'erosionSeed', label: 'Seed', min: 1, max: 999, step: 1, digits: 0, info: 'Deterministic random seed for droplet spawn positions.' },
];

const EROSION_ADVANCED = [
  { key: 'erosionRadius', label: 'Erosion Radius', min: 1, max: 6, step: 1, digits: 0, info: 'Brush radius for material removal (larger = smoother channels).' },
  { key: 'erosionErosionRate', label: 'Erosion Strength', min: 0, max: 1, step: 0.01, digits: 2, info: 'How aggressively fast-moving water carves terrain.' },
  { key: 'erosionDeposition', label: 'Deposition', min: 0, max: 1, step: 0.01, digits: 2, info: 'How readily carried sediment settles back out.' },
  { key: 'erosionSedimentCapacity', label: 'Sediment Capacity', min: 1, max: 12, step: 0.5, digits: 1, info: 'How much material a droplet can carry before depositing.' },
  { key: 'erosionEvaporation', label: 'Evaporation', min: 0, max: 0.1, step: 0.005, digits: 3, info: 'Water lost per step (higher = shorter drainage lines).' },
  { key: 'erosionGravity', label: 'Gravity', min: 1, max: 12, step: 0.5, digits: 1, info: 'Downhill acceleration of droplets.' },
  { key: 'erosionInertia', label: 'Inertia', min: 0, max: 0.95, step: 0.01, digits: 2, info: 'How much droplets keep their direction vs. follow the slope.' },
  { key: 'erosionThermalStrength', label: 'Thermal Strength', min: 0, max: 1, step: 0.01, digits: 2, info: 'Strength of loose-material sliding off steep slopes.' },
  { key: 'erosionThermalIterations', label: 'Thermal Iterations', min: 0, max: 100, step: 5, digits: 0, info: 'Relaxation passes for the thermal (talus) erosion.' },
  { key: 'erosionTalus', label: 'Talus Angle', min: 0.1, max: 2, step: 0.05, digits: 2, info: 'Slope steepness (relative to cell size) above which material slides.' },
  { key: 'erosionSmoothing', label: 'Smoothing', min: 0, max: 1, step: 0.01, digits: 2, info: 'Final low-pass blend to soften noise.' },
];

const EROSION_PHASE_LABEL = {
  sampling: 'Sampling base terrain…',
  hydraulic: 'Hydraulic pass',
  thermal: 'Thermal pass',
  done: 'Updating terrain…',
  starting: 'Starting…',
};

// Erosion bake state, shared between the Terrain panel's Erosion tab body and
// its footer (bake / reset live in the footer, the body shows the controls).
function useErosionBake(ctx) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [baked, setBaked] = useState(!!ctx.erosionHasResult);

  // Keep the "baked" flag in sync with the engine after undo / redo (which can
  // add or drop the baked result without going through bake/reset here).
  useEffect(() => { setBaked(!!ctx.erosionHasResult); }, [ctx.erosionHasResult]);

  const bake = async () => {
    setBusy(true); setProgress(0); setPhase('starting');
    try {
      const ok = await ctx.onErosionBake((p, ph) => { setProgress(p); setPhase(ph); });
      if (ok) setBaked(true);
    } finally { setBusy(false); }
  };

  const reset = () => { ctx.onErosionReset(); setBaked(false); setProgress(0); setPhase(''); };

  return { busy, progress, phase, baked, bake, reset };
}

function ErosionTabFooter({ erosion }) {
  const { busy, progress, phase, baked, bake, reset } = erosion;
  const pct = Math.round(progress * 100);
  return (
    <div className="side-panel-quick" style={{ width: '100%' }}>
      <button type="button" className="action-btn primary" onClick={bake} disabled={busy} style={{ flex: 2 }}>
        {busy ? `${EROSION_PHASE_LABEL[phase] || 'Baking…'} ${pct}%` : (baked ? '침식 재베이크' : '침식 베이크')}
      </button>
      <button type="button" className="action-btn" onClick={reset} disabled={busy || !baked} style={{ flex: 1 }}>초기화</button>
    </div>
  );
}

function ErosionTabContent({ ctx, erosion }) {
  const { params, onParam } = ctx;
  const { baked } = erosion;

  // Editing any knob detaches from the named preset (→ Custom) without clobbering.
  const setKnob = (key, v) => {
    onParam(key, v);
    if (params.erosionPreset !== 'custom') onParam('erosionPreset', 'custom');
  };

  // Open the Advanced section when search navigates to one of its knobs.
  const advTarget = EROSION_ADVANCED.some((d) => ctx.settingsTarget?.settingId === `erosion.${d.key}`);

  return (
    <>
      <ToggleRow label="침식 활성화" value={!!params.erosionEnabled} onChange={(v) => onParam('erosionEnabled', v)}
        settingId="erosion.erosionEnabled"
        info="베이크된 침식을 지형에 적용합니다. 토글하여 전/후를 비교하세요. 베이크하기 전에는 비활성화됩니다." />
      {!baked && (
        <p className="section-hint">아직 베이크된 침식이 없습니다. 프리셋을 선택한 다음 누르세요<strong>침식 베이크</strong>. The simulation runs in the background.</p>
      )}

      <SelectRow label="프리셋" value={params.erosionPreset ?? 'natural'} settingId="erosion.erosionPreset"
        options={Object.entries(EROSION_PRESETS).map(([key, p]) => ({ value: key, label: p.label }))}
        onChange={(v) => ctx.onErosionPreset(v)} info="침식 스타일입니다. 슬라이더를 편집하면 사용자 지정으로 전환됩니다." />
      <SelectRow label="품질 우선" value={params.erosionQuality ?? 'balanced'} settingId="erosion.erosionQuality"
        options={Object.entries(EROSION_QUALITY).map(([key, q]) => ({ value: key, label: `${q.label} (${q.res}²)` }))}
        onChange={(v) => onParam('erosionQuality', v)} info="베이크 그리드 해상도. 값이 높을수록 채널이 정밀해지지만 속도가 느려집니다." />

      {EROSION_MAIN.map((def) => (
        <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => setKnob(def.key, v)} settingId={`erosion.${def.key}`} />
      ))}

      <ControlSection id="erosion-advanced" title="고급" defaultOpen={false} forceOpen={advTarget} settingId="erosion.section.advanced">
        {EROSION_ADVANCED.map((def) => (
          <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => setKnob(def.key, v)} settingId={`erosion.${def.key}`} />
        ))}
      </ControlSection>

      <p className="section-hint">Erosion also produces flow / rock / sediment / slope masks used by texturing &amp; props (wiring in progress). Exports already include the eroded terrain. Bake / reset can be reverted with Ctrl+Z.</p>
    </>
  );
}

function BiomesPanel({ ctx }) {
  const { params, onParam } = ctx;
  return (
      <SidePanel title="생태계들" description="기후 분포 및 마스크." onClose={ctx.onClose}>
      {BIOME_SLIDERS.map((def) => (
        <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => onParam(def.key, v)} settingId={`biomes.${def.key}`} />
      ))}
      <ToggleRow label="생태계 디버그" value={params.biomeDebug} onChange={(v) => onParam('biomeDebug', v)}
        settingId="biomes.biomeDebug"
        info="검토를 위해 지형 표면에 생태계를 색상으로 직접 표시합니다." />
      <PanelResetButton label="바이옴 설정 초기화" onClick={() => ctx.onResetPanel?.('biomes')} settingId="biomes.reset" />
    </SidePanel>
  );
}

function WaterPanel({ ctx }) {
  const { stats } = useLiveMetrics(ctx.liveMetrics);
  return (
    <SidePanel title="물" description="Ocean surface, quality modes and volumetric settings." onClose={ctx.onClose}>
      <WaterPanelInner
        params={ctx.params}
        onParam={ctx.onParam}
        worldMode={ctx.worldMode}
        perf={ctx.perf}
        perfStats={stats}
        gpu={ctx.gpu}
        onPerfSetting={ctx.onPerfSetting}
        planetStyleProps={ctx.planetStyleProps}
        onResetWaterSettings={() => ctx.onResetPanel?.('water')}
        onExportWaterMasks={ctx.onExportWaterMasks}
        onApplyWaterBaselineScene={ctx.onApplyWaterBaselineScene}
        onCaptureWaterBaseline={ctx.onCaptureWaterBaseline}
        settingsTarget={ctx.settingsTarget}
      />
    </SidePanel>
  );
}

const PROP_SLIDERS = {
  propsDensity: { label: '마스터 밀도', min: 0, max: 2, step: 0.05, digits: 2 },
  propsGrassDensity: { label: '풀 밀도', min: 0, max: 2, step: 0.05, digits: 2 },
  propsGrass: { label: '풀 높이', min: 0.05, max: 2, step: 0.05, digits: 2 },
  propsRocks: { label: '바위 밀도', min: 0, max: 2, step: 0.05, digits: 2 },
  propsRockScale: { label: '바위 스케일', min: 0.05, max: 2.5, step: 0.05, digits: 2 },
  propsTreeDensity: { label: '나무 밀도', min: 0, max: 2, step: 0.05, digits: 2 },
  propsTreeScale: { label: '나무 스케일', min: 0.25, max: 2.5, step: 0.05, digits: 2 },
  propsWind: { label: '바람', min: 0, max: 1.5, step: 0.05, digits: 2 },
  propsWindSpeed: { label: '애니메이션 속도', min: 0, max: 4, step: 0.05, digits: 2 },
  propsGust: { label: '돌풍 모션', min: 0, max: 1.5, step: 0.05, digits: 2 },
  propsFlowers: { label: '꽃 밀도', min: 0, max: 1, step: 0.01, digits: 2 },
  propsCullDistance: { label: '컬링 거리', min: 120, max: 1800, step: 20, digits: 0, unit: ' u' },
  propsLodDistance: { label: 'LOD 거리', min: 60, max: 900, step: 10, digits: 0, unit: ' u' },
};

function PropsPanel({ ctx }) {
  const { params, onParam, worldMode, perf, onPerfSetting } = ctx;
  const enabled = !!params.propsEnabled;
  const [subTab, setSubTab] = useState('assets');
  useEffect(() => {
    const settingId = ctx.settingsTarget?.settingId;
    if (!settingId?.startsWith('props.')) return;
    setSubTab(settingId === 'props.assetLibrary' ? 'assets' : 'settings');
  }, [ctx.settingsTarget]);
  return (
    <SidePanel title="소품" description="최적화된 3D 지형 에셋을 관리하고 미리 보고 분산 배치하세요." onClose={ctx.onClose}>
      <ToggleRow label="절차적 소품" value={enabled} onChange={(v) => onParam('propsEnabled', v)}
        info="Scatter optimized grass, flowers, terrain-matched boulders, broadleaf trees and conifers in every world mode." />
      <PanelTabs active={subTab} onChange={setSubTab} tabs={[
        { id: 'assets', label: '자산 라이브러리' },
        { id: 'settings', label: '분산 설정' },
      ]} />
      {subTab === 'assets' && (
        <PropsAssetLibrary value={params.propsAssets} onChange={(assets) => onParam('propsAssets', assets)} />
      )}
      {subTab === 'settings' && enabled && (
        <>
          <ControlSection id="props-distribution" title="분포" defaultOpen settingId="props.section.distribution">
            <SliderCtl def={PROP_SLIDERS.propsDensity} value={params.propsDensity} onChange={(v) => onParam('propsDensity', v)} />
            <SliderCtl def={PROP_SLIDERS.propsGrassDensity} value={params.propsGrassDensity ?? 1} onChange={(v) => onParam('propsGrassDensity', v)} />
            <SliderCtl def={PROP_SLIDERS.propsFlowers} value={params.propsFlowers} onChange={(v) => onParam('propsFlowers', v)} />
            <SliderCtl def={PROP_SLIDERS.propsRocks} value={params.propsRocks ?? 0.8} onChange={(v) => onParam('propsRocks', v)} />
            <SliderCtl def={PROP_SLIDERS.propsTreeDensity} value={params.propsTreeDensity ?? 0.65} onChange={(v) => onParam('propsTreeDensity', v)} />
          </ControlSection>

          <ControlSection id="props-look" title="시점" defaultOpen settingId="props.section.look">
            <SliderCtl def={PROP_SLIDERS.propsGrass} value={params.propsGrass} onChange={(v) => onParam('propsGrass', v)} />
            <SliderCtl def={PROP_SLIDERS.propsRockScale} value={params.propsRockScale ?? 1} onChange={(v) => onParam('propsRockScale', v)} />
            <SliderCtl def={PROP_SLIDERS.propsTreeScale} value={params.propsTreeScale ?? 1} onChange={(v) => onParam('propsTreeScale', v)} />
            <SliderCtl def={PROP_SLIDERS.propsWind} value={params.propsWind ?? 0.6} onChange={(v) => onParam('propsWind', v)} />
            <SliderCtl def={PROP_SLIDERS.propsWindSpeed} value={params.propsWindSpeed ?? 1.6} onChange={(v) => onParam('propsWindSpeed', v)} />
            <SliderCtl def={PROP_SLIDERS.propsGust} value={params.propsGust ?? 0.45} onChange={(v) => onParam('propsGust', v)} />
          </ControlSection>

          <ControlSection id="props-performance" title="성능 우선" defaultOpen settingId="props.section.performance">
            <SelectRow label="소품 품질" value={perf?.propQuality ?? 2} options={[
              { value: 0, label: '성능 우선' },
              { value: 1, label: '균형' },
              { value: 2, label: '높음' },
              { value: 3, label: '울트라' },
            ]} onChange={(v) => onPerfSetting?.('propQuality', Number(v))} settingId="props.propQuality" />
            <SliderCtl def={PROP_SLIDERS.propsCullDistance} value={params.propsCullDistance} onChange={(v) => onParam('propsCullDistance', v)} />
            <SliderCtl def={PROP_SLIDERS.propsLodDistance} value={params.propsLodDistance} onChange={(v) => onParam('propsLodDistance', v)} />
            <p className="section-hint">
              {worldMode === 'studio'
                ? '스튜디오는 페인트 모드에서 페인트된 프롭 마스크도 읽습니다.'
                : '이 모드는 현재 시드에서 결정론적 절차적 분산을 사용합니다.'}
            </p>
          </ControlSection>
        </>
      )}
      {subTab === 'settings' && !enabled && (
        <p className="section-hint">절차적 소품을 활성화하여 분포, 모양, 성능 설정을 조정하세요.</p>
      )}
      <PanelResetButton label="소품 설정 초기화" onClick={() => ctx.onResetPanel?.('props')} settingId="props.reset" />
    </SidePanel>
  );
}

function CloudsPanel({ ctx }) {
  return (
    <SidePanel title="구름" description="볼류메트릭 구름 레이어." onClose={ctx.onClose}>
      <CloudPanelInner
        params={ctx.params}
        onParam={ctx.onParam}
        perf={ctx.perf}
        onPerfSetting={ctx.onPerfSetting}
        onCloudQuality={ctx.onCloudQuality}
        worldMode={ctx.worldMode}
        settingsTarget={ctx.settingsTarget}
      />
      <PanelResetButton label="구름 설정 초기화" onClick={() => ctx.onResetPanel?.('clouds')} settingId="clouds.reset" />
    </SidePanel>
  );
}

// Shared time-of-day control. `timeOfDay` is a single engine-owned value used
// by the Skybox tab here, the Lighting system and the infinite HUD — never
// duplicated. Owned (surfaced) by the Skybox tab.
function TimeOfDayControl({ timeOfDay, onTimeOfDay, settingId }) {
  return (
    <div className="ctl" data-setting-id={settingId}>
      <div className="ctl-top">
        <span className="setting-label">시간</span>
        <span className="ctl-val" style={{ pointerEvents: 'none' }}>{formatTimeOfDay(timeOfDay)}</span>
      </div>
      <div className="slider-track-wrap">
        <div className="slider-track-bg" />
        <div className="slider-track-fill" style={{ width: `${timeOfDay * 100}%` }} />
        <input type="range" className="slider-input" min="0" max="1" step="0.005"
          value={timeOfDay} onChange={(e) => onTimeOfDay(parseFloat(e.target.value))} />
      </div>
    </div>
  );
}

const SKYBOX_SLIDERS = {
  skyboxBrightness: { key: 'skyboxBrightness', label: '하늘 밝기', min: 0.2, max: 2.5, step: 0.05, digits: 2, info: '스카이 돔과 태양 광휘의 전체 밝기.' },
  skyboxHaze: { key: 'skyboxHaze', label: '지평선 연무', min: 0, max: 1.2, step: 0.05, digits: 2, info: '지평선 주변에 블렌드되는 대기 헤이즈 밴드의 강도.' },
  skyboxCycleSpeed: { key: 'skyboxCycleSpeed', label: '주기 속도', min: 0.05, max: 12, step: 0.05, digits: 2, unit: 'x', info: 'Day/night animation speed. 1x is one full cycle in about two minutes.' },
};

function SkyboxPanel({ ctx }) {
  const { params, onParam } = ctx;
  const enabled = params.skyboxEnabled !== false;
  return (
    <SidePanel title="하늘" description="Sky environment, time of day and atmosphere." onClose={ctx.onClose}>
      <ToggleRow label="절차적 하늘" value={enabled} onChange={(v) => onParam('skyboxEnabled', v)}
        settingId="skybox.skyboxEnabled"
        info="Surround the scene with the procedural sky dome (Tile + Infinite World). When off, a flat backdrop and the manual Lighting sun angles are used." />

      <ControlSection id="skybox-time" title="시간대" defaultOpen settingId="skybox.section.time">
        <TimeOfDayControl timeOfDay={ctx.timeOfDay} onTimeOfDay={ctx.onTimeOfDay} settingId="skybox.timeOfDay" />
        <ToggleRow label="낮/밤 사이클" value={!!params.skyboxDayNightCycle}
          onChange={(v) => onParam('skyboxDayNightCycle', v)}
          settingId="skybox.skyboxDayNightCycle"
          info="절차적 하늘이 활성화된 동안 하루 중 시간대를 애니메이션화합니다." />
        <SliderCtl def={SKYBOX_SLIDERS.skyboxCycleSpeed} value={params.skyboxCycleSpeed ?? 1}
          onChange={(v) => onParam('skyboxCycleSpeed', v)} settingId="skybox.skyboxCycleSpeed" />
        <p className="section-hint">하늘 색상, 태양 위치, 대기를 제어합니다. 타일 뷰와 무한 세계에서 공유됩니다.</p>
      </ControlSection>

      {enabled && (
        <ControlSection id="skybox-appearance" title="외관" defaultOpen settingId="skybox.section.appearance">
          <SliderCtl def={SKYBOX_SLIDERS.skyboxBrightness} value={params.skyboxBrightness ?? 1}
            onChange={(v) => onParam('skyboxBrightness', v)} settingId="skybox.skyboxBrightness" />
          <SliderCtl def={SKYBOX_SLIDERS.skyboxHaze} value={params.skyboxHaze ?? 0.55}
            onChange={(v) => onParam('skyboxHaze', v)} settingId="skybox.skyboxHaze" />
          <ToggleRow label="밤 별" value={params.skyboxStars !== false}
            onChange={(v) => onParam('skyboxStars', v)}
            settingId="skybox.skyboxStars"
            info="태양이 지평선 아래에 있을 때 프로시저럴 별 필드를 표시합니다." />
        </ControlSection>
      )}
      <PanelResetButton label="스카이박스 설정 초기화" onClick={() => ctx.onResetPanel?.('skybox')} settingId="skybox.reset" />
    </SidePanel>
  );
}

function LightingPanel({ ctx }) {
  const { params } = ctx;
  const skyOn = params.skyboxEnabled !== false;
  return (
    <SidePanel title="조명" description="태양, 대기 및 안개." onClose={ctx.onClose}>
      {skyOn && (
        <p className="section-hint">시간대 및 하늘 환경은 다음에서 설정됩니다:<strong>하늘</strong>탭. 절차적 하늘이 켜져 있으면 태양 방향과 대기를 제어합니다. 끄면 아래의 수동 조명 팔레트를 사용합니다.</p>
      )}
      <EnvironmentPanelInner params={params} planetStyle={params.planetStyle}
        onParam={ctx.onParam} onTuning={ctx.onStyleTuning} settingsTarget={ctx.settingsTarget} />
      <PanelResetButton label="조명 설정 초기화" onClick={() => ctx.onResetPanel?.('lighting')} settingId="lighting.reset" />
    </SidePanel>
  );
}

function VisualsPanel({ ctx }) {
  return (
    <SidePanel title="비주얼" description="포스트 이펙트, 글로벌 카메라 셰이더, HDR 하늘 및 표면 마감." onClose={ctx.onClose}>
      <VisualsPanelInner ctx={ctx} />
    </SidePanel>
  );
}

function PerformancePanel({ ctx }) {
  const { stats } = useLiveMetrics(ctx.liveMetrics);
  return (
    <SidePanel title="성능 우선" description="GPU, 물, 안개, 구름 예산." onClose={ctx.onClose}>
      <PerformanceStats stats={stats} gpu={ctx.gpu} />
      <PerfSettings perf={ctx.perf} rendererInfo={ctx.rendererInfo} onPerfPreset={ctx.onPerfPreset}
        onPerfSetting={ctx.onPerfSetting} onPerfReset={ctx.onPerfReset}
        settingsTarget={ctx.settingsTarget}
        onSettingsTargetHandled={ctx.onSettingsTargetHandled} />
      <PanelResetButton label="성능 설정 초기화" onClick={() => ctx.onResetPanel?.('performance')} settingId="performance.reset" />
    </SidePanel>
  );
}

function DebugPanel({ ctx }) {
  const [tab, setTab] = useState('monitor');
  const isStudio = ctx.worldMode === 'studio';
  const live = useLiveMetrics(ctx.liveMetrics);

  useEffect(() => {
    const targetTab = ctx.settingsTarget?.tabId;
    if (targetTab && targetTab !== tab) setTab(targetTab);
  }, [ctx.settingsTarget?.tabId, tab]);

  return (
    <SidePanel title="디버그" description="실시간 통계 및 진단." onClose={ctx.onClose}>
      <PanelTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'monitor', label: '모니터' },
          { id: 'viewport', label: '뷰포트' },
          ...(isStudio ? [{ id: 'analysis', label: '분석' }] : []),
          { id: 'engine', label: '엔진' },
        ]}
      />

      {tab === 'monitor' && (
        <>
          <PerformanceStats stats={live.stats} gpu={ctx.gpu} />
          <SessionInfo ctx={ctx} />
        </>
      )}

      {tab === 'viewport' && (
        <>
          <CameraPanel
            camInfo={live.camInfo}
            camMode={ctx.camMode}
            onMode={ctx.onMode}
            onFov={ctx.onFov}
            onFocusCenter={ctx.onFocusCenter}
            embedded
          />
          {ctx.worldMode !== 'planet' && ctx.worldMode !== 'infinite' && (
            <LodPanel
              lodCounts={live.lodCounts}
              chunkCount={live.chunkCount}
              visibleChunks={live.visibleChunks}
              culledChunks={live.culledChunks}
              cullingEnabled={ctx.cullingEnabled}
              behindCameraCulling={ctx.behindCameraCulling}
              onCullingEnabled={ctx.onCullingEnabled}
              onBehindCameraCulling={ctx.onBehindCameraCulling}
              embedded
            />
          )}
          <TerrainOverlayOptions ctx={ctx} />
          {isStudio && (
            <TileMapDebugSection
              tileDebug={ctx.tileDebug}
              onTileDebug={ctx.onTileDebug}
            />
          )}
        </>
      )}

      {tab === 'engine' && <EngineDebugOptions ctx={ctx} />}
      {tab === 'analysis' && isStudio && <AnalysisContent ctx={ctx} />}

      <PanelResetButton label="디버그 설정 초기화" onClick={() => ctx.onResetPanel?.('debug')} settingId="debug.reset" />
    </SidePanel>
  );
}

function SessionInfo({ ctx }) {
  return (
    <div className="panel-group">
      <div className="panel-group-header">
        <span className="panel-group-title">SESSION</span>
      </div>
      <div className="panel-group-body">
        <div className="stat-row">
          <span className="stat-label">세계 모드</span>
          <span className="stat-value">{ctx.worldMode}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">시드</span>
          <span className="stat-value stat-mono">{ctx.params.seed}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">보드</span>
          <span className="stat-value stat-mono">{ctx.boardSize} u</span>
        </div>
        {ctx.worldMode === 'studio' && (
          <div className="stat-row">
            <span className="stat-label">높이 베이크</span>
            <span className="stat-value">
              {ctx.debugFlags?.disableHeightBake ? '끔 (라이브 필드)' : '활성'}
            </span>
          </div>
        )}
        <div className="stat-row">
          <span className="stat-label">버전</span>
          <span className="stat-value stat-mono">v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}

function TerrainOverlayOptions({ ctx }) {
  const { params, onParam, worldMode } = ctx;
  const isStudio = worldMode === 'studio';
  const detailDebugOptions = [
    { value: 'off', label: '꺼짐' },
    { value: 'slope', label: '경사 마스크' },
    { value: 'rock', label: '암석 마스크' },
    { value: 'shoreline', label: '해안선 마스크' },
    { value: 'detailFade', label: '근접 디테일 페이드' },
    { value: 'detail', label: '디테일 노이즈' },
    { value: 'albedo', label: '최종 알베도' },
    { value: 'normal', label: '최종 노멀' },
  ];

  return (
    <CollapsibleGroup
      title="지형 오버레이"
      icon={<Eye size={15} strokeWidth={1.75} />}
      defaultOpen
    >
      <ToggleRow
        label="와이어프레임"
        value={params.wireframe}
        onChange={(v) => onParam('wireframe', v)}
        info="지형을 솔리드 삼각형 대신 와이어 메쉬 라인으로 그립니다."
      />
      <ToggleRow
        label="LOD 디버그"
        value={params.lodDebug}
        onChange={(v) => onParam('lodDebug', v)}
        info="Tint chunks by their active level-of-detail (red = highest detail → blue = lowest)."
      />
      {isStudio && (
        <ToggleRow
          label="청크 그리드"
          value={params.chunkGrid}
          onChange={(v) => onParam('chunkGrid', v)}
          info="Overlay borders along chunk boundaries. Lines turn green over merged chunk groups and magenta over the macro proxy."
        />
      )}
      <ToggleRow
        label="청크 병합 표시"
        value={!!ctx.debugFlags?.mergeDebug}
        onChange={(v) => ctx.onDebugFlag?.('mergeDebug', v)}
        info="Tint folded terrain by merge level (green = small 2×2 fold → magenta = whole region). Works in Tile, Infinite and Planet modes. Watch blocks colour in as terrain folds at distance."
        settingId="debug.mergeDebug"
      />
      <ToggleRow
        label="생태계 디버그"
        value={params.biomeDebug}
        onChange={(v) => onParam('biomeDebug', v)}
        info="검토를 위해 지형 표면에 생태계를 색상으로 직접 표시합니다."
      />
      <SelectRow
        label="지형 재질 디버그"
        value={ctx.debugFlags?.terrainDetailDebug ?? 'off'}
        options={detailDebugOptions}
        onChange={(v) => ctx.onDebugFlag?.('terrainDetailDebug', v)}
        info="Inspect close-detail masks, albedo, and normals generated by the terrain material."
        settingId="debug.terrainDetailDebug"
      />
    </CollapsibleGroup>
  );
}

function EngineDebugOptions({ ctx }) {
  const { params, onParam, worldMode } = ctx;
  const flags = ctx.debugFlags ?? {};
  const setFlag = ctx.onDebugFlag ?? (() => {});
  const isStudio = worldMode === 'studio';

  return (
    <>
      <CollapsibleGroup
        title="세대"
        icon={<RefreshCw size={15} strokeWidth={1.75} />}
        defaultOpen
      >
        <ToggleRow
          label="자동 업데이트"
          value={params.autoUpdate}
          onChange={(v) => onParam('autoUpdate', v)}
          info="Rebuild the terrain live as shape settings change. When off, edits stay pending until Auto Update is turned back on."
          settingId="debug.autoUpdate"
        />
      </CollapsibleGroup>

      <CollapsibleGroup
        title="진단"
        icon={<Cog size={15} strokeWidth={1.75} />}
        defaultOpen={isStudio || worldMode === 'planet'}
      >
        {isStudio || worldMode === 'planet' ? (
          <>
            <ToggleRow
              label="컬링 정지"
              value={!!flags.freezeCulling}
              onChange={(v) => setFlag('freezeCulling', v)}
              info="Stop recomputing chunk visibility. Freeze, then orbit out to inspect the culling frustum from outside."
              settingId="debug.freezeCulling"
            />
            <ToggleRow
              label="LOD 정지"
              value={!!flags.freezeLod}
              onChange={(v) => setFlag('freezeLod', v)}
              info="Stop recomputing per-chunk level of detail — hold the current LOD layout while you move."
              settingId="debug.freezeLod"
            />
            <ToggleRow
              label="강제 렌더링"
              value={!!flags.forceRender}
              onChange={(v) => setFlag('forceRender', v)}
              info="Bypass on-demand rendering and draw every frame (use to read true sustained FPS)."
              settingId="debug.forceRender"
            />
            <ToggleRow
              label="높이 베이크 비활성화"
              value={!!flags.disableHeightBake}
              onChange={(v) => setFlag('disableHeightBake', v)}
              info={isStudio
                ? 'Force the live per-pixel height field instead of the baked texture — A/B the studio render optimization.'
                : 'Force the live per-pixel height field instead of the baked cubemap — A/B the planet render optimization.'}
              settingId="debug.disableHeightBake"
            />
            <ToggleRow
              label="프리캠 노클립"
              value={!!flags.freeCamNoClip}
              onChange={(v) => setFlag('freeCamNoClip', v)}
              info="Temporarily switch to a collision-free FPS debug camera, then restore the previous explore/camera mode when disabled."
              settingId="debug.freeCamNoClip"
            />
          </>
        ) : (
          <>
            <ToggleRow
              label="프리캠 노클립"
              value={!!flags.freeCamNoClip}
              onChange={(v) => setFlag('freeCamNoClip', v)}
              info="Temporarily switch to a collision-free FPS debug camera, then restore the previous explore/camera mode when disabled."
              settingId="debug.freeCamNoClip"
            />
            <p className="section-hint">프리즈/렌더 진단은 타일 또는 행성 모드에 적용됩니다.</p>
          </>
        )}
      </CollapsibleGroup>
    </>
  );
}

// ------------------------------------------------------------- export panel
const FORMAT_OPTIONS = [
  { value: 'glb', label: 'GLB / GLTF (권장)' },
  { value: 'obj', label: 'OBJ (Wavefront)' },
];
const RES_OPTIONS = [
  { value: '64', label: '64 × 64 (Low-poly)' }, { value: '128', label: '128 × 128' },
  { value: '256', label: '256 × 256' }, { value: '512', label: '512 × 512 (Standard)' },
  { value: '1024', label: '1024 × 1024 (High-end)' },
];
const TEX_OPTIONS = [
  { value: '512', label: '512 × 512' }, { value: '1024', label: '1024 × 1024' },
  { value: '2048', label: '2048 × 2048 (Crisp)' }, { value: '4096', label: '4096 × 4096 (UHD)' },
];
const COLL_OPTIONS = [
  { value: '32', label: '32 × 32' }, { value: '64', label: '64 × 64' },
  { value: '128', label: '128 × 128 (Recommended)' }, { value: '256', label: '256 × 256' },
];

function ExportPanel({ ctx }) {
  const [opt, setOpt] = useState({
    exportPresetId: 'custom', packageRoot: null, packagePaths: null, heightmapRawPath: null,
    format: 'glb', meshRes: '512', includeMesh: true, includeSkirts: true, includeBase: true,
    bakeColor: true, texRes: '2048', bakeLighting: false, bakeNormal: true,
    exportHeightmap: false, exportSplat: false, exportCollision: false, collisionRes: '128',
    exportWater: false, exportPreset: true,
    exportWaterMask: false, exportDepthMap: false, exportShorelineMask: false, exportFoamMask: false,
    excludeWaterFromExport: false, exportWaterMetadata: false,
    exportTileMode: 'merged', exportSplineMasks: false,
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setOpt((p) => ({ ...p, [k]: v }));
  // Turning on any water mask auto-enables the water plane (overridable: the
  // user can still switch the plane back off afterwards).
  const setMask = (k, v) => setOpt((p) => ({ ...p, [k]: v, ...(v && !p.exportWater ? { exportWater: true } : {}) }));
  const showTex = opt.bakeColor || opt.bakeNormal || opt.exportHeightmap;
  const multiTile = ctx.worldMode === 'studio' && (ctx.tiles?.length ?? 1) > 1;
  const circleTiles = ctx.tileAssemblyShape === 'circle';
  const productionChecks = validateExport(opt, { worldMode: ctx.worldMode, boardSize: ctx.boardSize });
  const exportBlocked = hasExportErrors(productionChecks);
  const selectedPreset = getExportPreset(opt.exportPresetId);
  const applyPreset = (id) => setOpt((current) => applyExportPreset(current, id));

  const doExport = async () => {
    if (exportBlocked) return;
    setBusy(true);
    try { await ctx.onExport(opt); }
    finally { setBusy(false); }
  };

  return (
    <SidePanel title="내보내기" description="메시와 텍스처 내보내기."
      onClose={ctx.onClose}
      footer={(
        <button type="button" className="action-btn primary" onClick={doExport} disabled={busy || exportBlocked}>
          {busy ? '내보내는 중…' : `${ctx.worldMode === 'planet' ? '행성' : '지형'} 내보내기`}
        </button>
      )}>
      <div className="side-panel-quick">
        <button type="button" className="action-btn" onClick={ctx.onExportScreenshot} disabled={busy}>스크린샷</button>
        <button type="button" className="action-btn" onClick={ctx.onExportHeightmap} disabled={busy}>하이맵</button>
      </div>

      <ControlSection id="export-production-preset" title="프로덕션 프리셋" defaultOpen settingId="export.section.productionPreset">
        <SelectRow label="대상" value={opt.exportPresetId} options={EXPORT_PRESET_OPTIONS} onChange={applyPreset} />
        <div className="settings-hint">
          {selectedPreset ? selectedPreset.description : '파일, 지도, 지오메트리를 수동으로 선택하세요.'}
        </div>
        <div className="export-validation" role="status" aria-label="프로덕션 점검">
          <strong>프로덕션 검사</strong>
          {productionChecks.map((check, index) => (
            <div className={`export-validation-row ${check.status}`} key={`${check.status}-${index}`}>
              <span aria-hidden>{check.status === 'success' ? '✓' : check.status === 'warning' ? '⚠' : '×'}</span>{check.message}
            </div>
          ))}
        </div>
      </ControlSection>

      {multiTile && !circleTiles && (
        <ControlSection id="export-tile-assembly" title="타일 어셈블리" defaultOpen settingId="export.section.tileAssembly">
          <SelectRow
            label="타일 내보내기"
            value={opt.exportTileMode}
            options={[
              { value: 'merged', label: '하나의 지형 (병합됨)' },
              { value: 'separate', label: '분리된 타일' },
            ]}
            onChange={(v) => set('exportTileMode', v)}
          />
          <div className="settings-hint">
            Merged = one combined terrain mesh. Separate = one ZIP with an
            importable model and enabled maps for every tile.
          </div>
        </ControlSection>
      )}

      <ControlSection id="export-format" title="포맷 및 해상도" defaultOpen settingId="export.section.format">
        <SelectRow label="형식" value={opt.format} options={FORMAT_OPTIONS} onChange={(v) => set('format', v)} />
        <ToggleRow label="지형 메쉬 포함" value={opt.includeMesh} onChange={(v) => set('includeMesh', v)} />
        {opt.includeMesh && (
          <>
            <SelectRow label="메쉬 해상도" value={opt.meshRes} options={RES_OPTIONS} onChange={(v) => set('meshRes', v)} />
            <ToggleRow label="사이드 스커트 포함" value={opt.includeSkirts} onChange={(v) => set('includeSkirts', v)} />
            {opt.includeSkirts && (
              <ToggleRow label="베이스 슬랩 포함" value={opt.includeBase} onChange={(v) => set('includeBase', v)} />
            )}
          </>
        )}
      </ControlSection>

      <ControlSection id="export-textures" title="텍스처 베이크" defaultOpen settingId="export.section.textures">
        <ToggleRow label="색상 텍스처 베이크" value={opt.bakeColor} onChange={(v) => set('bakeColor', v)} />
        {opt.bakeColor && (
          <ToggleRow label="조명을 색상에 베이크" value={opt.bakeLighting} onChange={(v) => set('bakeLighting', v)} />
        )}
        <ToggleRow label="법선 맵 베이크" value={opt.bakeNormal} onChange={(v) => set('bakeNormal', v)} />
        {showTex && (
          <SelectRow label="텍스처 크기" value={opt.texRes} options={TEX_OPTIONS} onChange={(v) => set('texRes', v)} />
        )}
      </ControlSection>

      <ControlSection id="export-assets" title="추가 자산" defaultOpen={false} settingId="export.section.assets">
        <ToggleRow label="하이맵 내보내기" value={opt.exportHeightmap} onChange={(v) => set('exportHeightmap', v)} />
        {opt.exportHeightmap && (
          <ToggleRow label="바이옴 스플랫 맵 포함" value={opt.exportSplat} onChange={(v) => set('exportSplat', v)} />
        )}
        <ToggleRow label="충돌 메쉬 내보내기" value={opt.exportCollision} onChange={(v) => set('exportCollision', v)} />
        {opt.exportCollision && (
          <SelectRow label="충돌 해상도" value={opt.collisionRes} options={COLL_OPTIONS} onChange={(v) => set('collisionRes', v)} />
        )}
        <ToggleRow label="물 평면 포함" value={opt.exportWater} onChange={(v) => set('exportWater', v)} />
        {ctx.worldMode === 'studio' && <ToggleRow label="스플라인 마스크 내보내기" value={opt.exportSplineMasks} onChange={(v) => set('exportSplineMasks', v)} />}
        {opt.exportWater && (
          <ToggleRow label="내보낼 때 물 제외" value={opt.excludeWaterFromExport} onChange={(v) => set('excludeWaterFromExport', v)} />
        )}
      </ControlSection>

      <ControlSection id="export-water-maps" title="물 맵" defaultOpen={false} settingId="export.section.waterMaps">
        <ToggleRow label="물 마스크 내보내기" value={opt.exportWaterMask} onChange={(v) => setMask('exportWaterMask', v)} />
        <ToggleRow label="깊이 맵 내보내기" value={opt.exportDepthMap} onChange={(v) => setMask('exportDepthMap', v)} />
        <ToggleRow label="해안선 마스크 내보내기" value={opt.exportShorelineMask} onChange={(v) => setMask('exportShorelineMask', v)} />
        <ToggleRow label="거품 마스크 내보내기" value={opt.exportFoamMask} onChange={(v) => setMask('exportFoamMask', v)} />
        <ToggleRow label="물 머티리얼 메타데이터 포함" value={opt.exportWaterMetadata} onChange={(v) => set('exportWaterMetadata', v)} />
        <ToggleRow label="프리셋 내보내기 (JSON)" value={opt.exportPreset} onChange={(v) => set('exportPreset', v)} />
      </ControlSection>
    </SidePanel>
  );
}

// --------------------------------------------------------------- tiles panel
function TilesContent({ ctx }) {
  const tiles = ctx.tiles ?? [{ cx: 0, cz: 0 }];
  const grid = ctx.tileGridSize ?? 5;
  const extent = ctx.tileGridExtent ?? 2;
  const gridCells = grid * grid;
  const shape = ctx.tileAssemblyShape ?? 'square';
  const diskOuter = extent + 0.5;
  const diskMaxCells = Array.from({ length: grid }, (_, ix) => ix - extent)
    .flatMap((cx) => Array.from({ length: grid }, (_, iz) => ({ cx, cz: iz - extent })))
    .filter(({ cx, cz }) => Math.hypot(Math.max(Math.abs(cx) - 0.5, 0), Math.max(Math.abs(cz) - 0.5, 0)) < diskOuter - 1e-6)
    .length;
  const maxCells = shape === 'circle' ? diskMaxCells : gridCells;
  const atGridEdge = tiles.length >= maxCells;
  return (
    <ControlSection id="inspector-tiles" title="타일" defaultOpen settingId="world.section.tiles" icon={PANEL_ICONS.tiles}>
      <ControlSection id="inspector-tiles-assembly" title="조립" nested defaultOpen settingId="world.section.tilesAssembly">
        <div className="settings-hint" style={{ marginBottom: 8 }}>
          {shape === 'square'
            ? `Hover near a board edge and click the highlighted square to add a tile. Placement is limited to a ${grid}×${grid} grid centred on the origin.`
            : (ctx.diskRadiusCells < extent
              ? '원형 가장자리를 호버하고 강조된 링을 클릭하여 디스크를 확장하세요.'
              : '원형 지형이 최대 반경에 도달했습니다.')}
          {' '}Tiles share the same noise field and export together.
        </div>
        <SelectRow label="형태" value={shape}
          options={[{ value: 'square', label: '사각형' }, { value: 'circle', label: '원' }]}
          onChange={ctx.onTileAssemblyShape} settingId="world.tileAssemblyShape"
          info="Square supports hover-to-add tiles. Circle crops the current square chunk assembly to a disk." />
        <div className="kv-row"><span>타일</span><span>{tiles.length} / {maxCells}</span></div>
        {shape === 'circle' && <div className="kv-row"><span>디스크 반경</span><span>{(ctx.diskRadiusCells ?? 0).toFixed(2)} cells</span></div>}
        {atGridEdge && (
          <div className="settings-hint">All {maxCells} available cells are occupied.</div>
        )}
      </ControlSection>

      {shape === 'square' && tiles.length > 1 && (
        <ControlSection id="inspector-tiles-remove" title="타일 제거" nested defaultOpen={false} settingId="world.section.tilesRemove">
          <div className="tile-chip-grid">
            {tiles.map((t) => (
              <button
                key={`${t.cx},${t.cz}`}
                type="button"
                className="action-btn"
                title={`타일 제거 (${t.cx}, ${t.cz})`}
                onClick={() => ctx.onRemoveTile?.(t.cx, t.cz)}
              >
                {t.cx === 0 && t.cz === 0 ? 'origin' : `${t.cx}, ${t.cz}`} ✕
              </button>
            ))}
          </div>
        </ControlSection>
      )}
    </ControlSection>
  );
}

function NoiseLayersPanelWrapper({ ctx }) {
  return (
    <NoiseLayersPanel ctx={ctx}>
      <PanelResetButton label="노이즈 레이어 초기화" onClick={() => ctx.onResetPanel?.('noiseLayers')} settingId="noiseLayers.reset" />
    </NoiseLayersPanel>
  );
}

const COMPONENTS = {
  terrain: TerrainPanel, noiseLayers: NoiseLayersPanelWrapper, world: WorldPanel, planet: PlanetPanel, biomes: BiomesPanel,
  water: WaterPanel, props: PropsPanel, clouds: CloudsPanel, visuals: VisualsPanel, skybox: SkyboxPanel, lighting: LightingPanel, export: ExportPanel,
  performance: PerformancePanel, debug: DebugPanel,
  splines: ({ ctx }) => <SplinesPanel ctx={ctx} />, history: ({ ctx }) => <HistoryPanel ctx={ctx} />,
};

export function renderPanel(id, ctx) {
  const Comp = COMPONENTS[id];
  return Comp ? <Comp ctx={ctx} /> : null;
}
