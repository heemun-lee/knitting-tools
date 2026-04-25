import {IconReset} from '../components/icons';
import {useToast} from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import {useLocal} from '../hooks/useLocal';
import {Stepper} from '../components/ui/Stepper';

const StitchCalc = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [gaugeStitches, setGaugeStitches] = useLocal('kt.stitch.gs', 22);
    const [gaugeRows, setGaugeRows] = useLocal('kt.stitch.gr', 30);
    const [swatchSize, setSwatchSize] = useLocal('kt.stitch.sw', 10);
    const [targetWidth, setTargetWidth] = useLocal('kt.stitch.tw', 50);
    const [targetHeight, setTargetHeight] = useLocal('kt.stitch.th', 60);

    const stitchesPerCm = gaugeStitches / swatchSize;
    const rowsPerCm = gaugeRows / swatchSize;
    const totalStitches = Math.round(stitchesPerCm * targetWidth);
    const totalRows = Math.round(rowsPerCm * targetHeight);

    const presets = [
        {label: t('stitch_calc.preset_muffler'), w: 20, h: 150},
        {label: t('stitch_calc.preset_baby_hat'), w: 38, h: 18},
        {label: t('stitch_calc.preset_adult_hat'), w: 52, h: 22},
        {label: t('stitch_calc.preset_cardigan'), w: 25, h: 55},
        {label: t('stitch_calc.preset_socks'), w: 16, h: 12}
    ];

    const reset = () => {
        setGaugeStitches(22);
        setGaugeRows(30);
        setSwatchSize(10);
        setTargetWidth(50);
        setTargetHeight(60);
        toast(t('stitch_calc.msg_reset'));
    };

    return (
        <div className="page">
            <div className="page-head">
                <div className="page-eyebrow">Tool 01</div>
                <h1 className="page-title">{t('stitch_calc.title')}</h1>
                <p className="page-subtitle">{t('stitch_calc.subtitle')}</p>
            </div>

            <div className="two-col">
                <div className="card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">{t('stitch_calc.gauge_input')}</h2>
                            <p className="card-help">{t('stitch_calc.gauge_input_help')}</p>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={reset}>
                            <IconReset size={14} stroke={2}/> {t('stitch_calc.reset')}
                        </button>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
                        <div className="field">
                            <label className="field-label">{t('stitch_calc.swatch_size')} <span className="field-hint">{t('stitch_calc.swatch_size_hint')}</span></label>
                            <Stepper value={swatchSize} onChange={setSwatchSize} min={1} max={30} suffix={t('stitch_calc.unit_cm')}/>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
                            <div className="field">
                                <label className="field-label">{t('stitch_calc.gauge_stitches')}</label>
                                <Stepper value={gaugeStitches} onChange={setGaugeStitches} min={1} max={200}
                                         suffix={t('stitch_calc.unit_stitches')}/>
                            </div>
                            <div className="field">
                                <label className="field-label">{t('stitch_calc.gauge_rows')}</label>
                                <Stepper value={gaugeRows} onChange={setGaugeRows} min={1} max={200} suffix={t('stitch_calc.unit_rows')}/>
                            </div>
                        </div>

                        <div className="formula-box">
                            <div>{t('stitch_calc.formula_per_cm')}<strong>{stitchesPerCm.toFixed(2)}{t('stitch_calc.unit_stitches')}</strong> · <strong>{rowsPerCm.toFixed(2)}{t('stitch_calc.unit_rows')}</strong></div>
                        </div>

                        <div className="card-head" style={{marginTop: 8, marginBottom: 4}}>
                            <div>
                                <h2 className="card-title">{t('stitch_calc.target_size')}</h2>
                                <p className="card-help">{t('stitch_calc.target_size_help')}</p>
                            </div>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
                            <div className="field">
                                <label className="field-label">{t('stitch_calc.width')}</label>
                                <Stepper value={targetWidth} onChange={setTargetWidth} min={1} max={500} suffix={t('stitch_calc.unit_cm')}/>
                            </div>
                            <div className="field">
                                <label className="field-label">{t('stitch_calc.height')}</label>
                                <Stepper value={targetHeight} onChange={setTargetHeight} min={1} max={500} suffix={t('stitch_calc.unit_cm')}/>
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">{t('stitch_calc.presets')} <span className="field-hint">{t('stitch_calc.presets_hint')}</span></label>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                                {presets.map(p => (
                                    <button key={p.label} className="chip"
                                            style={{cursor: 'pointer', height: 32, padding: '0 14px'}}
                                            onClick={() => {
                                                setTargetWidth(p.w);
                                                setTargetHeight(p.h);
                                                toast(t('stitch_calc.msg_preset', {label: p.label}));
                                            }}>
                                        {p.label} <span
                                        style={{color: 'var(--pink-500)', fontWeight: 600}}>{p.w}×{p.h}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="result">
                    <div className="result-stat">
                        <div className="result-label">{t('stitch_calc.req_start_stitches')}</div>
                        <div>
                            <span className="result-value">{totalStitches.toLocaleString()}</span>
                            <span className="result-unit">{t('stitch_calc.unit_stitches')}</span>
                        </div>
                    </div>
                    <div className="result-divider"></div>
                    <div className="result-stat">
                        <div className="result-label">{t('stitch_calc.req_rows')}</div>
                        <div>
                            <span className="result-value">{totalRows.toLocaleString()}</span>
                            <span className="result-unit">{t('stitch_calc.unit_rows')}</span>
                        </div>
                    </div>
                    <div className="result-divider"></div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
                        <div className="result-stat">
                            <div className="result-label">{t('stitch_calc.width')}</div>
                            <div style={{fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600}}>
                                {targetWidth} <span
                                style={{fontSize: 13, color: 'var(--ink-500)', fontWeight: 400}}>cm</span>
                            </div>
                        </div>
                        <div className="result-stat">
                            <div className="result-label">{t('stitch_calc.height')}</div>
                            <div style={{fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600}}>
                                {targetHeight} <span
                                style={{fontSize: 13, color: 'var(--ink-500)', fontWeight: 400}}>cm</span>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 12,
                        color: 'var(--ink-600, #6c5862)',
                        lineHeight: 1.6
                    }}>
                        <strong style={{color: 'var(--pink-700)'}}>{t('stitch_calc.tip_strong')}</strong>{t('stitch_calc.tip_desc')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StitchCalc;