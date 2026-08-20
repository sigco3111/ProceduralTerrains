import { Mountain, Waves, Minus, Droplet, Palette, Sprout, Eraser, SlidersHorizontal } from 'lucide-react';

const ICON_SIZE = 19;
const ICON_STROKE = 1.75;

export const PAINT_TOOLS = [
  { id: 'sculpt', label: '스컬프트', icon: Mountain, title: '스컬프트', description: '지형 높이를 직접 올리거나 낮춥니다.' },
  { id: 'smooth', label: '부드러움', icon: Waves, title: '부드러움', description: '이웃 지형을 향해 높이를 혼합하여 디테일을 부드럽게 합니다.' },
  { id: 'flatten', label: '평탄화', icon: Minus, title: '평탄화', description: '고도를 고정된 목표 고도로 혼합합니다.' },
  { id: 'river', label: '강', icon: Droplet, title: '강 깎기', description: 'Carve a river bed with soft banks.' },
  { id: 'biome', label: '생태계', icon: Palette, title: '생태계', description: 'Paint biome influence onto the terrain.' },
  { id: 'mask', label: '마스크', icon: Sprout, title: '마스크', description: 'Paint grass and flower density.' },
  { id: 'erase', label: '지우기', icon: Eraser, title: 'Erase / Reset', description: 'Erase paint back to the procedural terrain, or start over.' },
  { id: 'brush', label: '브러시', icon: SlidersHorizontal, title: 'Brush Settings', description: 'Shape, size and application settings shared by every tool.' },
];

// Vertical icon rail for Paint Mode — mirrors the app's main LeftToolbar/
// toolbar-btn visual language, but drives the paint-specific tool tabs
// instead of the global panel registry.
export default function PaintToolbar({ activeTool, onSelect }) {
  return (
    <nav className="paint-toolbar" aria-label="Paint Tools">
      {PAINT_TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`toolbar-btn${activeTool === id ? ' active' : ''}`}
          title={label}
          aria-label={label}
          aria-pressed={activeTool === id}
          onClick={() => onSelect(id)}
        >
          <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
          <span className="toolbar-btn-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
import React from 'react';

