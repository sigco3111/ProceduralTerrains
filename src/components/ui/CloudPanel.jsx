import React, { useContext } from 'react';
import ControlSection from './ControlSection.jsx';
import { FlatPanelContext } from '../panels/PanelContext.js';
import { shouldForceSectionOpen } from '../panels/sectionUtils.js';
import { SliderCtl, ToggleRow, SelectRow, ColorInput } from '../controls.jsx';
import { colorToHex, parseColor } from '../../engine/style/ColorPalette.js';
import { CLOUD_DEFAULT_PARAMS } from '../../engine/sky/CloudSettings.js';

const SHAPE_SLIDERS = [
  { key: 'cloudCoverage', label: '범위', min: 0, max: 1, step: 0.01, digits: 2, info: '구름으로 덮인 하늘의 비율.' },
  { key: 'cloudDensity', label: '밀도', min: 0.1, max: 3, step: 0.05, digits: 2, info: '구름의 전체 불투명도 / 광학 두께.' },
  { key: 'cloudSoftness', label: '부드러움', min: 0.01, max: 0.6, step: 0.01, digits: 2, info: '커버리지 컷인 위치의 구름 가장자리 부드러움.' },
];

const SHELL_SLIDERS = [
  { key: 'cloudAltitude', label: '고도', min: 0, max: 1500, step: 5, info: 'Height of the cloud layer base. In studio this is an absolute height (0 = ground level), so clouds can sit right at the surface.' },
  { key: 'cloudThickness', label: '두께', min: 80, max: 2500, step: 10, info: '구름 레이어의 수직 두께.' },
];

const NOISE_SLIDERS = [
  { key: 'cloudScale', label: '구름 스케일', min: 0.3, max: 8, step: 0.1, digits: 1, info: '큰 구름 모양의 크기 (값이 낮을수록 더 큼).' },
  { key: 'cloudDetailScale', label: '디테일 스케일', min: 2, max: 24, step: 0.5, digits: 1, info: '중간 스케일 물결의 빈도.' },
  { key: 'cloudDetailStrength', label: '디테일 세기', min: 0, max: 1, step: 0.02, digits: 2, info: '디테일 노이즈가 셰이프를 변조하는 강도.' },
  { key: 'cloudErosionScale', label: '침식 스케일', min: 4, max: 40, step: 0.5, digits: 1, info: '섬세한 가장자리를 깎아내는 워레이 침식의 빈도.' },
  { key: 'cloudErosionStrength', label: '침식 세기', min: 0, max: 1, step: 0.02, digits: 2, info: '침식이 구름을 얼마나 공격적으로 파고드는지.' },
];

const MOTION_SLIDERS = [
  { key: 'cloudWindDir', label: '바람 방향', min: 0, max: 360, step: 1, unit: '°', info: 'Heading the cloud field drifts toward.' },
  { key: 'cloudWindSpeed', label: '바람 속도', min: 0, max: 4, step: 0.05, digits: 2, info: '구름 흐름 속도.' },
  { key: 'cloudRotationSpeed', label: '회전', min: 0, max: 3, step: 0.05, digits: 2, info: 'Slow rotation of the cloud field around the planet axis.' },
  { key: 'cloudEvolveSpeed', label: '진화', min: 0, max: 4, step: 0.05, digits: 2, info: 'How fast clouds form, morph and dissipate in place (0 = static shapes that only drift).' },
];

const LIGHT_SLIDERS = [
  { key: 'cloudLightAbsorption', label: '광 흡수', min: 0.1, max: 3, step: 0.05, digits: 2, info: '구름이 햇빛을 얼마나 흡수하는지 (셰이딩 대비).' },
  { key: 'cloudShadowStrength', label: '그림자 강도', min: 0, max: 1, step: 0.02, digits: 2, info: '자체 그림자가 있는 구름 영역의 어두움입니다.' },
  { key: 'cloudScatteringStrength', label: '산란', min: 0, max: 2, step: 0.05, digits: 2, info: 'Brightness of light scattered toward the camera.' },
  { key: 'cloudAtmosphereInfluence', label: '하늘 영향', min: 0, max: 1, step: 0.02, digits: 2, info: 'How strongly the active sky, sun and atmosphere color the clouds. Zero restores the legacy independent lighting.' },
  { key: 'cloudSunResponse', label: '태양 반응', min: 0, max: 2, step: 0.05, digits: 2, info: '구름이 받는 직사광의 강도.' },
  { key: 'cloudAmbientResponse', label: '주변광 반응', min: 0, max: 2, step: 0.05, digits: 2, info: '천정, 지평선, 지면 반사 조명의 강도.' },
  { key: 'cloudSilverLining', label: '실버 라이닝', min: 0, max: 1, step: 0.01, digits: 2, info: '구름 가장자리를 통해 태양을 바라볼 때 나타나는 방향성 글로우입니다.' },
];

const RESOLUTION_OPTIONS = [
  { value: 'low', label: '낮음 (12단계)' },
  { value: 'medium', label: '중간 (24단계)' },
  { value: 'high', label: '높음 (40단계)' },
  { value: 'ultra', label: '울트라 (72 스텝)' },
  { value: 'custom', label: '사용자 지정' },
];

const FALLBACK_OPTIONS = [
  { value: 'none', label: '전체' },
  { value: 'lite', label: '라이트 (저사양 GPU)' },
  { value: 'off', label: '꺼짐' },
];

const RENDER_SCALE_OPTIONS = [
  { value: '1', label: 'Full res' },
  { value: '0.5', label: '절반 해상도 (디노이즈)' },
  { value: '0.25', label: '4분의 1 해상도' },
];

const COLOR_FIELDS = [
  { key: 'cloudColor', label: '구름 색상', info: '구름 알베도에 태양광과 하늘 조명을 곱한 값입니다.', def: [1, 1, 1] },
  { key: 'cloudShadowColor', label: '그림자 색상', info: '자체 그림자가 있는 구름 영역에만 적용되는 예술적 색조입니다.', def: [0.42, 0.47, 0.6] },
];

function val(params, key) {
  return params[key] ?? CLOUD_DEFAULT_PARAMS[key];
}

export default function CloudPanel({
  params,
  onParam,
  perf,
  onPerfSetting,
  worldMode,
  settingsTarget,
  id = 'inspector-clouds',
  defaultOpen = false,
}) {
  const flat = useContext(FlatPanelContext);
  const enabled = !!params.cloudsEnabled;
  const distInfo = worldMode === 'planet'
    ? '카메라가 이만큼의 행성 반지름보다 멀 때 구름을 숨깁니다.'
    : '카메라가 이만큼의 보드 너비보다 멀리 있을 때 구름을 숨깁니다.';
  const enableInfo = worldMode === 'planet'
    ? '행성 주위의 볼류메트릭 구름 셸을 표시합니다.'
    : (worldMode === 'infinite'
      ? '무한 세계에서 카메라를 따라가는 경계가 있는 볼류메트릭 구름 레이어를 표시합니다.'
      : '타일 어셈블리 위의 볼류메트릭 구름 슬랩을 표시합니다.');
  const p = perf ?? {};
  const currentSteps = p.cloudSteps ?? 12;
  let resolutionName = 'custom';
  if (currentSteps === 8) resolutionName = 'low';
  else if (currentSteps === 12) resolutionName = 'medium';
  else if (currentSteps === 16) resolutionName = 'quality';
  else if (currentSteps === 24) resolutionName = 'high';
  else if (currentSteps === 48) resolutionName = 'ultra';

  const target = settingsTarget?.panelId === 'clouds' ? settingsTarget : null;
  const forceSection = (sectionId, sectionLabel, prefixes = []) =>
    shouldForceSectionOpen(target, sectionId, { sectionLabel, childPrefixes: prefixes });

  const handleResolutionChange = (v) => {
    if (v === 'low') onPerfSetting('cloudSteps', 8);
    else if (v === 'medium') onPerfSetting('cloudSteps', 12);
    else if (v === 'quality') onPerfSetting('cloudSteps', 16);
    else if (v === 'high') onPerfSetting('cloudSteps', 24);
    else if (v === 'ultra') onPerfSetting('cloudSteps', 48);
  };

  const content = (
    <>
      <ToggleRow
        label="구름 활성화"
        value={enabled}
        onChange={(v) => onParam('cloudsEnabled', v)}
        info={enableInfo}
        settingId="clouds.cloudsEnabled"
      />

      {enabled && (
        <>
          <ControlSection
            id={`${id}-shape`}
            title="형태"
            defaultOpen
            settingId="clouds.section.shape"
            forceOpen={forceSection('clouds.section.shape', '형태', ['clouds.cloudCoverage', 'clouds.cloudDensity', 'clouds.cloudSoftness'])}
          >
            {SHAPE_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`clouds.${def.key}`} />
            ))}
          </ControlSection>

          <ControlSection
            id={`${id}-shell`}
            title="셸"
            defaultOpen={false}
            settingId="clouds.section.shell"
            forceOpen={forceSection('clouds.section.shell', '셸', ['clouds.cloudAltitude', 'clouds.cloudThickness'])}
          >
            {SHELL_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`clouds.${def.key}`} />
            ))}
          </ControlSection>

          <ControlSection
            id={`${id}-noise`}
            title="노이즈"
            defaultOpen={false}
            settingId="clouds.section.noise"
            forceOpen={forceSection('clouds.section.noise', '노이즈', ['clouds.cloudScale', 'clouds.cloudDetail', 'clouds.cloudErosion'])}
          >
            {NOISE_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`clouds.${def.key}`} />
            ))}
          </ControlSection>

          <ControlSection
            id={`${id}-motion`}
            title="동작"
            defaultOpen={false}
            settingId="clouds.section.motion"
            forceOpen={forceSection('clouds.section.motion', '동작', ['clouds.cloudWind', 'clouds.cloudRotation', 'clouds.cloudEvolve'])}
          >
            {MOTION_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`clouds.${def.key}`} />
            ))}
          </ControlSection>

          <ControlSection
            id={`${id}-lighting`}
            title="조명"
            defaultOpen={false}
            settingId="clouds.section.lighting"
            forceOpen={forceSection('clouds.section.lighting', '조명', ['clouds.cloudLight', 'clouds.cloudShadow', 'clouds.cloudScattering', 'clouds.cloudColor', 'performance.cloudSelfShadow'])}
          >
            {LIGHT_SLIDERS.map((def) => (
              <SliderCtl key={def.key} def={def} value={val(params, def.key)} onChange={(v) => onParam(def.key, v)} settingId={`clouds.${def.key}`} />
            ))}
            {COLOR_FIELDS.map(({ key, label, info, def }) => (
              <div className="color-field" key={key} data-setting-id={`clouds.${key}`}>
                <div className="label-with-icon" data-tooltip={info}>
                  <span className="setting-label">{label}</span>
                </div>
                <ColorInput
                  value={colorToHex(val(params, key) ?? def)}
                  onChange={(v) => onParam(key, parseColor(v))}
                />
              </div>
            ))}
            <ToggleRow
              label="자체 그림자"
              value={p.cloudSelfShadow !== false}
              onChange={(v) => onPerfSetting('cloudSelfShadow', v)}
              info="부드러운 자체 그림자를 위한 보조 태양 방향 행진 (비용이 더 많이 듭니다). 성능 설정과 공유됩니다."
              settingId="performance.cloudSelfShadow"
            />
          </ControlSection>

          <ControlSection
            id={`${id}-performance`}
            title="성능 우선"
            defaultOpen={false}
            settingId="clouds.section.performance"
            forceOpen={forceSection('clouds.section.performance', '성능 우선', ['performance.cloudSteps', 'performance.cloudFallback', 'performance.cloudMaxDistance'])}
          >
            <SelectRow
              label="해상도"
              value={resolutionName}
              options={RESOLUTION_OPTIONS}
              onChange={handleResolutionChange}
              info="레이마칭 단계 수. 높을수록 매끄러운 구름, FPS 감소. 성능 설정과 공유됩니다."
              settingId="performance.cloudSteps"
            />
            <SelectRow
              label="렌더 스케일"
              value={String(p.cloudRenderScale ?? 1)}
              options={RENDER_SCALE_OPTIONS}
              onChange={(v) => onPerfSetting('cloudRenderScale', parseFloat(v))}
              info="Render clouds at lower resolution, then upscale with a depth-aware (bilateral) filter. Big FPS win since clouds are fill-rate bound; edges stay crisp against terrain and noise is smoothed. Shared with Performance settings."
              settingId="performance.cloudRenderScale"
            />
            <SelectRow
              label="폴백 모드"
              value={p.cloudFallback ?? 'none'}
              options={FALLBACK_OPTIONS}
              onChange={(v) => onPerfSetting('cloudFallback', v)}
              info="Safe modes for weaker devices: Lite caps steps and disables self-shadowing; Off hides clouds."
              settingId="performance.cloudFallback"
            />
            {worldMode !== 'infinite' && (
              <SliderCtl
                def={{ key: 'cloudMaxDistance', label: '최대 거리', min: 1.5, max: 12, step: 0.5, digits: 1, unit: '×', info: distInfo }}
                value={p.cloudMaxDistance ?? 6.0}
                onChange={(v) => onPerfSetting('cloudMaxDistance', v)}
                settingId="performance.cloudMaxDistance"
              />
            )}
          </ControlSection>
        </>
      )}
    </>
  );

  if (flat) return content;

  return (
    <ControlSection
      id={id}
      title="CLOUDS"
      defaultOpen={defaultOpen}
      icon={(
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M4 11.5a2.5 2.5 0 0 1 .4-4.95A3.5 3.5 0 0 1 11.3 6.6a2.5 2.5 0 0 1-.3 4.9H4z" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      )}
    >
      {content}
    </ControlSection>
  );
}
