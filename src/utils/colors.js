export const PX_W = 3;
export const PX_H = 2;

export const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export const parseHex = (h) => {
    const s = h.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};

export const luma = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

export function axisLock(r1, c1, r2, c2) {
    const dCols = Math.abs(c2 - c1);
    const dRows = Math.abs(r2 - r1);
    if (dCols >= dRows) {
        return {r1, c1, r2: r1, c2};
    } else {
        return {r1, c1, r2, c2: c1};
    }
}

export function kmeans(pixels, k, maxIter = 14) {
    if (pixels.length === 0) return {centroids: [], labels: []};
    const centroids = [];
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)].slice());
    while (centroids.length < k) {
        const dists = pixels.map(p => {
            let min = Infinity;
            for (const c of centroids) {
                const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
                if (d < min) min = d;
            }
            return min;
        });
        const total = dists.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let idx = 0;
        for (; idx < dists.length; idx++) {
            r -= dists[idx];
            if (r <= 0) break;
        }
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
                const d = (p[0] - ct[0]) ** 2 + (p[1] - ct[1]) ** 2 + (p[2] - ct[2]) ** 2;
                if (d < bestD) {
                    bestD = d;
                    best = c;
                }
            }
            if (labels[i] !== best) {
                labels[i] = best;
                changed++;
            }
        }
        const sums = Array.from({length: k}, () => [0, 0, 0, 0]);
        for (let i = 0; i < pixels.length; i++) {
            const c = labels[i], p = pixels[i];
            sums[c][0] += p[0];
            sums[c][1] += p[1];
            sums[c][2] += p[2];
            sums[c][3]++;
        }
        for (let c = 0; c < k; c++) {
            if (sums[c][3] > 0) {
                centroids[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
            }
        }
        if (changed === 0) break;
    }
    return {centroids: centroids.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])]), labels};
}

export function estimateColors(imgEl) {
    const c = document.createElement('canvas');
    const W = 60, H = 60;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    const set = new Set();
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] >> 6, g = data[i + 1] >> 6, b = data[i + 2] >> 6;
        set.add((r << 4) | (g << 2) | b);
    }
    return Math.max(3, Math.min(20, set.size));
}
