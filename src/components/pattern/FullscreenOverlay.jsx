import {
    IconBrush, IconBucket, IconEyedrop, IconRulerLine, IconSelect,
    IconCopy, IconScissors, IconPaste, IconMove, IconUndo, IconRedo,
    IconMinimize, IconFit, IconCrosshair, IconTrash,
    IconDownload, IconFileExcel, IconFilePdf,
    IconPlus, IconMinus, IconChevronRight, IconChevronLeft
} from '../icons';
import {useTranslation} from 'react-i18next';
import {exportPNG, exportCSV, exportPDF} from '../../utils/export';
import {luma} from '../../utils/colors';

// Toolbar button for tool selection — compact, icon only on small size
const TB = ({active, onClick, disabled, children, title}) => (
    <button
        className={`tool-btn ${active ? 'active' : ''}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{padding: '0 10px'}}
    >
        {children}
    </button>
);

export const FullscreenOverlay = ({state}) => {
    const {t} = useTranslation();
    const {
        tool, setTool, setSelection, selection, copySelection, cutSelection, clipboard, pasteClipboard,
        moveSelectionToFloating, selectedMeasure, deleteSelectedMeasure, undo, history, redo, redoStack,
        setFullscreen, trackerOn, setTrackerOn,
        grid, palette, pixelScale, toast,
        viewZoom, viewZoomRef, canvasRef, zoomAround, resetZoom,
        showPalettePanel, setShowPalettePanel,
        activeColor, setActiveColor, setEditingPalette,
    } = state;

    const zoomBtn = (factor) => {
        const el = canvasRef.current;
        if (!el) return;
        const dpr = window.devicePixelRatio || 1;
        zoomAround((el.clientWidth / 2) * dpr, (el.clientHeight / 2) * dpr, viewZoomRef.current * factor);
    };

    return (
        <div className="fullscreen-overlay">
            {/* Floating toolbar — left side */}
            <div className="fs-toolbar">
                {/* Drawing tools */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB active={tool === 'brush'} onClick={() => { setTool('brush'); setSelection(null); }} title={t('pattern_toolbar.brush')}>
                        <IconBrush size={16}/>
                    </TB>
                    <TB active={tool === 'bucket'} onClick={() => { setTool('bucket'); setSelection(null); }} title={t('pattern_toolbar.fill')}>
                        <IconBucket size={16}/>
                    </TB>
                    <TB active={tool === 'eyedrop'} onClick={() => { setTool('eyedrop'); setSelection(null); }} title={t('pattern_toolbar.eyedrop')}>
                        <IconEyedrop size={16}/>
                    </TB>
                </div>

                {/* Measure & Select */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB active={tool === 'measure'} onClick={() => { setTool('measure'); setSelection(null); }} title={t('pattern_toolbar.measure')}>
                        <IconRulerLine size={16}/>
                    </TB>
                    <TB active={tool === 'select'} onClick={() => setTool('select')} title={t('pattern_toolbar.select')}>
                        <IconSelect size={16}/>
                    </TB>
                </div>

                {/* Select sub-tools */}
                {tool === 'select' && (
                    <div className="toolbar-group" style={{flexDirection: 'column'}}>
                        <TB disabled={!selection} onClick={copySelection} title={t('pattern_toolbar.copy')}>
                            <IconCopy size={15}/>
                        </TB>
                        <TB disabled={!selection} onClick={cutSelection} title={t('pattern_toolbar.cut')}>
                            <IconScissors size={15}/>
                        </TB>
                        <TB disabled={!clipboard} onClick={pasteClipboard} title={t('pattern_toolbar.paste')}>
                            <IconPaste size={15}/>
                        </TB>
                        <TB disabled={!selection} onClick={moveSelectionToFloating} title={t('pattern_toolbar.move')}>
                            <IconMove size={15}/>
                        </TB>
                    </div>
                )}

                {/* Measure delete */}
                {tool === 'measure' && selectedMeasure && (
                    <div className="toolbar-group" style={{flexDirection: 'column'}}>
                        <TB onClick={deleteSelectedMeasure} title={t('pattern_toolbar.measure_del')} style={{color: 'var(--pink-600)'}}>
                            <IconTrash size={15}/>
                        </TB>
                    </div>
                )}

                {/* Undo / Redo */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB disabled={history.length === 0} onClick={undo} title="Undo">
                        <IconUndo size={16}/>
                    </TB>
                    <TB disabled={redoStack.length === 0} onClick={redo} title="Redo">
                        <IconRedo size={16}/>
                    </TB>
                </div>

                {/* Tracker */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB active={trackerOn} onClick={() => setTrackerOn(t => !t)} title={t('pattern_toolbar.tracker')}>
                        <IconCrosshair size={16}/>
                    </TB>
                </div>

                {/* Palette toggle */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB active={showPalettePanel} onClick={() => setShowPalettePanel(p => !p)} title="팔레트">
                        <span style={{
                            display: 'flex', gap: 2, flexWrap: 'wrap', width: 16, height: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            {palette.slice(0, 4).map((p, i) => (
                                <span key={i} style={{
                                    width: 6, height: 6, borderRadius: 2,
                                    background: p.hex, border: '1px solid rgba(0,0,0,0.1)'
                                }}/>
                            ))}
                        </span>
                    </TB>
                </div>

                {/* Export */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB onClick={() => exportPNG(grid, palette, pixelScale, toast)} title="PNG">
                        <IconDownload size={15}/>
                    </TB>
                    <TB onClick={() => exportCSV(grid, palette, toast)} title="CSV">
                        <IconFileExcel size={15}/>
                    </TB>
                    <TB onClick={() => exportPDF(grid, palette, pixelScale, toast)} title="PDF">
                        <IconFilePdf size={15}/>
                    </TB>
                </div>

                {/* Exit fullscreen */}
                <div className="toolbar-group" style={{flexDirection: 'column'}}>
                    <TB onClick={() => setFullscreen(false)} title="전체화면 종료">
                        <IconMinimize size={16}/>
                    </TB>
                </div>
            </div>

            {/* Zoom controls — bottom right */}
            <div className="fs-zoom">
                <button className="tool-btn" onClick={() => zoomBtn(0.8)}>
                    <IconMinus size={14}/>
                </button>
                <span className="zoom-pct">{Math.round(viewZoom * 100)}%</span>
                <button className="tool-btn" onClick={() => zoomBtn(1.25)}>
                    <IconPlus size={14}/>
                </button>
                <button className="tool-btn" onClick={resetZoom} title="화면에 맞추기">
                    <IconFit size={14}/>
                </button>
            </div>

            {/* Palette slide-out panel — right side */}
            <div className={`fs-palette-panel ${showPalettePanel ? 'open' : ''}`}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12
                }}>
                    <span style={{fontSize: 14, fontWeight: 600, color: 'var(--ink-700)'}}>팔레트</span>
                    <button className="tool-btn" onClick={() => setShowPalettePanel(false)}
                            style={{padding: '0 8px'}}>
                        <IconChevronRight size={14}/>
                    </button>
                </div>

                <div className="palette-list">
                    {palette.map((p, i) => (
                        <div key={i}
                             className={`palette-row ${activeColor === i ? 'selected' : ''}`}
                             onClick={() => setActiveColor(i)}>
                            <div className="swatch"
                                 style={{background: p.hex}}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     setActiveColor(i);
                                     const r = e.currentTarget.getBoundingClientRect();
                                     setEditingPalette({idx: i, x: r.right + 6, y: r.top});
                                 }}>
                                <div className="swatch-mark"
                                     style={{color: luma(...p.rgb) > 0.5 ? '#000' : '#fff'}}>{i + 1}</div>
                            </div>
                            <div style={{flex: 1, minWidth: 0}}>
                                <div style={{fontSize: 12, color: 'var(--ink-700)', fontWeight: 500}}>
                                    색상 {i + 1}
                                </div>
                                <div className="phex">{p.hex}</div>
                            </div>
                            <span className="pcount">{p.count}코</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Palette panel backdrop (closes panel on tap outside) */}
            {showPalettePanel && (
                <div
                    style={{position: 'absolute', inset: 0, zIndex: 9}}
                    onClick={() => setShowPalettePanel(false)}
                />
            )}
        </div>
    );
};
