import React, { useState } from 'react';
import { SelectRow, SliderCtl } from '../controls.jsx';
import SidePanel from '../panels/SidePanel.jsx';
import PaintToolbar, { PAINT_TOOLS } from './PaintToolbar.jsx';

const BIOME_OPTIONS = [
  { value: 'desert', label: '사막' },
  { value: 'canyon', label: '협곡' },
  { value: 'wetland', label: '습지' },
  { value: 'mountains', label: '산맥' },
];

const BRUSH_SHAPE_OPTIONS = [
  { value: 'round', label: '라운드' },
  { value: 'ellipse', label: '타원' },
  { value: 'organic', label: '유기적' },
  { value: 'scatter', label: '산포' },
  { value: 'ribbon', label: '리본' },
];

const PROP_OPTIONS = [
  { value: 'mixed', label: '혼합 잔디 + 꽃' },
  { value: 'grass', label: '잔디' },
  { value: 'flowers', label: '꽃' },
  { value: 'eraseProps', label: '소품 지우기' },
];

const SCULPT_DIRECTION_OPTIONS = [
  { value: 'raise', label: '올리기' },
  { value: 'lower', label: '더 낮음' },
];

const BASE_MODE_OPTIONS = [
  { value: 'generated', label: '생성된 지형' },
  { value: 'flat', label: '평지 (빈 지형)' },
];

const defs = {
  brushSize: { label: '브러시 크기', min: 4, max: 900, step: 1, digits: 0, unit: ' u' },
  strength: { label: '세기', min: 0.01, max: 1, step: 0.01, digits: 2 },
  falloff: { label: '감쇠', min: 0, max: 1, step: 0.01, digits: 2 },
  brushRotation: { label: '브러시 회전', min: -180, max: 180, step: 1, digits: 0, unit: ' 도' },
  brushScatter: { label: '산포 양', min: 0.05, max: 1, step: 0.01, digits: 2 },
  brushSpacing: { label: '스트로크 간격', min: 0.08, max: 1, step: 0.01, digits: 2 },
  targetHeight: { label: '타겟 높이', min: -120, max: 900, step: 1, digits: 0, unit: ' u' },
  riverDepth: { label: '강 깊이', min: 1, max: 220, step: 1, digits: 0, unit: ' u' },
  riverBankSoftness: { label: '둑 부드러움', min: 0.05, max: 1, step: 0.01, digits: 2 },
  layerOpacity: { label: '레이어 불투명도', min: 0, max: 1, step: 0.01, digits: 2 },
};

// Which paint tab a given PaintModeManager `tool` value belongs to, so
// reopening the panel (or reacting to Shift+scroll etc.) shows the right tab.
function panelForTool(tool) {
  switch (tool) {
    case 'raise': case 'lower': return 'sculpt';
    case 'smooth': return 'smooth';
    case 'flatten': case 'setHeight': return 'flatten';
    case 'riverCarve': return 'river';
    case 'biome': return 'biome';
    case 'propsPaint': return 'mask';
    case 'erase': return 'erase';
    default: return 'sculpt';
  }
}

// Which `tool` value a tab activates when selected (brush settings doesn't
// have one — it just changes what's shown, not what a stroke does).
function toolForPanel(id, state) {
  switch (id) {
    case 'sculpt': return state.tool === 'lower' ? 'lower' : 'raise';
    case 'smooth': return 'smooth';
    case 'flatten': return 'flatten';
    case 'river': return 'riverCarve';
    case 'biome': return 'biome';
    case 'mask': return 'propsPaint';
    case 'erase': return 'erase';
    default: return null;
  }
}

export default function PaintPanel({ paintState, onSetting, onClear, onSetBaseMode, onStartEmpty, onExit }) {
  const state = paintState ?? {};
  const set = (key) => (value) => onSetting(key, value);
  const [activeTool, setActiveTool] = useState(() => panelForTool(state.tool));

  const selectTool = (id) => {
    setActiveTool(id);
    const toolValue = toolForPanel(id, state);
    if (toolValue) onSetting('tool', toolValue);
  };

  const meta = PAINT_TOOLS.find((t) => t.id === activeTool) ?? PAINT_TOOLS[0];

  return (
    <>
      <PaintToolbar activeTool={activeTool} onSelect={selectTool} />
      <aside className="paint-panel side-drawer open">
        <SidePanel title={meta.title} description={meta.description} onClose={onExit}>
          {activeTool === 'sculpt' && (
            <div className="paint-section">
              <SelectRow label="방향" value={state.tool === 'lower' ? 'lower' : 'raise'} options={SCULPT_DIRECTION_OPTIONS} onChange={set('tool')} />
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'smooth' && (
            <div className="paint-section">
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'flatten' && (
            <div className="paint-section">
              <SliderCtl def={defs.targetHeight} value={state.targetHeight ?? 120} onChange={set('targetHeight')} />
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'river' && (
            <div className="paint-section">
              <SliderCtl def={defs.riverDepth} value={state.riverDepth ?? 28} onChange={set('riverDepth')} />
              <SliderCtl def={defs.riverBankSoftness} value={state.riverBankSoftness ?? 0.65} onChange={set('riverBankSoftness')} />
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'biome' && (
            <div className="paint-section">
              <SelectRow label="생태계" value={state.biome ?? 'desert'} options={BIOME_OPTIONS} onChange={set('biome')} />
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'mask' && (
            <div className="paint-section">
              <SelectRow label="마스크" value={state.propType ?? 'mixed'} options={PROP_OPTIONS} onChange={set('propType')} />
              <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
            </div>
          )}

          {activeTool === 'erase' && (
            <>
              <div className="paint-section">
                <SliderCtl def={defs.strength} value={state.strength ?? 0.35} onChange={set('strength')} />
                <button className="wide-btn danger" type="button" onClick={onClear}>페인팅된 레이어 지우기</button>
              </div>
              <div className="paint-section">
                <div className="subsection-label">지형 베이스</div>
                <SelectRow label="기본" value={state.baseMode ?? 'generated'} options={BASE_MODE_OPTIONS} onChange={onSetBaseMode} />
                <button className="wide-btn danger" type="button" onClick={onStartEmpty}>빈 지형 시작</button>
                <p className="section-hint">
                  <b>기본</b>기존 스트로크를 건드리지 않고 페인트 중인 위쪽 레이어를 교체합니다.<b>빈 지형 시작</b>보드를 평평하게 만들고 모든 페인트 레이어를 지워 새 시작을 준비합니다.</p>
              </div>
            </>
          )}

          {activeTool === 'brush' && (
            <div className="paint-section">
              <SelectRow label="브러시 형태" value={state.brushShape ?? 'round'} options={BRUSH_SHAPE_OPTIONS} onChange={set('brushShape')} />
              <SliderCtl def={defs.brushSize} value={state.brushSize ?? 90} onChange={set('brushSize')} />
              <SliderCtl def={defs.falloff} value={state.falloff ?? 0.75} onChange={set('falloff')} />
              {(state.brushShape === 'ellipse' || state.brushShape === 'ribbon') && (
                <SliderCtl def={defs.brushRotation} value={state.brushRotation ?? 0} onChange={set('brushRotation')} />
              )}
              {(state.brushShape === 'scatter') && (
                <SliderCtl def={defs.brushScatter} value={state.brushScatter ?? 0.55} onChange={set('brushScatter')} />
              )}
              <SliderCtl def={defs.brushSpacing} value={state.brushSpacing ?? 0.35} onChange={set('brushSpacing')} />
              <SliderCtl def={defs.layerOpacity} value={state.layerOpacity ?? 1} onChange={set('layerOpacity')} />
              <p className="section-hint">누르고 있기<b>시프트</b>후 스크롤하여 브러시 크기를 조정합니다. 우클릭 드래그는 여전히 스튜디오 카메라를 궤도 회전시킵니다.</p>
            </div>
          )}
        </SidePanel>
      </aside>
    </>
  );
}
