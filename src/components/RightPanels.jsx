import React, { useEffect, useRef, useState } from 'react';
import ControlSection from './ui/ControlSection.jsx';
import { ToggleRow } from './controls.jsx';

const LOD_LEVELS = [
  { name: 'LOD 0 고해상도', color: '#e5484d' },
  { name: 'LOD 1 중간', color: '#f5a524' },
  { name: 'LOD 2 낮음', color: '#f5d90a' },
  { name: 'LOD 3 최저', color: '#3b82f6' },
];

function lodLabel(count) {
  const side = Math.sqrt(count);
  return Number.isInteger(side) && count > 0 ? `${side} × ${side}` : `${count}`;
}

function LodDonut({ counts }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rOut = canvas.width / 2 - 4;
    const rIn = rOut * 0.58;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let angle = -Math.PI / 2;
    counts.forEach((count, i) => {
      if (!count) return;
      const sweep = (count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, angle, angle + sweep);
      ctx.arc(cx, cy, rIn, angle + sweep, angle, true);
      ctx.closePath();
      ctx.fillStyle = LOD_LEVELS[i].color;
      ctx.fill();
      angle += sweep;
    });
  }, [counts]);
  return <canvas className="lod-donut" width="120" height="120" ref={ref} />;
}

export function CameraPanel({ camInfo, camMode, onMode, onFov, onFocusCenter, embedded }) {
  const [fov, setFov] = useState(45);
  const commitFov = () => {
    const v = Math.min(Math.max(parseFloat(fov) || 45, 20), 90);
    setFov(v);
    onFov(v);
  };

  const body = (
    <>
      <div className="row">
        <div className="label-with-icon" data-tooltip="카메라 이동 스타일: 타겟 주위 공전 또는 위에서 아래로 보는 직교 뷰">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">최빈값</span>
          <span className="info-icon-trigger">
            <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <select value={camMode} onChange={(e) => onMode(e.target.value)}>
          <option value="orbit">궤도</option>
          <option value="topdown">위에서 보기</option>
        </select>
      </div>
      <div className="row">
        <div className="label-with-icon" data-tooltip="투시 카메라의 시야각 (20-90°)">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2 14l6-6-6-6M14 2v12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">시야각</span>
          <span className="info-icon-trigger">
            <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <input
          type="number"
          min="20"
          max="90"
          step="1"
          value={fov}
          onChange={(e) => setFov(e.target.value)}
          onBlur={commitFov}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      </div>
      <div className="row">
        <div className="label-with-icon" data-tooltip="현재 카메라 궤도 기울기 각도">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M14 8A6 6 0 0 0 2 8" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8l4.5-4.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">각도</span>
          <span className="info-icon-trigger">
            <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <input type="text" readOnly value={camInfo.angle} />
      </div>
      <div className="row">
        <div className="label-with-icon" data-tooltip="카메라 초점 중심으로부터의 현재 거리">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1 8h14M3 5l-2 3 2 3M13 5l2 3-2 3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">거리</span>
          <span className="info-icon-trigger">
            <svg viewBox="0 0 16 16" fill="none" width="10" height="10" style={{ marginLeft: '4px' }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 11V8M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <input type="text" readOnly value={camInfo.distance} />
      </div>
      <button type="button" className="action-btn" onClick={onFocusCenter} data-tooltip="카메라 타겟을 월드 좌표 원점으로 다시 스�">
        <svg viewBox="0 0 16 16" className="bic">
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <path d="M8 1.5v2.6M8 11.9v2.6M1.5 8h2.6M11.9 8h2.6" stroke="currentColor" strokeWidth="1.2" />
        </svg>포커스 중앙</button>
    </>
  );

  if (embedded) {
    return (
      <ControlSection
        id="inspector-camera"
        title="카메라"
        defaultOpen
        icon={(
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M2 5h3l1.5-2h3L11 5h3v7H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        )}
      >
        {body}
      </ControlSection>
    );
  }

  return (
    <section className="panel" id="camera-panel">
      <div className="panel-header"><span>카메라</span></div>
      <div className="panel-body">{body}</div>
    </section>
  );
}

export function LodPanel({
  lodCounts,
  chunkCount,
  visibleChunks = 0,
  culledChunks = 0,
  cullingEnabled = true,
  behindCameraCulling = true,
  onCullingEnabled,
  onBehindCameraCulling,
  embedded
}) {
  const total = lodCounts.reduce((a, b) => a + b, 0);

  const body = (
    <>
      {LOD_LEVELS.map((level, i) => (
        <div className="lod-row" key={level.name} data-tooltip={`${level.name === 'LOD 0 High' ? 'Maximum geometric resolution for chunks close to the camera' : level.name === 'LOD 1 Medium' ? 'Balanced resolution for medium-distance terrain' : level.name === 'LOD 2 Low' ? 'Low resolution for far terrain chunks to save memory' : 'Minimal grid density for chunks near the horizon'}`}>
          <span className="lod-dot" style={{ background: level.color }} />
          <span className="lod-name">{level.name}</span>
          <span className="lod-count">{lodLabel(lodCounts[i])}</span>
        </div>
      ))}
      <div className="stat-row" data-tooltip="현재 카메라 뷰 내부에 보이는 청크 수">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">표시 중인 청크</span>
        </div>
        <span className="stat-value stat-mono">{visibleChunks} / {total}</span>
      </div>
      <div className="stat-row" data-tooltip="카메라 뷰 밖에 있거나 카메라 뒤에 있어 컬링(숨김)된 청크 수">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2.5 13.5l11-11M1.5 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">컬링된 청크</span>
        </div>
        <span className={`stat-value stat-mono${culledChunks > 0 ? ' fps-info-culled' : ''}`}>{culledChunks}</span>
      </div>
      <div className="stat-row" data-tooltip="렌더링된 청크 그리드의 현재 크기">
        <div className="label-with-icon">
          <span className="setting-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2 2h4v4H2zM10 2h4v4h-4zM2 10h4v4H2zM10 10h4v4h-4z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="setting-label">활성 그리드</span>
        </div>
        <span className="stat-value stat-mono">{chunkCount} × {chunkCount}</span>
      </div>
      <div className="lod-summary">
        <LodDonut counts={lodCounts} />
        <div className="lod-total" data-tooltip="메모리에 로드된 총 청크 수">
          <div className="lod-total-num">{total}</div>
          <div className="lod-total-label">총 청크 수<span className="lod-grid-label">({chunkCount} × {chunkCount})</span>
          </div>
        </div>
      </div>
      <div className="culling-controls" style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <ToggleRow
          label="프러스텀 컬링"
          value={cullingEnabled}
          onChange={onCullingEnabled}
          info="성능 절약을 위해 카메라 시야 밖의 청크 숨기기"
        />
        <ToggleRow
          label="백 컬링"
          value={behindCameraCulling}
          onChange={onBehindCameraCulling}
          info="성능 향상을 위해 카메라 시점 뒤쪽 청크 숨기기"
        />
      </div>
    </>
  );

  if (embedded) {
    return (
      <ControlSection
        id="inspector-lod"
        title="LOD 정보"
        defaultOpen={false}
        icon={(
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
            <rect x="9" y="5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
            <rect x="5" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        )}
      >
        {body}
      </ControlSection>
    );
  }

  return (
    <section className="panel" id="lod-panel">
      <div className="panel-header"><span>LOD 정보</span></div>
      <div className="panel-body">{body}</div>
    </section>
  );
}

export function MinimapPanel({ boardSize, baseRef, overlayRef, embedded }) {
  const body = (
    <>
      <div className="minimap-wrap">
        <canvas className="minimap-base" width="256" height="256" ref={baseRef} />
        <canvas className="minimap-overlay" width="256" height="256" ref={overlayRef} />
      </div>
      <div className="minimap-caption" data-tooltip="지형 좌표 단위 기준 전체 맵 크기">
        <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent)' }}>
          <path d="M1 3l4.5-2v12L1 15V3zM5.5 1l5 2v12l-5-2V1zM10.5 3L15 1v12l-4.5 2V3z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        Board: {boardSize} × {boardSize} units
      </div>
    </>
  );

  if (embedded) {
    return (
      <ControlSection
        id="inspector-minimap"
        title="미니맵"
        defaultOpen
        icon={(
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="5" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      >
        {body}
      </ControlSection>
    );
  }

  return (
    <section className="panel" id="minimap-panel">
      <div className="panel-header"><span>미니맵</span></div>
      <div className="panel-body">{body}</div>
    </section>
  );
}
