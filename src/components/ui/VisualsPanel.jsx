import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PanelTabs } from '../panels/SidePanel.jsx';
import ControlSection from './ControlSection.jsx';
import PanelResetButton from './PanelResetButton.jsx';
import { SliderCtl, ToggleRow, ColorInput } from '../controls.jsx';
import { colorToHex, parseColor } from '../../engine/style/ColorPalette.js';
import { VISUAL_DEFAULT_PARAMS } from '../../engine/render/VisualSettings.js';
import { RENDER_SLIDERS } from '../panels/defs.jsx';

const slider = (key, label, min, max, step, opts = {}) => ({ key, label, min, max, step, ...opts });

const POST_SLIDERS = [
  slider('visualsExposure', '노출', 0.5, 1.8, 0.02, { digits: 2 }),
  slider('visualsContrast', '대비', 0.75, 1.45, 0.02, { digits: 2 }),
  slider('visualsSaturation', '채도', 0.4, 1.6, 0.02, { digits: 2 }),
  slider('visualsVignette', '비네트', 0, 0.65, 0.01, { digits: 2 }),
  slider('visualsBloomStrength', '블룸 세기', 0, 0.9, 0.02, { digits: 2 }),
  slider('visualsBloomThreshold', '블룸 임계값', 0.35, 1.2, 0.02, { digits: 2 }),
];

const SKY_SLIDERS = [
  slider('visualsSkyIntensity', 'HDR 하늘 강도', 0.4, 2.2, 0.02, { digits: 2 }),
  slider('visualsSunGlow', '태양 발광', 0, 2.2, 0.02, { digits: 2 }),
  slider('visualsHorizonGlow', '지평선 글로우', 0, 1.4, 0.02, { digits: 2 }),
];

const TERRAIN_SLIDERS = [
  slider('visualsTerrainColorVariation', '색상 변화', 0, 1, 0.02, { digits: 2 }),
  slider('visualsTerrainHeightDetail', '디테일 높이', 0, 1, 0.02, { digits: 2 }),
  slider('visualsWetShoreStrength', '젖은 해안 세기', 0, 1.2, 0.02, { digits: 2 }),
  slider('visualsRockDetail', '바위 디테일', 0, 1, 0.02, { digits: 2 }),
  slider('visualsSoilDetail', '토양 디테일', 0, 1, 0.02, { digits: 2 }),
  slider('visualsSandDetail', '모래 디테일', 0, 1, 0.02, { digits: 2 }),
];

const SHORE_SLIDERS = [
  slider('visualsFoamBreakup', '거품 해체', 0, 1, 0.02, { digits: 2 }),
  slider('visualsWetSandRange', '젖은 모래 범위', 2, 48, 1, { unit: 'u' }),
  slider('visualsShallowWaterSoftness', '얕은 물 부드러움', 0, 1, 0.02, { digits: 2 }),
];

const VISUALS_TABS = [
  { id: 'post', label: '포스트 FX' },
  { id: 'sky', label: 'HDR 하늘' },
  { id: 'terrain', label: '지형 표면' },
  { id: 'shoreline', label: '해안선' },
  { id: 'camera', label: '카메라 셰이더' },
];

const CAMERA_SLIDERS = {
  pixelResolution: slider('visualsPixelResolution', '가상 해상도', 120, 720, 8, { unit: 'p' }),
  ditheringStrength: slider('visualsDitheringStrength', '디더링 세기', 0, 1, 0.02, { digits: 2 }),
  ditheringLevels: slider('visualsDitheringLevels', '색상 레벨', 2, 32, 1),
  ditheringScale: slider('visualsDitheringScale', '패턴 스케일', 1, 6, 1, { unit: ' px' }),
  crtStrength: slider('visualsCrtStrength', 'CRT 강도', 0, 1, 0.02, { digits: 2 }),
  crtLensBend: slider('visualsCrtLensBend', '렌즈 굴절', 0, 1, 0.02, { digits: 2 }),
  crtLineWidth: slider('visualsCrtLineWidth', '스캔라인 너비', 1, 6, 0.25, { digits: 2, unit: ' px' }),
  chromaticStrength: slider('visualsChromaticAberrationStrength', '색수차 오프셋', 0, 8, 0.1, { digits: 1, unit: ' px' }),
};

function val(params, key) {
  return params[key] ?? VISUAL_DEFAULT_PARAMS[key];
}

function SliderList({ items, params, onParam, disabled, query = '' }) {
  const normalized = query.trim().toLowerCase();
  return items.filter((def) => !normalized || `${def.label} ${def.key}`.toLowerCase().includes(normalized)).map((def) => (
    <SliderCtl
      key={def.key}
      def={def}
      value={val(params, def.key)}
      onChange={(v) => onParam(def.key, v)}
      disabled={disabled}
      disabledTooltip="이 시각 그룹을 활성화하여 설정을 편집합니다."
      settingId={`visuals.${def.key}`}
    />
  ));
}

export default function VisualsPanel({ ctx }) {
  const { params, onParam, settingsTarget } = ctx;
  const tint = val(params, 'visualsAtmosphereTint');
  const [tab, setTab] = useState('post');
  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState({ post: true, sky: true, terrain: true, shoreline: true });
  useEffect(() => {
    const targetTab = settingsTarget?.panelId === 'visuals' ? settingsTarget?.tabId : null;
    if (targetTab && VISUALS_TABS.some((item) => item.id === targetTab)) setTab(targetTab);
  }, [settingsTarget]);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (label, keywords = '') => !normalizedQuery || `${label} ${keywords}`.toLowerCase().includes(normalizedQuery);
  const group = (id, label, keywords, children, tabId = id) => {
    const settingKey = ({ pixelated: 'visualsPixelatedEnabled', dithering: 'visualsDitheringEnabled', crt: 'visualsCrtEnabled', chromatic: 'visualsChromaticAberrationEnabled' })[id];
    const active = settingKey ? !!val(params, settingKey) : enabled[id] !== false;
    const setActive = settingKey
      ? (value) => onParam(settingKey, value)
      : (value) => setEnabled((current) => ({ ...current, [id]: value }));
    return tab === tabId && matches(label, keywords) && (
    <ControlSection id={`visuals-${id}`} title={label} defaultOpen={id === 'post' || id === 'pixelated'} enabled={active} onEnabledChange={setActive}>
      <div className={!active ? 'visuals-section-disabled' : ''}>{children}</div>
    </ControlSection>
    );
  };

  return (
    <>
      <div className="visuals-search-wrap">
        <Search size={14} aria-hidden />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="시각 설정 검색…" aria-label="시각 설정 검색" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="시각 설정 검색 지우기"><X size={13} /></button>}
      </div>

      <PanelTabs active={tab} onChange={setTab} tabs={VISUALS_TABS} />

      {group('post', '포스트 프로세싱', 'post fx exposure contrast saturation vignette bloom rays', (
        <>
          <ToggleRow
            label="포스트 프로세싱"
            value={val(params, 'visualsPostEnabled') !== false}
            onChange={(v) => onParam('visualsPostEnabled', v)}
            settingId="visuals.visualsPostEnabled"
            info="타일 모드 색상 보정, 블룸, 비네팅, 빛줄기."
          />
          <SliderList items={POST_SLIDERS} params={params} onParam={onParam} disabled={enabled.post === false} query={query} />
        </>
      ))}

      {group('sky', 'HDR 하늘', '하늘 hdr 강도 광황 지평선 대기 틴트', (
        <>
          <SliderList items={SKY_SLIDERS} params={params} onParam={onParam} disabled={enabled.sky === false} query={query} />
          <div className="color-field" data-setting-id="visuals.visualsAtmosphereTint">
            <div className="label-with-icon" data-tooltip="절차적 하늘 환경에 적용되는 틴트.">
              <span className="setting-label">대기 색조</span>
            </div>
            <ColorInput
              value={colorToHex(tint)}
              onChange={(v) => onParam('visualsAtmosphereTint', parseColor(v))}
            />
          </div>
        </>
      ))}

      {group('terrain', '지형 표면', '지형 표면 색상 변화 높이 디테일 바위 토양 모래 렌더', (
        <>
          <SliderList items={TERRAIN_SLIDERS} params={params} onParam={onParam} disabled={enabled.terrain === false} query={query} />
          {RENDER_SLIDERS.map((def) => (
            (!normalizedQuery || `${def.label} ${def.key}`.toLowerCase().includes(normalizedQuery)) && <SliderCtl key={def.key} def={def} value={params[def.key]} onChange={(v) => onParam(def.key, v)} disabled={enabled.terrain === false} disabledTooltip="이 시각 그룹을 활성화하여 설정을 편집합니다." settingId={`visuals.${def.key}`} />
          ))}
        </>
      ))}

      {group('shoreline', '해안선', '해안 거품 젖은 모래 얕은 물', (
        <SliderList items={SHORE_SLIDERS} params={params} onParam={onParam} disabled={enabled.shoreline === false} query={query} />
      ))}

      {tab === 'camera' && (
        <>
          {group('pixelated', '픽셀화', 'pixel resolution virtual resolution', (
            <>
          <SliderCtl
            def={CAMERA_SLIDERS.pixelResolution}
            value={val(params, 'visualsPixelResolution')}
            onChange={(v) => onParam('visualsPixelResolution', Math.round(v))}
            settingId="visuals.visualsPixelResolution"
          />
            </>
          ), 'camera')}
          {group('dithering', '디더링', '디더 패턴 색상 단계 강도 스케일', (
            <>
          <ToggleRow
            label="디더링"
            value={!!val(params, 'visualsDitheringEnabled')}
            onChange={(v) => onParam('visualsDitheringEnabled', v)}
            settingId="visuals.visualsDitheringEnabled"
            info="조정 가능한 색상 깊이와 패턴 크기로 보이는 정렬된 4×4 디더링을 적용합니다."
          />
          <SliderCtl
            def={CAMERA_SLIDERS.ditheringStrength}
            value={val(params, 'visualsDitheringStrength')}
            onChange={(v) => onParam('visualsDitheringStrength', v)}
            settingId="visuals.visualsDitheringStrength"
          />
          <SliderCtl
            def={CAMERA_SLIDERS.ditheringLevels}
            value={val(params, 'visualsDitheringLevels')}
            onChange={(v) => onParam('visualsDitheringLevels', Math.round(v))}
            settingId="visuals.visualsDitheringLevels"
          />
          <SliderCtl
            def={CAMERA_SLIDERS.ditheringScale}
            value={val(params, 'visualsDitheringScale')}
            onChange={(v) => onParam('visualsDitheringScale', Math.round(v))}
            settingId="visuals.visualsDitheringScale"
          />
            </>
          ), 'camera')}
          {group('crt', 'CRT', 'crt 스캔라인 렌즈 벤드 아날로그 노이즈', (
            <>
          <ToggleRow
            label="CRT"
            value={!!val(params, 'visualsCrtEnabled')}
            onChange={(v) => onParam('visualsCrtEnabled', v)}
            settingId="visuals.visualsCrtEnabled"
            info="조정 가능한 스캔라인, RGB 마스크, 렌즈 곡률, 아날로그 노이즈, 가장자리 감쇠를 추가합니다."
          />
          <SliderCtl
            def={CAMERA_SLIDERS.crtStrength}
            value={val(params, 'visualsCrtStrength')}
            onChange={(v) => onParam('visualsCrtStrength', v)}
            settingId="visuals.visualsCrtStrength"
          />
          <SliderCtl
            def={CAMERA_SLIDERS.crtLensBend}
            value={val(params, 'visualsCrtLensBend')}
            onChange={(v) => onParam('visualsCrtLensBend', v)}
            settingId="visuals.visualsCrtLensBend"
          />
          <SliderCtl
            def={CAMERA_SLIDERS.crtLineWidth}
            value={val(params, 'visualsCrtLineWidth')}
            onChange={(v) => onParam('visualsCrtLineWidth', v)}
            settingId="visuals.visualsCrtLineWidth"
          />
            </>
          ), 'camera')}
          {group('chromatic', '색수차', '색수차 오프셋 rgb 채널 렌즈 가장자리', (
            <>
          <ToggleRow
            label="색수차"
            value={!!val(params, 'visualsChromaticAberrationEnabled')}
            onChange={(v) => onParam('visualsChromaticAberrationEnabled', v)}
            settingId="visuals.visualsChromaticAberrationEnabled"
            info="렌즈 가장자리를 향해 빨간색과 파란색 채널을 분리하고 다른 모든 카메라 셰이더와 결합합니다."
          />
          <SliderCtl
            def={CAMERA_SLIDERS.chromaticStrength}
            value={val(params, 'visualsChromaticAberrationStrength')}
            onChange={(v) => onParam('visualsChromaticAberrationStrength', v)}
            settingId="visuals.visualsChromaticAberrationStrength"
          />
            </>
          ), 'camera')}
        </>
      )}

      <PanelResetButton label="시각 설정 초기화" onClick={() => ctx.onResetPanel?.('visuals')} settingId="visuals.reset" />
    </>
  );
}
