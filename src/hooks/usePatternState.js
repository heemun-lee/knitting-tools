import {useState, useEffect, useRef, useCallback} from 'react';
import {useToast} from './useToast';
import {useLocal} from './useLocal';
import {kmeans, estimateColors, hex, parseHex, luma, axisLock, PX_W, PX_H} from '../utils/colors';

export const usePatternState = () => {
    const toast = useToast();
    const fileRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasAreaRef = useRef(null);

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
    const [overwriteId, setOverwriteId] = useState(null);

    const [drawing, setDrawing] = useState(false);
    const [floatingDrag, setFloatingDrag] = useState(null);
    const [measureDragEnd, setMeasureDragEnd] = useState(null);

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        setImgUrl(url);
        const img = new Image();
        img.onload = () => {
            setImgEl(img);
            try {
                setColorCount(estimateColors(img));
            } catch {
            }
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
        if (!imgEl) {
            toast('먼저 사진을 업로드해주세요');
            return;
        }
        setBusy(true);
        setTimeout(() => {
            try {
                const W = stitchCount, H = rowCount, K = colorCount;
                const work = document.createElement('canvas');
                work.width = W;
                work.height = H;
                const ctx = work.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(imgEl, 0, 0, W, H);
                const data = ctx.getImageData(0, 0, W, H).data;
                const pixels = [];
                for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i + 1], data[i + 2]]);
                const {centroids, labels} = kmeans(pixels, K);
                const newGrid = [];
                for (let r = 0; r < H; r++) {
                    const row = [];
                    for (let c = 0; c < W; c++) row.push(labels[r * W + c]);
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
    }, [imgEl, stitchCount, rowCount, colorCount, toast]);

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

    useEffect(() => {
        fitScale();
    }, [grid, fullscreen, fitScale]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && fullscreen) setFullscreen(false);
        };
        const onResize = () => {
            if (fullscreen) fitScale();
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
        };
    }, [fullscreen, fitScale]);

    const pushHistory = () => {
        setHistory(h => [...h.slice(-29), JSON.stringify({grid, palette})]);
        setRedoStack([]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setRedoStack(r => [...r, JSON.stringify({grid, palette})]);
        const {grid: g, palette: p} = JSON.parse(prev);
        setGrid(g);
        setPalette(p);
        setHistory(h => h.slice(0, -1));
    };
    const redo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setHistory(h => [...h, JSON.stringify({grid, palette})]);
        const {grid: g, palette: p} = JSON.parse(next);
        setGrid(g);
        setPalette(p);
        setRedoStack(r => r.slice(0, -1));
    };

    const getCellFromEvent = (e) => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const cw = pixelScale * PX_W;
        const ch = pixelScale * PX_H;
        const G_LEFT = 32, G_TOP = 8;
        const col = Math.floor((x - G_LEFT) / cw);
        const row = Math.floor((y - G_TOP) / ch);
        if (col < 0 || row < 0 || !grid || col >= grid[0].length || row >= grid.length) return null;
        return {row, col};
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
                stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
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
        toast(`${c2 - c1 + 1}×${r2 - r1 + 1} 복사했어요`);
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
        setFloating({r, c, data: clipboard, h: clipboard.length, w: clipboard[0].length});
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
        setFloating({r: r1, c: c1, data, h: data.length, w: data[0].length});
        setSelection(null);
        toast('이동 모드 — 드래그하세요');
    };

    const hitTestMeasure = (cell) => {
        for (const m of measurements) {
            if (Math.abs(m.r1 - cell.row) <= 1 && Math.abs(m.c1 - cell.col) <= 1) return {id: m.id, end: 1};
            if (Math.abs(m.r2 - cell.row) <= 1 && Math.abs(m.c2 - cell.col) <= 1) return {id: m.id, end: 2};
        }
        return null;
    };

    const onCanvasDown = (e) => {
        if (!grid) return;
        const cell = getCellFromEvent(e);
        if (!cell) return;

        if (floating) {
            const inFloat = cell.row >= floating.r && cell.row < floating.r + floating.h &&
                cell.col >= floating.c && cell.col < floating.c + floating.w;
            if (inFloat) {
                setFloatingDrag({offsetR: cell.row - floating.r, offsetC: cell.col - floating.c});
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
                setMeasureDragEnd({id: hitId.id, end: hitId.end});
            } else {
                setSelectedMeasure(null);
                setMeasureDraft({r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col});
            }
        } else if (tool === 'select') {
            setSelectDraft({r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col});
            setSelection(null);
        }
    };

    const onCanvasMove = (e) => {
        const cell = getCellFromEvent(e);
        if (!cell) return;
        if (floatingDrag) {
            setFloating(f => f ? {...f, r: cell.row - floatingDrag.offsetR, c: cell.col - floatingDrag.offsetC} : f);
            return;
        }
        if (drawing && tool === 'brush') paintCell(cell.row, cell.col);
        if (measureDraft) setMeasureDraft(m => axisLock(m.r1, m.c1, cell.row, cell.col));
        if (measureDragEnd) {
            setMeasurements(ms => ms.map(m => {
                if (m.id !== measureDragEnd.id) return m;
                if (measureDragEnd.end === 1) {
                    const locked = axisLock(cell.row, cell.col, m.r2, m.c2);
                    return {...m, ...locked};
                }
                return {...m, ...axisLock(m.r1, m.c1, cell.row, cell.col)};
            }));
        }
        if (selectDraft) setSelectDraft(s => ({...s, r2: cell.row, c2: cell.col}));
    };

    const onCanvasUp = () => {
        setDrawing(false);
        setFloatingDrag(null);
        setMeasureDragEnd(null);
        if (measureDraft) {
            const m = {...measureDraft, id: Date.now().toString(36)};
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
        setPalette(p => p.map((it, i) => i === idx ? {...it, hex: newHex, rgb: parseHex(newHex)} : it));
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
        grid.forEach(r => r.forEach(v => {
            if (v < counts.length) counts[v]++;
        }));
        setPalette(p => p.map((it, i) => it.count === counts[i] ? it : {...it, count: counts[i]}));
    }, [grid]);

    const buildEntry = (id) => {
        const thumbCanvas = document.createElement('canvas');
        const tw = 90, th = Math.round(90 * (grid.length * PX_H) / (grid[0].length * PX_W));
        thumbCanvas.width = tw;
        thumbCanvas.height = th;
        const tctx = thumbCanvas.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        const cw = tw / grid[0].length, ch = th / grid.length;
        grid.forEach((row, r) => row.forEach((v, c) => {
            tctx.fillStyle = palette[v]?.hex || '#fff';
            tctx.fillRect(c * cw, r * ch, cw + 1, ch + 1);
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
        if (!saveName.trim()) {
            toast('이름을 적어주세요');
            return;
        }
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

    const openSaveAs = () => {
        setOverwriteId(null);
        setSaveName('');
        setShowSave(true);
    };
    const openSaveOver = (entry) => {
        setOverwriteId(entry.id);
        setSaveName(entry.name);
        setShowSave(true);
    };

    const loadSaved = (entry) => {
        setGrid(entry.grid);
        setPalette(entry.palette);
        setStitchCount(entry.stitchCount);
        setRowCount(entry.rowCount);
        setHistory([]);
        setRedoStack([]);
        setMeasurements(entry.measurements || []);
        setTrackerOn(!!entry.trackerOn);
        setTrackerRow(entry.trackerRow || 0);
        setSelection(null);
        setFloating(null);
        setSelectedMeasure(null);
        setShowSaved(false);
        toast(`'${entry.name}' 불러왔어요`);
    };

    const deleteSaved = (id) => setSaved(s => s.filter(x => x.id !== id));

    return {
        toast,
        fileRef,
        canvasRef,
        canvasAreaRef,
        imgUrl, setImgUrl,
        imgEl, setImgEl,
        stitchCount, setStitchCount,
        rowCount, setRowCount,
        colorCount, setColorCount,
        grid, setGrid,
        palette, setPalette,
        history, setHistory,
        redoStack, setRedoStack,
        busy, setBusy,
        tool, setTool,
        activeColor, setActiveColor,
        pixelScale, setPixelScale,
        fullscreen, setFullscreen,
        trackerOn, setTrackerOn,
        trackerRow, setTrackerRow,
        measurements, setMeasurements,
        measureDraft, setMeasureDraft,
        selectedMeasure, setSelectedMeasure,
        selection, setSelection,
        selectDraft, setSelectDraft,
        floating, setFloating,
        clipboard, setClipboard,
        editingPalette, setEditingPalette,
        mergeMode, setMergeMode,
        mergeFrom, setMergeFrom,
        saved, setSaved,
        showSaved, setShowSaved,
        saveName, setSaveName,
        showSave, setShowSave,
        overwriteId, setOverwriteId,
        drawing, setDrawing,
        floatingDrag, setFloatingDrag,
        measureDragEnd, setMeasureDragEnd,
        onFile,
        convert,
        fitScale,
        pushHistory,
        undo, redo,
        getCellFromEvent,
        paintCell,
        floodFill,
        commitFloating,
        copySelection, cutSelection, pasteClipboard, moveSelectionToFloating,
        hitTestMeasure,
        onCanvasDown, onCanvasMove, onCanvasUp,
        deleteSelectedMeasure,
        updatePaletteColor, mergePalette,
        buildEntry, doSave, openSaveAs, openSaveOver, loadSaved, deleteSaved
    };
};
