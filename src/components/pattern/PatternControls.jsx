import {IconUpload, IconSparkle, IconMerge, IconTrash} from '../icons';
import {NumberField} from '../ui/NumberField';
import {luma} from '../../utils/colors';

export const PatternControls = ({state}) => {
    const {
        fileRef, onFile, imgUrl, imgEl,
        stitchCount, setStitchCount,
        rowCount,
        colorCount, setColorCount,
        convert, busy,
        palette, mergeMode, setMergeMode,
        mergeFrom, setMergeFrom,
        activeColor, setActiveColor,
        setEditingPalette, mergePalette, toast,
        grid, measurements, setMeasurements,
        selectedMeasure, setSelectedMeasure
    } = state;

    return (
        <div className="pattern-controls">
            <div className="card" style={{padding: 18}}>
                <div className="card-head" style={{marginBottom: 12}}>
                    <h2 className="card-title" style={{fontSize: 15}}>사진 업로드</h2>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display: 'none'}}/>
                <div className={`upload-zone ${imgUrl ? 'has-image' : ''}`} onClick={() => fileRef.current.click()}>
                    {imgUrl ? (
                        <img src={imgUrl} className="upload-preview" alt="원본"/>
                    ) : (
                        <>
                            <div className="upload-icon"><IconUpload size={28} stroke={1.6}/></div>
                            <div className="upload-text">사진 선택하기</div>
                            <div className="upload-sub">JPG, PNG · 클릭하여 선택</div>
                        </>
                    )}
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16}}>
                    <div className="field">
                        <label className="field-label">코수 (가로)</label>
                        <NumberField value={stitchCount} onChange={setStitchCount} suffix="코" min={4} max={400}/>
                        {imgEl && (
                            <div className="field-hint" style={{marginTop: 4}}>
                                단수는 자동으로 <strong style={{color: 'var(--pink-600)'}}>{rowCount}단</strong>으로 계산됐어요
                            </div>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">사용할 색상 수 <span className="field-hint">최대 20</span></label>
                        <NumberField value={colorCount} onChange={setColorCount} suffix="색" min={2} max={20}/>
                    </div>

                    <button className="btn btn-primary" onClick={convert} disabled={busy || !imgEl}>
                        {busy ? '변환 중...' : <><IconSparkle size={16} stroke={2}/> 도안으로 변환</>}
                    </button>
                </div>
            </div>

            {palette.length > 0 && (
                <div className="card" style={{padding: 18}}>
                    <div className="card-head" style={{marginBottom: 12}}>
                        <h2 className="card-title" style={{fontSize: 15}}>
                            색상 팔레트
                            {mergeMode &&
                                <span style={{color: 'var(--pink-500)', fontSize: 12, fontWeight: 500, marginLeft: 8}}>· 합칠 색을 선택</span>}
                        </h2>
                        <button
                            className={`tool-btn ${mergeMode ? 'active' : ''}`}
                            onClick={() => {
                                setMergeMode(m => !m);
                                setMergeFrom(null);
                            }}>
                            <IconMerge size={14}/> 합치기
                        </button>
                    </div>
                    <div className="palette-list">
                        {palette.map((p, i) => (
                            <div key={i}
                                 className={`palette-row ${activeColor === i ? 'selected' : ''} ${mergeFrom === i ? 'selected' : ''}`}>
                                <div className="swatch"
                                     style={{background: p.hex}}
                                     onClick={(e) => {
                                         if (mergeMode) {
                                             if (mergeFrom === null) {
                                                 setMergeFrom(i);
                                                 toast('합칠 대상 색을 선택하세요');
                                             } else if (mergeFrom !== i) {
                                                 mergePalette(mergeFrom, i);
                                                 setMergeFrom(null);
                                                 setMergeMode(false);
                                             }
                                         } else {
                                             setActiveColor(i);
                                             const r = e.currentTarget.getBoundingClientRect();
                                             setEditingPalette({idx: i, x: r.right + 6, y: r.top});
                                         }
                                     }}>
                                    <div className="swatch-mark"
                                         style={{color: luma(...p.rgb) > 0.5 ? '#000' : '#fff'}}>{i + 1}</div>
                                </div>
                                <div style={{flex: 1, minWidth: 0}}>
                                    <div style={{
                                        fontSize: 12,
                                        color: 'var(--ink-700)',
                                        fontWeight: 500
                                    }}>색상 {i + 1}</div>
                                    <div className="phex">{p.hex}</div>
                                </div>
                                <span className="pcount">{p.count}코</span>
                            </div>
                        ))}
                    </div>
                    {mergeMode && (
                        <button className="btn btn-ghost btn-sm" style={{marginTop: 10, width: '100%'}}
                                onClick={() => {
                                    setMergeMode(false);
                                    setMergeFrom(null);
                                }}>
                            취소
                        </button>
                    )}
                </div>
            )}

            {grid && measurements.length > 0 && (
                <div className="card" style={{padding: 18}}>
                    <div className="card-head" style={{marginBottom: 12}}>
                        <h2 className="card-title" style={{fontSize: 15}}>측정 ({measurements.length})</h2>
                        <button className="tool-btn" onClick={() => {
                            setMeasurements([]);
                            setSelectedMeasure(null);
                            toast('측정 모두 삭제');
                        }}>
                            <IconTrash size={13}/> 모두
                        </button>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto'}}>
                        {measurements.map((m, i) => {
                            const dCols = Math.abs(m.c2 - m.c1) + 1;
                            const dRows = Math.abs(m.r2 - m.r1) + 1;
                            const sel = selectedMeasure === m.id;
                            const isHoriz = m.r1 === m.r2;
                            return (
                                <div key={m.id}
                                     onClick={() => setSelectedMeasure(m.id)}
                                     style={{
                                         display: 'flex', alignItems: 'center', gap: 10,
                                         padding: '8px 10px', borderRadius: 10,
                                         background: sel ? 'var(--pink-50)' : 'var(--ink-100)',
                                         border: sel ? '1.5px solid var(--pink-400)' : '1.5px solid transparent',
                                         cursor: 'pointer'
                                     }}>
                                    <div style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        background: 'var(--pink-500)',
                                        color: 'white',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 11,
                                        fontWeight: 700
                                    }}>{i + 1}</div>
                                    <div style={{flex: 1, fontSize: 13}}>
                                        <strong>{isHoriz ? `${dCols}코` : `${dRows}단`}</strong>
                                        <span style={{color: 'var(--ink-500)', marginLeft: 6, fontSize: 11}}>
                      {isHoriz ? '가로' : '세로'}
                    </span>
                                    </div>
                                    <button className="picon-btn"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setMeasurements(ms => ms.filter(x => x.id !== m.id));
                                                if (sel) setSelectedMeasure(null);
                                            }}>
                                        <IconTrash size={13}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
