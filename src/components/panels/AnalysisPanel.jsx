import SidePanel from './SidePanel.jsx';
import { SliderCtl, ToggleRow, SelectRow } from '../controls.jsx';
import { ANALYSIS_LEGENDS } from '../../creator/analysis/TerrainAnalysisManager.js';

export function AnalysisContent({ ctx }) {
  const s = ctx.analysisState || {};
  const patch = (p) => ctx.onAnalysisSettings(p);
  return <>
    <ToggleRow label="분석 표시" value={!!s.enabled} onChange={(v) => patch({ enabled: v })} />
    <SelectRow label="최빈값" value={s.mode || 'elevation'} options={[
      { value: 'elevation', label: '고도' }, { value: 'slope', label: '경사' }, { value: 'normals', label: '법선' }, { value: 'curvature', label: 'Curvature' }, { value: 'waterDepth', label: '물 깊이' }, { value: 'biome', label: 'Biome distribution' }, { value: 'contribution', label: '페인트 + 스플라인 기여' },
    ]} onChange={(v) => ctx.onAnalysisMode(v)} />
    <SelectRow label="표시" value={s.display || 'overlay'} options={[{ value: 'overlay', label: 'Overlay' }, { value: 'replace', label: '대체' }]} onChange={(v) => patch({ display: v, opacity: v === 'replace' ? 1 : s.opacity })} />
    <SliderCtl def={{ key: 'opacity', label: '불투명도', min: 0, max: 1, step: .01, digits: 2 }} value={s.opacity ?? .72} onChange={(v) => patch({ opacity: v })} />
    {(s.mode === 'elevation' || s.mode === 'waterDepth') && <><SliderCtl def={{ key: 'min', label: '최소', min: -300, max: 1000, step: 5, digits: 0 }} value={s.min ?? 0} onChange={(v) => patch({ min: v })} /><SliderCtl def={{ key: 'max', label: '최대', min: 1, max: 2000, step: 5, digits: 0 }} value={s.max ?? 600} onChange={(v) => patch({ max: v })} /></>}
    {s.mode === 'slope' && <><SliderCtl def={{ key: 'thresholdA', label: '걷기 가능', min: 0, max: 70, step: 1, digits: 0 }} value={s.thresholdA ?? 35} onChange={(v) => patch({ thresholdA: v })} /><SliderCtl def={{ key: 'thresholdB', label: '절벽', min: 5, max: 90, step: 1, digits: 0 }} value={s.thresholdB ?? 55} onChange={(v) => patch({ thresholdB: v })} /></>}
    <ToggleRow label="범례 표시" value={s.legend !== false} onChange={(v) => patch({ legend: v })} />
    {s.legend !== false && <p className="section-hint">{ANALYSIS_LEGENDS[s.mode] || ANALYSIS_LEGENDS.elevation}</p>}
  </>;
}

export default function AnalysisPanel({ ctx }) {
  return <SidePanel title="분석" description="Inspect final terrain structure." onClose={ctx.onClose}><AnalysisContent ctx={ctx} /></SidePanel>;
}
import React from 'react';

