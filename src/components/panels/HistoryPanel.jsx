import { History as HistoryIcon, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import SidePanel, { PanelTabs } from './SidePanel.jsx';
import { usePopup } from '../ui/PopupProvider.jsx';

export default function HistoryPanel({ ctx }) {
  const [tab, setTab] = useState('actions');
  const { showPrompt } = usePopup();
  const h = ctx.creatorHistory || { actions: [], snapshots: [] };

  const createSnapshot = async () => {
    const name = (await showPrompt({ title: '스냅샷 만들기', inputLabel: '스냅샷 이름', initialValue: '제작자 체크포인트', confirmLabel: '만들기' }))?.trim();
    if (name) ctx.onCreateSnapshot(name);
  };

  const renameSnapshot = async (snapshot) => {
    const name = (await showPrompt({ title: '스냅샷 이름 바꾸기', inputLabel: '스냅샷 이름', initialValue: snapshot.name, confirmLabel: '이름 변경' }))?.trim();
    if (name && name !== snapshot.name) ctx.onRenameSnapshot(snapshot.id, name);
  };

  return <SidePanel title="기록" description="제작자 체크포인트 및 동작." onClose={ctx.onClose}>
    <PanelTabs active={tab} onChange={setTab} tabs={[{ id: 'actions', label: '동작' }, { id: 'snapshots', label: '스냅샷' }]} />
    {tab === 'actions' && <div className="history-action-list">{!h.actions?.length && <p className="section-hint">제작자 작업이 여기에 표시됩니다.</p>}{h.actions?.slice().reverse().map((a) => <div className="history-action-row" key={a.id}><span className="history-action-icon"><HistoryIcon size={14} aria-hidden /></span><div><strong>{a.label}</strong><small>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div><button type="button" className="history-rewind-btn" onClick={() => ctx.onRestoreHistoryAction(a.id)} title={`${a.label}(으)로 돌아가기`} aria-label={`${a.label}(으)로 돌아가기`}><RotateCcw size={15} aria-hidden /></button></div>)}</div>}
    {tab === 'snapshots' && <><button type="button" className="action-btn primary" onClick={createSnapshot}>스냅샷 만들기</button>{!h.snapshots?.length && <p className="section-hint">이름 있는 스냅샷은 로컬에 저장되며 새로 고침 후에도 유지됩니다.</p>}{h.snapshots?.slice().reverse().map((s) => <div className="settings-hint" key={s.id}>{s.thumbnail && <img alt="" src={s.thumbnail} style={{ width: '100%', borderRadius: 5, marginBottom: 6 }} />}<strong>{s.name}</strong><br />{new Date(s.timestamp).toLocaleString()}<div className="side-panel-quick"><button type="button" className="action-btn" onClick={() => ctx.onRestoreSnapshot(s.id)}>복원</button><button type="button" className="action-btn" onClick={() => renameSnapshot(s)}>이름 변경</button><button type="button" className="action-btn danger" onClick={() => ctx.onDeleteSnapshot(s.id)}>삭제</button></div></div>)}</>}
  </SidePanel>;
}
