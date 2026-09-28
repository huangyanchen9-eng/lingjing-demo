// Shared synthetic fixtures. User files are previewed locally, never uploaded.
(function () {
    const models = { attnwgain: 'AttnWGAIN', transformer: 'Transformer', rnn: 'RNN' };
    const runKey = 'LJ_DEMO_RUN_V1';
    const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function read(storage, key, fallback) {
        try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function parseCSV(text, limit = 6) {
        const rows = []; let row = [], cell = '', quoted = false;
        text = text.replace(/^\uFEFF/, '');
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
                if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
                else quoted = !quoted;
            } else if (!quoted && c === ',') { row.push(cell); cell = ''; }
            else if (!quoted && (c === '\n' || c === '\r')) {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(cell); rows.push(row); row = []; cell = '';
                if (rows.length >= limit) return rows;
            } else cell += c;
        }
        if (cell || row.length) { row.push(cell); rows.push(row); }
        return rows;
    }
    function createRun(options = {}) {
        const missingRate = [10, 20, 30, 40, 50].includes(Number(options.missingRate)) ? Number(options.missingRate) : 20;
        const rows = Array.from({ length: 100 }, (_, i) => {
            const truth = +(25 + Math.sin(i * .1) * 5 + Math.cos(i * .7) * .4).toFixed(3);
            const missing = (i * 37 % 100) < missingRate;
            const imputed = missing ? +(truth + Math.sin(i * 1.7) * .24).toFixed(3) : truth;
            return { timestamp: new Date(Date.UTC(2025, 0, 1, 0, i)).toISOString(), original: missing ? null : truth, imputed, difference: Math.abs(truth - imputed), status: missing ? 'imputed' : 'original', truth };
        });
        return { version: 1, demo: true, name: options.name || '内置传感器示例.csv', model: models[options.model] ? options.model : 'attnwgain', missingRate, batchSize: Number(options.batchSize) || 64, epochs: Number(options.epochs) || 200, rows };
    }
    function loadRun() {
        const stored = read(sessionStorage, runKey, null);
        // Rebuild from metadata so stale or malformed row data cannot break charts.
        return createRun(stored?.version === 1 ? stored : {});
    }
    function saveRun(run) { sessionStorage.setItem(runKey, JSON.stringify(run)); }
    function resultsCSV(run) {
        const rows = [['时间戳','原始数据','填补数据','合成真值误差','状态','数据性质'], ...run.rows.map(r => [r.timestamp, r.original ?? '', r.imputed, r.difference.toFixed(3), r.status === 'imputed' ? '填补' : '原始', '演示合成数据'])];
        return '\uFEFF' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    }
    function download(text, name) {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function catalog() {
        const scenes = ['工业制造','医疗健康','智能交通','金融科技','环境监测','农业科技','能源电力'];
        return Array.from({ length: 120 }, (_, index) => {
            const n = index + 1, scene = scenes[index % scenes.length];
            return { id: 'ds_' + n, name: scene + ' 传感器数据集 #' + n, desc: '用于' + scene + '场景的时序/设备记录（演示合成数据）', tags: ['传感器','时序','IoT'], scene, rows: 800 + n * 379, cols: 8 + n % 53, missingRate: n * 7 % 61, downloads: 50 + n * 31, uploadedAt: Date.now() - (n % 60 + 1) * 86400000, rating: +(3 + n % 21 / 10).toFixed(1), reviews: 2 + n % 119, sizeMB: (n * .79).toFixed(1), formats: ['CSV'], license: '仅供本地演示', version: 'demo-1.0' };
        });
    }
    function dataset(id) { return catalog().find(d => d.id === id) || null; }
    function sampleCSV() { return 'timestamp,value\r\n2025-01-01 00:00,25.4\r\n2025-01-01 00:01,\r\n2025-01-01 00:02,26.1\r\n2025-01-01 00:03,25.8\r\n2025-01-01 00:04,\r\n'; }
    window.LJDemo = { models, read, escapeHTML, parseCSV, createRun, loadRun, saveRun, resultsCSV, download, catalog, dataset, sampleCSV };
})();
