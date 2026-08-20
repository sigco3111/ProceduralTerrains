import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Boxes, Check, Compass, Copy, Eye, FolderDown, Globe2, Hand,
  Lock, Mountain, Orbit, Pencil, Route, Search, Settings2, UserRound, Waves, X,
} from 'lucide-react';
import { avatarUrl } from '../auth/authApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { projectStore } from './ProjectStore.js';
import { projectApi } from './projectApi.js';
import { usePopup } from '../components/ui/PopupProvider.jsx';

const normalizeCode = (value) => String(value ?? '').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 10);
const COMMUNITY_TYPES = [
  { id: 'procedural', label: '절차적' },
  { id: 'nodes', label: '노드' },
  { id: 'manual', label: '매뉴얼' },
];
const COMMUNITY_ICONS = [
  { id: 'mountain', label: '산', Icon: Mountain },
  { id: 'boxes', label: '노드', Icon: Boxes },
  { id: 'hand', label: '매뉴얼', Icon: Hand },
  { id: 'waves', label: '물결', Icon: Waves },
  { id: 'orbit', label: '궤도', Icon: Orbit },
  { id: 'route', label: '경로', Icon: Route },
];
const ICON_BY_ID = new Map(COMMUNITY_ICONS.map((option) => [option.id, option]));
const DEFAULT_ICON_BY_TYPE = { procedural: 'mountain', nodes: 'boxes', manual: 'hand' };

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('이 브라우저에서는 복사가 지원되지 않습니다.');
}

function shareCodeFromHash() {
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get('code') ?? '';
}

function shareLinkFor(code) {
  const url = new URL(window.location.href);
  url.hash = `/community?code=${encodeURIComponent(normalizeCode(code))}`;
  return url.toString();
}

function typeLabel(type) {
  return COMMUNITY_TYPES.find((option) => option.id === type)?.label ?? '지형';
}

function iconForProject(project) {
  return ICON_BY_ID.get(project.communityIcon)
    ?? ICON_BY_ID.get(DEFAULT_ICON_BY_TYPE[project.editorMode])
    ?? COMMUNITY_ICONS[0];
}

export default function CommunityPage({ onBack, onOpen, ready = true }) {
  const { user } = useAuth();
  const { showPopup, showPrompt } = usePopup();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [editingId, setEditingId] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const pendingOpenRef = useRef(null);
  const autoOpenCodeRef = useRef('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectApi.community({ query: activeQuery, type: activeType, page });
      setProjects(result.projects);
      setPages(result.pages);
      setTotal(result.total);
    } catch (requestError) {
      showPopup(requestError.message || '커뮤니티 프로젝트를 불러올 수 없습니다.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeQuery, activeType, page, showPopup]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!ready || !pendingOpenRef.current) return;
    const project = pendingOpenRef.current;
    pendingOpenRef.current = null;
    onOpen(project);
  }, [onOpen, ready]);

  const importByCode = useCallback(async (code) => {
    const normalized = normalizeCode(code);
    if (normalized.length !== 10) {
      showPopup('10자리 완전한 공유 코드로 검색하세요.', { type: 'error', title: '불완전한 공유 코드' });
      return;
    }
    setBusy(normalized);
    try {
      const result = await projectApi.shared(normalized);
      const imported = await projectStore.importCopy({
        ...result.project.data,
        metadata: {
          ...(result.project.data.metadata ?? {}),
          name: result.project.name,
          description: result.project.description ?? result.project.data.metadata?.description,
          author: result.project.author.displayName || result.project.author.username,
          communityIcon: result.project.communityIcon ?? result.project.data.metadata?.communityIcon,
        },
      }, { name: result.project.name });
      if (ready) onOpen(imported);
      else pendingOpenRef.current = imported;
    } catch (requestError) {
      showPopup(requestError.message || '이 공유 프로젝트를 열 수 없습니다.', { type: 'error' });
    } finally {
      setBusy('');
    }
  }, [onOpen, ready, showPopup]);

  useEffect(() => {
    const code = normalizeCode(shareCodeFromHash());
    if (code.length !== 10 || autoOpenCodeRef.current === code) return;
    autoOpenCodeRef.current = code;
    importByCode(code);
  }, [importByCode]);

  const search = (event) => {
    event.preventDefault();
    setPage(1);
    setActiveQuery(query.trim());
  };

  const selectType = (type) => {
    setPage(1);
    setActiveType(type);
  };

  const copyShareLink = async (code) => {
    const normalized = normalizeCode(code);
    try {
      await copyText(shareLinkFor(normalized));
      setCopiedCode(normalized);
      showPopup('열기 링크가 클립보드에 복사되었습니다.', { type: 'success' });
      window.setTimeout(() => setCopiedCode((current) => current === normalized ? '' : current), 1800);
    } catch (copyError) {
      showPopup(copyError.message || '오프닝 링크를 복사할 수 없습니다.', { type: 'error' });
    }
  };

  const updateOwnerProject = useCallback(async (project, input, successMessage) => {
    setBusy(project.id);
    try {
      const result = await projectApi.update(project.id, input);
      if (result.project.visibility === 'public') {
        setProjects((current) => current.map((item) => item.id === project.id ? { ...item, ...result.project } : item));
      } else {
        await load();
        setEditingId('');
      }
      showPopup(successMessage, { type: 'success' });
    } catch (requestError) {
      showPopup(requestError.message || '이 지형을 업데이트할 수 없습니다.', { type: 'error' });
    } finally {
      setBusy('');
    }
  }, [load, showPopup]);

  const rename = async (project) => {
    const name = (await showPrompt({
      title: '커뮤니티 지형 이름 바꾸기',
      inputLabel: '지형 이름',
      initialValue: project.name,
      confirmLabel: '이름 변경',
      maxLength: 120,
    }))?.trim();
    if (!name || name === project.name) return;
    await updateOwnerProject(project, { name }, `${name}(으)로 이름이 변경되었습니다.`);
  };

  const ownerProjects = useMemo(() => new Set(
    projects.filter((project) => user?.id && project.author?.id === user.id).map((project) => project.id),
  ), [projects, user?.id]);

  const resultsTitle = activeQuery
    ? `“${activeQuery}” 검색 결과`
    : activeType ? `${typeLabel(activeType)} terrains` : '최근 공유됨';

  return (
    <section className="community-page" aria-labelledby="community-title">
      <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={14} /> 프로젝트로 돌아가기</button>
      <header className="community-heading">
        <span><Compass size={14} /> 탐색</span>
        <h1 id="community-title">커뮤니티 지형</h1>
        <p>공개 프로젝트를 탐색하고, 열기 링크를 복사하고, 이름, 제작자, 공유 코드로 지형을 찾아보세요.</p>
      </header>

      <form className="community-search" onSubmit={search}>
        <Search size={14} aria-hidden />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 제작자 또는 공유 코드 검색" aria-label="커뮤니티 프로젝트 검색" />
        <button type="submit" className="lp-secondary sm">검색</button>
      </form>

      <div className="community-filters" role="tablist" aria-label="에디터별 커뮤니티 지형 필터">
        <button type="button" role="tab" aria-selected={!activeType} className={!activeType ? 'active' : ''} onClick={() => selectType('')}>모든 지형</button>
        {COMMUNITY_TYPES.map((option) => (
          <button type="button" role="tab" key={option.id} aria-selected={activeType === option.id} className={activeType === option.id ? 'active' : ''} onClick={() => selectType(option.id)}>{option.label}</button>
        ))}
      </div>

      <div className="community-results-head">
        <div><h2>{resultsTitle}</h2><span>{total} public project{total === 1 ? '' : 's'}</span></div>
        {activeQuery && <button type="button" className="community-clear-search" onClick={() => { setQuery(''); setActiveQuery(''); setPage(1); }}><X size={12} />검색 지우기</button>}
      </div>

      {loading ? <div className="community-state"><Compass size={22} /><span>Loading community projects…</span></div> : projects.length === 0 ? (
        <div className="community-state"><Globe2 size={24} /><strong>이 필터와 일치하는 지형이 없습니다</strong><span>다른 검색을 시도하거나 모든 공개 지형을 탐색하세요.</span></div>
      ) : (
        <div className="community-grid">
          {projects.map((project) => {
            const { Icon } = iconForProject(project);
            const isOwner = ownerProjects.has(project.id);
            const disabled = !!busy;
            const selectedCommunityIcon = project.communityIcon ?? DEFAULT_ICON_BY_TYPE[project.editorMode] ?? COMMUNITY_ICONS[0].id;
            return (
              <article className={`community-card${isOwner ? ' is-owner' : ''}`} key={project.id}>
                <div className={`community-card-art ${project.editorMode || 'procedural'}`}>
                  <span className="community-card-icon"><Icon size={30} aria-hidden /></span>
                  <span className="community-card-type">{typeLabel(project.editorMode)}</span>
                  <button type="button" className="community-share-link" onClick={() => copyShareLink(project.shareCode)} title="오프닝 링크 복사" aria-label={`${project.name}의 오프닝 링크 복사`}>
                    {copiedCode === project.shareCode ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}<code>{project.shareCode}</code>
                  </button>
                </div>
                <div className="community-card-body">
                  <div className="community-card-title-row"><h3>{project.name}</h3>{isOwner && <span className="community-owner-badge">내 지형</span>}</div>
                  <p>{project.description || `공유된 ${typeLabel(project.editorMode)} 지형 프로젝트.`}</p>
                  <div className="community-author">
                    <span>{avatarUrl(project.author) ? <img src={avatarUrl(project.author)} alt="" /> : <UserRound size={13} />}</span>
                    <strong>{project.author.displayName || project.author.username}</strong>
                    <small>@{project.author.username}</small>
                  </div>
                  <div className="community-card-actions">
                    <button type="button" className="lp-primary sm" onClick={() => importByCode(project.shareCode)} disabled={disabled || !ready}><FolderDown size={14} />가져오기 및 열기</button>
                    {isOwner && <button type="button" className={`lp-secondary sm community-edit-button${editingId === project.id ? ' active' : ''}`} onClick={() => setEditingId((current) => current === project.id ? '' : project.id)} disabled={disabled}><Settings2 size={13} />편집</button>}
                  </div>
                  {isOwner && editingId === project.id && (
                    <div className="community-owner-panel">
                      <div className="community-owner-panel-head"><strong>지형 관리</strong><button type="button" onClick={() => setEditingId('')} aria-label="지형 설정 닫기"><X size={13} /></button></div>
                      <div className="community-owner-actions">
                        <button type="button" className="lp-secondary sm" onClick={() => rename(project)} disabled={disabled}><Pencil size={13} /> 이름 변경</button>
                        <label className="community-visibility-select"><span>가시성</span><span className="community-select-wrap">{project.visibility === 'public' ? <Globe2 size={12} /> : project.visibility === 'unlisted' ? <Eye size={12} /> : <Lock size={12} />}<select value={project.visibility} onChange={(event) => updateOwnerProject(project, { visibility: event.target.value }, `가시성을 ${event.target.value}(으)로 변경했습니다.`)} disabled={disabled} aria-label={`${project.name} 공개 범위`}><option value="private">비공개</option><option value="unlisted">비공개(링크 보유자만)</option><option value="public">공개</option></select></span></label>
                      </div>
                      <div className="community-icon-picker"><span>카드 아이콘</span><div>{COMMUNITY_ICONS.map((option) => { const OptionIcon = option.Icon; return <button type="button" key={option.id} className={selectedCommunityIcon === option.id ? 'active' : ''} onClick={() => updateOwnerProject(project, { communityIcon: option.id }, `${option.label} icon selected.`)} disabled={disabled} title={option.label} aria-label={`${option.label} 아이콘 사용`}><OptionIcon size={14} /></button>; })}</div></div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pages > 1 && <nav className="community-pagination" aria-label="커뮤니티 페이지">
        <button type="button" className="lp-secondary sm" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || loading}><ArrowLeft size={13} /> 이전</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className="lp-secondary sm" onClick={() => setPage((value) => value + 1)} disabled={page >= pages || loading}>다음<ArrowRight size={13} /></button>
      </nav>}
    </section>
  );
}
