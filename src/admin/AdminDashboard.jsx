import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, CircleUserRound,
  Clock3, Eye, FileClock, FolderKanban, KeyRound, Laptop, LockKeyhole, RefreshCw, Search,
  ShieldAlert, ShieldCheck, Smartphone, Tablet, UserCheck, UserCog, UsersRound, UserX,
} from 'lucide-react';
import { adminApi } from './adminApi.js';
import { usePopup } from '../components/ui/PopupProvider.jsx';

const TABS = [
  { id: 'overview', label: '개요', icon: BarChart3 },
  { id: 'users', label: '사용자', icon: UsersRound },
  { id: 'visits', label: '방문', icon: Eye },
  { id: 'terrains', label: '지형들', icon: FolderKanban },
  { id: 'audit', label: '감사 로그', icon: FileClock },
  { id: 'security', label: '보안', icon: ShieldCheck },
];

const number = new Intl.NumberFormat();
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const dateTime = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatDate = (value, fallback = '없음') => value ? dateTime.format(new Date(value)) : fallback;
const actionLabel = (value = '') => value.split('.').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' · ');
const localDayKey = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function LoadingState() {
  return <div className="admin-loading" role="status"><span /><strong>보안 데이터 로드 중</strong><small>최신 관리 기록을 가져오는 중…</small></div>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-error" role="alert">
      <ShieldAlert size={22} />
      <strong>Couldn&apos;t load this view</strong>
      <span>{message || '관리 서비스가 응답하지 않았습니다.'}</span>
      <button type="button" onClick={onRetry}><RefreshCw size={13} /> 다시 시도</button>
    </div>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="결과 페이지">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={14} /> 이전</button>
      <span>페이지<strong>{page}</strong> of {pages}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages}>다음<ChevronRight size={14} /></button>
    </nav>
  );
}

function TrendChart({ data = [], valueKey = 'visits', days: requestedDays = 14, valueLabel: requestedValueLabel }) {
  const days = Math.max(1, Number(requestedDays) || 14);
  const valueLabel = requestedValueLabel || valueKey.replace(/([A-Z])/g, ' $1').toLowerCase();
  const points = useMemo(() => {
    const byDay = new Map(data.map((item) => [localDayKey(item.day), item]));
    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - 1 - index));
      const key = localDayKey(date);
      return { day: date, value: Number(byDay.get(key)?.[valueKey] ?? 0) };
    });
  }, [data, days, valueKey]);
  const max = Math.max(1, ...points.map((item) => item.value));
  const labelStep = days <= 7 ? 2 : days <= 31 ? 7 : 14;
  const shouldLabel = (index) => index === 0 || index === points.length - 1 || index % labelStep === 0;
  const [activeIndex, setActiveIndex] = useState(null);
  return (
    <div className="admin-chart" role="group" aria-label={`최근 ${days}일간의 일별 ${valueLabel}`}>
      <div className="admin-chart-grid" aria-hidden="true"><i /><i /><i /></div>
      <div className="admin-chart-bars">
        {points.map((item, index) => (
          <span
            className={`admin-chart-column ${activeIndex === index ? 'is-active' : ''}`}
            key={item.day.toISOString()}
            tabIndex="0"
            aria-label={`${shortDate.format(item.day)}: ${number.format(item.value)} ${valueLabel}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            <span className="admin-chart-bar" style={{ height: `${Math.max(item.value ? 6 : 2, (item.value / max) * 100)}%` }}>
              <span className="admin-chart-tooltip" role="status"><strong>{number.format(item.value)}</strong><small>{shortDate.format(item.day)}</small><em>{valueLabel}</em></span>
            </span>
            {shouldLabel(index) && <small>{shortDate.format(item.day)}</small>}
          </span>
        ))}
      </div>
    </div>
  );
}

const REPORTING_RANGES = [
  { value: 7, label: '주간' },
  { value: 30, label: '월간' },
  { value: 90, label: '90일' },
];

function RangeSelector({ value, onChange, label = '보고 기간' }) {
  return (
    <div className="admin-range-selector" role="group" aria-label={label}>
      {REPORTING_RANGES.map((range) => (
        <button type="button" key={range.value} className={value === range.value ? 'active' : ''} onClick={() => onChange(range.value)} aria-pressed={value === range.value}>
          {range.label}
        </button>
      ))}
    </div>
  );
}

function Overview({ data, onNavigate, rangeDays, onRangeChange }) {
  const rangeLabel = REPORTING_RANGES.find((range) => range.value === rangeDays)?.label.toLowerCase() || `${rangeDays} days`;
  const stats = [
    { label: '전체 사용자', value: data.counts.users, meta: `${number.format(data.counts.activeUsers)} active`, icon: UsersRound, tone: 'blue' },
    { label: '오늘 방문', value: data.counts.visitsToday, meta: `${number.format(data.counts.uniqueToday)} unique`, icon: Activity, tone: 'green' },
    { label: '지형들', value: data.counts.terrains, meta: '모든 사용자', icon: FolderKanban, tone: 'violet' },
    { label: '세션 열기', value: data.counts.openSessions, meta: '만료되지 않은 세션', icon: KeyRound, tone: 'amber' },
  ];
  return (
    <div className="admin-overview">
      <section className="admin-stat-grid" aria-label="서비스 개요">
        {stats.map(({ label, value, meta, icon: Icon, tone }) => (
          <article className={`admin-stat ${tone}`} key={label}>
            <span className="admin-stat-icon"><Icon size={18} /></span>
            <span><small>{label}</small><strong>{number.format(value)}</strong><em>{meta}</em></span>
          </article>
        ))}
      </section>

      <section className="admin-panel admin-trend-panel">
        <header>
          <div><span className="admin-eyebrow">트래픽</span><h2>Visits over the last {rangeDays} days</h2></div>
          <div className="admin-panel-actions"><RangeSelector value={rangeDays} onChange={onRangeChange} /><button type="button" className="admin-text-button" onClick={() => onNavigate('visits')}>방문 로그 보기 <ChevronRight size={13} /></button></div>
        </header>
        <TrendChart data={data.visitTrend} days={rangeDays} valueLabel="페이지 방문" />
        <div className="admin-chart-legend"><span><i className="blue" />페이지 방문</span><span><i className="muted" /> Daily values · {rangeLabel}</span></div>
      </section>

      <div className="admin-overview-columns">
        <section className="admin-panel">
          <header><div><span className="admin-eyebrow">최근 작업</span><h2>최근 지형</h2></div><button type="button" className="admin-icon-button" onClick={() => onNavigate('terrains')} aria-label="모든 지형 보기"><ChevronRight size={15} /></button></header>
          <div className="admin-compact-list">
            {data.recentTerrains.length === 0 && <p className="admin-empty">아직 클라우드 지형이 없습니다.</p>}
            {data.recentTerrains.map((terrain) => (
              <div key={terrain.id}>
                <span className="admin-list-icon"><FolderKanban size={14} /></span>
                <span><strong>{terrain.name}</strong><small>@{terrain.username} · {formatDate(terrain.updatedAt)}</small></span>
                <span className={`admin-badge ${terrain.visibility}`}>{terrain.visibility}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <header><div><span className="admin-eyebrow">책임성</span><h2>관리자 활동</h2></div><button type="button" className="admin-icon-button" onClick={() => onNavigate('audit')} aria-label="감사 로그 보기"><ChevronRight size={15} /></button></header>
          <div className="admin-compact-list audit">
            {data.recentAudit.length === 0 && <p className="admin-empty">아직 기록된 관리자 변경 사항이 없습니다.</p>}
            {data.recentAudit.map((event) => (
              <div key={event.id}>
                <span className="admin-list-icon"><FileClock size={14} /></span>
                <span><strong>{actionLabel(event.action)}</strong><small>{event.actor} · {formatDate(event.createdAt)}</small></span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function UsersPanel({ currentUser }) {
  const { showPopup, showConfirm } = usePopup();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [verified, setVerified] = useState('');
  const [activity, setActivity] = useState('');
  const [terrains, setTerrains] = useState('');
  const [sessions, setSessions] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.users({ page, q: query, status, role, verified, activity, terrains, sessions })); }
    catch (nextError) { setError(nextError.message); }
  }, [page, query, status, role, verified, activity, terrains, sessions]);
  useEffect(() => { load(); }, [load]);

  const update = async (target, patch) => {
    const isSuspend = patch.status === 'suspended';
    const isDemote = patch.role === 'user';
    const confirmed = await showConfirm({
      title: isSuspend ? '이 계정을 정지하시겠습니까?' : isDemote ? '관리자 권한을 제거하시겠습니까?' : '계정 변경 확인',
      message: isSuspend
        ? `${target.username} will be signed out everywhere and unable to sign in until reactivated.`
        : isDemote ? `${target.username} will immediately lose access to administration data.`
          : `${target.username}에게 이 변경 사항을 적용하시겠습니까?`,
      confirmLabel: isSuspend ? '계정 정지' : '변경 사항 적용',
      danger: isSuspend || isDemote,
    });
    if (!confirmed) return;
    setBusy(target.id);
    try {
      const result = await adminApi.updateUser(target.id, patch);
      setData((current) => ({ ...current, users: current.users.map((user) => user.id === target.id ? result.user : user) }));
      showPopup('계정이 업데이트되었으며 작업이 감사 로그에 추가되었습니다.', { type: 'success', title: '사용자 업데이트됨' });
    } catch (nextError) {
      showPopup(nextError.message, { type: 'error', title: '업데이트 차단됨' });
    } finally { setBusy(''); }
  };

  const revoke = async (target) => {
    const confirmed = await showConfirm({
      title: '모든 세션을 취소하시겠습니까?',
      message: `${target.username} will be signed out on every device. Their password will not change.`,
      confirmLabel: '세션 취소',
      danger: true,
    });
    if (!confirmed) return;
    setBusy(target.id);
    try {
      const result = await adminApi.revokeSessions(target.id);
      setData((current) => ({ ...current, users: current.users.map((user) => user.id === target.id ? { ...user, activeSessions: 0 } : user) }));
      showPopup(`${result.revoked} session${result.revoked === 1 ? '' : 's'} revoked.`, { type: 'success', title: '세션 닫힘' });
    } catch (nextError) {
      showPopup(nextError.message, { type: 'error', title: '세션을 폐기할 수 없습니다' });
    } finally { setBusy(''); }
  };

  return (
    <section className="admin-panel admin-data-panel">
      <header className="admin-data-head">
        <div><span className="admin-eyebrow">계정</span><h2>사용자 관리</h2><p>접근 권한, 역할, 계정 상태, 세션을 검토하세요.</p></div>
        <button type="button" className="admin-refresh" onClick={load}><RefreshCw size={13} />새로 고침</button>
      </header>
      <form className="admin-filters users-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search); }}>
        <label className="admin-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름, 사용자명 또는 이메일 검색" aria-label="사용자 검색" /></label>
        <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} aria-label="사용자 상태 필터">
          <option value="">모든 상태</option><option value="active">활성</option><option value="suspended">일시 중단됨</option>
        </select>
        <select value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }} aria-label="사용자 역할 필터링">
          <option value="">모든 역할</option><option value="admin">관리자</option><option value="user">멤버</option>
        </select>
        <select value={verified} onChange={(event) => { setPage(1); setVerified(event.target.value); }} aria-label="이메일 인증 필터링">
          <option value="">모든 인증</option><option value="verified">인증된 이메일</option><option value="unverified">미인증 이메일</option>
        </select>
        <select value={terrains} onChange={(event) => { setPage(1); setTerrains(event.target.value); }} aria-label="지형 소유권 필터링">
          <option value="">모든 지형 활동</option><option value="has">지형 있음</option><option value="none">지형 없음</option>
        </select>
        <select value={activity} onChange={(event) => { setPage(1); setActivity(event.target.value); }} aria-label="최근 활동 필터">
          <option value="">마지막 접속 무관</option><option value="7d">7일 내 접속</option><option value="30d">30일 내 접속</option><option value="never">접속 기록 없음</option>
        </select>
        <select value={sessions} onChange={(event) => { setPage(1); setSessions(event.target.value); }} aria-label="활성 세션 필터링">
          <option value="">모든 세션</option><option value="active">활성 세션 있음</option><option value="none">활성 세션 없음</option>
        </select>
        <button type="submit">검색</button>
      </form>
      {!data && !error && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {data && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>사용자</th><th>상태</th><th>역할</th><th>지형들</th><th>세션</th><th>마지막 접속</th><th><span className="sr-only">동작</span></th></tr></thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td><span className="admin-user-cell"><span className="admin-user-avatar">{(user.displayName || user.username).slice(0, 2).toUpperCase()}</span><span><strong>{user.displayName || user.username}{user.id === currentUser.id && <em>당신</em>}</strong><small>@{user.username} · {user.email}</small></span></span></td>
                    <td><span className={`admin-status ${user.status}`}><i />{user.status}</span></td>
                    <td><span className={`admin-role ${user.role}`}><ShieldCheck size={12} /> {user.role}</span></td>
                    <td>{number.format(user.projectCount)}</td>
                    <td>{number.format(user.activeSessions)}</td>
                    <td><span className="admin-muted">{formatDate(user.lastSeenAt)}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        {user.status === 'active'
                          ? <button type="button" className="danger" disabled={busy === user.id || user.id === currentUser.id} onClick={() => update(user, { status: 'suspended' })}><UserX size={13} />일시 중단</button>
                          : <button type="button" disabled={busy === user.id} onClick={() => update(user, { status: 'active' })}><UserCheck size={13} />활성화</button>}
                        {user.role === 'admin'
                          ? <button type="button" disabled={busy === user.id || user.id === currentUser.id} onClick={() => update(user, { role: 'user' })}><CircleUserRound size={13} />멤버로 지정</button>
                          : <button type="button" disabled={busy === user.id} onClick={() => update(user, { role: 'admin' })}><UserCog size={13} />관리자로 지정</button>}
                        <button type="button" disabled={busy === user.id || user.id === currentUser.id || user.activeSessions === 0} onClick={() => revoke(user)}><KeyRound size={13} />세션 취소</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.users.length === 0 && <p className="admin-empty">이 필터와 일치하는 사용자가 없습니다.</p>}
          </div>
          <footer className="admin-results-footer"><span>{number.format(data.total)} user{data.total === 1 ? '' : 's'}</span><Pagination page={data.page} pages={data.pages} onPage={setPage} /></footer>
        </>
      )}
    </section>
  );
}

function VisitsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(30);
  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.visits({ page, days })); }
    catch (nextError) { setError(nextError.message); }
  }, [page, days]);
  useEffect(() => { load(); }, [load]);
  const DeviceIcon = ({ device }) => device === '모바일' ? <Smartphone size={13} /> : device === '태블릿' ? <Tablet size={13} /> : <Laptop size={13} />;
  return (
    <div className="admin-stack">
      {data && <section className="admin-panel admin-trend-panel"><header><div><span className="admin-eyebrow">대상</span><h2>방문 및 순 방문자</h2></div><RangeSelector value={days} onChange={(value) => { setPage(1); setDays(value); }} /></header><div className="admin-inline-metrics"><div><strong>{number.format(data.summary?.visits ?? data.total)}</strong><span>총 방문</span></div><div><strong>{number.format(data.summary?.uniqueVisitors ?? 0)}</strong><span>순 방문자</span></div><div><strong>{number.format(data.summary?.averagePerDay ?? 0)}</strong><span>일 평균</span></div></div><TrendChart data={data.trend} days={days} valueLabel="페이지 방문" /><div className="admin-chart-legend"><span><i className="blue" />페이지 방문</span><span><i className="green" />정확한 수치는 날짜에 마우스를 올리면 확인됩니다</span></div></section>}
      <section className="admin-panel admin-data-panel">
        <header className="admin-data-head"><div><span className="admin-eyebrow">최근 트래픽</span><h2>방문 로그</h2><p>원시 네트워크 주소는 절대 표시되거나 저장되지 않습니다.</p></div><button type="button" className="admin-refresh" onClick={load}><RefreshCw size={13} />새로 고침</button></header>
        {!data && !error && <LoadingState />}{error && <ErrorState message={error} onRetry={load} />}
        {data && <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>시간</th><th>경로</th><th>방문자</th><th>디바이스</th><th>리퍼러</th></tr></thead><tbody>{data.visits.map((visit) => <tr key={visit.id}><td><span className="admin-muted">{formatDate(visit.createdAt)}</span></td><td><code>{visit.path}</code></td><td>{visit.username ? `@${visit.username}` : <span className="admin-muted">익명</span>}</td><td><span className="admin-device"><DeviceIcon device={visit.device} />{visit.device}</span></td><td><span className="admin-muted">{visit.referrerHost || '직접'}</span></td></tr>)}</tbody></table>{data.visits.length === 0 && <p className="admin-empty">이 기간에 방문이 없습니다.</p>}</div><footer className="admin-results-footer"><span>{number.format(data.total)} visits</span><Pagination page={data.page} pages={data.pages} onPage={setPage} /></footer></>}
      </section>
    </div>
  );
}

function TerrainsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.terrains({ page, q: query, visibility })); }
    catch (nextError) { setError(nextError.message); }
  }, [page, query, visibility]);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="admin-panel admin-data-panel">
      <header className="admin-data-head"><div><span className="admin-eyebrow">클라우드 라이브러리</span><h2>최근 지형</h2><p>Metadata only; private terrain content is not exposed here.</p></div><button type="button" className="admin-refresh" onClick={load}><RefreshCw size={13} />새로 고침</button></header>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search); }}><label className="admin-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="지형 또는 소유자 검색" aria-label="지형 검색" /></label><select value={visibility} onChange={(event) => { setPage(1); setVisibility(event.target.value); }} aria-label="지형 가시성 필터"><option value="">모든 공개 범위</option><option value="private">비공개</option><option value="unlisted">비공개(링크 보유자만)</option><option value="public">공개</option></select><button type="submit">검색</button></form>
      {!data && !error && <LoadingState />}{error && <ErrorState message={error} onRetry={load} />}
      {data && <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>지형</th><th>소유자</th><th>가시성</th><th>리비전</th><th>생성됨</th><th>최종 업데이트</th></tr></thead><tbody>{data.terrains.map((terrain) => <tr key={terrain.id}><td><span className="admin-terrain-cell"><span className="admin-list-icon"><FolderKanban size={14} /></span><span><strong>{terrain.name}</strong><small>{terrain.description || '설명 없음'}</small></span></span></td><td>@{terrain.owner.username}</td><td><span className={`admin-badge ${terrain.visibility}`}>{terrain.visibility}</span></td><td>v{terrain.contentRevision}</td><td><span className="admin-muted">{formatDate(terrain.createdAt)}</span></td><td><span className="admin-muted">{formatDate(terrain.updatedAt)}</span></td></tr>)}</tbody></table>{data.terrains.length === 0 && <p className="admin-empty">이 필터와 일치하는 지형이 없습니다.</p>}</div><footer className="admin-results-footer"><span>{number.format(data.total)} terrains</span><Pagination page={data.page} pages={data.pages} onPage={setPage} /></footer></>}
    </section>
  );
}

function AuditPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.audit({ page, q: query })); }
    catch (nextError) { setError(nextError.message); }
  }, [page, query]);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="admin-panel admin-data-panel">
      <header className="admin-data-head"><div><span className="admin-eyebrow">책임성</span><h2>관리자 감사 로그</h2><p>보안에 민감한 관리자 작업은 작업자와 대상과 함께 기록됩니다.</p></div><button type="button" className="admin-refresh" onClick={load}><RefreshCw size={13} />새로 고침</button></header>
      <form className="admin-filters compact" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search); }}><label className="admin-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="액션, 액터 또는 타겟 ID 검색" aria-label="감사 로그 검색" /></label><button type="submit">검색</button></form>
      {!data && !error && <LoadingState />}{error && <ErrorState message={error} onRetry={load} />}
      {data && <><div className="admin-audit-list">{data.events.map((event) => <article key={event.id}><span className="admin-audit-mark"><FileClock size={14} /></span><div><header><strong>{actionLabel(event.action)}</strong><span>{formatDate(event.createdAt)}</span></header><p><b>{event.actor}</b> changed {event.targetType}{event.targetId ? ` ${event.targetId}` : ''}.</p>{event.metadata?.changes && <div className="admin-change-chips">{Object.entries(event.metadata.changes).map(([key, value]) => <span key={key}>{key}: <strong>{String(value)}</strong></span>)}</div>}</div></article>)}{data.events.length === 0 && <p className="admin-empty">이 검색과 일치하는 감사 이벤트가 없습니다.</p>}</div><footer className="admin-results-footer"><span>{number.format(data.total)} audit events</span><Pagination page={data.page} pages={data.pages} onPage={setPage} /></footer></>}
    </section>
  );
}

function SecurityPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.security()); }
    catch (nextError) { setError(nextError.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!data && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  const stats = [
    { label: '로그인 실패 · 24시간', value: data.summary.failedLogins, icon: ShieldAlert, danger: data.summary.failedLogins > 10 },
    { label: '세션 열기', value: data.summary.openSessions, icon: KeyRound },
    { label: '정지된 사용자', value: data.summary.suspendedUsers, icon: UserX },
    { label: '활성 관리자', value: data.summary.admins, icon: ShieldCheck },
  ];
  return (
    <div className="admin-stack">
      <section className="admin-security-grid">{stats.map(({ label, value, icon: Icon, danger }) => <article className={danger ? 'danger' : ''} key={label}><Icon size={18} /><span><strong>{number.format(value)}</strong><small>{label}</small></span></article>)}</section>
      <section className="admin-panel admin-security-note"><LockKeyhole size={19} /><div><strong>보안 제어가 활성화됨</strong><p>서버 측 역할 검사, 정확한 출처 강제, HTTP 전용 쿠키, 요청 제한, 개인정보 보호 식별자, 비밀번호 해싱, 관리자 감사 이벤트가 이 영역을 보호합니다.</p></div></section>
      <section className="admin-panel admin-data-panel"><header className="admin-data-head"><div><span className="admin-eyebrow">인증</span><h2>최근 보안 이벤트</h2><p>식별자와 네트워크 주소는 노출되지 않습니다.</p></div><button type="button" className="admin-refresh" onClick={load}><RefreshCw size={13} />새로 고침</button></header><div className="admin-security-events">{data.events.map((event) => <div key={event.id}><span className={`admin-event-icon ${event.outcome}`}>{event.outcome === 'success' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}</span><span><strong>{actionLabel(event.type)}</strong><small>{event.username ? `@${event.username}` : '알 수 없는 계정'} · {formatDate(event.createdAt)}</small></span><span className={`admin-status ${event.outcome}`}><i />{event.outcome}</span></div>)}{data.events.length === 0 && <p className="admin-empty">아직 기록된 보안 이벤트가 없습니다.</p>}</div></section>
    </div>
  );
}

export default function AdminDashboard({ user, onBack }) {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [overviewDays, setOverviewDays] = useState(30);
  const [error, setError] = useState('');
  const loadOverview = useCallback(async () => {
    setError('');
    try { setOverview(await adminApi.overview({ days: overviewDays })); }
    catch (nextError) { setError(nextError.message); }
  }, [overviewDays]);
  useEffect(() => { loadOverview(); }, [loadOverview]);
  const changeOverviewRange = useCallback((days) => {
    setOverview(null);
    setOverviewDays(days);
  }, []);
  const title = TABS.find((item) => item.id === tab)?.label ?? '개요';

  return (
    <section className="admin-dashboard" aria-labelledby="admin-title">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading"><span className="admin-shield"><ShieldCheck size={18} /></span><span><strong>관리자 콘솔</strong><small>3개 지형</small></span></div>
        <nav aria-label="관리">
          {TABS.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={15} /><span>{label}</span></button>)}
        </nav>
        <div className="admin-sidebar-account"><span>{(user.displayName || user.username).slice(0, 2).toUpperCase()}</span><div><strong>{user.displayName || user.username}</strong><small>관리자</small></div></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-content">
            <div className="admin-topbar-title">
              <button type="button" className="admin-back" onClick={onBack}><ArrowLeft size={15} />관리자 모드 종료</button>
              <div><span>Three Terrain 백오피스</span><h1 id="admin-title">{title}</h1></div>
            </div>
            <div className="admin-secure-indicator"><LockKeyhole size={13} /><span>안전한 관리자 세션</span></div>
          </div>
        </header>
        <div className="admin-mobile-tabs" role="tablist" aria-label="관리 섹션">{TABS.map(({ id, label }) => <button type="button" role="tab" aria-selected={tab === id} key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
        <div className="admin-page">
          {tab === 'overview' && !overview && !error && <LoadingState />}
          {tab === 'overview' && error && <ErrorState message={error} onRetry={loadOverview} />}
          {tab === 'overview' && overview && <Overview data={overview} onNavigate={setTab} rangeDays={overviewDays} onRangeChange={changeOverviewRange} />}
          {tab === 'users' && <UsersPanel currentUser={user} />}
          {tab === 'visits' && <VisitsPanel />}
          {tab === 'terrains' && <TerrainsPanel />}
          {tab === 'audit' && <AuditPanel />}
          {tab === 'security' && <SecurityPanel />}
        </div>
      </div>
    </section>
  );
}
