import {usePatternState} from '../hooks/usePatternState';
import {PatternControls} from '../components/pattern/PatternControls';
import {PatternToolbar} from '../components/pattern/PatternToolbar';
import {PatternCanvas} from '../components/pattern/PatternCanvas';
import {PatternModals} from '../components/pattern/PatternModals';
import {IconBookmark, IconSave, IconPattern} from '../components/icons';

const PatternTool = () => {
    const state = usePatternState();

    return (
        <div className="page" style={{maxWidth: 1320}}>
            <div className="page-head"
                 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24}}>
                <div>
                    <div className="page-eyebrow">Tool 03</div>
                    <h1 className="page-title">사진 → 도안 변환</h1>
                    <p className="page-subtitle">사진을 픽셀 도안으로 변환하고, 색상 편집 · 측정 · 영역 복사 등을 자유롭게.</p>
                </div>
                <div style={{display: 'flex', gap: 10}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => state.setShowSaved(true)}>
                        <IconBookmark size={14} stroke={2}/> 불러오기 ({state.saved.length})
                    </button>
                    {state.grid && (
                        <button className="btn btn-secondary btn-sm" onClick={state.openSaveAs}>
                            <IconSave size={14} stroke={2}/> 저장
                        </button>
                    )}
                </div>
            </div>

            <div className="pattern-tool">
                {/* Left controls */}
                <PatternControls state={state}/>

                {/* Right canvas */}
                <div className={`pattern-canvas-wrap ${state.fullscreen ? 'fullscreen' : ''}`}>
                    {state.grid ? (
                        <>
                            <PatternToolbar state={state}/>
                            <PatternCanvas state={state}/>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--ink-400)',
                            textAlign: 'center',
                            padding: 40
                        }}>
                            <div>
                                <div style={{color: 'var(--pink-300)', marginBottom: 16}}>
                                    <IconPattern size={56} stroke={1.2}/>
                                </div>
                                <div
                                    style={{fontSize: 16, color: 'var(--ink-700)', fontWeight: 500, marginBottom: 6}}>아직
                                    도안이 없어요
                                </div>
                                <div style={{fontSize: 13, color: 'var(--ink-500)', maxWidth: 320, lineHeight: 1.6}}>
                                    왼쪽에서 사진을 업로드하고 코수를 정한 뒤 <strong style={{color: 'var(--pink-600)'}}>도안으로 변환</strong>을
                                    눌러주세요.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals and Overlays */}
            <PatternModals state={state}/>
        </div>
    );
};

export default PatternTool;
