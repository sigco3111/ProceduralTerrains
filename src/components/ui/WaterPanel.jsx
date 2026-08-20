import React, { useContext, useState } from 'react';
import ControlSection from './ControlSection.jsx';
import { FlatPanelContext } from '../panels/PanelContext.js';
import { shouldForceSectionOpen } from '../panels/sectionUtils.js';
import { SliderCtl, ToggleRow, SelectRow } from '../controls.jsx';
import { ColorField, WATER_COLORS, TERRAIN_SLIDERS } from '../panels/defs.jsx';
import { colorToHex, parseColor } from '../../engine/style/ColorPalette.js';
import { PERF_LIMITS } from '../../engine/render/PerformanceSettings.js';
import {
  WATER_MODES,
  WATER_DEFAULT_PARAMS,
  UNDERWATER_MODES,
  isRealisticWaterMode,
  resolveEffectiveWaterMode,
  isWaterModeDowngraded,
  resolveUnderwaterMode,
  underwaterModeFellBack,
  WORLD_MODE_WATER_LABELS,
  WORLD_MODE_WATER_HINTS,
} from '../../engine/water/WaterSettings.js';
import { WATER_DEBUG_VIEWS } from '../../engine/water/WaterDebugViews.js';
import { WATER_BASELINE_SCENES } from '../../engine/water/WaterBaseline.js';
import PanelResetButton from './PanelResetButton.jsx';

function val(params, key) {
  return params[key] ?? WATER_DEFAULT_PARAMS[key];
}

function fmtWaterCostMs(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} ms` : 'unavailable';
}

function fmtWaterResolution(pass) {
  return pass?.resolution
    ? `${pass.resolution.width}×${pass.resolution.height}`
    : 'not allocated';
}

function fmtWaterMemory(bytes) {
  return `${((bytes || 0) / 1048576).toFixed(1)} MB`;
}

const SEA_LEVEL_DEF = TERRAIN_SLIDERS.find((s) => s.key === 'seaLevel');

const MODE_HINTS = {
  off: '물 비활성화 — 메쉬 없음, 수면 효과 없음.',
  legacy: '원본 물 셰이더의 고속 버전. 성능과 무한 세계(Infinite World)에 최적입니다.',
  realistic: 'RGB 흡수, 실시간 하늘 반사, 방향성 파도, 해안선 거품.',
  volumetric: 'Realistic surface plus half-resolution scene refraction, depth rejection, and higher-tier underwater effects.',
  cinematic: 'Volumetric water plus displaced geometry, sparse crest foam, and planar scene reflections. Best for Tile screenshots.',
};

const MATERIAL_SLIDERS = [
  { key: 'waterOpacity', label: '밀도 / 불투명도', min: 0.2, max: 1, step: 0.01, digits: 2, info: 'Realistic 모드에서는 광학 밀도, Legacy 모드에서는 전통적 투명도입니다.' },
  { key: 'waterRoughness', label: '거칠기', min: 0, max: 1, step: 0.02, digits: 2, info: '반사된 하늘과 태양 하이라이트를 넓히고 미세한 잔물결을 부드럽게 합니다.' },
  { key: 'waterFresnelStrength', label: '프레넬 강도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterRefractionStrength', label: '투과 / 굴절', min: 0.05, max: 1.5, step: 0.05, digits: 2, info: 'Controls transmission clarity in Realistic mode and scene distortion in Volumetric/Cinematic modes.' },
  { key: 'waterSpecularStrength', label: '스펙큘러 강도', min: 0, max: 2, step: 0.05, digits: 2 },
];

const DEPTH_SLIDERS = [
  { key: 'waterDepthColorStrength', label: '심부 색상 강도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterDepthOpacityStrength', label: '심부 불투명도 강도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterMaxVisibleDepth', label: '최대 가시 깊이', min: 20, max: 250, step: 5, unit: ' u' },
  { key: 'waterDepthFalloff', label: '심부 감쇠', min: 0.2, max: 3, step: 0.05, digits: 2 },
  { key: 'waterShallowDistance', label: '얕은 거리', min: 2, max: 30, step: 0.5, digits: 1, unit: ' u' },
  { key: 'waterDeepDistance', label: '심부 거리', min: 20, max: 120, step: 1, unit: ' u' },
  { key: 'waterAbsorptionStrength', label: '흡수 강도', min: 0, max: 2, step: 0.05, digits: 2 },
];

const WAVE_SLIDERS = [
  { key: 'waterWaveSpeed', label: '물결 속도', min: 0, max: 3, step: 0.05, digits: 2 },
  { key: 'waterWaveScale', label: '파도 스케일', min: 0.3, max: 3, step: 0.05, digits: 2 },
  { key: 'waterWaveStrength', label: '파도 강도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterSmallWaveStrength', label: '잔잔한 파도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterLargeWaveStrength', label: '큰 파도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterNormalIntensity', label: '노멀 강도', min: 0, max: 2, step: 0.05, digits: 2 },
  { key: 'waterWaveDirection', label: '물결 방향', min: 0, max: 360, step: 1, unit: '°' },
  { key: 'waterAnimSpeed', label: '애니메이션 속도', min: 0, max: 3, step: 0.05, digits: 2 },
];

const FOAM_SLIDERS = [
  { key: 'waterFoamStrength', label: '해안선 거품 강도', min: 0, max: 1.5, step: 0.02, digits: 2 },
  { key: 'waterFoamSoftness', label: '거품 부드러움', min: 0.1, max: 4, step: 0.1, digits: 1 },
  { key: 'waterFoamAnimSpeed', label: '거품 애니메이션', min: 0, max: 3, step: 0.05, digits: 2 },
  { key: 'waterSlopeFoam', label: '경사 기반 거품', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'waterCliffFoam', label: '절벽 / 암석 거품', min: 0, max: 1.5, step: 0.05, digits: 2 },
];

const SHORE_DISTANCE_SLIDER = {
  key: 'waterFoamWidth',
  label: '해안 거리',
  min: 0.5,
  max: 12,
  step: 0.1,
  digits: 1,
  unit: ' u',
  info: '보이는 해안선 띠가 물 안으로 얼마나 멀리 뻗어가는지.',
};

// Apply to both Lite and High underwater modes.
const UNDERWATER_SLIDERS = [
  { key: 'waterUnderwaterFogDensity', label: '안개 밀도', min: 0.2, max: 2.5, step: 0.05, digits: 2 },
  { key: 'waterUnderwaterVisibility', label: '가시 거리', min: 0.25, max: 2, step: 0.05, digits: 2 },
  { key: 'waterUnderwaterDistortion', label: '표면 왜곡', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'waterSurfaceTransition', label: '표면 전환', min: 0.2, max: 2, step: 0.05, digits: 2 },
];

const CAUSTIC_SLIDERS = [
  { key: 'waterUnderwaterCaustics', label: '반사광 세도', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'waterUnderwaterCausticScale', label: '코스틱 스케일', min: 0.25, max: 3, step: 0.05, digits: 2 },
  { key: 'waterUnderwaterCausticSpeed', label: '코스틱 속도', min: 0, max: 3, step: 0.05, digits: 2 },
  {
    key: 'waterUnderwaterCausticMinDepth',
    label: '최소 캐스틱 깊이',
    min: 0,
    max: 20,
    step: 0.25,
    digits: 2,
    unit: ' u',
    info: 'Prevents caustics from appearing where terrain is almost touching the water surface.',
  },
  {
    key: 'waterUnderwaterCausticMinDepthFalloff',
    label: '최소 깊이 폴오프',
    min: 0.1,
    max: 20,
    step: 0.25,
    digits: 2,
    unit: ' u',
    info: '최소 심도 이후 코스틱이 페이드 인되는 거리입니다.',
  },
];

const REALISTIC_PERF_SLIDERS = [
  { key: 'waterReflectionQuality', label: '반사 품질', min: 0, max: 1.5, step: 0.05, digits: 2, expensive: true, info: 'Up to 1× controls analytical sky clarity. Above 1× enables planar scene reflection in Cinematic Tile mode.' },
  { key: 'waterFoamQuality', label: '거품 품질', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'waterCausticsQuality', label: '코스틱 품질', min: 0, max: 1.5, step: 0.05, digits: 2, expensive: true },
  { key: 'waterNormalResolution', label: '마이크로 파도 디테일', min: 0.25, max: 1.5, step: 0.05, digits: 2, info: '미세한 프로시저럴 잔물결만 조정하며 주 파도 크기는 변경하지 않습니다.' },
  { key: 'waterDisableExpensiveBelowFps', label: 'FPS 다운그레이드 임계값', min: 24, max: 60, step: 1, digits: 0 },
];

const REFRACTION_PERF_SLIDERS = [
  { key: 'waterRefractionQuality', label: '굴절 디테일', min: 0.1, max: 1.5, step: 0.05, digits: 2, expensive: true, info: '왜곡 디테일과 지형 실루엣 차단을 제어합니다.' },
  { key: 'waterRenderScale', label: '물 패스 해상도', min: 0.5, max: 2, step: 0.25, digits: 2, expensive: true, info: '1× renders refraction at half resolution; 2× reaches full resolution and also raises Cinematic reflection resolution.' },
];

const REFLECTION_UPDATE_OPTIONS = [
  { value: '1', label: 'Every frame' },
  { value: '2', label: 'Every 2 frames' },
  { value: '4', label: 'Every 4 frames' },
];

const WATER_QUALITY_OPTIONS = [
  { value: '0', label: '낮음' },
  { value: '1', label: '중간' },
  { value: '2', label: '높음' },
];

const lim = (key, label, step, opts = {}) => ({
  key,
  label,
  step,
  min: PERF_LIMITS[key].min,
  max: PERF_LIMITS[key].max,
  ...opts,
});

const LEGACY_SHADER_SLIDERS = [
  lim('waterReflection', '물 반사', 0.05, { digits: 2, unit: '×' }),
  lim('waterDetail', '물 디테일', 0.05, { digits: 2, unit: '×' }),
  lim('waterWaves', '파도 복잡도', 0.05, { digits: 2, unit: '×' }),
];

function PerfSlider({ perf, id, def, onPerfSetting, settingId }) {
  return (
    <SliderCtl
      def={def}
      value={perf?.[id] ?? PERF_LIMITS[id]?.min ?? 0}
      onChange={(v) => onPerfSetting(id, v)}
      settingId={settingId}
    />
  );
}

export default function WaterPanelInner({
  params,
  onParam,
  worldMode,
  perf,
  perfStats,
  gpu,
  onPerfSetting,
  planetStyleProps,
  onResetWaterSettings,
  onExportWaterMasks,
  onApplyWaterBaselineScene,
  onCaptureWaterBaseline,
  settingsTarget,
  id = 'inspector-water',
}) {
  const flat = useContext(FlatPanelContext);
  const target = settingsTarget?.panelId === 'water' ? settingsTarget : null;
  const forceSection = (sectionId, sectionLabel, prefixes = []) =>
    shouldForceSectionOpen(target, sectionId, { sectionLabel, childPrefixes: prefixes });
  const palette = params.planetStyle?.palette ?? {};
  const mode = val(params, 'waterMode');
  const enabled = val(params, 'waterEnabled');
  const selectedRealistic = isRealisticWaterMode(mode);
  const selectedSceneRefraction = mode === 'volumetric' || mode === 'cinematic';
  const legacy = mode === 'legacy' || mode === 'off';
  const isStudio = worldMode === 'studio';
  const isInfinite = worldMode === 'infinite';
  const isPlanet = worldMode === 'planet';
  const selectedPlanarReflection = mode === 'cinematic' && isStudio;
  const worldLabel = WORLD_MODE_WATER_LABELS[worldMode] ?? worldMode;
  const effectiveMode = resolveEffectiveWaterMode(params, worldMode);
  const effectiveRealistic = isRealisticWaterMode(effectiveMode);
  const downgraded = isWaterModeDowngraded(params, worldMode);
  const modeLabel = WATER_MODES.find((m) => m.value === mode)?.label ?? mode;
  const effectiveLabel = WATER_MODES.find((m) => m.value === effectiveMode)?.label ?? effectiveMode;
  const waterCost = perfStats?.waterCost ?? null;
  const p = perf ?? {};
  const [baselineScene, setBaselineScene] = useState(WATER_BASELINE_SCENES[0].value);
  const [baselineBusy, setBaselineBusy] = useState('');

  const runBaselineAction = async (action, busyLabel) => {
    setBaselineBusy(busyLabel);
    try {
      await action?.(baselineScene);
    } finally {
      setBaselineBusy('');
    }
  };

  const setEnabled = (v) => {
    onParam('waterEnabled', v);
    onParam('waterMode', v ? (mode === 'off' ? 'legacy' : mode) : 'off');
  };

  const setMode = (v) => {
    onParam('waterMode', v);
    onParam('waterEnabled', v !== 'off');
  };

  const setSeaLevel = (v) => {
    onParam('seaLevel', v);
    if (v <= 0.5 && mode !== 'off') {
      onParam('waterMode', 'off');
      onParam('waterEnabled', false);
    } else if (v > 0.5 && mode === 'off') {
      onParam('waterMode', 'legacy');
      onParam('waterEnabled', true);
    }
  };

  const content = (
    <>
      <div className={`water-mode-banner${effectiveRealistic ? ' realistic' : effectiveMode === 'legacy' ? ' legacy' : ''}`}>
        <span className="water-mode-banner-label">{worldLabel} · Water</span>
        <span className="water-mode-banner-value">
          {downgraded ? `${modeLabel} → ${effectiveLabel}` : modeLabel}
        </span>
        <p className="section-hint">{WORLD_MODE_WATER_HINTS[worldMode]}</p>
        {downgraded && (
          <p className="section-hint warning">
            Rendering as {effectiveLabel}
            {isInfinite && val(params, 'waterAutoDowngradeInfinite') ? ' (자동 다운그레이드 활성)' : ''}
            {isPlanet && selectedRealistic ? ' (행성 구형 폴백)' : ''}
          </p>
        )}
      </div>

      <ControlSection
        id={`${id}-mode`}
        title="최빈값"
        defaultOpen
        settingId="water.section.mode"
        forceOpen={forceSection('water.section.mode', '최빈값', ['water.water', 'water.seaLevel', 'performance.water'])}
      >
        <ToggleRow
          label="물 활성화"
          value={enabled && mode !== 'off'}
          onChange={setEnabled}
          settingId="water.waterEnabled"
          info="모든 월드 모드에서 수면 및 수중 효과의 마스터 토글."
        />
        {SEA_LEVEL_DEF && (
          <SliderCtl
            def={SEA_LEVEL_DEF}
            value={params.seaLevel}
            onChange={setSeaLevel}
            settingId="water.seaLevel"
          />
        )}
        <SelectRow
          label="물 모드"
          value={mode}
          options={WATER_MODES}
          onChange={setMode}
          settingId="water.waterMode"
          info={MODE_HINTS[mode] ?? '물 렌더링 파이프라인을 선택하세요.'}
        />
        {isInfinite && (
          <ToggleRow
            label="Infinite World에서 자동 다운그레이드"
            value={!!val(params, 'waterAutoDowngradeInfinite')}
            onChange={(v) => onParam('waterAutoDowngradeInfinite', v)}
            settingId="water.waterAutoDowngradeInfinite"
            info="무한 월드를 탐험하는 동안 볼류메트릭/시네마틱을 사실로 제한합니다."
          />
        )}
        <ToggleRow
          label="낮은 FPS에서 레거시 사용"
          value={!!val(params, 'waterLegacyOnLowFps')}
          onChange={(v) => onParam('waterLegacyOnLowFps', v)}
          settingId="water.waterLegacyOnLowFps"
          info="FPS가 임계값 아래로 떨어지면 비싼 물 효과를 일시적으로 줄입니다."
        />
      </ControlSection>

      {enabled && mode !== 'off' && (
        <ControlSection
          id={`${id}-shader`}
          title="셰이더 품질"
          defaultOpen
          settingId="water.section.shader"
          forceOpen={forceSection('water.section.shader', '셰이더 품질', ['performance.water'])}
        >
          <SelectRow
            label="물 품질"
            value={String(p.waterQuality ?? 2)}
            options={WATER_QUALITY_OPTIONS}
            onChange={(v) => onPerfSetting?.('waterQuality', parseInt(v, 10))}
            settingId="performance.waterQuality"
            info="레거시 셰이더 품질 등급 — 타일, 무한 월드, 행성에 적용됩니다."
          />
          {LEGACY_SHADER_SLIDERS.map((def) => (
            <PerfSlider
              key={def.key}
              perf={p}
              id={def.key}
              def={def}
              onPerfSetting={onPerfSetting}
              settingId={`performance.${def.key}`}
            />
          ))}
          {isInfinite && (
            <PerfSlider
              perf={p}
              id="waterDistance"
              def={lim('waterDistance', '물 렌더 거리', 0.05, { digits: 2, unit: '×', info: 'How far the infinite water plane extends relative to loaded terrain.' })}
              onPerfSetting={onPerfSetting}
              settingId="performance.waterDistance"
            />
          )}
        </ControlSection>
      )}

      <ControlSection
        id={`${id}-material`}
        title="재질"
        defaultOpen={enabled}
        settingId="water.section.material"
        forceOpen={forceSection('water.section.material', '재질', ['water.waterAnim', 'planet.water', 'water.waterOpacity', 'water.waterRoughness', 'water.waterFresnel', 'water.waterRefraction', 'water.waterSpecular'])}
      >
        <ToggleRow
          label="물 애니메이션"
          value={params.waterAnim}
          onChange={(v) => onParam('waterAnim', v)}
          settingId="water.waterAnim"
          info="모든 월드 모드에서 수면 잔물결과 거품을 애니메이션."
        />
        <ControlSection
          id={`${id}-water-colors`}
          title="물 색상"
          nested
          defaultOpen
          settingId="water.section.waterColors"
          forceOpen={forceSection('water.section.waterColors', '물 색상', ['planet.water'])}
        >
          {selectedRealistic && (
            <>
              <ToggleRow
                label="바이옴 색상 변화"
                value={val(params, 'waterBiomeColorEnabled')}
                onChange={(v) => onParam('waterBiomeColorEnabled', v)}
                settingId="water.waterBiomeColorEnabled"
                info="선택한 기본 색상을 유지하면서 로컬 절차적 바이옴에 물 색조를 부드럽게 적응시킵니다."
              />
              {val(params, 'waterBiomeColorEnabled') && (
                <SliderCtl
                  def={{
                    key: 'waterBiomeColorStrength',
                    label: '바이옴 색상 강도',
                    min: 0,
                    max: 1.5,
                    step: 0.05,
                    digits: 2,
                  }}
                  value={val(params, 'waterBiomeColorStrength')}
                  onChange={(v) => onParam('waterBiomeColorStrength', v)}
                  settingId="water.waterBiomeColorStrength"
                />
              )}
            </>
          )}
          {WATER_COLORS.map(({ key, label, icon, info }) => (
            <ColorField
              key={key}
              label={label}
              icon={icon}
              info={info}
              value={colorToHex(palette[key] ?? [0.05, 0.2, 0.35])}
              onChange={(e) => planetStyleProps.onColorChange(key, parseColor(e.target.value))}
            />
          ))}
        </ControlSection>
        {selectedRealistic && MATERIAL_SLIDERS.map((def) => (
          <SliderCtl
            key={def.key}
            def={def}
            value={val(params, def.key)}
            onChange={(v) => onParam(def.key, v)}
            settingId={`water.${def.key}`}
          />
        ))}
        {legacy && enabled && (
          <p className="section-hint">레거시 셰이더는 위의 색상과 셰이더 품질 설정을 사용합니다. 깊이, 거품, 볼류메트릭 제어를 위해 사실 모드로 전환하세요.</p>
        )}
      </ControlSection>

      {selectedRealistic && (
        <ControlSection
          id={`${id}-depth`}
          title="깊이"
          defaultOpen={isStudio}
          settingId="water.section.depth"
          forceOpen={forceSection('water.section.depth', '깊이', ['water.waterDepth', 'water.waterMaxVisible', 'water.waterShallow', 'water.waterDeep', 'water.waterAbsorption'])}
        >
          {!effectiveRealistic && (
            <p className="section-hint">
              Stored for Tile / Infinite World. {isPlanet ? '행성이 현재 Legacy 물을 렌더링합니다.' : '유효 모드가 선택한 모드와 다릅니다.'}
            </p>
          )}
          {DEPTH_SLIDERS.map((def) => (
            <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`water.${def.key}`} />
          ))}
        </ControlSection>
      )}

      {enabled && (
        <ControlSection
          id={`${id}-waves`}
          title="물결"
          defaultOpen={false}
          settingId="water.section.waves"
          forceOpen={forceSection('water.section.waves', '물결', ['water.waterWave', 'water.waterSmall', 'water.waterLarge', 'water.waterNormal', 'water.waterAnimSpeed', 'performance.waterWaves'])}
        >
          {selectedRealistic
            ? WAVE_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`water.${def.key}`} />
            ))
            : LEGACY_SHADER_SLIDERS.filter((d) => d.key === 'waterWaves').map((def) => (
              <PerfSlider key={def.key} perf={p} id={def.key} def={def} onPerfSetting={onPerfSetting} settingId={`performance.${def.key}`} />
            ))}
        </ControlSection>
      )}

      {enabled && (
        <ControlSection
          id={`${id}-foam`}
          title="해안선"
          defaultOpen={false}
          settingId="water.section.foam"
          forceOpen={forceSection('water.section.foam', '해안선', ['water.waterFoam'])}
        >
          <SliderCtl
            def={SHORE_DISTANCE_SLIDER}
            value={val(params, SHORE_DISTANCE_SLIDER.key)}
            onChange={(v) => onParam(SHORE_DISTANCE_SLIDER.key, v)}
            settingId="water.waterFoamWidth"
          />
          {selectedRealistic && (
            <>
              <ToggleRow
                label="거품 활성화"
                value={!!val(params, 'waterFoamEnabled')}
                onChange={(v) => onParam('waterFoamEnabled', v)}
                settingId="water.waterFoamEnabled"
              />
              {FOAM_SLIDERS.map((def) => (
                <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`water.${def.key}`} />
              ))}
            </>
          )}
        </ControlSection>
      )}

      {enabled && !isPlanet && (() => {
        const uwEnabled = !!val(params, 'waterUnderwaterEnabled') && p.underwaterEffect !== false;
        const uwResolved = resolveUnderwaterMode(params, effectiveMode, p.underwaterEffect !== false);
        const uwFellBack = underwaterModeFellBack(params, effectiveMode);
        const requested = val(params, 'waterUnderwaterMode');
        return (
          <ControlSection
            id={`${id}-underwater`}
            title="수중"
            defaultOpen={false}
            settingId="water.section.underwater"
            forceOpen={forceSection('water.section.underwater', '수중', ['water.waterUnderwater', 'performance.underwater'])}
          >
            <ToggleRow
              label="수중 효과 활성화"
              value={uwEnabled}
              onChange={(v) => {
                onParam('waterUnderwaterEnabled', v);
                onPerfSetting?.('underwaterEffect', v);
              }}
              settingId="water.waterUnderwaterEnabled"
              info="타일 및 무한 월드에서 카메라 수중 안개, 색조 및 코스틱 효과"
            />
            <SelectRow
              label="수중 모드"
              value={requested}
              options={UNDERWATER_MODES}
              onChange={(v) => onParam('waterUnderwaterMode', v)}
              settingId="water.waterUnderwaterMode"
              info="Lite is cheap (any water). High is cinematic and needs the Realistic renderer. Auto picks High with Realistic water, Lite otherwise."
            />
            {uwEnabled && (
              <p className={`section-hint${uwFellBack ? ' warning' : ''}`}>
                {uwResolved === 'off'
                  ? '수중 효과가 꺼져 있습니다.'
                  : `활성 모드: ${uwResolved === 'high' ? '고품질' : '라이트'}`}
                {uwFellBack ? ' — High는 Realistic 렌더러가 필요하며 Lite로 폴백합니다.' : ''}
              </p>
            )}

            {uwEnabled && UNDERWATER_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`water.${def.key}`} />
            ))}

            {uwEnabled && (
              <ControlSection
                id={`${id}-caustics`}
                title="반사광"
                nested
                defaultOpen={false}
                settingId="water.section.caustics"
                forceOpen={forceSection('water.section.caustics', '반사광', ['water.waterUnderwaterCaustics'])}
              >
                <ToggleRow
                  label="코스틱 활성화"
                  value={val(params, 'waterUnderwaterCausticsEnabled') !== false}
                  onChange={(v) => onParam('waterUnderwaterCausticsEnabled', v)}
                  settingId="water.waterUnderwaterCausticsEnabled"
                  info="잠긴 해저에 투영된 애니메이션 점무늬 빛."
                />
                {val(params, 'waterUnderwaterCausticsEnabled') !== false && CAUSTIC_SLIDERS.map((def) => (
                  <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`water.${def.key}`} />
                ))}
              </ControlSection>
            )}

            {uwEnabled && (
              <ControlSection
                id={`${id}-high-extras`}
                title="고급 모드 추가 옵션"
                nested
                defaultOpen={false}
                settingId="water.section.highExtras"
                forceOpen={forceSection('water.section.highExtras', '고급 모드 추가 옵션', ['water.waterUnderwaterLight', 'water.waterUnderwaterParticles'])}
              >
                <ToggleRow
                  label="광선"
                  value={!!val(params, 'waterUnderwaterLightShafts')}
                  onChange={(v) => onParam('waterUnderwaterLightShafts', v)}
                  settingId="water.waterUnderwaterLightShafts"
                  info="물을 통과하는 볼류메트릭 빛줄기. 고급 모드에서만 사용 가능."
                />
                <ToggleRow
                  label="부유 입자"
                  value={!!val(params, 'waterUnderwaterParticles')}
                  onChange={(v) => onParam('waterUnderwaterParticles', v)}
                  settingId="water.waterUnderwaterParticles"
                  info="몰입감을 위한 희박한 부유 입자. High 모드 전용."
                />
                {uwResolved !== 'high' && (val(params, 'waterUnderwaterLightShafts') || val(params, 'waterUnderwaterParticles')) && (
                  <p className="section-hint">광선과 파티클은 고품질 모드에서만 렌더링됩니다.</p>
                )}
              </ControlSection>
            )}
          </ControlSection>
        );
      })()}

      {enabled && isPlanet && (
        <ControlSection id={`${id}-planet`} title="행성 바다" defaultOpen={false} settingId="water.section.planet">
          <p className="section-hint">
            Planet uses a spherical ocean shell at sea level. Water colors and animation apply immediately.
            Underwater post-processing is disabled on the planet (curved surface). Realistic depth/foam settings are saved for other modes.
          </p>
        </ControlSection>
      )}

      {selectedRealistic && (
        <ControlSection
          id={`${id}-performance`}
          title="성능 우선"
          defaultOpen={false}
          settingId="water.section.performance"
          forceOpen={forceSection('water.section.performance', '성능 우선', ['water.waterReflectionQuality', 'water.waterUpdateFrequency', 'water.waterRefractionQuality', 'water.waterRenderScale', 'water.waterFoamQuality', 'water.waterCausticsQuality', 'water.waterNormal', 'water.waterDisable'])}
        >
          {mode === 'cinematic' && isStudio && (
            <p className="section-hint warning">Cinematic adds a mirrored scene render for planar reflection — best for Tile mode screenshots.</p>
          )}
          {REALISTIC_PERF_SLIDERS.map((def) => (
            <SliderCtl
              key={def.key}
              def={{
                ...def,
                info: def.expensive
                  ? `${def.info ? `${def.info} ` : ''}May impact FPS.`
                  : def.info,
              }}
              value={val(params, def.key)}
              onChange={(v) => onParam(def.key, v)}
              settingId={`water.${def.key}`}
            />
          ))}
          {selectedSceneRefraction && !isPlanet && REFRACTION_PERF_SLIDERS.map((def) => (
            <SliderCtl
              key={def.key}
              def={{
                ...def,
                info: `${def.info} May impact FPS.`,
              }}
              value={val(params, def.key)}
              onChange={(v) => onParam(def.key, v)}
              settingId={`water.${def.key}`}
            />
          ))}
          {selectedPlanarReflection && (
            <SelectRow
              label="반사 업데이트"
              value={String(val(params, 'waterUpdateFrequency'))}
              options={REFLECTION_UPDATE_OPTIONS}
              onChange={(v) => onParam('waterUpdateFrequency', Number(v))}
              settingId="water.waterUpdateFrequency"
              info="업데이트 사이에 평면 반사를 재사용하여 씬 렌더링 비용을 줄입니다."
            />
          )}
        </ControlSection>
      )}

      <ControlSection
        id={`${id}-debug`}
        title="디버그"
        defaultOpen={false}
        settingId="water.section.debug"
        forceOpen={forceSection('water.section.debug', '디버그', ['water.waterDebug', 'water.waterShow'])}
      >
        <SelectRow
          label="시각 기준 씬"
          value={baselineScene}
          options={WATER_BASELINE_SCENES}
          onChange={setBaselineScene}
          settingId="water.waterBaselineScene"
          info="전후 비교를 위해 고정된 지형, 카메라, 물 프리셋, 시간을 로드합니다."
        />
        <button
          type="button"
          className="action-btn"
          disabled={!!baselineBusy}
          onClick={() => runBaselineAction(onApplyWaterBaselineScene, 'load')}
        >
          {baselineBusy === 'load' ? '기준선 로드 중…' : '기준 씬 불러오기'}
        </button>
        <button
          type="button"
          className="action-btn"
          disabled={!!baselineBusy}
          onClick={() => runBaselineAction(onCaptureWaterBaseline, 'capture')}
        >
          {baselineBusy === 'capture' ? '기준선 캡처 중…' : 'PNG + 지표 캡처 (.zip)'}
        </button>
        <p className="section-hint">
          Capture the same scene on each target GPU. The ZIP records FPS, frame time,
          whole-frame GPU time when available, draw calls, triangles, and water shader compile time.
        </p>
        <SelectRow
          label="물 디버그 뷰"
          value={val(params, 'waterDebugView')}
          options={WATER_DEBUG_VIEWS}
          onChange={(v) => onParam('waterDebugView', v)}
          settingId="water.waterDebugView"
          info="Inspect water inputs and terms on the surface (requires effective Realistic mode)."
        />
        <ToggleRow
          label="물 메쉬 경계 표시"
          value={!!val(params, 'waterShowMeshBounds')}
          onChange={(v) => onParam('waterShowMeshBounds', v)}
          settingId="water.waterShowMeshBounds"
          info="이 월드 모드의 활성 물 메쉬 윤곽선을 표시합니다."
        />
        <ToggleRow
          label="물 성능 비용 표시"
          value={!!val(params, 'waterShowPerfCost')}
          onChange={(v) => onParam('waterShowPerfCost', v)}
          settingId="water.waterShowPerfCost"
        />
        {!!val(params, 'waterShowPerfCost') && waterCost && (
          <div className="section-hint">
            <strong>라이브 워터 비용</strong><br />
            Surface CPU submission: {fmtWaterCostMs(waterCost.surface?.surfaceSubmitAvgMs)}<br />
            Surface GPU: individual timing unavailable · whole frame {gpu?.supported ? fmtWaterCostMs(gpu.frameMs) : 'unavailable'}<br />
            Geometry: {waterCost.surface?.vertices ?? 0} vertices · {waterCost.surface?.triangles ?? 0} triangles<br />
            Opaque refraction: {fmtWaterCostMs(waterCost.refraction?.captureMs)} · {fmtWaterResolution(waterCost.refraction)}<br />
            Planar reflection: {fmtWaterCostMs(waterCost.reflection?.captureMs)} · {fmtWaterResolution(waterCost.reflection)}<br />
            Targets: {fmtWaterMemory(waterCost.renderTargetMemoryBytes)} · {waterCost.additionalSceneRenders ?? 0} extra scene render(s)
          </div>
        )}
        {!effectiveRealistic && (
          <p className="section-hint">셰이더 디버그 보기는 사실(또는 그 이상) 모드가 필요합니다.</p>
        )}
      </ControlSection>

      <ControlSection id={`${id}-export`} title="내보내기" defaultOpen={false} settingId="water.section.export">
        <p className="section-hint">
          {isStudio
            ? 'Export water masks from the tile height field, or use the Export panel for GLB output.'
            : isInfinite
              ? '마스크 내보내기는 현재 절차적 높이 필드를 보드 스케일로 샘플링합니다.'
              : '마스크 내보내기는 가능한 경우 행성 높이 샘플링을 사용합니다. GLB 내보내기에는 해양 셸이 포함됩니다.'}
        </p>
        <button type="button" className="action-btn" onClick={() => onExportWaterMasks?.({ exportWaterMask: true, exportDepthMap: true })}>물 + 깊이 마스크 내보내기</button>
        <button type="button" className="action-btn" onClick={() => onExportWaterMasks?.({ exportShorelineMask: true, exportFoamMask: true })}>해안선 + 거품 마스크 내보내기</button>
      </ControlSection>

      <PanelResetButton label="물 설정 초기화" onClick={onResetWaterSettings} settingId="water.reset" />
    </>
  );

  if (flat) return content;

  return <div className="water-panel-inner">{content}</div>;
}
