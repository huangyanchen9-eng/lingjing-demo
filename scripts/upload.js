// File selection, preview and the explicitly synthetic demo workflow.
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const area = $('uploadArea'), input = $('fileInput'), start = $('startImputation');
    let source = null, model = 'attnwgain', busy = false, selectionVersion = 0;
    start.disabled = false;

    function preview(rows) {
        const render = (cells, tag) => '<tr>' + cells.map(c => `<${tag}>${LJDemo.escapeHTML(c)}</${tag}>`).join('') + '</tr>';
        $('previewHead').innerHTML = rows.length ? render(rows[0], 'th') : '';
        $('previewBody').innerHTML = rows.slice(1, 6).map(row => render(row, 'td')).join('');
        $('filePreview').style.display = 'block';
    }
    function showSource(name, size) {
        $('fileName').textContent = name;
        $('fileSize').textContent = size;
        $('fileInfo').style.display = 'block'; area.style.display = 'none';
    }
    function selectFile(file) {
        if (busy) return;
        if (!/\.(csv|xlsx|xls)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) {
            input.value = '';
            showNotification('请选择非空的 CSV 或 Excel 文件，大小不超过 10MB', 'error');
            return;
        }
        const version = ++selectionVersion;
        source = { name: file.name };
        showSource(file.name, utils.formatFileSize(file.size) + ' · 仅在本地预览');
        $('filePreview').style.display = 'none';
        if (/\.csv$/i.test(file.name)) {
            const reader = new FileReader();
            reader.onload = () => { if (version === selectionVersion) preview(LJDemo.parseCSV(String(reader.result))); };
            reader.onerror = () => { if (version === selectionVersion) showNotification('文件预览失败，请重新选择', 'error'); };
            reader.readAsText(file);
        } else {
            preview([['Excel 文件已选择'], ['此演示仅预览 CSV；结果页使用合成示例数据。']]);
        }
        showNotification('文件已选择；演示结果使用合成示例数据', 'info');
    }
    // The input is inside the drop zone; stop its click from opening it again.
    input.addEventListener('click', e => e.stopPropagation());
    area.addEventListener('click', () => { if (!busy) input.click(); });
    area.addEventListener('keydown', e => { if (e.target === area && ['Enter', ' '].includes(e.key)) { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { if (input.files[0]) selectFile(input.files[0]); });
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('dragover'); if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]); });
    window.removeFile = () => {
        if (busy) return;
        selectionVersion++; source = null; input.value = '';
        $('fileInfo').style.display = 'none'; $('filePreview').style.display = 'none'; area.style.display = 'block';
        sessionStorage.removeItem('importDataset');
    };
    const imported = LJDemo.read(sessionStorage, 'importDataset', null);
    if (imported) {
        const data = LJDemo.dataset(imported.id);
        if (data) {
            source = { name: data.name + '.csv' };
            showSource(source.name, '数据集市场 · 合成示例');
            preview(LJDemo.parseCSV(LJDemo.sampleCSV()));
        }
        sessionStorage.removeItem('importDataset');
    }
    $('useSample').addEventListener('click', () => {
        if (busy) return;
        selectionVersion++; input.value = ''; source = { name: '内置传感器示例.csv' };
        showSource(source.name, '合成示例 · 5 行预览'); preview(LJDemo.parseCSV(LJDemo.sampleCSV()));
    });
    $('downloadSample').addEventListener('click', () => LJDemo.download(LJDemo.sampleCSV(), 'lingjing_sample.csv'));
    document.querySelectorAll('.model-card').forEach(card => card.addEventListener('click', () => {
        if (busy) return;
        document.querySelectorAll('.model-card').forEach(c => { c.classList.toggle('active', c === card); c.setAttribute('aria-pressed', String(c === card)); });
        model = card.dataset.model;
    }));
    const presets = { duration: [20, 64, 200], multivariate: [20, 128, 300], 'high-missing': [40, 64, 300] };
    document.querySelectorAll('.preset-card').forEach(card => card.addEventListener('click', () => {
        if (busy) return;
        document.querySelectorAll('.preset-card').forEach(c => { c.classList.toggle('active', c === card); c.setAttribute('aria-pressed', String(c === card)); });
        ['missingRate','batchSize','epochs'].forEach((id, i) => { $(id).value = presets[card.dataset.preset][i]; });
    }));
    document.querySelectorAll('.model-card, .preset-card').forEach(card => {
        card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-pressed', String(card.classList.contains('active')));
        card.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); card.click(); } });
    });
    document.querySelectorAll('.form-select').forEach(select => select.addEventListener('change', () => {
        document.querySelectorAll('.preset-card').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
    }));
    $('toggleAdvanced').addEventListener('click', () => {
        const panel = document.querySelector('.parameter-hidden');
        const opened = panel.style.display !== 'block'; panel.style.display = opened ? 'block' : 'none';
        $('toggleAdvanced').setAttribute('aria-expanded', String(opened));
        $('toggleAdvanced').innerHTML = '<i class="fas fa-sliders-h"></i> ' + (opened ? '收起参数' : '高级参数');
    });
    start.addEventListener('click', () => {
        if (busy) return;
        const run = LJDemo.createRun({ name: source?.name, model, missingRate: $('missingRate').value, batchSize: $('batchSize').value, epochs: $('epochs').value });
        busy = true; start.disabled = true;
        document.querySelectorAll('.form-select').forEach(el => el.disabled = true);
        $('progressSection').style.display = 'block'; $('resultsSection').style.display = 'none';
        $('progressSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
        const steps = ['准备合成示例数据…', '演示预处理…', '演示模型填补…', '生成示例图表…', '演示完成'];
        let step = 0;
        function advance() {
            $('progressFill').style.width = ((step + 1) / steps.length * 100) + '%';
            $('progressFill').parentElement.setAttribute('aria-valuenow', String((step + 1) * 20));
            $('progressText').textContent = steps[step];
            if (++step < steps.length) { setTimeout(advance, 650); return; }
            try {
                LJDemo.saveRun(run);
                $('resultsSection').style.display = 'block';
                showNotification('示例结果已生成，正在进入结果页', 'success');
                setTimeout(() => { location.href = 'results.html'; }, 600);
            } catch {
                busy = false; start.disabled = false;
                document.querySelectorAll('.form-select').forEach(el => el.disabled = false);
                showNotification('无法保存演示状态，请允许浏览器会话存储后重试', 'error');
            }
        }
        advance();
    });
    window.downloadResults = () => LJDemo.download(LJDemo.resultsCSV(LJDemo.loadRun()), 'lingjing_demo_results.csv');
});
