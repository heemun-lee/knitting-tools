import {IconUpload, IconSparkle, IconMerge, IconTrash} from '../icons';
import { useTranslation } from 'react-i18next';
import {NumberField} from '../ui/NumberField';
import {luma} from '../../utils/colors';

export const PatternControls = ({state}) => {
    const { t } = useTranslation();
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
                    <h2 className="card-title" style={{fontSize: 15}}>{t('pattern_controls.photo_upload')}</h2>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display: 'none'}}/>
                <div className={`upload-zone ${imgUrl ? 'has-image' : ''}`} onClick={() => fileRef.current.click()}>
                    {imgUrl ? (
                        <img src={imgUrl} className="upload-preview" alt="Original"/>
                    ) : (
                        <>
                            <div className="upload-icon"><IconUpload size={28} stroke={1.6}/></div>
                            <div className="upload-text">{t('pattern_controls.select_photo')}</div>
                            <div className="upload-sub">{t('pattern_controls.photo_format')}</div>
                        </>
                    )}
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16}}>
                    <div className="field">
                        <label className="field-label">{t('pattern_controls.stitch_count_w')}</label>
                        <NumberField value={stitchCount} onChange={setStitchCount} suffix={t('pattern_controls.unit_stitches')} min={4} max={400}/>
                        {imgEl && (
                            <div className="field-hint" style={{marginTop: 4}}>
                                {t('pattern_controls.rows_auto_calc')}<strong style={{color: 'var(--pink-600)'}}>{rowCount}{t('pattern_controls.rows_auto_calc2')}</strong>{t('pattern_controls.rows_auto_calc3')}
                            </div>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">{t('pattern_controls.color_count')} <span className="field-hint">{t('pattern_controls.color_count_hint')}</span></label>
                        <NumberField value={colorCount} onChange={setColorCount} suffix={t('pattern_controls.unit_colors')} min={2} max={20}/>
                    </div>

                    <button className="btn btn-primary" onClick={convert} disabled={busy || !imgEl}>
                        {busy ? t('pattern_controls.converting') : <><IconSparkle size={16} stroke={2}/> {t('pattern_controls.convert_btn')}</>}
                    </button>
                </div>
            </div>

            {palette.length > 0 && (
                <div className="card" style={{padding: 18}}>
                    <div className="card-head" style={{marginBottom: 12}}>
                        <h2 className="card-title" style={{fontSize: 15}}>
                            {t('pattern_controls.palette')}
                            {mergeMode &&
                                <span style={{color: 'var(--pink-500)', fontSize: 12, fontWeight: 500, marginLeft: 8}}>{t('pattern_controls.select_color_merge')}</span>}
                        </h2>
                        <button
                            className={`tool-btn ${mergeMode ? 'active' : ''}`}
                            onClick={() => {
                                setMergeMode(m => !m);
                                setMergeFrom(null);
                            }}>
                            <IconMerge size={14}/> {t('pattern_controls.merge')}
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
                                                 toast(t('pattern_controls.msg_select_merge'));
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
                                    }}>{t('pattern_controls.color')} {i + 1}</div>
                                    <div className="phex">{p.hex}</div>
                                </div>
                                <span className="pcount">{p.count}{t('pattern_controls.unit_stitches')}</span>
                            </div>
                        ))}
                    </div>
                    {mergeMode && (
                        <button className="btn btn-ghost btn-sm" style={{marginTop: 10, width: '100%'}}
                                onClick={() => {
                                    setMergeMode(false);
                                    setMergeFrom(null);
                                }}>
                            {t('pattern_controls.cancel')}
                        </button>
                    )}
                </div>
            )}

            {grid && measurements.length > 0 && (
                <div className="card" style={{padding: 18}}>
                    <div className="card-head" style={{marginBottom: 12}}>
                        <h2 className="card-title" style={{fontSize: 15}}>{t('pattern_controls.measurements', {count: measurements.length})}</h2>
                        <button className="tool-btn" onClick={() => {
                            setMeasurements([]);
                            setSelectedMeasure(null);
                            toast(t('pattern_controls.msg_measure_del'));
                        }}>
                            <IconTrash size={13}/> {t('pattern_controls.all')}
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
                                        <strong>{isHoriz ? `${dCols}${t('pattern_controls.unit_stitches')}` : `${dRows}${t('pattern_controls.unit_rows')}`}</strong>
                                        <span style={{color: 'var(--ink-500)', marginLeft: 6, fontSize: 11}}>
                      {isHoriz ? t('pattern_controls.horiz') : t('pattern_controls.vert')}
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
