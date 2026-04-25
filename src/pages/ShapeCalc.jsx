import {useMemo} from 'react';
import {IconSparkle} from '../components/icons';
import {useToast} from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import {useLocal} from '../hooks/useLocal';
import {Stepper} from '../components/ui/Stepper';

const ShapeCalc = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [startStitches, setStartStitches] = useLocal('kt.shape.start', 80);
    const [endStitches, setEndStitches] = useLocal('kt.shape.end', 60);
    const [totalRows, setTotalRows] = useLocal('kt.shape.rows', 40);
    const [stitchesPerStep, setStitchesPerStep] = useLocal('kt.shape.step', 2);

    const diff = startStitches - endStitches;
    const isDecrease = diff > 0;
    const absDiff = Math.abs(diff);
    const numSteps = Math.floor(absDiff / stitchesPerStep);
    const remainder = absDiff - (numSteps * stitchesPerStep);

    const schedule = useMemo(() => {
        if (numSteps === 0 || totalRows === 0) return [];
        const base = Math.floor(totalRows / numSteps);
        const extras = totalRows - (base * numSteps);
        const intervals = [];
        for (let i = 0; i < numSteps; i++) {
            const isExtra = Math.floor(((i + 1) * extras) / numSteps) > Math.floor((i * extras) / numSteps);
            intervals.push(isExtra ? base + 1 : base);
        }
        let cum = 0;
        return intervals.map((iv, idx) => {
            cum += iv;
            return {idx: idx + 1, atRow: cum, interval: iv};
        });
    }, [numSteps, totalRows]);

    const grouped = useMemo(() => {
        if (schedule.length === 0) return [];
        const groups = [];
        let curr = {interval: schedule[0].interval, count: 1};
        for (let i = 1; i < schedule.length; i++) {
            if (schedule[i].interval === curr.interval) curr.count++;
            else {
                groups.push(curr);
                curr = {interval: schedule[i].interval, count: 1};
            }
        }
        groups.push(curr);
        return groups;
    }, [schedule]);

    return (
        <div className="page">
            <div className="page-head">
                <div className="page-eyebrow">Tool 02</div>
                <h1 className="page-title">{t('shape_calc.title')}</h1>
                <p className="page-subtitle">{t('shape_calc.subtitle')}</p>
            </div>

            <div className="two-col">
                <div className="card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">{t('shape_calc.input_cond')}</h2>
                            <p className="card-help">{t('shape_calc.input_cond_help')}</p>
                        </div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
                            <div className="field">
                                <label className="field-label">{t('shape_calc.start_stitches')}</label>
                                <Stepper value={startStitches} onChange={setStartStitches} min={1} max={500}
                                         suffix={t('shape_calc.unit_stitches')}/>
                            </div>
                            <div className="field">
                                <label className="field-label">{t('shape_calc.end_stitches')}</label>
                                <Stepper value={endStitches} onChange={setEndStitches} min={1} max={500} suffix={t('shape_calc.unit_stitches')}/>
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">{t('shape_calc.work_rows')} <span className="field-hint">{t('shape_calc.work_rows_hint')}</span></label>
                            <Stepper value={totalRows} onChange={setTotalRows} min={1} max={500} suffix={t('shape_calc.unit_rows')}/>
                        </div>

                        <div className="field">
                            <label className="field-label">{t('shape_calc.stitches_per_step')} <span className="field-hint">{t('shape_calc.stitches_per_step_hint')}</span></label>
                            <Stepper value={stitchesPerStep} onChange={setStitchesPerStep} min={1} max={20} suffix={t('shape_calc.unit_stitches')}/>
                        </div>

                        <div className="formula-box">
                            {diff === 0 ? (
                                <div>{t('shape_calc.no_change')}</div>
                            ) : (
                                <div>
                                    {t('shape_calc.total')}<strong>{absDiff}{t('shape_calc.unit_stitches')}</strong>{isDecrease ? t('shape_calc.decrease') : t('shape_calc.increase')}{t('shape_calc.do')}
                                    &nbsp;{t('shape_calc.step_each', {stitches: stitchesPerStep})}<strong>{numSteps}{t('shape_calc.times')}</strong>
                                    {remainder > 0 &&
                                        <span style={{color: 'var(--ink-500)'}}>{t('shape_calc.remainder', {remainder})}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">{isDecrease ? t('shape_calc.guide_dec') : t('shape_calc.guide_inc')}</h2>
                            <p className="card-help">{t('shape_calc.guide_help')}</p>
                        </div>
                        <span className="chip">{isDecrease ? t('shape_calc.chip_dec') : t('shape_calc.chip_inc')}</span>
                    </div>

                    {grouped.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon"><IconSparkle size={28}/></div>
                            {t('shape_calc.empty_guide')}
                        </div>
                    ) : (
                        <>
                            <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18}}>
                                {grouped.map((g, i) => (
                                    <div key={i} style={{
                                        background: 'var(--pink-50)',
                                        border: '1px solid var(--pink-200)',
                                        borderRadius: 'var(--r-md)',
                                        padding: '14px 18px',
                                        display: 'flex', alignItems: 'center', gap: 14
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10,
                                            background: 'var(--pink-500)', color: 'white',
                                            display: 'grid', placeItems: 'center',
                                            fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)'
                                        }}>{i + 1}</div>
                                        <div style={{flex: 1, fontSize: 14, color: 'var(--ink-900)'}}>
                                            <strong>{t('shape_calc.every_rows', {interval: g.interval})}</strong> {isDecrease ? t('shape_calc.step_dec', {stitches: stitchesPerStep}) : t('shape_calc.step_inc', {stitches: stitchesPerStep})}
                                            <span style={{color: 'var(--ink-500)'}}>{t('shape_calc.times_count', {count: g.count})}</span>
                                        </div>
                                        <div style={{fontSize: 12, color: 'var(--ink-500)'}}>
                                            {t('shape_calc.total_rows', {rows: g.interval * g.count})}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{borderTop: '1px solid var(--ink-100)', paddingTop: 16}}>
                                <div style={{
                                    fontSize: 12,
                                    color: 'var(--ink-400)',
                                    fontWeight: 600,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    marginBottom: 10
                                }}>
                                    {t('shape_calc.row_details')}
                                </div>
                                <div style={{
                                    maxHeight: 240,
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    paddingRight: 4
                                }}>
                                    {schedule.map((s, i) => {
                                        const cum = (i + 1) * stitchesPerStep;
                                        const remaining = isDecrease ? startStitches - cum : startStitches + cum;
                                        return (
                                            <div key={i} className="dist-row"
                                                 style={{borderBottom: 'none', padding: '6px 0'}}>
                                                <div className="row-label">{t('shape_calc.round_idx', {idx: s.idx})}</div>
                                                <div style={{fontSize: 13}}>
                                                    <strong>{t('shape_calc.at_row', {row: s.atRow})}</strong>{t('shape_calc.from_at_row')} {isDecrease ? t('shape_calc.step_dec', {stitches: stitchesPerStep}) : t('shape_calc.step_inc', {stitches: stitchesPerStep})}
                                                </div>
                                                <div className="row-value"
                                                     style={{fontSize: 12, color: 'var(--ink-500)', fontWeight: 500}}>
                                                    {t('shape_calc.to_stitches', {remaining})}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShapeCalc;
