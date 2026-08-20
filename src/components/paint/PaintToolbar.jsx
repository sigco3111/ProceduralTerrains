import { Mountain, Waves, Minus, Droplet, Palette, Sprout, Eraser, SlidersHorizontal } from 'lucide-react';

const ICON_SIZE = 19;
const ICON_STROKE = 1.75;

export const PAINT_TOOLS = [
  { id: 'sculpt', label: '스컬프트', icon: Mountain, title: '스컬프트', description: '지형 높이를 직접 올리거나 낮춥니다.' },
  { id: 'smooth', label: '부드러움', icon: Waves, title: '부드러움', description: '이웃 지형을 향해 높이를 혼합하여 디테일을 부드럽게 합니다.' },
  { id: 'flatten', label: '평탄화', icon: Minus, title: '평탄화', description: '고도를 고정된 목표 고도로 혼합합니다.' },
  { id: 'river', label: '강', icon: Droplet, title: '강 깎기', description: 'Carve a river bed with soft banks.' },
  { id: 'biome', label: '생태계', icon: Palette, title: '생태계', description: '지형에 바이옴 영향을 페인트합니다.' },
  { id: 'mask', label: '마스크', icon: Sprout, title: '마스크', description: '풀과 꽃 밀도를 페인트합니다.' },
  { id: 'erase', label: '지우기', icon: Eraser, title: '지우기 / 초기화', description: '절차적 지형으로 페인트를 지우거나 처음부터 다시 시작합니다.' },
  { id: 'brush', label: '브러시', icon: SlidersHorizontal, title: '브러시 설정', description: '모든 도구가 공유하는 모양, 크기 및 적용 설정.' },
];

// Vertical icon rail for Paint Mode — mirrors the app's main LeftToolbar/
// toolbar-btn visual language, but drives the paint-specific tool tabs
// instead of the global panel registry.
export default function PaintToolbar({ activeTool, onSelect }) {
  return (
    <nav className="paint-toolbar" aria-label="페인트 도구">
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

