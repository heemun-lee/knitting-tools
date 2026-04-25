import {useMemo} from 'react';
import {IconSparkle} from '../components/icons';
import {useToast} from '../hooks/useToast';
import {useLocal} from '../hooks/useLocal';
import {Stepper} from '../components/ui/Stepper';

const ShapeCalc = () => {
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
                <h1 className="page-title">줄임 · 늘림 분배기</h1>
                <p className="page-subtitle">시작 코수와 마지막 코수, 그리고 작업할 단수를 입력하면 균등하게 분배된 작업 가이드를 만들어드려요.</p>
            </div>

            <div className="two-col">
                <div className="card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">조건 입력</h2>
                            <p className="card-help">소매·진동 등 점진적인 코수 변화에 사용하세요.</p>
                        </div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
                            <div className="field">
                                <label className="field-label">시작 코수</label>
                                <Stepper value={startStitches} onChange={setStartStitches} min={1} max={500}
                                         suffix="코"/>
                            </div>
                            <div className="field">
                                <label className="field-label">마지막 코수</label>
                                <Stepper value={endStitches} onChange={setEndStitches} min={1} max={500} suffix="코"/>
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">작업할 단수 <span className="field-hint">시작에서 끝까지</span></label>
                            <Stepper value={totalRows} onChange={setTotalRows} min={1} max={500} suffix="단"/>
                        </div>

                        <div className="field">
                            <label className="field-label">한 번에 변화하는 코수 <span
                                className="field-hint">양 옆 합계</span></label>
                            <Stepper value={stitchesPerStep} onChange={setStitchesPerStep} min={1} max={20} suffix="코"/>
                        </div>

                        <div className="formula-box">
                            {diff === 0 ? (
                                <div>시작과 끝 코수가 같아요. 변화가 필요하지 않아요.</div>
                            ) : (
                                <div>
                                    총 <strong>{absDiff}코</strong>를 {isDecrease ? '줄여야' : '늘려야'} 해요.
                                    &nbsp;한 번에 {stitchesPerStep}코씩 → <strong>{numSteps}회</strong>
                                    {remainder > 0 &&
                                        <span style={{color: 'var(--ink-500)'}}> · {remainder}코 나머지</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-head">
                        <div>
                            <h2 className="card-title">{isDecrease ? '줄임' : '늘림'} 분배 가이드</h2>
                            <p className="card-help">아래 순서대로 작업하시면 균등하게 분배됩니다.</p>
                        </div>
                        <span className="chip">{isDecrease ? '⌄ 줄임' : '⌃ 늘림'}</span>
                    </div>

                    {grouped.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon"><IconSparkle size={28}/></div>
                            조건을 입력하면 분배 가이드가 나타나요
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
                                            <strong>{g.interval}단마다</strong> {stitchesPerStep}코 {isDecrease ? '줄임' : '늘림'}
                                            <span style={{color: 'var(--ink-500)'}}> × {g.count}회</span>
                                        </div>
                                        <div style={{fontSize: 12, color: 'var(--ink-500)'}}>
                                            총 {g.interval * g.count}단
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
                                    단별 상세
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
                                                <div className="row-label">{s.idx}회차</div>
                                                <div style={{fontSize: 13}}>
                                                    <strong>{s.atRow}단</strong>에서 {stitchesPerStep}코 {isDecrease ? '줄임' : '늘림'}
                                                </div>
                                                <div className="row-value"
                                                     style={{fontSize: 12, color: 'var(--ink-500)', fontWeight: 500}}>
                                                    → {remaining}코
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
