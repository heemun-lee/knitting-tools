import { useTranslation } from 'react-i18next';
import {usePatternState} from '../hooks/usePatternState';
import {PatternControls} from '../components/pattern/PatternControls';
import {PatternToolbar} from '../components/pattern/PatternToolbar';
import {PatternCanvas} from '../components/pattern/PatternCanvas';
import {PatternModals} from '../components/pattern/PatternModals';
import {FullscreenOverlay} from '../components/pattern/FullscreenOverlay';
import {IconBookmark, IconSave, IconPattern} from '../components/icons';

const PatternTool = () => {
    const { t } = useTranslation();
    const state = usePatternState();

    return (
        <div className="page" style={{maxWidth: 1320}}>
            <div className="page-head"
                 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24}}>
                <div>
                    <div className="page-eyebrow">Tool 03</div>
                    <h1 className="page-title">{t('pattern_tool.title')}</h1>
                    <p className="page-subtitle">{t('pattern_tool.subtitle')}</p>
                </div>
                <div style={{display: 'flex', gap: 10}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => state.setShowSaved(true)}>
                        <IconBookmark size={14} stroke={2}/> {t('pattern_tool.load', { count: state.saved.length })}
                    </button>
                    {state.grid && (
                        <button className="btn btn-secondary btn-sm" onClick={state.openSaveAs}>
                            <IconSave size={14} stroke={2}/> {t('pattern_tool.save')}
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
                            {!state.fullscreen && <PatternToolbar state={state}/>}
                            <PatternCanvas state={state}/>
                            {state.fullscreen && <FullscreenOverlay state={state}/>}
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
                                    style={{fontSize: 16, color: 'var(--ink-700)', fontWeight: 500, marginBottom: 6}}>{t('pattern_tool.no_pattern')}
                                </div>
                                <div style={{fontSize: 13, color: 'var(--ink-500)', maxWidth: 320, lineHeight: 1.6}}>
                                    {t('pattern_tool.no_pattern_desc1')}<strong style={{color: 'var(--pink-600)'}}>{t('pattern_tool.no_pattern_desc2')}</strong>{t('pattern_tool.no_pattern_desc3')}
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
