import { Settings, X } from 'lucide-react';

const MODE_DISPLAY_OPTIONS = [
  { id: 'both', label: '아이콘 + 이름' },
  { id: 'icons', label: '아이콘만' },
  { id: 'labels', label: '이름만' },
];

/**
 * UI appearance settings — opened from Edit → Settings.
 */
export default function UiSettingsPanel({ open, prefs, onChange, onClose }) {
  if (!open) return null;

  const set = (patch) => onChange({ ...prefs, ...patch });

  return (
    <div className="ui-settings-overlay" role="dialog" aria-modal="true" aria-label="UI 설정">
      <button type="button" className="ui-settings-backdrop" aria-label="설정 닫기" onClick={onClose} />
      <div className="ui-settings-panel">
        <header className="ui-settings-header">
          <div className="ui-settings-heading">
            <Settings size={16} strokeWidth={1.75} aria-hidden className="ui-settings-heading-icon" />
            <div>
              <h2 className="ui-settings-title">설정</h2>
              <p className="ui-settings-desc">인터페이스 모양 및 UI 밀도.</p>
            </div>
          </div>
          <button type="button" className="side-panel-close" onClick={onClose} aria-label="닫기" title="닫기 (Esc)">
            <X size={15} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="ui-settings-body">
          <section className="ui-settings-section">
            <h3 className="ui-settings-section-title">도구 �바</h3>
            <label className="ui-settings-row">
              <span className="ui-settings-row-label">도구 이름 표시</span>
              <input
                type="checkbox"
                checked={!!prefs.toolbarLabels}
                onChange={(e) => set({ toolbarLabels: e.target.checked })}
              />
            </label>
          </section>

          <section className="ui-settings-section">
            <h3 className="ui-settings-section-title">월드 모드</h3>
            <div className="ui-settings-choice-group" role="radiogroup" aria-label="모드 버튼 표시">
              {MODE_DISPLAY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.modeDisplay === opt.id}
                  className={`ui-settings-choice${prefs.modeDisplay === opt.id ? ' active' : ''}`}
                  onClick={() => set({ modeDisplay: opt.id })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="ui-settings-section">
            <h3 className="ui-settings-section-title">뷰포트</h3>
            <label className="ui-settings-row">
              <span className="ui-settings-row-label">카메라 컨트롤 표시</span>
              <input
                type="checkbox"
                checked={prefs.cameraControls !== false}
                onChange={(e) => set({ cameraControls: e.target.checked })}
              />
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

