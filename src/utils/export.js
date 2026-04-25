export const exportPNG = (canvasRef, toast) => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
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
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {type: 'text/csv;charset=utf-8'});
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast('CSV로 내보냈어요');
};

export const exportPDF = (grid, palette, canvasRef, toast) => {
    if (!grid) return;
    const W = grid[0].length, H = grid.length;
    const dataUrl = canvasRef.current.toDataURL('image/png');
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
