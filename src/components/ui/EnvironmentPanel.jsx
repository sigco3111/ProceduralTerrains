import React, { useContext } from 'react';
import ControlSection from './ControlSection.jsx';
import { FlatPanelContext } from '../panels/PanelContext.js';
import { shouldForceSectionOpen } from '../panels/sectionUtils.js';
import { SliderCtl, ToggleRow, ColorInput } from '../controls.jsx';
import { colorToHex, parseColor } from '../../engine/style/ColorPalette.js';
import { WATER_DEFAULT_PARAMS } from '../../engine/water/WaterSettings.js';

const FOG_SLIDER = {
  key: 'fogDensity',
  label: '안개 밀도',
  min: 0,
  max: 2,
  step: 0.05,
  digits: 2,
  info: '대기 먼지와 안개의 밀도',
  icon: (
    <svg viewBox="0 0 16 16" fill="none">
      <path d="M3 10.5a2.5 2.5 0 0 1 2-4.4 3.5 3.5 0 0 1 6.8 1.1 2.5 2.5 0 0 1-.8 4.8H3z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
};

const SUN_INTENSITY = {
  key: 'sunIntensity',
  label: '태양 강도',
  min: 0.2,
  max: 3,
  step: 0.05,
  digits: 2,
  info: '직사광선의 밝기',
  icon: (
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
};

const CLOUD_SHADOW_OPACITY = {
  key: 'cloudShadowOpacity',
  label: 'Shadow Strength',
  min: 0,
  max: 0.85,
  step: 0.01,
  digits: 2,
  info: 'Darkness of the soft real-time shadows projected by volumetric clouds onto the terrain.',
};

const GOD_RAYS = {
  key: 'visualsSunRaysStrength',
  label: '신의 광선',
  min: 0,
  max: 0.8,
  step: 0.02,
  digits: 2,
  info: 'Screen-space atmospheric light shafts aligned with the active skybox sun.',
};

const WATER_LIGHTING_SLIDERS = [
  {
    key: 'waterAtmosphereInfluence',
    label: 'Sky Influence',
    min: 0,
    max: 1,
    step: 0.02,
    digits: 2,
    info: 'How strongly the active sky, sun, and atmosphere color the water. Zero restores the previous independent water lighting.',
  },
  {
    key: 'waterSunResponse',
    label: '태양 반응',
    min: 0,
    max: 2,
    step: 0.05,
    digits: 2,
    info: 'Strength of direct sunlight received by the water surface and volume.',
  },
  {
    key: 'waterAmbientResponse',
    label: '주변광 반응',
    min: 0,
    max: 2,
    step: 0.05,
    digits: 2,
    info: 'Strength of sky ambient light and ground bounce on the water.',
  },
  {
    key: 'waterFoamLighting',
    label: 'Foam Lighting',
    min: 0,
    max: 1,
    step: 0.01,
    digits: 2,
    info: 'How much foam follows environmental lighting. Lower values keep foam more readable in darkness.',
  },
];

const ATMOSPHERE_COLORS = [
  {
    key: 'skyAmbient',
    label: '하늘 주변광',
    info: 'Color of ambient scattered sky light reflecting onto the terrain',
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M8 3a4 4 0 0 1 4 4H4a4 4 0 0 1 4-4zM2 10h12M4 13h8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  },
  {
    key: 'groundBounce',
    label: '지면 반사',
    info: 'Color of light bouncing from the ground back up into shadowed areas',
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 13h12M4 4l4 6 4-6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    )
  },
];

export default function EnvironmentPanel({ params, planetStyle, onParam, onTuning, settingsTarget }) {
  const flat = useContext(FlatPanelContext);
  const style = planetStyle ?? {};
  const target = settingsTarget?.panelId === 'lighting' ? settingsTarget : null;
  const forceSection = (sectionId, sectionLabel, prefixes = []) =>
    shouldForceSectionOpen(target, sectionId, { sectionLabel, childPrefixes: prefixes });

  const sections = (
    <>
      <ControlSection
        id="inspector-environment-sun"
        title="태양"
        defaultOpen
        settingId="lighting.section.sun"
        forceOpen={forceSection('lighting.section.sun', '태양', ['lighting.sun'])}
      >
        <div className="color-field" data-setting-id="lighting.sunColor">
          <div className="label-with-icon" data-tooltip="직사광선의 색상 틴트">
            <span className="setting-icon">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 2c-2.5 4-5 5-5 8a5 5 0 0 0 10 0c0-3-2.5-4-5-8z" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="setting-label">Sun Color</span>
            <span className="info-icon-trigger">
              <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <ColorInput
            value={colorToHex(style.sunColor ?? [1.0, 0.94, 0.82])}
            onChange={(v) => onTuning('sunColor', parseColor(v))}
          />
        </div>
        <SliderCtl
          def={SUN_INTENSITY}
          value={style.sunIntensity ?? 1.25}
          onChange={(v) => onTuning('sunIntensity', v)}
          settingId="lighting.sunIntensity"
        />
      </ControlSection>

      <ControlSection
        id="inspector-environment-cloud-light"
        title="구름 & 광선"
        defaultOpen={false}
        settingId="lighting.section.clouds"
        forceOpen={forceSection(
          'lighting.section.clouds',
          '구름 & 광선',
          ['lighting.cloudShadows', 'lighting.cloudShadowOpacity', 'lighting.godRays']
        )}
      >
        <ToggleRow
          label="구름 그림자"
          value={!!params.cloudShadowsEnabled}
          onChange={(v) => onParam('cloudShadowsEnabled', v)}
          info="애니메이션 클라우드 필드를 실시간으로 지형 위에 투영합니다. 타일 모드 전용."
          settingId="lighting.cloudShadowsEnabled"
        />
        {params.cloudShadowsEnabled && (
          <SliderCtl
            def={CLOUD_SHADOW_OPACITY}
            value={params.cloudShadowOpacity ?? 0.45}
            onChange={(v) => onParam('cloudShadowOpacity', v)}
            settingId="lighting.cloudShadowOpacity"
          />
        )}
        <SliderCtl
          def={GOD_RAYS}
          value={params.visualsSunRaysStrength ?? 0.22}
          onChange={(v) => onParam('visualsSunRaysStrength', v)}
          settingId="lighting.godRays"
        />
      </ControlSection>

      <ControlSection
        id="inspector-environment-atmosphere"
        title="대기"
        defaultOpen
        settingId="lighting.section.atmosphere"
        forceOpen={forceSection('lighting.section.atmosphere', '대기', ['lighting.fog', 'lighting.skyAmbient', 'lighting.groundBounce'])}
      >
        <SliderCtl
          def={FOG_SLIDER}
          value={params.fogDensity}
          onChange={(v) => onParam('fogDensity', v)}
          settingId="lighting.fogDensity"
        />
        {ATMOSPHERE_COLORS.map(({ key, label, icon, info }) => (
          <div className="color-field" key={key} data-setting-id={`lighting.${key}`}>
            <div className="label-with-icon" data-tooltip={info}>
              {icon && <span className="setting-icon">{icon}</span>}
              <span className="setting-label">{label}</span>
              {info && (
                <span className="info-icon-trigger">
                  <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </div>
            <ColorInput
              value={colorToHex(style[key] ?? [0.5, 0.5, 0.5])}
              onChange={(v) => onTuning(key, parseColor(v))}
            />
          </div>
        ))}
      </ControlSection>

      <ControlSection
        id="inspector-environment-water-lighting"
        title="물 조명"
        defaultOpen={false}
        settingId="lighting.section.waterLighting"
        forceOpen={forceSection(
          'lighting.section.waterLighting',
          '물 조명',
          ['lighting.water']
        )}
      >
        {WATER_LIGHTING_SLIDERS.map((def) => (
          <SliderCtl
            key={def.key}
            def={def}
            value={params[def.key] ?? WATER_DEFAULT_PARAMS[def.key]}
            onChange={(v) => onParam(def.key, v)}
            settingId={`lighting.${def.key}`}
          />
        ))}
        <p className="section-hint">
          Applies to Legacy, Realistic, Volumetric, Cinematic, Infinite World,
          and the Planet ocean.
        </p>
      </ControlSection>
    </>
  );

  if (flat) return sections;

  return (
    <ControlSection
      id="inspector-environment"
      title="ENVIRONMENT"
      defaultOpen
      icon={(
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      )}
    >
      {sections}
    </ControlSection>
  );
}
