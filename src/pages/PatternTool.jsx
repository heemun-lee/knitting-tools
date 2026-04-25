import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IconUpload, IconSparkle, IconBookmark, IconSave, IconMerge, IconTrash,
  IconBrush, IconBucket, IconEyedrop, IconRulerLine, IconSelect,
  IconCopy, IconScissors, IconPaste, IconMove, IconUndo, IconRedo,
  IconMinus, IconPlus, IconFit, IconMaximize, IconMinimize,
  IconCrosshair, IconDownload, IconFileExcel, IconFilePdf,
  IconPattern, IconCheck, IconReset
} from '../components/icons';
import { useToast, Modal, useLocal } from '../components/shared';

/* ---- color helpers ---- */
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const parseHex = (h) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

function axisLock(r1, c1, r2, c2) {
  const dCols = Math.abs(c2 - c1);
  const dRows = Math.abs(r2 - r1);
  if (dCols >= dRows) {
    return { r1, c1, r2: r1, c2 };
  } else {
    return { r1, c1, r2, c2: c1 };
  }
}

const PX_W = 3;
const PX_H = 2;

/* ---- k-means color quantization ---- */
function kmeans(pixels, k, maxIter = 14) {
  if (pixels.length === 0) return { centroids: [], labels: [] };
  const centroids = [];
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)].slice());
  while (centroids.length < k) {
    const dists = pixels.map(p => {
      let min = Infinity;
      for (const c of centroids) {
        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
        if (d < min) min = d;
      }
      return min;
    });
    const total = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < dists.length; idx++) { r -= dists[idx]; if (r <= 0) break; }
    centroids.push(pixels[Math.min(idx, pixels.length - 1)].slice());
  }
  let labels = new Array(pixels.length);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = 0;
    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const ct = centroids[c];
        const d = (p[0]-ct[0])**2 + (p[1]-ct[1])**2 + (p[2]-ct[2])**2;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (labels[i] !== best) { labels[i] = best; changed++; }
    }
    const sums = Array.from({length: k}, () => [0,0,0,0]);
    for (let i = 0; i < pixels.length; i++) {
      const c = labels[i], p = pixels[i];
      sums[c][0] += p[0]; sums[c][1] += p[1]; sums[c][2] += p[2]; sums[c][3]++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3] > 0) {
        centroids[c] = [sums[c][0]/sums[c][3], sums[c][1]/sums[c][3], sums[c][2]/sums[c][3]];
      }
    }
    if (changed === 0) break;
  }
  return { centroids: centroids.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])]), labels };
}

function estimateColors(imgEl) {
  const c = document.createElement('canvas');
  const W = 60, H = 60;
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const set = new Set();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] >> 6, g = data[i+1] >> 6, b = data[i+2] >> 6;
    set.add((r << 4) | (g << 2) | b);
  }
  return Math.max(3, Math.min(20, set.size));
}

const PatternTool = () => {
  const toast = useToast();
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const [imgUrl, setImgUrl] = useState(null);
  const [imgEl, setImgEl] = useState(null);

  const [stitchCount, setStitchCount] = useState(40);
  const [rowCount, setRowCount] = useState(50);
  const [colorCount, setColorCount] = useState(6);

  const [grid, setGrid] = useState(null);
  const [palette, setPalette] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [busy, setBusy] = useState(false);

  const [tool, setTool] = useState('brush');
  const [activeColor, setActiveColor] = useState(0);
  const [pixelScale, setPixelScale] = useState(8);
  const [fullscreen, setFullscreen] = useState(false);
  const canvasAreaRef = useRef(null);

  const [trackerOn, setTrackerOn] = useState(false);
  const [trackerRow, setTrackerRow] = useState(0);

  const [measurements, setMeasurements] = useState([]);
  const [measureDraft, setMeasureDraft] = useState(null);
  const [selectedMeasure, setSelectedMeasure] = useState(null);

  const [selection, setSelection] = useState(null);
  const [selectDraft, setSelectDraft] = useState(null);
  const [floating, setFloating] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const [editingPalette, setEditingPalette] = useState(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeFrom, setMergeFrom] = useState(null);

  const [saved, setSaved] = useLocal('kt.pattern.saved', []);
  const [showSaved, setShowSaved] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      try { setColorCount(estimateColors(img)); } catch {}
    };
    img.src = url;
  };

  useEffect(() => {
    if (imgEl) {
      const imgAR = imgEl.height / imgEl.width;
      const newRows = Math.max(4, Math.round(stitchCount * (PX_W / PX_H) * imgAR));
      setRowCount(newRows);
    }
  }, [imgEl, stitchCount]);

  const convert = useCallback(() => {
    if (!imgEl) { toast('먼저 사진을 업로드해주세요'); return; }
    setBusy(true);
    setTimeout(() => {
      try {
        const W = stitchCount, H = rowCount, K = colorCount;
        const work = document.createElement('canvas');
        work.width = W; work.height = H;
        const ctx = work.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgEl, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i+1], data[i+2]]);
        const { centroids, labels } = kmeans(pixels, K);
        const newGrid = [];
        for (let r = 0; r < H; r++) {
          const row = [];
          for (let c = 0; c < W; c++) row.push(labels[r*W + c]);
          newGrid.push(row);
        }
        const order = centroids.map((c, i) => i).sort((a, b) => luma(...centroids[b]) - luma(...centroids[a]));
        const orderMap = {};
        order.forEach((origIdx, newIdx) => orderMap[origIdx] = newIdx);
        const sortedCentroids = order.map(i => centroids[i]);
        const remapped = newGrid.map(row => row.map(v => orderMap[v]));
        const counts = new Array(K).fill(0);
        remapped.forEach(row => row.forEach(v => counts[v]++));
        const pal = sortedCentroids.map((c, i) => ({
          rgb: c, hex: hex(...c), count: counts[i], hidden: false
        }));
        setGrid(remapped);
        setPalette(pal);
        setHistory([]);
        setRedoStack([]);
        setActiveColor(0);
        setMeasurements([]);
        setSelection(null);
        setFloating(null);
        toast('도안으로 변환했어요');
      } catch (e) {
        console.error(e);
        toast('변환 중 문제가 발생했어요');
      }
      setBusy(false);
    }, 30);
  }, [imgEl, stitchCount, rowCount, colorCount]);

  const fitScale = useCallback(() => {
    if (!grid) return;
    const W = grid[0].length, H = grid.length;
    const maxW = fullscreen ? window.innerWidth - 80 : 720;
    const maxH = fullscreen ? window.innerHeight - 200 : 460;
    const sW = maxW / (W * PX_W);
    const sH = maxH / (H * PX_H);
    const s = Math.max(2, Math.min(20, Math.floor(Math.min(sW, sH))));
    setPixelScale(s);
  }, [grid, fullscreen]);

  useEffect(() => { fitScale(); }, [grid, fullscreen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && fullscreen) setFullscreen(false); };
    const onResize = () => { if (fullscreen) fitScale(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [fullscreen, fitScale]);

  const G_LEFT = 32, G_RIGHT = 32, G_BOTTOM = 28, G_TOP = 8;

  useEffect(() => {
    if (!grid || !canvasRef.current) return;
    const W = grid[0].length, H = grid.length;
    const cw = pixelScale * PX_W;
    const ch = pixelScale * PX_H;
    const c = canvasRef.current;
    const totalW = W * cw + G_LEFT + G_RIGHT;
    const totalH = H * ch + G_TOP + G_BOTTOM;
    c.width = totalW;
    c.height = totalH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

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
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      const drawDot = (x, y) => {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#D94E84'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      };
      drawDot(x1, y1); drawDot(x2, y2);
      const dCols = Math.abs(m.c2 - m.c1) + 1;
      const dRows = Math.abs(m.r2 - m.r1) + 1;
      const label = m.r1 === m.r2 ? `${dCols}코` : `${dRows}단`;
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
  }, [grid, palette, pixelScale, trackerOn, trackerRow, measurements, measureDraft, selection, selectDraft, floating, selectedMeasure]);

  const pushHistory = () => {
    setHistory(h => [...h.slice(-29), JSON.stringify({ grid, palette })]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [...r, JSON.stringify({ grid, palette })]);
    const { grid: g, palette: p } = JSON.parse(prev);
    setGrid(g); setPalette(p);
    setHistory(h => h.slice(0, -1));
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, JSON.stringify({ grid, palette })]);
    const { grid: g, palette: p } = JSON.parse(next);
    setGrid(g); setPalette(p);
    setRedoStack(r => r.slice(0, -1));
  };

  const getCellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cw = pixelScale * PX_W;
    const ch = pixelScale * PX_H;
    const col = Math.floor((x - G_LEFT) / cw);
    const row = Math.floor((y - G_TOP) / ch);
    if (col < 0 || row < 0 || !grid || col >= grid[0].length || row >= grid.length) return null;
    return { row, col };
  };

  const paintCell = (row, col) => {
    setGrid(g => {
      const ng = g.map(r => r.slice());
      ng[row][col] = activeColor;
      return ng;
    });
  };

  const floodFill = (row, col) => {
    pushHistory();
    setGrid(g => {
      const ng = g.map(r => r.slice());
      const target = ng[row][col];
      if (target === activeColor) return ng;
      const stack = [[row, col]];
      const H = ng.length, W = ng[0].length;
      while (stack.length) {
        const [r, c] = stack.pop();
        if (r < 0 || c < 0 || r >= H || c >= W) continue;
        if (ng[r][c] !== target) continue;
        ng[r][c] = activeColor;
        stack.push([r+1, c], [r-1, c], [r, c+1], [r, c-1]);
      }
      return ng;
    });
  };

  const commitFloating = () => {
    if (!floating) return;
    pushHistory();
    setGrid(g => {
      const ng = g.map(r => r.slice());
      const H = ng.length, W = ng[0].length;
      for (let dr = 0; dr < floating.h; dr++) {
        for (let dc = 0; dc < floating.w; dc++) {
          const r = floating.r + dr, c = floating.c + dc;
          if (r >= 0 && r < H && c >= 0 && c < W) {
            const v = floating.data[dr][dc];
            if (v !== null && v !== undefined) ng[r][c] = v;
          }
        }
      }
      return ng;
    });
    setFloating(null);
  };

  const copySelection = () => {
    if (!selection) return;
    const r1 = Math.min(selection.r1, selection.r2), r2 = Math.max(selection.r1, selection.r2);
    const c1 = Math.min(selection.c1, selection.c2), c2 = Math.max(selection.c1, selection.c2);
    const data = [];
    for (let r = r1; r <= r2; r++) {
      const row = [];
      for (let c = c1; c <= c2; c++) row.push(grid[r][c]);
      data.push(row);
    }
    setClipboard(data);
    toast(`${c2-c1+1}×${r2-r1+1} 복사했어요`);
  };

  const cutSelection = () => {
    if (!selection) return;
    copySelection();
    pushHistory();
    const r1 = Math.min(selection.r1, selection.r2), r2 = Math.max(selection.r1, selection.r2);
    const c1 = Math.min(selection.c1, selection.c2), c2 = Math.max(selection.c1, selection.c2);
    setGrid(g => {
      const ng = g.map(r => r.slice());
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) ng[r][c] = 0;
      return ng;
    });
    setSelection(null);
    toast('잘라냈어요');
  };

  const pasteClipboard = () => {
    if (!clipboard) return;
    if (floating) commitFloating();
    const r = selection ? Math.min(selection.r1, selection.r2) : 0;
    const c = selection ? Math.min(selection.c1, selection.c2) : 0;
    setFloating({ r, c, data: clipboard, h: clipboard.length, w: clipboard[0].length });
    setSelection(null);
    toast('붙여넣었어요 — 드래그해서 위치 조정');
  };

  const moveSelectionToFloating = () => {
    if (!selection) return;
    const r1 = Math.min(selection.r1, selection.r2), r2 = Math.max(selection.r1, selection.r2);
    const c1 = Math.min(selection.c1, selection.c2), c2 = Math.max(selection.c1, selection.c2);
    const data = [];
    for (let r = r1; r <= r2; r++) {
      const row = [];
      for (let c = c1; c <= c2; c++) row.push(grid[r][c]);
      data.push(row);
    }
    pushHistory();
    setGrid(g => {
      const ng = g.map(r => r.slice());
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) ng[r][c] = 0;
      return ng;
    });
    setFloating({ r: r1, c: c1, data, h: data.length, w: data[0].length });
    setSelection(null);
    toast('이동 모드 — 드래그하세요');
  };

  const [drawing, setDrawing] = useState(false);
  const [floatingDrag, setFloatingDrag] = useState(null);
  const [measureDragEnd, setMeasureDragEnd] = useState(null);

  const onCanvasDown = (e) => {
    if (!grid) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (floating) {
      const inFloat = cell.row >= floating.r && cell.row < floating.r + floating.h &&
                      cell.col >= floating.c && cell.col < floating.c + floating.w;
      if (inFloat) {
        setFloatingDrag({ offsetR: cell.row - floating.r, offsetC: cell.col - floating.c });
        return;
      } else {
        commitFloating();
      }
    }

    if (tool === 'brush') {
      pushHistory();
      setDrawing(true);
      paintCell(cell.row, cell.col);
    } else if (tool === 'bucket') {
      floodFill(cell.row, cell.col);
    } else if (tool === 'eyedrop') {
      setActiveColor(grid[cell.row][cell.col]);
      setTool('brush');
      toast('색상을 가져왔어요');
    } else if (tool === 'measure') {
      const hitId = hitTestMeasure(cell);
      if (hitId) {
        setSelectedMeasure(hitId.id);
        setMeasureDragEnd({ id: hitId.id, end: hitId.end });
      } else {
        setSelectedMeasure(null);
        setMeasureDraft({ r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col });
      }
    } else if (tool === 'select') {
      setSelectDraft({ r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col });
      setSelection(null);
    }
  };

  const hitTestMeasure = (cell) => {
    for (const m of measurements) {
      if (Math.abs(m.r1 - cell.row) <= 1 && Math.abs(m.c1 - cell.col) <= 1) return { id: m.id, end: 1 };
      if (Math.abs(m.r2 - cell.row) <= 1 && Math.abs(m.c2 - cell.col) <= 1) return { id: m.id, end: 2 };
    }
    return null;
  };

  const onCanvasMove = (e) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;
    if (floatingDrag) {
      setFloating(f => f ? { ...f, r: cell.row - floatingDrag.offsetR, c: cell.col - floatingDrag.offsetC } : f);
      return;
    }
    if (drawing && tool === 'brush') paintCell(cell.row, cell.col);
    if (measureDraft) setMeasureDraft(m => axisLock(m.r1, m.c1, cell.row, cell.col));
    if (measureDragEnd) {
      setMeasurements(ms => ms.map(m => {
        if (m.id !== measureDragEnd.id) return m;
        if (measureDragEnd.end === 1) {
          const locked = axisLock(cell.row, cell.col, m.r2, m.c2);
          return { ...m, ...locked };
        }
        return { ...m, ...axisLock(m.r1, m.c1, cell.row, cell.col) };
      }));
    }
    if (selectDraft) setSelectDraft(s => ({ ...s, r2: cell.row, c2: cell.col }));
  };

  const onCanvasUp = () => {
    setDrawing(false);
    setFloatingDrag(null);
    setMeasureDragEnd(null);
    if (measureDraft) {
      const m = { ...measureDraft, id: Date.now().toString(36) };
      if (!(m.r1 === m.r2 && m.c1 === m.c2)) {
        setMeasurements(ms => [...ms, m]);
        setSelectedMeasure(m.id);
      }
      setMeasureDraft(null);
    }
    if (selectDraft) {
      setSelection(selectDraft);
      setSelectDraft(null);
    }
  };

  const deleteSelectedMeasure = () => {
    if (!selectedMeasure) return;
    setMeasurements(ms => ms.filter(m => m.id !== selectedMeasure));
    setSelectedMeasure(null);
  };

  const updatePaletteColor = (idx, newHex) => {
    pushHistory();
    setPalette(p => p.map((it, i) => i === idx ? { ...it, hex: newHex, rgb: parseHex(newHex) } : it));
  };

  const mergePalette = (fromIdx, intoIdx) => {
    if (fromIdx === intoIdx) return;
    pushHistory();
    setGrid(g => g.map(row => row.map(v => v === fromIdx ? intoIdx : (v > fromIdx ? v - 1 : v))));
    setPalette(p => p.filter((_, i) => i !== fromIdx));
    setActiveColor(c => c === fromIdx ? intoIdx : (c > fromIdx ? c - 1 : c));
    toast('색상을 합쳤어요');
  };

  useEffect(() => {
    if (!grid || palette.length === 0) return;
    const counts = new Array(palette.length).fill(0);
    grid.forEach(r => r.forEach(v => { if (v < counts.length) counts[v]++; }));
    setPalette(p => p.map((it, i) => it.count === counts[i] ? it : { ...it, count: counts[i] }));
  }, [grid]);

  const [overwriteId, setOverwriteId] = useState(null);

  const buildEntry = (id) => {
    const thumbCanvas = document.createElement('canvas');
    const tw = 90, th = Math.round(90 * (grid.length * PX_H) / (grid[0].length * PX_W));
    thumbCanvas.width = tw; thumbCanvas.height = th;
    const tctx = thumbCanvas.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    const cw = tw / grid[0].length, ch = th / grid.length;
    grid.forEach((row, r) => row.forEach((v, c) => {
      tctx.fillStyle = palette[v]?.hex || '#fff';
      tctx.fillRect(c*cw, r*ch, cw+1, ch+1);
    }));
    const thumb = thumbCanvas.toDataURL('image/png');
    return {
      id: id || Date.now().toString(36),
      name: saveName.trim(),
      date: new Date().toISOString(),
      grid, palette,
      stitchCount: grid[0].length, rowCount: grid.length,
      thumb,
      trackerOn, trackerRow,
      measurements
    };
  };

  const doSave = () => {
    if (!grid) return;
    if (!saveName.trim()) { toast('이름을 적어주세요'); return; }
    if (overwriteId) {
      const entry = buildEntry(overwriteId);
      setSaved(s => s.map(x => x.id === overwriteId ? entry : x));
      toast('덮어썼어요');
    } else {
      const dup = saved.find(s => s.name === saveName.trim());
      if (dup) {
        if (!window.confirm(`'${dup.name}' 이름으로 저장된 도안이 있어요. 덮어쓸까요?`)) return;
        const entry = buildEntry(dup.id);
        setSaved(s => s.map(x => x.id === dup.id ? entry : x));
        toast('덮어썼어요');
      } else {
        const entry = buildEntry();
        setSaved(s => [entry, ...s].slice(0, 30));
        toast('저장했어요');
      }
    }
    setShowSave(false);
    setSaveName('');
    setOverwriteId(null);
  };

  const openSaveAs = () => { setOverwriteId(null); setSaveName(''); setShowSave(true); };
  const openSaveOver = (entry) => { setOverwriteId(entry.id); setSaveName(entry.name); setShowSave(true); };

  const loadSaved = (entry) => {
    setGrid(entry.grid);
    setPalette(entry.palette);
    setStitchCount(entry.stitchCount);
    setRowCount(entry.rowCount);
    setHistory([]); setRedoStack([]);
    setMeasurements(entry.measurements || []);
    setTrackerOn(!!entry.trackerOn);
    setTrackerRow(entry.trackerRow || 0);
    setSelection(null); setFloating(null); setSelectedMeasure(null);
    setShowSaved(false);
    toast(`'${entry.name}' 불러왔어요`);
  };

  const deleteSaved = (id) => setSaved(s => s.filter(x => x.id !== id));

  const exportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast('PNG로 내보냈어요');
  };

  const exportCSV = () => {
    if (!grid) return;
    const lines = [];
    lines.push('# Knitting Tools Pattern');
    lines.push('# Palette');
    palette.forEach((p, i) => lines.push(`# ${i + 1},${p.hex},${p.count}코`));
    lines.push('');
    grid.forEach(row => lines.push(row.map(v => v + 1).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `pattern-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast('CSV로 내보냈어요');
  };

  const exportPDF = () => {
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
            <strong>${i+1}</strong> · ${p.hex} · ${p.count}코
          </div>`).join('')}
      </div>
      <script>setTimeout(() => window.print(), 400);<\/script>
      </body></html>
    `);
    w.document.close();
    toast('PDF용 인쇄 창을 열었어요');
  };

  const NumberField = ({ value, onChange, suffix, min = 1, max }) => {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => { setDraft(String(value)); }, [value]);
    return (
      <div className="input-suffix">
        <input className="input" type="text" inputMode="numeric"
               value={draft}
               onChange={e => setDraft(e.target.value)}
               onBlur={() => {
                 const v = parseInt(draft, 10);
                 if (isNaN(v)) { setDraft(String(value)); return; }
                 let clamped = Math.max(min, v);
                 if (max !== undefined) clamped = Math.min(max, clamped);
                 onChange(clamped);
                 setDraft(String(clamped));
               }}
               onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        {suffix && <span className="suffix-text">{suffix}</span>}
      </div>
    );
  };

  return (
    <div className="page" style={{ maxWidth: 1320 }}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div>
          <div className="page-eyebrow">Tool 03</div>
          <h1 className="page-title">사진 → 도안 변환</h1>
          <p className="page-subtitle">사진을 픽셀 도안으로 변환하고, 색상 편집 · 측정 · 영역 복사 등을 자유롭게.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSaved(true)}>
            <IconBookmark size={14} stroke={2} /> 불러오기 ({saved.length})
          </button>
          {grid && (
            <button className="btn btn-secondary btn-sm" onClick={openSaveAs}>
              <IconSave size={14} stroke={2} /> 저장
            </button>
          )}
        </div>
      </div>

      <div className="pattern-tool">
        {/* Left controls */}
        <div className="pattern-controls">
          <div className="card" style={{ padding: 18 }}>
            <div className="card-head" style={{ marginBottom: 12 }}>
              <h2 className="card-title" style={{ fontSize: 15 }}>사진 업로드</h2>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
            <div className={`upload-zone ${imgUrl ? 'has-image' : ''}`} onClick={() => fileRef.current.click()}>
              {imgUrl ? (
                <img src={imgUrl} className="upload-preview" alt="원본" />
              ) : (
                <>
                  <div className="upload-icon"><IconUpload size={28} stroke={1.6} /></div>
                  <div className="upload-text">사진 선택하기</div>
                  <div className="upload-sub">JPG, PNG · 클릭하여 선택</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div className="field">
                <label className="field-label">코수 (가로)</label>
                <NumberField value={stitchCount} onChange={setStitchCount} suffix="코" min={4} max={400} />
                {imgEl && (
                  <div className="field-hint" style={{ marginTop: 4 }}>
                    단수는 자동으로 <strong style={{ color: 'var(--pink-600)' }}>{rowCount}단</strong>으로 계산됐어요
                  </div>
                )}
              </div>
              <div className="field">
                <label className="field-label">사용할 색상 수 <span className="field-hint">최대 20</span></label>
                <NumberField value={colorCount} onChange={setColorCount} suffix="색" min={2} max={20} />
              </div>

              <button className="btn btn-primary" onClick={convert} disabled={busy || !imgEl}>
                {busy ? '변환 중...' : <><IconSparkle size={16} stroke={2} /> 도안으로 변환</>}
              </button>
            </div>
          </div>

          {palette.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="card-head" style={{ marginBottom: 12 }}>
                <h2 className="card-title" style={{ fontSize: 15 }}>
                  색상 팔레트
                  {mergeMode && <span style={{ color: 'var(--pink-500)', fontSize: 12, fontWeight: 500, marginLeft: 8 }}>· 합칠 색을 선택</span>}
                </h2>
                <button
                  className={`tool-btn ${mergeMode ? 'active' : ''}`}
                  onClick={() => { setMergeMode(m => !m); setMergeFrom(null); }}>
                  <IconMerge size={14} /> 합치기
                </button>
              </div>
              <div className="palette-list">
                {palette.map((p, i) => (
                  <div key={i} className={`palette-row ${activeColor === i ? 'selected' : ''} ${mergeFrom === i ? 'selected' : ''}`}>
                    <div className="swatch"
                         style={{ background: p.hex }}
                         onClick={(e) => {
                           if (mergeMode) {
                             if (mergeFrom === null) {
                               setMergeFrom(i);
                               toast('합칠 대상 색을 선택하세요');
                             } else if (mergeFrom !== i) {
                               mergePalette(mergeFrom, i);
                               setMergeFrom(null);
                               setMergeMode(false);
                             }
                           } else {
                             setActiveColor(i);
                             const r = e.currentTarget.getBoundingClientRect();
                             setEditingPalette({ idx: i, x: r.right + 6, y: r.top });
                           }
                         }}>
                      <div className="swatch-mark" style={{ color: luma(...p.rgb) > 0.5 ? '#000' : '#fff' }}>{i+1}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-700)', fontWeight: 500 }}>색상 {i+1}</div>
                      <div className="phex">{p.hex}</div>
                    </div>
                    <span className="pcount">{p.count}코</span>
                  </div>
                ))}
              </div>
              {mergeMode && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%' }}
                        onClick={() => { setMergeMode(false); setMergeFrom(null); }}>
                  취소
                </button>
              )}
            </div>
          )}

          {grid && measurements.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="card-head" style={{ marginBottom: 12 }}>
                <h2 className="card-title" style={{ fontSize: 15 }}>측정 ({measurements.length})</h2>
                <button className="tool-btn" onClick={() => { setMeasurements([]); setSelectedMeasure(null); toast('측정 모두 삭제'); }}>
                  <IconTrash size={13} /> 모두
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {measurements.map((m, i) => {
                  const dCols = Math.abs(m.c2 - m.c1) + 1;
                  const dRows = Math.abs(m.r2 - m.r1) + 1;
                  const sel = selectedMeasure === m.id;
                  const isHoriz = m.r1 === m.r2;
                  return (
                    <div key={m.id}
                         onClick={() => setSelectedMeasure(m.id)}
                         style={{
                           display: 'flex', alignItems: 'center', gap: 10,
                           padding: '8px 10px', borderRadius: 10,
                           background: sel ? 'var(--pink-50)' : 'var(--ink-100)',
                           border: sel ? '1.5px solid var(--pink-400)' : '1.5px solid transparent',
                           cursor: 'pointer'
                         }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--pink-500)', color: 'white',
                                    display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{i+1}</div>
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <strong>{isHoriz ? `${dCols}코` : `${dRows}단`}</strong>
                        <span style={{ color: 'var(--ink-500)', marginLeft: 6, fontSize: 11 }}>
                          {isHoriz ? '가로' : '세로'}
                        </span>
                      </div>
                      <button className="picon-btn"
                              onClick={e => { e.stopPropagation(); setMeasurements(ms => ms.filter(x => x.id !== m.id)); if (sel) setSelectedMeasure(null); }}>
                        <IconTrash size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right canvas */}
        <div className={`pattern-canvas-wrap ${fullscreen ? 'fullscreen' : ''}`}>
          {grid ? (
            <>
              <div className="pattern-toolbar">
                <div className="toolbar-group">
                  <button className={`tool-btn ${tool === 'brush' ? 'active' : ''}`} onClick={() => { setTool('brush'); setSelection(null); }}>
                    <IconBrush size={14} /> 브러시
                  </button>
                  <button className={`tool-btn ${tool === 'bucket' ? 'active' : ''}`} onClick={() => { setTool('bucket'); setSelection(null); }}>
                    <IconBucket size={14} /> 채우기
                  </button>
                  <button className={`tool-btn ${tool === 'eyedrop' ? 'active' : ''}`} onClick={() => { setTool('eyedrop'); setSelection(null); }}>
                    <IconEyedrop size={14} /> 스포이드
                  </button>
                </div>

                <div className="toolbar-group">
                  <button className={`tool-btn ${tool === 'measure' ? 'active' : ''}`} onClick={() => { setTool('measure'); setSelection(null); }}>
                    <IconRulerLine size={14} /> 측정
                  </button>
                  <button className={`tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')}>
                    <IconSelect size={14} /> 선택
                  </button>
                </div>

                {tool === 'select' && (
                  <div className="toolbar-group">
                    <button className="tool-btn" disabled={!selection} onClick={copySelection}>
                      <IconCopy size={13} /> 복사
                    </button>
                    <button className="tool-btn" disabled={!selection} onClick={cutSelection}>
                      <IconScissors size={13} /> 자르기
                    </button>
                    <button className="tool-btn" disabled={!clipboard} onClick={pasteClipboard}>
                      <IconPaste size={13} /> 붙여넣기
                    </button>
                    <button className="tool-btn" disabled={!selection} onClick={moveSelectionToFloating}>
                      <IconMove size={13} /> 이동
                    </button>
                  </div>
                )}

                {tool === 'measure' && selectedMeasure && (
                  <button className="tool-btn" onClick={deleteSelectedMeasure}
                          style={{ color: 'var(--pink-600)' }}>
                    <IconTrash size={13} /> 측정 삭제
                  </button>
                )}

                <div className="toolbar-group">
                  <button className="tool-btn" onClick={undo} disabled={history.length === 0}>
                    <IconUndo size={14} />
                  </button>
                  <button className="tool-btn" onClick={redo} disabled={redoStack.length === 0}>
                    <IconRedo size={14} />
                  </button>
                </div>

                <div className="toolbar-group">
                  <button className="tool-btn" onClick={() => setPixelScale(s => Math.max(2, s - 1))}>
                    <IconMinus size={14} />
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--ink-500)', padding: '0 6px', minWidth: 32, textAlign: 'center' }}>{pixelScale}×</span>
                  <button className="tool-btn" onClick={() => setPixelScale(s => Math.min(40, s + 1))}>
                    <IconPlus size={14} />
                  </button>
                  <button className="tool-btn" onClick={fitScale}>
                    <IconFit size={14} /> 맞춤
                  </button>
                  <button className={`tool-btn ${fullscreen ? 'active' : ''}`} onClick={() => setFullscreen(f => !f)}>
                    {fullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
                  </button>
                </div>

                <div className="toolbar-group">
                  <button className={`tool-btn ${trackerOn ? 'active' : ''}`} onClick={() => setTrackerOn(t => !t)}>
                    <IconCrosshair size={14} /> 트래커
                  </button>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button className="tool-btn" onClick={exportPNG}><IconDownload size={14} /> PNG</button>
                  <button className="tool-btn" onClick={exportCSV}><IconFileExcel size={14} /> CSV</button>
                  <button className="tool-btn" onClick={exportPDF}><IconFilePdf size={14} /> PDF</button>
                </div>
              </div>

              {floating && (
                <div className="tracker-strip" style={{ background: 'linear-gradient(90deg, #FFF5F9, #FFEDF4)' }}>
                  <span className="chip" style={{ background: 'var(--pink-500)', color: 'white' }}>이동 중</span>
                  <div className="tracker-text" style={{ flex: 1 }}>
                    선택 영역을 드래그해서 이동하세요. 다른 곳을 클릭하면 적용됩니다.
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={commitFloating}>
                    <IconCheck size={13} stroke={2.4} /> 적용
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFloating(null); undo(); }}>
                    취소
                  </button>
                </div>
              )}

              {trackerOn && (
                <div className="tracker-strip">
                  <button className="btn btn-icon btn-secondary" onClick={() => setTrackerRow(r => Math.max(0, r - 1))}>
                    <IconMinus size={14} stroke={2.4} />
                  </button>
                  <div className="tracker-text">
                    현재 <strong style={{ color: 'var(--pink-600)' }}>{trackerRow + 1}단</strong> / {grid.length}단
                  </div>
                  <div className="tracker-progress">
                    <div className="tracker-progress-fill" style={{ width: `${((trackerRow + 1) / grid.length) * 100}%` }} />
                  </div>
                  <button className="btn btn-icon btn-secondary" onClick={() => setTrackerRow(r => Math.min(grid.length - 1, r + 1))}>
                    <IconPlus size={14} stroke={2.4} />
                  </button>
                  <button className="btn btn-icon btn-ghost" onClick={() => setTrackerRow(0)}>
                    <IconReset size={14} stroke={2} />
                  </button>
                </div>
              )}

              <div className="pattern-canvas-area" ref={canvasAreaRef}>
                <canvas
                  ref={canvasRef}
                  className="pattern-canvas"
                  style={{ imageRendering: 'auto', cursor: 'crosshair' }}
                  onMouseDown={onCanvasDown}
                  onMouseMove={onCanvasMove}
                  onMouseUp={onCanvasUp}
                  onMouseLeave={onCanvasUp}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--ink-400)', textAlign: 'center', padding: 40 }}>
              <div>
                <div style={{ color: 'var(--pink-300)', marginBottom: 16 }}>
                  <IconPattern size={56} stroke={1.2} />
                </div>
                <div style={{ fontSize: 16, color: 'var(--ink-700)', fontWeight: 500, marginBottom: 6 }}>아직 도안이 없어요</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', maxWidth: 320, lineHeight: 1.6 }}>
                  왼쪽에서 사진을 업로드하고 코수를 정한 뒤 <strong style={{ color: 'var(--pink-600)' }}>도안으로 변환</strong>을 눌러주세요.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color picker popover */}
      {editingPalette && (
        <div onClick={() => setEditingPalette(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div className="color-picker-pop"
               onClick={e => e.stopPropagation()}
               style={{ left: Math.min(editingPalette.x, window.innerWidth - 240), top: editingPalette.y }}>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>색상 변경</div>
            <input type="color"
                   value={palette[editingPalette.idx]?.hex || '#000000'}
                   onChange={e => updatePaletteColor(editingPalette.idx, e.target.value)}
                   style={{ width: '100%', height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
            <input className="input" style={{ height: 36 }}
                   value={palette[editingPalette.idx]?.hex || ''}
                   onChange={e => {
                     const v = e.target.value;
                     if (/^#[0-9A-Fa-f]{6}$/.test(v)) updatePaletteColor(editingPalette.idx, v);
                   }} />
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>자주 쓰는 색</div>
            <div className="swatch-grid">
              {['#FFFFFF','#F4ECEF','#FFC9DE','#EC6B9C','#B23968','#7A6B73','#1F1620','#000000',
                '#F4D06F','#7FCFB8','#8FB8E0','#C8A8E9','#FFB5A7','#A0937D','#3D5A6C','#94A684'].map(c => (
                <div key={c} style={{ background: c }} onClick={() => updatePaletteColor(editingPalette.idx, c)} />
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={showSave} onClose={() => { setShowSave(false); setOverwriteId(null); }}
             title={overwriteId ? '도안 덮어쓰기' : '도안 저장하기'}
             actions={<>
               <button className="btn btn-ghost btn-sm" onClick={() => { setShowSave(false); setOverwriteId(null); }}>취소</button>
               <button className="btn btn-primary btn-sm" onClick={doSave}>
                 {overwriteId ? '덮어쓰기' : '저장'}
               </button>
             </>}>
        <div className="field" style={{ marginTop: 8 }}>
          <label className="field-label">도안 이름</label>
          <input className="input" value={saveName} onChange={e => setSaveName(e.target.value)}
                 placeholder="예: 곰돌이 무릎담요" autoFocus
                 onKeyDown={e => e.key === 'Enter' && doSave()} />
          <div className="field-hint" style={{ marginTop: 6 }}>
            {overwriteId
              ? <>기존 도안에 <strong style={{ color: 'var(--pink-600)' }}>덮어쓰기</strong>됩니다. 트래커 위치와 측정도 함께 갱신돼요.</>
              : <>트래커 위치{trackerOn ? <strong style={{ color: 'var(--pink-600)' }}> ({trackerRow + 1}단)</strong> : ''}와 측정({measurements.length}개)도 함께 저장됩니다.</>
            }
          </div>
        </div>

        {!overwriteId && saved.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--ink-100)' }}>
            <div className="field-label" style={{ marginBottom: 8 }}>또는 기존 도안에 덮어쓰기</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {saved.map(s => (
                <div key={s.id} className="saved-item" style={{ padding: '8px 10px' }}>
                  <div className="saved-thumb" style={{ backgroundImage: `url(${s.thumb})`, width: 36, height: 36 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="saved-name" style={{ fontSize: 13 }}>{s.name}</div>
                    <div className="saved-meta" style={{ fontSize: 11 }}>
                      {s.stitchCount}×{s.rowCount} · {s.palette.length}색
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setOverwriteId(s.id); setSaveName(s.name); }}>
                    덮어쓰기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showSaved} onClose={() => setShowSaved(false)}
             title="저장된 도안"
             actions={<button className="btn btn-ghost btn-sm" onClick={() => setShowSaved(false)}>닫기</button>}>
        {saved.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}>
            <div className="empty-icon"><IconBookmark size={28} /></div>
            아직 저장된 도안이 없어요
          </div>
        ) : (
          <div className="saved-list">
            {saved.map(s => (
              <div key={s.id} className="saved-item">
                <div className="saved-thumb" style={{ backgroundImage: `url(${s.thumb})` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="saved-name">{s.name}</div>
                  <div className="saved-meta">
                    {s.stitchCount}×{s.rowCount} · {s.palette.length}색
                    {s.trackerOn ? ` · ${s.trackerRow + 1}단 진행 중` : ''}
                    {s.measurements?.length ? ` · 측정 ${s.measurements.length}개` : ''}
                    &nbsp;· {new Date(s.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className="saved-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => loadSaved(s)}>불러오기</button>
                  <button className="btn btn-icon btn-ghost" onClick={() => deleteSaved(s.id)}>
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatternTool;
