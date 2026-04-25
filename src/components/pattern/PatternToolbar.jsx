import {
    IconBrush, IconBucket, IconEyedrop, IconRulerLine, IconSelect,
    IconCopy, IconScissors, IconPaste, IconMove, IconUndo, IconRedo,
    IconMinus, IconPlus, IconFit, IconMaximize, IconMinimize,
    IconCrosshair, IconDownload, IconFileExcel, IconFilePdf, IconTrash
} from '../icons';
import {exportPNG, exportCSV, exportPDF} from '../../utils/export';

export const PatternToolbar = ({state}) => {
    const {
        tool, setTool, setSelection, selection, copySelection, cutSelection, clipboard, pasteClipboard,
        moveSelectionToFloating, selectedMeasure, deleteSelectedMeasure, undo, history, redo, redoStack,
        setPixelScale, pixelScale, fitScale, fullscreen, setFullscreen, trackerOn, setTrackerOn,
        grid, palette, canvasRef, toast
    } = state;

    return (
        <div className="pattern-toolbar">
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === 'brush' ? 'active' : ''}`} onClick={() => {
                    setTool('brush');
                    setSelection(null);
                }}>
                    <IconBrush size={14}/> 브러시
                </button>
                <button className={`tool-btn ${tool === 'bucket' ? 'active' : ''}`} onClick={() => {
                    setTool('bucket');
                    setSelection(null);
                }}>
                    <IconBucket size={14}/> 채우기
                </button>
                <button className={`tool-btn ${tool === 'eyedrop' ? 'active' : ''}`} onClick={() => {
                    setTool('eyedrop');
                    setSelection(null);
                }}>
                    <IconEyedrop size={14}/> 스포이드
                </button>
            </div>

            <div className="toolbar-group">
                <button className={`tool-btn ${tool === 'measure' ? 'active' : ''}`} onClick={() => {
                    setTool('measure');
                    setSelection(null);
                }}>
                    <IconRulerLine size={14}/> 측정
                </button>
                <button className={`tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')}>
                    <IconSelect size={14}/> 선택
                </button>
            </div>

            {tool === 'select' && (
                <div className="toolbar-group">
                    <button className="tool-btn" disabled={!selection} onClick={copySelection}>
                        <IconCopy size={13}/> 복사
                    </button>
                    <button className="tool-btn" disabled={!selection} onClick={cutSelection}>
                        <IconScissors size={13}/> 자르기
                    </button>
                    <button className="tool-btn" disabled={!clipboard} onClick={pasteClipboard}>
                        <IconPaste size={13}/> 붙여넣기
                    </button>
                    <button className="tool-btn" disabled={!selection} onClick={moveSelectionToFloating}>
                        <IconMove size={13}/> 이동
                    </button>
                </div>
            )}

            {tool === 'measure' && selectedMeasure && (
                <button className="tool-btn" onClick={deleteSelectedMeasure}
                        style={{color: 'var(--pink-600)'}}>
                    <IconTrash size={13}/> 측정 삭제
                </button>
            )}

            <div className="toolbar-group">
                <button className="tool-btn" onClick={undo} disabled={history.length === 0}>
                    <IconUndo size={14}/>
                </button>
                <button className="tool-btn" onClick={redo} disabled={redoStack.length === 0}>
                    <IconRedo size={14}/>
                </button>
            </div>

            <div className="toolbar-group">
                <button className="tool-btn" onClick={() => setPixelScale(s => Math.max(2, s - 1))}>
                    <IconMinus size={14}/>
                </button>
                <span style={{
                    fontSize: 12,
                    color: 'var(--ink-500)',
                    padding: '0 6px',
                    minWidth: 32,
                    textAlign: 'center'
                }}>{pixelScale}×</span>
                <button className="tool-btn" onClick={() => setPixelScale(s => Math.min(40, s + 1))}>
                    <IconPlus size={14}/>
                </button>
                <button className="tool-btn" onClick={fitScale}>
                    <IconFit size={14}/> 맞춤
                </button>
                <button className={`tool-btn ${fullscreen ? 'active' : ''}`} onClick={() => setFullscreen(f => !f)}>
                    {fullscreen ? <IconMinimize size={14}/> : <IconMaximize size={14}/>}
                </button>
            </div>

            <div className="toolbar-group">
                <button className={`tool-btn ${trackerOn ? 'active' : ''}`} onClick={() => setTrackerOn(t => !t)}>
                    <IconCrosshair size={14}/> 트래커
                </button>
            </div>

            <div style={{marginLeft: 'auto', display: 'flex', gap: 6}}>
                <button className="tool-btn" onClick={() => exportPNG(canvasRef, toast)}><IconDownload size={14}/> PNG
                </button>
                <button className="tool-btn" onClick={() => exportCSV(grid, palette, toast)}><IconFileExcel
                    size={14}/> CSV
                </button>
                <button className="tool-btn" onClick={() => exportPDF(grid, palette, canvasRef, toast)}><IconFilePdf
                    size={14}/> PDF
                </button>
            </div>
        </div>
    );
};
