import {PX_W, PX_H} from './colors';

const G_LEFT = 32, G_RIGHT = 32, G_TOP = 8, G_BOTTOM = 28;

// Draw the full grid at native resolution into an offscreen canvas.
// Used by PNG and PDF export so the output is always full-resolution
// regardless of the current viewport zoom/pan.
export const drawGridOffscreen = (grid, palette, pixelScale = 8) => {
    const cw = pixelScale * PX_W;
    const ch = pixelScale * PX_H;
    const W = grid[0].length, H = grid.length;
    const totalW = G_LEFT + W * cw + G_RIGHT;
    const totalH = G_TOP + H * ch + G_BOTTOM;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalW, totalH);

    for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
            const p = palette[grid[r][c]];
            if (!p || p.hidden) continue;
            ctx.fillStyle = p.hex;
            ctx.fillRect(G_LEFT + c * cw, G_TOP + r * ch, cw, ch);
        }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= W; i++) {
        const x = G_LEFT + i * cw + 0.5;
        ctx.beginPath(); ctx.moveTo(x, G_TOP); ctx.lineTo(x, G_TOP + H * ch); ctx.stroke();
    }
    for (let i = 0; i <= H; i++) {
        const y = G_TOP + i * ch + 0.5;
        ctx.beginPath(); ctx.moveTo(G_LEFT, y); ctx.lineTo(G_LEFT + W * cw, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i <= W; i += 5) {
        const x = G_LEFT + i * cw + 0.5;
        ctx.beginPath(); ctx.moveTo(x, G_TOP); ctx.lineTo(x, G_TOP + H * ch); ctx.stroke();
    }
    for (let i = 0; i <= H; i += 5) {
        const y = G_TOP + i * ch + 0.5;
        ctx.beginPath(); ctx.moveTo(G_LEFT, y); ctx.lineTo(G_LEFT + W * cw, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(31,22,32,0.75)';
    ctx.font = `${Math.max(9, Math.min(11, Math.floor(ch * 0.7)))}px Pretendard, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 5; i <= W; i += 5) {
        const colIdx = W - i;
        ctx.fillText(String(i), G_LEFT + colIdx * cw + cw / 2, G_TOP + H * ch + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= H; i += 2) {
        ctx.fillText(String(i), G_LEFT - 6, G_TOP + (H - i) * ch + ch / 2);
    }
    ctx.textAlign = 'left';
    for (let i = 2; i <= H; i += 2) {
        ctx.fillText(String(i), G_LEFT + W * cw + 6, G_TOP + (H - i) * ch + ch / 2);
    }

    return canvas;
};

export const exportPNG = (grid, palette, pixelScale, toast) => {
    if (!grid) return;
    const canvas = drawGridOffscreen(grid, palette, pixelScale);
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('PNG로 내보냈어요');
};

export const exportCSV = (grid, palette, toast) => {
    if (!grid) return;
    const lines = [];
    lines.push('# Knitting Tools Pattern');
    lines.push('# Palette');
    palette.forEach((p, i) => lines.push(`# ${i + 1},${p.hex},${p.count}코`));
    lines.push('');
    grid.forEach(row => lines.push(row.map(v => v + 1).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], {type: 'text/csv;charset=utf-8'});
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast('CSV로 내보냈어요');
};

export const exportPDF = (grid, palette, pixelScale, toast) => {
    if (!grid) return;
    const W = grid[0].length, H = grid.length;
    const canvas = drawGridOffscreen(grid, palette, pixelScale);
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank');
    w.document.write(`
    <!doctype html><html><head><meta charset="utf-8"><title>도안 인쇄</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      body { font-family: 'Pretendard', system-ui, sans-serif; color: #1F1620; margin: 0; padding: 24px; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      .meta { color: #7A6B73; font-size: 13px; margin-bottom: 18px; }
      .pattern-img { max-width: 100%; border: 1px solid #E8DEE3; border-radius: 8px; }
      .legend { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 18px; margin-top: 24px; }
      .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; }
      .swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.06); }
      .stat { display: inline-block; margin-right: 18px; font-size: 13px; color: #4A3D44; }
      .stat strong { color: #EC6B9C; }
    </style></head><body>
    <h1>뜨개질 도안</h1>
    <div class="meta">
      <span class="stat">코수 <strong>${W}</strong></span>
      <span class="stat">단수 <strong>${H}</strong></span>
      <span class="stat">색상 <strong>${palette.length}</strong></span>
      <span class="stat">${new Date().toLocaleDateString('ko-KR')}</span>
    </div>
    <img src="${dataUrl}" class="pattern-img" />
    <h2 style="font-size:15px;margin:24px 0 10px;">색상 범례</h2>
    <div class="legend">
      ${palette.map((p, i) => `
        <div class="legend-item">
          <div class="swatch" style="background:${p.hex}"></div>
          <strong>${i + 1}</strong> · ${p.hex} · ${p.count}코
        </div>`).join('')}
    </div>
    <script>setTimeout(() => window.print(), 400);<\/script>
    </body></html>
  `);
    w.document.close();
    toast('PDF용 인쇄 창을 열었어요');
};
