import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Compass } from 'lucide-react';

export default function BottomToolbar({ camMode, onTopDown, onAngled, onResetCamera, exploreMode, onExploreMode }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const exploring = exploreMode === 'walk' || exploreMode === 'plane';

  useEffect(() => {
    if (!open) return undefined;
    const placeMenu = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    const onPointerDown = (e) => {
      const target = e.target;
      if (!wrapRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    placeMenu();
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open]);

  const select = (mode) => {
    onExploreMode(mode);
    setOpen(false);
  };

  return (
    <div className="viewport-camera-bar" role="toolbar" aria-label="카메라 보기">
      <button
        type="button"
        className={`camera-bar-btn${camMode === 'topdown' ? ' active' : ''}`}
        onClick={onTopDown}
        aria-label="위에서 보기"
        title="위에서 보기"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 7h10M7 3v10" stroke="currentColor" strokeWidth="0.8" opacity=".6" />
        </svg>
        <span className="camera-bar-label">위에서 보기</span>
      </button>
      <button
        type="button"
        className={`camera-bar-btn${camMode !== 'topdown' ? ' active' : ''}`}
        onClick={onAngled}
        aria-label="비스듬한 시점"
        title="비스듬한 시점"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M2 11 8 4l6 7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M2 11h12" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="camera-bar-label">비스듬히</span>
      </button>
      <button
        type="button"
        className="camera-bar-btn"
        onClick={onResetCamera}
        aria-label="카메라 초기화"
        title="카메라 초기화"
      >
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" />
        </svg>
        <span className="camera-bar-label">카메라 리셋</span>
      </button>

      <div className="explore-menu-wrap" ref={wrapRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`camera-bar-btn explore-menu-trigger${exploring ? ' active' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="탐험 모드"
          aria-haspopup="menu"
          aria-expanded={open}
          title="걷기 또는 비행기로 지형 탐험"
        >
          <Compass aria-hidden size={14} strokeWidth={1.9} />
          <span className="camera-bar-label">탐험</span>
          <ChevronUp className={`explore-chevron${open ? ' open' : ''}`} aria-hidden size={12} strokeWidth={2} />
        </button>
        {open && menuStyle && createPortal(
          <div
            ref={menuRef}
            className="explore-menu"
            style={{ left: menuStyle.left, bottom: menuStyle.bottom }}
            role="menu"
            aria-label="탐험 모드"
          >
            <button
              type="button"
              className={`explore-menu-item${exploreMode === 'walk' ? ' active' : ''}`}
              onClick={() => select('walk')}
              role="menuitem"
            >걷기</button>
            <button
              type="button"
              className={`explore-menu-item${exploreMode === 'plane' ? ' active' : ''}`}
              onClick={() => select('plane')}
              role="menuitem"
            >비행기</button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
