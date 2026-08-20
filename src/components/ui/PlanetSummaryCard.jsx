import { PRESETS } from '../../engine/presets.js';
import { PLANET_PRESETS } from '../../engine/style/PlanetPresets.js';
import { COLOR_PALETTE_PRESETS } from '../../engine/style/ColorPalettePresets.js';
import ControlSection from './ControlSection.jsx';

export default function PlanetSummaryCard({ params }) {
  const terrainLabel = PRESETS[params.preset]?.label ?? params.preset;
  const planetLabel = PLANET_PRESETS[params.planetPreset]?.label ?? params.planetPreset;
  const paletteLabel = COLOR_PALETTE_PRESETS[params.palettePreset]?.label
    ?? (params.palettePreset === 'custom' ? '사용자 지정' : params.palettePreset);

  return (
    <ControlSection
      id="inspector-planet-summary"
      title="PLANET SUMMARY"
      defaultOpen={false}
      icon={(
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 8h11" stroke="currentColor" strokeWidth="0.9" />
        </svg>
      )}
    >
      <div className="stat-row" data-tooltip="월드에 전역 스타일링 구성 프리셋 적용">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 10c2.5-1 9.5-1 12 0" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">행성 스타일</span>
        </div>
        <span className="stat-value">{planetLabel}</span>
      </div>
      <div className="stat-row" data-tooltip="색상 팔레트 프리셋이 높이 대역 / 바이옴에 적용됨">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 2a6 6 0 1 0 6 6c0-.8-.7-1.5-1.5-1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 0 8 2z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor" />
              <circle cx="5.5" cy="9.5" r="1.1" fill="currentColor" />
              <circle cx="9.5" cy="9.5" r="1.1" fill="currentColor" />
            </svg>
          </span>
          <span className="setting-label">팔레트</span>
        </div>
        <span className="stat-value">{paletteLabel}</span>
      </div>
      <div className="stat-row" data-tooltip="지형 윤곽을 형성하는 기본 지질 프리셋 모델">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1.5 12l4-7 3.5 5 2.5-3.5 3 5.5h-13z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="setting-label">지형 유형</span>
        </div>
        <span className="stat-value">{terrainLabel}</span>
      </div>
      <div className="stat-row" data-tooltip="깊은 물과 얕은 물 바이옴이 렌더링되는 높이 스케일 오프셋">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1 9c1.5-1 2.5-1 4 0s2.5 1 4 0 2.5-1 4 0 2.5 1 3 0" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">해수면</span>
        </div>
        <span className="stat-value stat-mono">{params.seaLevel} m</span>
      </div>
      <div className="stat-row" data-tooltip="절차적 높이 생성기 디테일 노이즈 패턴 프리셋">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1 9c2.5-3 3.5-3 5 0s2.5 3 5 0 2.5-3 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="setting-label">노이즈 스타일</span>
        </div>
        <span className="stat-value">{params.noisePreset ?? 'default'}</span>
      </div>
    </ControlSection>
  );
}
import React from 'react';

