import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Check, LoaderCircle, Mountain, Shapes, X } from 'lucide-react';

const projectMode = (project) => project?.terrain?.editorMode === 'nodes' ? 'nodes' : 'procedural';

const relativeTime = (value) => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '알 수 없는 날짜';
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 45) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
};

export default function ManualTerrainImportDialog({
  open,
  projects = [],
  loading = false,
  busy = false,
  onClose,
  onImport,
}) {
  const [mode, setMode] = useState('procedural');
  const [selectedId, setSelectedId] = useState('');
  const dialogRef = useRef(null);
  const counts = useMemo(() => ({
    procedural: projects.filter((project) => projectMode(project) === 'procedural').length,
    nodes: projects.filter((project) => projectMode(project) === 'nodes').length,
  }), [projects]);
  const visibleProjects = useMemo(
    () => projects.filter((project) => projectMode(project) === mode),
    [mode, projects],
  );
  const selectedProject = projects.find((project) => project.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) return;
    const preferredMode = counts.procedural > 0 || counts.nodes === 0 ? 'procedural' : 'nodes';
    setMode(preferredMode);
    const first = projects.find((project) => projectMode(project) === preferredMode);
    setSelectedId(first?.id ?? '');
    window.requestAnimationFrame(() => dialogRef.current?.focus());
  }, [counts.nodes, counts.procedural, open, projects]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose, open]);

  useEffect(() => {
    if (!open || visibleProjects.some((project) => project.id === selectedId)) return;
    setSelectedId(visibleProjects[0]?.id ?? '');
  }, [open, selectedId, visibleProjects]);

  if (!open) return null;

  return (
    <div
      className="manual-import-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose?.()}
    >
      <form
        ref={dialogRef}
        className="manual-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-import-title"
        tabIndex={-1}
        onSubmit={(event) => {
          event.preventDefault();
          if (selectedProject && !busy) onImport?.(selectedProject);
        }}
      >
        <header className="manual-import-header">
          <span className="manual-import-header-icon"><Shapes size={20} aria-hidden /></span>
          <span>
            <h2 id="manual-import-title">지형 가져오기</h2>
            <p>이 수동 지형의 편집 가능한 기반으로 사용할 타일 프로젝트를 선택하세요.</p>
          </span>
          <button type="button" onClick={onClose} disabled={busy} aria-label="지형 가져오기 닫기">
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="manual-import-mode-tabs" role="tablist" aria-label="지형 소스 종류">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'procedural'}
            className={mode === 'procedural' ? 'active' : ''}
            onClick={() => setMode('procedural')}
          >
            <Mountain size={16} aria-hidden />
            <span><strong>절차적</strong><small>노이즈 스택 및 시드</small></span>
            <em>{counts.procedural}</em>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'nodes'}
            className={mode === 'nodes' ? 'active' : ''}
            onClick={() => setMode('nodes')}
          >
            <Boxes size={16} aria-hidden />
            <span><strong>노드</strong><small>그래프 및 뷰포트</small></span>
            <em>{counts.nodes}</em>
          </button>
        </div>

        <div className="manual-import-projects" role="listbox" aria-label={`${mode === 'nodes' ? 'Nodes' : 'Procedural'} terrain projects`}>
          {loading ? (
            <div className="manual-import-empty"><LoaderCircle className="spin" size={22} aria-hidden /><strong>Loading projects…</strong></div>
          ) : visibleProjects.length ? visibleProjects.map((project) => {
            const selected = project.id === selectedId;
            const tileCount = Array.isArray(project.terrain?.tiles) ? project.terrain.tiles.length : 1;
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`manual-import-project${selected ? ' selected' : ''}`}
                onClick={() => setSelectedId(project.id)}
              >
                <span className="manual-import-thumb">
                  {project.metadata?.thumbnail
                    ? <img src={project.metadata.thumbnail} alt="" />
                    : mode === 'nodes' ? <Boxes size={24} aria-hidden /> : <Mountain size={24} aria-hidden />}
                </span>
                <span className="manual-import-project-copy">
                  <strong>{project.metadata?.name || '이름 없는 지형'}</strong>
                  <small>{tileCount} {tileCount === 1 ? 'tile' : 'tiles'} · {relativeTime(project.metadata?.modified)}</small>
                </span>
                <span className="manual-import-check">{selected ? <Check size={15} aria-hidden /> : null}</span>
              </button>
            );
          }) : (
            <div className="manual-import-empty">
              {mode === 'nodes' ? <Boxes size={24} aria-hidden /> : <Mountain size={24} aria-hidden />}
              <strong>No {mode === 'nodes' ? '노드' : '절차적'} Tile projects</strong>
              <span>먼저 프로젝트를 만들거나 저장한 다음 여기로 돌아와서 가져오세요.</span>
            </div>
          )}
        </div>

        <div className="manual-import-note">
          Your Manual shapes, sculpting and surface paint stay in place. The selected terrain’s generator, Paint, splines and erosion become the new base.
        </div>

        <footer>
          <button type="button" className="manual-import-cancel" onClick={onClose} disabled={busy}>취소</button>
          <button type="submit" className="manual-import-confirm" disabled={!selectedProject || loading || busy}>
            {busy ? <><LoaderCircle className="spin" size={14} aria-hidden /> 가져오는 중…</> : '선택한 지형 가져오기'}
          </button>
        </footer>
      </form>
    </div>
  );
}
