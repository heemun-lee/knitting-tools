import {Modal} from '../ui/Modal';
import {IconBookmark, IconTrash} from '../icons';

export const PatternModals = ({state}) => {
    const {
        editingPalette, setEditingPalette, palette, updatePaletteColor,
        showSave, setShowSave, setOverwriteId, overwriteId, doSave, saveName, setSaveName,
        trackerOn, trackerRow, measurements, saved, showSaved, setShowSaved, loadSaved, deleteSaved
    } = state;

    return (
        <>
            {/* Color picker popover */}
            {editingPalette && (
                <div onClick={() => setEditingPalette(null)} style={{position: 'fixed', inset: 0, zIndex: 40}}>
                    <div className="color-picker-pop"
                         onClick={e => e.stopPropagation()}
                         style={{left: Math.min(editingPalette.x, window.innerWidth - 240), top: editingPalette.y}}>
                        <div style={{fontSize: 12, color: 'var(--ink-500)', fontWeight: 500}}>색상 변경</div>
                        <input type="color"
                               value={palette[editingPalette.idx]?.hex || '#000000'}
                               onChange={e => updatePaletteColor(editingPalette.idx, e.target.value)}
                               style={{width: '100%', height: 36, border: 'none', borderRadius: 8, cursor: 'pointer'}}/>
                        <input className="input" style={{height: 36}}
                               value={palette[editingPalette.idx]?.hex || ''}
                               onChange={e => {
                                   const v = e.target.value;
                                   if (/^#[0-9A-Fa-f]{6}$/.test(v)) updatePaletteColor(editingPalette.idx, v);
                               }}/>
                        <div style={{fontSize: 11, color: 'var(--ink-500)'}}>자주 쓰는 색</div>
                        <div className="swatch-grid">
                            {['#FFFFFF', '#F4ECEF', '#FFC9DE', '#EC6B9C', '#B23968', '#7A6B73', '#1F1620', '#000000',
                                '#F4D06F', '#7FCFB8', '#8FB8E0', '#C8A8E9', '#FFB5A7', '#A0937D', '#3D5A6C', '#94A684'].map(c => (
                                <div key={c} style={{background: c}}
                                     onClick={() => updatePaletteColor(editingPalette.idx, c)}/>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Modal open={showSave} onClose={() => {
                setShowSave(false);
                setOverwriteId(null);
            }}
                   title={overwriteId ? '도안 덮어쓰기' : '도안 저장하기'}
                   actions={<>
                       <button className="btn btn-ghost btn-sm" onClick={() => {
                           setShowSave(false);
                           setOverwriteId(null);
                       }}>취소
                       </button>
                       <button className="btn btn-primary btn-sm" onClick={doSave}>
                           {overwriteId ? '덮어쓰기' : '저장'}
                       </button>
                   </>}>
                <div className="field" style={{marginTop: 8}}>
                    <label className="field-label">도안 이름</label>
                    <input className="input" value={saveName} onChange={e => setSaveName(e.target.value)}
                           placeholder="예: 곰돌이 무릎담요" autoFocus
                           onKeyDown={e => e.key === 'Enter' && doSave()}/>
                    <div className="field-hint" style={{marginTop: 6}}>
                        {overwriteId
                            ? <>기존 도안에 <strong style={{color: 'var(--pink-600)'}}>덮어쓰기</strong>됩니다. 트래커 위치와 측정도 함께
                                갱신돼요.</>
                            : <>트래커 위치{trackerOn ?
                                <strong style={{color: 'var(--pink-600)'}}> ({trackerRow + 1}단)</strong> : ''}와
                                측정({measurements.length}개)도 함께 저장됩니다.</>
                        }
                    </div>
                </div>

                {!overwriteId && saved.length > 0 && (
                    <div style={{marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--ink-100)'}}>
                        <div className="field-label" style={{marginBottom: 8}}>또는 기존 도안에 덮어쓰기</div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            maxHeight: 220,
                            overflowY: 'auto'
                        }}>
                            {saved.map(s => (
                                <div key={s.id} className="saved-item" style={{padding: '8px 10px'}}>
                                    <div className="saved-thumb"
                                         style={{backgroundImage: `url(${s.thumb})`, width: 36, height: 36}}/>
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <div className="saved-name" style={{fontSize: 13}}>{s.name}</div>
                                        <div className="saved-meta" style={{fontSize: 11}}>
                                            {s.stitchCount}×{s.rowCount} · {s.palette.length}색
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => {
                                        setOverwriteId(s.id);
                                        setSaveName(s.name);
                                    }}>
                                        덮어쓰기
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={showSaved} onClose={() => setShowSaved(false)}
                   title="저장된 도안"
                   actions={<button className="btn btn-ghost btn-sm" onClick={() => setShowSaved(false)}>닫기</button>}>
                {saved.length === 0 ? (
                    <div className="empty" style={{padding: '20px 0'}}>
                        <div className="empty-icon"><IconBookmark size={28}/></div>
                        아직 저장된 도안이 없어요
                    </div>
                ) : (
                    <div className="saved-list">
                        {saved.map(s => (
                            <div key={s.id} className="saved-item">
                                <div className="saved-thumb" style={{backgroundImage: `url(${s.thumb})`}}/>
                                <div style={{flex: 1, minWidth: 0}}>
                                    <div className="saved-name">{s.name}</div>
                                    <div className="saved-meta">
                                        {s.stitchCount}×{s.rowCount} · {s.palette.length}색
                                        {s.trackerOn ? ` · ${s.trackerRow + 1}단 진행 중` : ''}
                                        {s.measurements?.length ? ` · 측정 ${s.measurements.length}개` : ''}
                                        &nbsp;· {new Date(s.date).toLocaleDateString('ko-KR')}
                                    </div>
                                </div>
                                <div className="saved-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => loadSaved(s)}>불러오기
                                    </button>
                                    <button className="btn btn-icon btn-ghost" onClick={() => deleteSaved(s.id)}>
                                        <IconTrash size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
};
