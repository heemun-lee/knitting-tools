import { IconReset } from '../components/icons';
import { useToast, Stepper, useLocal } from '../components/shared';

const StitchCalc = () => {
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
    { label: '머플러', w: 20, h: 150 },
    { label: '아기 모자', w: 38, h: 18 },
    { label: '성인 모자', w: 52, h: 22 },
    { label: '카디건 앞판', w: 25, h: 55 },
    { label: '양말 (발목)', w: 16, h: 12 }
  ];

  const reset = () => {
    setGaugeStitches(22); setGaugeRows(30); setSwatchSize(10);
    setTargetWidth(50); setTargetHeight(60);
    toast('초기 값으로 되돌렸어요');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Tool 01</div>
        <h1 className="page-title">코 계산기</h1>
        <p className="page-subtitle">게이지(샘플 뜨기)와 만들고 싶은 크기를 입력하면 필요한 코수와 단수를 알려드려요.</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">게이지 입력</h2>
              <p className="card-help">샘플 뜨기에서 측정한 값을 적어주세요.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              <IconReset size={14} stroke={2} /> 초기화
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label className="field-label">샘플 크기 <span className="field-hint">정사각형 한 변</span></label>
              <Stepper value={swatchSize} onChange={setSwatchSize} min={1} max={30} suffix="cm" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label className="field-label">샘플 코수</label>
                <Stepper value={gaugeStitches} onChange={setGaugeStitches} min={1} max={200} suffix="코" />
              </div>
              <div className="field">
                <label className="field-label">샘플 단수</label>
                <Stepper value={gaugeRows} onChange={setGaugeRows} min={1} max={200} suffix="단" />
              </div>
            </div>

            <div className="formula-box">
              <div>1cm 당 약 <strong>{stitchesPerCm.toFixed(2)}코</strong> · <strong>{rowsPerCm.toFixed(2)}단</strong></div>
            </div>

            <div className="card-head" style={{ marginTop: 8, marginBottom: 4 }}>
              <div>
                <h2 className="card-title">만들고 싶은 크기</h2>
                <p className="card-help">완성된 옷·소품의 너비와 길이를 입력하세요.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label className="field-label">너비</label>
                <Stepper value={targetWidth} onChange={setTargetWidth} min={1} max={500} suffix="cm" />
              </div>
              <div className="field">
                <label className="field-label">길이</label>
                <Stepper value={targetHeight} onChange={setTargetHeight} min={1} max={500} suffix="cm" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">자주 쓰는 크기 <span className="field-hint">탭하여 적용</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {presets.map(p => (
                  <button key={p.label} className="chip" style={{ cursor: 'pointer', height: 32, padding: '0 14px' }}
                          onClick={() => { setTargetWidth(p.w); setTargetHeight(p.h); toast(`${p.label} 크기로 설정했어요`); }}>
                    {p.label} <span style={{ color: 'var(--pink-500)', fontWeight: 600 }}>{p.w}×{p.h}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="result">
          <div className="result-stat">
            <div className="result-label">필요한 시작 코수</div>
            <div>
              <span className="result-value">{totalStitches.toLocaleString()}</span>
              <span className="result-unit">코</span>
            </div>
          </div>
          <div className="result-divider"></div>
          <div className="result-stat">
            <div className="result-label">필요한 단수</div>
            <div>
              <span className="result-value">{totalRows.toLocaleString()}</span>
              <span className="result-unit">단</span>
            </div>
          </div>
          <div className="result-divider"></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="result-stat">
              <div className="result-label">너비</div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {targetWidth} <span style={{ fontSize: 13, color: 'var(--ink-500)', fontWeight: 400 }}>cm</span>
              </div>
            </div>
            <div className="result-stat">
              <div className="result-label">길이</div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {targetHeight} <span style={{ fontSize: 13, color: 'var(--ink-500)', fontWeight: 400 }}>cm</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 14, fontSize: 12, color: 'var(--ink-600, #6c5862)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--pink-700)' }}>Tip.</strong> 도안에 따라 가장자리 마감 코수를 1~2코 더하시면 좋아요. 무늬가 있는 경우 무늬 반복의 배수에 맞춰 반올림해주세요.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StitchCalc;