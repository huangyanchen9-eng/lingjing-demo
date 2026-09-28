// Dataset detail page with mock rendering
(function(){
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id') || 'ds_1';

    const data = LJDemo.dataset(id);
    if (!data) {
        document.getElementById('title').textContent = '未找到该数据集';
        document.getElementById('tabContent').textContent = '请返回数据集市场选择现有示例。';
        document.querySelectorAll('.actions button, .tab').forEach(b => b.disabled = true);
        return;
    }
    data.description = data.desc; data.updatedAt = data.uploadedAt;
    const saved = LJDemo.read(localStorage, 'SFLX_DATASETS', {})[data.id];
    if (saved) ['downloads', 'rating', 'reviews'].forEach(key => { if (typeof saved[key] === 'number') data[key] = saved[key]; });
    document.getElementById('title').textContent = data.name;
    document.getElementById('dsName').textContent = data.name;
    document.getElementById('meta').innerHTML = `
        <span class="badge">${data.scene}</span>
        <span><i class="fas fa-table"></i> ${data.rows}行 · ${data.cols}列</span>
        <span class="missing"><i class="fas fa-percent"></i> 缺失率 ${data.missingRate}%</span>
        <span class="rating"><i class="fas fa-star"></i> ${data.rating} (${data.reviews})</span>
    `;

    const tabs = document.querySelectorAll('.tab');
    const content = document.getElementById('tabContent');

    function renderOverview(){
        content.innerHTML = `
            <h3>数据描述</h3>
            <p>${data.description}</p>
            <h3>数据规模</h3>
            <table class="preview-table">
                <tr><th>行数</th><td>${data.rows}</td><th>列数</th><td>${data.cols}</td></tr>
                <tr><th>缺失率</th><td>${data.missingRate}%</td><th>版本</th><td>${data.version}</td></tr>
                <tr><th>更新日期</th><td>${new Date(data.updatedAt).toLocaleDateString('zh-CN')}</td><th>授权协议</th><td>${data.license}</td></tr>
            </table>
        `;
    }

    function renderPreview(){
        const allCols = Array.from({length: data.cols}, (_,i)=>({name:'col_'+(i+1), type:['int','float','str'][i%3]}));
        const state = { page:1, pageSize:50, selected: new Set(allCols.map(c=>c.name)) };

        // helpers to生成更贴近真实的值
        const perColBase = allCols.map(()=>({
            base: 20 + Math.random()*60,
            drift: (Math.random()*0.04) - 0.02,
            scale: 1 + Math.random()*3
        }));
        function randn(){ // Box–Muller
            let u = 0, v = 0; while(u===0) u=Math.random(); while(v===0) v=Math.random();
            return Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);
        }
        function genValue(col, colIdx, rowIdx){
            // 缺失按比例出现
            const missP = Math.min(0.5, data.missingRate/100 * 0.6);
            if (Math.random() < missP) return 'N/A';
            const p = perColBase[colIdx];
            if (col.type === 'int'){
                const val = p.base + p.scale*randn() + 3*Math.sin((rowIdx+colIdx)/12);
                return Math.max(0, Math.round(val));
            }
            if (col.type === 'float'){
                const val = p.base + p.drift*rowIdx + p.scale*0.6*randn() + 1.5*Math.sin((rowIdx+colIdx)/18);
                return (Math.max(0, val)).toFixed(2);
            }
            // 枚举状态，偶发告警
            const pool = ['OK','OK','OK','WARN','ERR'];
            return pool[Math.floor(Math.random()*pool.length)];
        }

        function draw(){
            const cols = allCols.filter(c=>state.selected.has(c.name));
            const rows = Array.from({length: state.pageSize}, (_,r)=>cols.map((c,i)=> genValue(c, i, (state.page-1)*state.pageSize + r)));
            const thead = '<tr>'+cols.map(c=>`<th>${c.name}</th>`).join('')+'</tr>';
            const tbody = rows.map(r=>'<tr>'+r.map(v=>`<td>${v}</td>`).join('')+'</tr>').join('');
            content.innerHTML = `
                <div style="display:flex; gap:1rem; align-items:center; margin-bottom:.6rem">
                    <div>每页
                        <select id="ppg"><option>50</option><option>100</option></select>
                        行，第 <span id="pageno">${state.page}</span> 页
                        <button id="prevp">上一页</button>
                        <button id="nextp">下一页</button>
                    </div>
                    <div>列筛选：<span id="colsel"></span></div>
                </div>
                <div style="overflow:auto"> <table class="preview-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;

            const sel = document.getElementById('colsel');
            sel.innerHTML = allCols.map(c=>`<label style="margin-right:.5rem"><input type="checkbox" ${state.selected.has(c.name)?'checked':''} data-col="${c.name}"> ${c.name}</label>`).join('');
            sel.querySelectorAll('input[type="checkbox"]').forEach(ch=>ch.addEventListener('change',()=>{ if(ch.checked) state.selected.add(ch.dataset.col); else state.selected.delete(ch.dataset.col); draw(); }));
            document.getElementById('ppg').value = String(state.pageSize);
            document.getElementById('ppg').addEventListener('change', (e)=>{ state.pageSize = parseInt(e.target.value,10); state.page=1; draw(); });
            document.getElementById('prevp').addEventListener('click', ()=>{ if(state.page>1){ state.page--; draw(); }});
            document.getElementById('nextp').addEventListener('click', ()=>{ if (state.page < Math.ceil(data.rows / state.pageSize)) { state.page++; draw(); } });
        }

        draw();
    }

    function renderCases(){
        const cases = [
            {
                title: '工业温控车间缺失修复',
                model: '灵境织算',
                rating: 4.7,
                text: '原始数据温度/湿度存在间断，使用该数据集微调后，RMSE 从 0.42 降到 0.31，异常告警误报率下降约 12%。',
                org: '某制造企业 · 产线监控组'
            },
            {
                title: '病房生命体征补全',
                model: '灵境织算',
                rating: 4.6,
                text: '住院部监护数据因探头脱落产生连续缺失，基于该数据集训练的模型能平滑补全心率/血氧，临床复核通过率达到 93%。',
                org: '市三院 · 信息科'
            },
            {
                title: '城市空气质量断点修复',
                model: '灵境织算',
                rating: 4.8,
                text: 'PM2.5/NO₂ 站点因供电波动缺测，接入本数据集后，周报 MAE 下降 18%，时序连续性显著改善。',
                org: '生态环境监测中心'
            }
        ];
        content.innerHTML = `
            <div class="dataset-grid">
                ${cases.map(c=>`<div class="card">
                    <div class="title">${c.title}</div>
                    <div class="meta"><span>模型：${c.model}</span><span class="rating"><i class=\"fas fa-star\"></i> ${c.rating}</span></div>
                    <p>${c.text}</p>
                    <div class="meta"><span>${c.org}</span></div>
                    <button class="btn-outline-sm">查看报告</button>
                </div>`).join('')}
            </div>
        `;
    }

    function renderComments(){
        const list = [
            {user:'王工', rating:4.0, time:Date.now()-2*86400000, text:'列说明清楚，空值主要集中在夜间时段，方便做规则化处理。'},
            {user:'周老师', rating:4.6, time:Date.now()-5*86400000, text:'拿来做课堂实验挺合适的，特征分布稳定，学生能复现实验结果。'},
            {user:'林技术', rating:3.8, time:Date.now()-7*86400000, text:'个别列存在异常峰值，建议补充单位/量纲说明，其它都还好。'},
            {user:'陈医生', rating:4.5, time:Date.now()-9*86400000, text:'和院内监护数据对齐后效果不错，心率补全视觉上比较自然。'},
            {user:'sensor_dev', rating:4.2, time:Date.now()-12*86400000, text:'加入自家站点后训练也能收敛，通用性还可以。'}
        ];
        const html = list.map(c=>`<div class="card"><div class="meta"><span class="rating"><i class=\"fas fa-star\"></i> ${c.rating.toFixed(1)}</span><span>${c.user}</span><span>${new Date(c.time).toLocaleString('zh-CN')}</span></div><p>${c.text}</p></div>`).join('');
        content.innerHTML = `
            <div class="card">
                <div class="title">发表评论</div>
                <div style="display:flex; gap:.6rem; margin:.6rem 0">
                    <input id="commentText" style="flex:1; padding:.6rem 1rem; border:1px solid #e5e7eb; border-radius:10px" placeholder="写下你的体验…">
                    <select id="commentRate"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
                    <button id="submitComment" class="btn-outline-sm">提交</button>
                </div>
            </div>
            ${html}
        `;
        const submit = document.getElementById('submitComment');
        submit.addEventListener('click', ()=>{
            // 简单演示：更新评分与评价数量并持久化
            const rating = Number(document.getElementById('commentRate').value);
            const store = LJDemo.read(localStorage, 'SFLX_DATASETS', {});
            const s = store[data.id] || {downloads:data.downloads, rating:data.rating, reviews:data.reviews};
            const newReviews = (s.reviews||data.reviews)+1;
            const newRating = ((s.rating||data.rating)* (newReviews-1) + rating) / newReviews;
            store[data.id] = {downloads:s.downloads||0, rating:Number(newRating.toFixed(1)), reviews:newReviews};
            localStorage.setItem('SFLX_DATASETS', JSON.stringify(store));
            data.rating = store[data.id].rating; data.reviews = store[data.id].reviews;
            document.querySelector('#meta .rating').textContent = '★ ' + data.rating + ' (' + data.reviews + ')';
            alert('已提交评论（演示）');
        });
    }

    function renderDownload(){
        content.innerHTML = `
            <div class="card">
                <div class="title">文件格式</div>
                <p>CSV（下载为 5 行合成示例）</p>
                <div class="title" style="margin-top:.6rem">Python 示例</div>
<pre style="background:#0f172a; color:#e2e8f0; padding:.8rem 1rem; border-radius:10px; overflow:auto"><code>import pandas as pd
df = pd.read_csv('dataset.csv')
print(df.head())
</code></pre>
                <div class="title" style="margin-top:.6rem">常见问题</div>
                <p>缺失值以空单元格/NAN 表示；建议使用我们提供的填补系统进行修复。</p>
            </div>
        `;
    }

    function switchTab(tab){
        tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
        if(tab==='overview') renderOverview();
        if(tab==='preview') renderPreview();
        if(tab==='cases') renderCases();
        if(tab==='comments') renderComments();
        if(tab==='download') renderDownload();
    }

    tabs.forEach(t=>t.addEventListener('click', ()=>switchTab(t.dataset.tab)));
    switchTab(['overview','preview','cases','comments','download'].includes(qs.get('tab')) ? qs.get('tab') : 'overview');

    // Buttons
    document.getElementById('btnDownload').addEventListener('click', ()=>{
        LJDemo.download(LJDemo.sampleCSV(), data.id + '_sample.csv');
    });

    document.getElementById('btnImport').addEventListener('click', ()=>{
        // Store an import flag for upload page to pick up
        sessionStorage.setItem('importDataset', JSON.stringify({id:data.id, name:data.name}));
        // 直接跳转到数据上传页（不再拦截到登录页）
        location.href = 'upload.html';
    });

    document.getElementById('btnFav').addEventListener('click', ()=>{
        if(sessionStorage.getItem('isLoggedIn')!=='true'){
            alert('请先登录');
            location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
            return;
        }
        alert('已收藏（演示）');
    });
})();

