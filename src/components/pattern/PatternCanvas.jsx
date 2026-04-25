import {useEffect} from 'react';
import {PX_W, PX_H} from '../../utils/colors';
import {G_LEFT, G_RIGHT, G_TOP, G_BOTTOM} from '../../hooks/usePatternState';
import { useTranslation } from 'react-i18next';
import {IconCheck, IconMinus, IconPlus, IconReset} from '../icons';

export const PatternCanvas = ({state}) => {
    const { t } = useTranslation();
    const {
        grid, palette, pixelScale, fullscreen,
        trackerOn, trackerRow, setTrackerRow,
        measurements, measureDraft, selection, selectDraft, floating,
        selectedMeasure,
        canvasRef, canvasAreaRef,
        viewZoom, viewPanX, viewPanY,
        viewZoomRef,
        drawTick, setDrawTick,
        containerSizeRef,
        resetZoom, zoomAround,
        onPointerDown, onPointerMove, onPointerUp,
        commitFloating, setFloating, undo
    } = state;

    // ── Resize observer: keeps canvas sized to its container ────────────────
    useEffect(() => {
        const area = canvasAreaRef.current;
        if (!area) return;
        const ro = new ResizeObserver(() => {
            setDrawTick(t => t + 1);
        });
        ro.observe(area);
        return () => ro.disconnect();
    }, [canvasAreaRef, setDrawTick]);

    // ── Wheel zoom (non-passive so we can preventDefault) ───────────────────
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const pivotX = (e.clientX - rect.left) * dpr;
            const pivotY = (e.clientY - rect.top) * dpr;
            // e.ctrlKey true = trackpad pinch gesture on macOS
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            zoomAround(pivotX, pivotY, viewZoomRef.current * factor);
        };
        el.addEventListener('wheel', handleWheel, {passive: false});
        return () => el.removeEventListener('wheel', handleWheel);
    }, [canvasRef, zoomAround, viewZoomRef]);

    // ── Main draw loop ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!grid || !canvasRef.current || !canvasAreaRef.current) return;
        const W = grid[0].length, H = grid.length;
        const cw = pixelScale * PX_W;
        const ch = pixelScale * PX_H;
        const totalW = W * cw + G_LEFT + G_RIGHT;
        const totalH = H * ch + G_TOP + G_BOTTOM;

        // Size canvas to fill container
        const area = canvasAreaRef.current;
        const dpr = window.devicePixelRatio || 1;
        const areaW = area.clientWidth, areaH = area.clientHeight;
        const c = canvasRef.current;
        c.width = areaW * dpr;
        c.height = areaH * dpr;
        c.style.width = areaW + 'px';
        c.style.height = areaH + 'px';
        containerSizeRef.current = {w: areaW, h: areaH};

        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Clear to transparent (CSS checkerboard shows through)
        ctx.clearRect(0, 0, c.width, c.height);

        // Apply viewport transform
        ctx.save();
        ctx.translate(viewPanX, viewPanY);
        ctx.scale(viewZoom, viewZoom);

        // White background for grid area only
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalW, totalH);

        const overlayCell = (r, col) => {
            if (!floating) return null;
            const dr = r - floating.r;
            const dc = col - floating.c;
            if (dr < 0 || dc < 0 || dr >= floating.h || dc >= floating.w) return null;
            return floating.data[dr][dc];
        };

        for (let r = 0; r < H; r++) {
            for (let col = 0; col < W; col++) {
                let idx = grid[r][col];
                const ov = overlayCell(r, col);
                if (ov !== null && ov !== undefined) idx = ov;
                const p = palette[idx];
                if (!p || p.hidden) continue;
                ctx.fillStyle = p.hex;
                ctx.fillRect(G_LEFT + col * cw, G_TOP + r * ch, cw, ch);
            }
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= W; i++) {
            const x = G_LEFT + i * cw + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, G_TOP);
            ctx.lineTo(x, G_TOP + H * ch);
            ctx.stroke();
        }
        for (let i = 0; i <= H; i++) {
            const y = G_TOP + i * ch + 0.5;
            ctx.beginPath();
            ctx.moveTo(G_LEFT, y);
            ctx.lineTo(G_LEFT + W * cw, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i <= W; i += 5) {
            const x = G_LEFT + i * cw + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, G_TOP);
            ctx.lineTo(x, G_TOP + H * ch);
            ctx.stroke();
        }
        for (let i = 0; i <= H; i += 5) {
            const y = G_TOP + i * ch + 0.5;
            ctx.beginPath();
            ctx.moveTo(G_LEFT, y);
            ctx.lineTo(G_LEFT + W * cw, y);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(31,22,32,0.75)';
        ctx.font = `${Math.max(9, Math.min(11, Math.floor(ch * 0.7)))}px Pretendard, system-ui, sans-serif`;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 5; i <= W; i += 5) {
            const colIdx = W - i;
            const x = G_LEFT + colIdx * cw + cw / 2;
            ctx.fillText(String(i), x, G_TOP + H * ch + 6);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 1; i <= H; i += 2) {
            const rowIdx = H - i;
            const y = G_TOP + rowIdx * ch + ch / 2;
            ctx.fillText(String(i), G_LEFT - 6, y);
        }
        ctx.textAlign = 'left';
        for (let i = 2; i <= H; i += 2) {
            const rowIdx = H - i;
            const y = G_TOP + rowIdx * ch + ch / 2;
            ctx.fillText(String(i), G_LEFT + W * cw + 6, y);
        }

        if (trackerOn && trackerRow < H) {
            const visualRow = H - 1 - trackerRow;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fillRect(G_LEFT, G_TOP, W * cw, visualRow * ch);
            ctx.strokeStyle = '#EC6B9C';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(G_LEFT - 0.5, G_TOP + visualRow * ch - 0.5, W * cw + 1, ch + 1);
        }

        const drawMeasure = (m, isSelected, isDraft) => {
            const x1 = G_LEFT + (m.c1 + 0.5) * cw;
            const y1 = G_TOP + (m.r1 + 0.5) * ch;
            const x2 = G_LEFT + (m.c2 + 0.5) * cw;
            const y2 = G_TOP + (m.r2 + 0.5) * ch;
            ctx.strokeStyle = isSelected ? '#D94E84' : (isDraft ? 'rgba(217,78,132,0.7)' : 'rgba(217,78,132,0.85)');
            ctx.lineWidth = isSelected ? 2.5 : 2;
            ctx.setLineDash(isDraft ? [4, 3] : []);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
            const drawDot = (x, y) => {
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#D94E84';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            };
            drawDot(x1, y1);
            drawDot(x2, y2);
            const dCols = Math.abs(m.c2 - m.c1) + 1;
            const dRows = Math.abs(m.r2 - m.r1) + 1;
            const label = m.r1 === m.r2 ? `${dCols}${t('pattern_canvas.unit_stitches')}` : `${dRows}${t('pattern_canvas.unit_rows')}`;
            ctx.font = '11px Pretendard, system-ui, sans-serif';
            const tw = ctx.measureText(label).width + 12;
            const tx = (x1 + x2) / 2 - tw / 2;
            const ty = (y1 + y2) / 2 - 9;
            ctx.fillStyle = isSelected ? '#D94E84' : '#EC6B9C';
            ctx.beginPath();
            const radius = 6;
            ctx.moveTo(tx + radius, ty);
            ctx.arcTo(tx + tw, ty, tx + tw, ty + 18, radius);
            ctx.arcTo(tx + tw, ty + 18, tx, ty + 18, radius);
            ctx.arcTo(tx, ty + 18, tx, ty, radius);
            ctx.arcTo(tx, ty, tx + tw, ty, radius);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, tx + tw / 2, ty + 9);
        };
        measurements.forEach(m => drawMeasure(m, m.id === selectedMeasure, false));
        if (measureDraft) drawMeasure(measureDraft, false, true);

        const drawSel = (sel, color, dash = [5, 4]) => {
            const r1 = Math.min(sel.r1, sel.r2), r2 = Math.max(sel.r1, sel.r2);
            const c1 = Math.min(sel.c1, sel.c2), c2 = Math.max(sel.c1, sel.c2);
            const x = G_LEFT + c1 * cw;
            const y = G_TOP + r1 * ch;
            const w = (c2 - c1 + 1) * cw;
            const h = (r2 - r1 + 1) * ch;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash(dash);
            ctx.strokeRect(x + 0.5, y + 0.5, w, h);
            ctx.setLineDash([]);
        };
        if (selection && !floating) drawSel(selection, '#1F1620');
        if (selectDraft) drawSel(selectDraft, 'rgba(31,22,32,0.7)');
        if (floating) {
            drawSel({
                r1: floating.r, c1: floating.c,
                r2: floating.r + floating.h - 1, c2: floating.c + floating.w - 1
            }, '#EC6B9C');
        }

        ctx.restore();
    }, [grid, palette, pixelScale, trackerOn, trackerRow, measurements, measureDraft, selection, selectDraft, floating, selectedMeasure, viewZoom, viewPanX, viewPanY, drawTick, canvasRef, canvasAreaRef]);

    return (
        <>
            {floating && (
                <div className="tracker-strip" style={{background: 'linear-gradient(90deg, #FFF5F9, #FFEDF4)'}}>
                    <span className="chip" style={{background: 'var(--pink-500)', color: 'white'}}>{t('pattern_canvas.moving')}</span>
                    <div className="tracker-text" style={{flex: 1}}>
                        {t('pattern_canvas.moving_desc')}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={commitFloating}>
                        <IconCheck size={13} stroke={2.4}/> {t('pattern_canvas.apply')}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        setFloating(null);
                        undo();
                    }}>
                        {t('pattern_canvas.cancel')}
                    </button>
                </div>
            )}

            {trackerOn && (
                <div className="tracker-strip">
                    <button className="btn btn-icon btn-secondary"
                            onClick={() => setTrackerRow(r => Math.max(0, r - 1))}>
                        <IconMinus size={14} stroke={2.4}/>
                    </button>
                    <div className="tracker-text">
                        {t('pattern_canvas.current')}<strong style={{color: 'var(--pink-600)'}}>{trackerRow + 1}{t('pattern_canvas.unit_rows')}</strong>{t('pattern_canvas.total', {total: grid.length})}
                    </div>
                    <div className="tracker-progress">
                        <div className="tracker-progress-fill"
                             style={{width: `${((trackerRow + 1) / grid.length) * 100}%`}}/>
                    </div>
                    <button className="btn btn-icon btn-secondary"
                            onClick={() => setTrackerRow(r => Math.min(grid.length - 1, r + 1))}>
                        <IconPlus size={14} stroke={2.4}/>
                    </button>
                    <button className="btn btn-icon btn-ghost" onClick={() => setTrackerRow(0)}>
                        <IconReset size={14} stroke={2}/>
                    </button>
                </div>
            )}

            <div className="pattern-canvas-area" ref={canvasAreaRef}>
                <canvas
                    ref={canvasRef}
                    className="pattern-canvas"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                />
            </div>
        </>
    );
};
