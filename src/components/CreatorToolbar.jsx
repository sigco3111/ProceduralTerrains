import { Route } from 'lucide-react';

export default function CreatorToolbar({ active, onToggle }) {
  return (
    <div className="creator-toolbar" role="toolbar" aria-label="크리에이터 도구">
      <div className="creator-toolbar-popover" role="tooltip">
        <strong>스플라인 편집기</strong>
        <span>지형 위에 편집 가능한 도로와 강을 그리세요.</span>
        <kbd>S</kbd>
      </div>
      <button
        type="button"
        className={`creator-toolbar-btn${active ? ' active' : ''}`}
        onClick={onToggle}
        title="스플라인 편집기 토글 (S)"
        aria-label="스플라인 에디터 토글"
        aria-pressed={active}
      >
        <Route size={16} strokeWidth={1.9} aria-hidden />
      </button>
    </div>
  );
}
import React from 'react';

