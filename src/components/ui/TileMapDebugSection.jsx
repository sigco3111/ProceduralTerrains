import { Map } from 'lucide-react';
import CollapsibleGroup from './CollapsibleGroup.jsx';
import { ToggleRow, SelectRow } from '../controls.jsx';

const DEBUG_VIEW_OPTIONS = [
  { value: 'off', label: '꺼짐' },
  { value: 'noise', label: '노이즈 텍스처' },
  { value: 'height', label: '하이맵' },
  { value: 'biome', label: 'Biome Map' },
];

const BIOME_LEGEND = [
  ['#d6b35a', '사막 / 모래'],
  ['#b05f32', '협곡 / 마른 바위'],
  ['#2f9f67', '습지 / 풀'],
  ['#8b8f98', '산맥 / 설산'],
];

function BiomeLegend() {
  return (
    <div className="biome-legend">
      {BIOME_LEGEND.map(([color, label]) => (
        <div className="biome-legend-row" key={label}>
          <span className="biome-legend-swatch" style={{ background: color }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function TileMapDebugSection({ tileDebug, onTileDebug }) {
  const dbg = tileDebug ?? { view: 'off', showLegend: true, opacity: 1, showPreview: true };

  return (
    <CollapsibleGroup
      title="맵 오버레이"
      icon={<Map size={15} strokeWidth={1.75} />}
      defaultOpen={dbg.view !== 'off'}
    >
      <p className="section-hint">저장된 지형 데이터를 변경하지 않고 타일 표면에 내부 지형 맵을 미리 봅니다.</p>
      <SelectRow
        label="디버그 보기"
        value={dbg.view}
        options={DEBUG_VIEW_OPTIONS}
        onChange={(v) => onTileDebug({ view: v })}
        info="Overlays noise, height or biome data directly on the terrain mesh."
      />
      <ToggleRow
        label="Show Legend"
        value={!!dbg.showLegend}
        onChange={(v) => onTileDebug({ showLegend: v })}
      />
      {dbg.view === 'biome' && dbg.showLegend && <BiomeLegend />}
    </CollapsibleGroup>
  );
}
import React from 'react';

