// Datasets market page script with mock data and client-side filtering
(function(){
    const grid = document.getElementById('datasetGrid');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestions = document.getElementById('suggestions');
    const historyChips = document.getElementById('historyChips');
    const hotChips = document.getElementById('hotChips');
    const likeRow = document.getElementById('likeRow');
    const newbieRow = document.getElementById('newbieRow');
    const resultCount = document.getElementById('resultCount');
    const loadingMore = document.getElementById('loadingMore');
    const paginator = document.getElementById('paginator');
    const pageInfo = document.getElementById('pageInfo');
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    const gotoInput = document.getElementById('gotoInput');
    const gotoBtn = document.getElementById('gotoBtn');

    const sceneRadios = document.querySelectorAll('input[name="scene"]');
    const missingRadios = document.querySelectorAll('input[name="missing"]');
    const sortSelect = document.getElementById('sortSelect');

    const modal = null;
    const modalClose = null;
    const modalTitle = null;
    const modalBody = null;

    const ALL = LJDemo.catalog();
    // 恢复持久化统计（演示）
    const savedStats = LJDemo.read(localStorage, 'SFLX_DATASETS', {});
    ALL.forEach(d=>{
        if(savedStats[d.id]){
            const s = savedStats[d.id];
            if(typeof s.downloads==='number') d.downloads = s.downloads;
            if(typeof s.rating==='number') d.rating = s.rating;
            if(typeof s.reviews==='number') d.reviews = s.reviews;
        }
    });

    // State
    let page = 1; const pageSize = 15; let current = []; let totalPages = 1;

    function timeago(ts){
        const diff = Math.floor((Date.now()-ts)/86400000);
        if(diff<=0) return '今天';
        return diff+'天前';
    }

    function applyFilters(){
        const q = (searchInput.value||'').trim().toLowerCase();
        const scene = document.querySelector('input[name="scene"]:checked').value;
        const missing = document.querySelector('input[name="missing"]:checked').value;
        const sort = sortSelect.value;
        const maxMissing = Number(document.getElementById('missingRange')?.value || 50);
        const size = (document.querySelector('input[name="fsize"]:checked')||{}).value || 'all';
        const samples = (document.querySelector('input[name="samples"]:checked')||{}).value || 'all';
        const dims = (document.querySelector('input[name="dims"]:checked')||{}).value || 'all';
        const stars = (document.querySelector('input[name="stars"]:checked')||{}).value || 'all';
        const certOnly = document.getElementById('certOnly')?.checked;
        const communityPick = document.getElementById('communityPick')?.checked;
        const recentOnly = document.getElementById('recentOnly')?.checked;
        const fmtChecked = Array.from(document.querySelectorAll('#fmtChips input:checked')).map(i=>i.value);

        let list = ALL.filter(d=>{
            let ok = true;
            if(q){ ok = advancedMatch(d, q); }
            if(ok && scene!=='all') ok = d.scene===scene;
            if(ok) ok = d.missingRate <= maxMissing;
            if(ok && size!=='all'){
                const s = Number(d.sizeMB);
                if(size==='small') ok = s <= 1; else if(size==='medium') ok = s>1 && s<=50; else ok = s>50;
            }
            if(ok && samples!=='all'){
                if(samples==='>10000') ok = d.rows>10000; else if(samples==='1000-10000') ok = d.rows>=1000 && d.rows<=10000; else ok = d.rows<1000;
            }
            if(ok && dims!=='all'){
                if(dims==='low') ok = d.cols<10; else if(dims==='mid') ok = d.cols>=10 && d.cols<=50; else ok = d.cols>50;
            }
            if(ok && stars!=='all') ok = d.rating >= Number(stars);
            if(ok && fmtChecked.length) ok = fmtChecked.some(f=>d.formats.includes(f));
            if(ok && recentOnly) ok = (Date.now()-d.uploadedAt) <= 7*86400000;
            // cert/community picks demo: pick by thresholds
            if(ok && certOnly) ok = d.rating>=4.5 && d.reviews>40;
            if(ok && communityPick) ok = d.rating>=4.2 && d.downloads>1000;
            if(ok && missing!=='all'){
                if(missing==='light') ok = d.missingRate<=20;
                else if(missing==='medium') ok = d.missingRate>20 && d.missingRate<=40;
                else ok = d.missingRate>40;
            }
            return ok;
        });

        if(sort==='latest') list.sort((a,b)=>b.uploadedAt-a.uploadedAt);
        if(sort==='downloads') list.sort((a,b)=>b.downloads-a.downloads);
        if(sort==='rating') list.sort((a,b)=>b.rating-a.rating);

        current = list;
        page = 1;
        totalPages = Math.max(1, Math.ceil(current.length / pageSize));
        grid.innerHTML = '';
        resultCount.textContent = `找到 ${list.length} 个数据集`;
        renderPage();
    }

    function advancedMatch(d, q){
        // support simple AND/OR/NOT
        const text = (d.name+' '+d.desc+' '+d.tags.join(' ')+ ' '+ d.scene).toLowerCase();
        const tokens = q.replace(/\s+/g,' ').split(' ');
        let include = [] , exclude = [];
        let currentAnd = [];
        for(let i=0;i<tokens.length;i++){
            const t = tokens[i];
            if(t==='and') continue;
            if(t==='or') { if(currentAnd.length){ include.push(currentAnd); currentAnd=[]; } continue; }
            if(t==='not'){ i++; if(i<tokens.length) exclude.push(tokens[i]); continue; }
            currentAnd.push(t);
        }
        if(currentAnd.length) include.push(currentAnd);
        const passInclude = include.length===0 || include.some(group=>group.every(w=>text.includes(w)));
        const passExclude = exclude.every(w=>!text.includes(w));
        return passInclude && passExclude;
    }

    function renderPage(){
        const start = (page-1)*pageSize;
        const slice = current.slice(start, start+pageSize);
        grid.innerHTML = '';
        slice.forEach(d=>grid.appendChild(renderCard(d)));
        if (!slice.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = '没有符合条件的数据集，请调整关键词或筛选条件。'; grid.appendChild(empty); }
        loadingMore.style.display = 'none';
        if (paginator) {
            paginator.style.display = 'flex';
            pageInfo.textContent = `第 ${page} / ${totalPages} 页`;
            firstPageBtn.disabled = page <= 1;
            prevPageBtn.disabled = page <= 1;
            nextPageBtn.disabled = page >= totalPages;
            lastPageBtn.disabled = page >= totalPages;
        }
    }

    function renderCard(d){
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="title">${d.name}</div>
            <span class="badge scene-${d.scene}">${d.scene}</span>
            <div class="meta">
                <span class="rating"><i class="fas fa-star"></i> ${d.rating} (${d.reviews})</span>
                <span><i class="fas fa-table"></i> ${d.rows}行 × ${d.cols}列</span>
                <span><i class="fas fa-file"></i> ${d.sizeMB} MB</span>
                <span class="missing"><i class="fas fa-percent"></i> ${Math.max(0, d.missingRate-5)}% - ${d.missingRate}%</span>
                <span class="downloads"><i class="fas fa-download"></i> ${d.downloads}</span>
                <span class="timeago"><i class="far fa-clock"></i> ${timeago(d.uploadedAt)}</span>
            </div>
            <div class="desc">${d.desc}</div>
            <div class="footer">
               <div>${d.formats.map(f=>`<span class="chip">${f}</span>`).join('')}</div>
               <div class="op">
                   <button class="icon-btn btn-preview" title="快速预览"><i class="far fa-eye"></i></button>
                   <button class="icon-btn btn-download" title="下载"><i class="fas fa-download"></i></button>
                   <button class="icon-btn btn-import" title="一键导入"><i class="fas fa-cloud-upload-alt"></i></button>
                   <button class="icon-btn btn-fav" title="收藏"><i class="far fa-heart"></i></button>
                   <button class="icon-btn btn-share" title="分享"><i class="fas fa-share-alt"></i></button>
               </div>
            </div>
        `;

        card.addEventListener('click', (e)=>{
            if (e.target.closest('.btn-preview') || e.target.closest('.btn-download')) return;
            location.href = `dataset-detail.html?id=${encodeURIComponent(d.id)}`;
        });
        card.querySelector('.btn-preview').addEventListener('click', (e)=>{
            e.stopPropagation(); openPreview(d);
        });
        card.querySelector('.btn-download').addEventListener('click', (e)=>{
            e.stopPropagation(); doDownload(d);
        });
        card.querySelector('.btn-import').addEventListener('click', (e)=>{ e.stopPropagation(); sessionStorage.setItem('importDataset', JSON.stringify({id:d.id,name:d.name})); location.href = 'upload.html'; });
        card.querySelector('.btn-fav').addEventListener('click', (e)=>{ e.stopPropagation(); alert('已收藏（演示）'); });
        card.querySelector('.btn-share').addEventListener('click', (e)=>{ e.stopPropagation(); const url = new URL('dataset-detail.html?id=' + d.id, location.href).href; if (navigator.clipboard) navigator.clipboard.writeText(url).then(()=>alert('分享链接已复制')).catch(()=>alert(url)); else alert(url); });
        return card;
    }

    function openPreview(d){
        location.href = 'dataset-detail.html?id=' + encodeURIComponent(d.id) + '&tab=preview';

        // Simulate async load
        // removed content building
    }

    // modal removed

    function doDownload(d){
        // Mock: increase downloads and simulate file
        d.downloads += 1; 
        const stats = JSON.parse(localStorage.getItem('SFLX_DATASETS')||'{}');
        stats[d.id] = {downloads:d.downloads, rating:d.rating, reviews:d.reviews};
        localStorage.setItem('SFLX_DATASETS', JSON.stringify(stats));
        applyFilters();
        LJDemo.download(LJDemo.sampleCSV(), d.id + '_sample.csv');
    }

    // Search & filters
    searchBtn.addEventListener('click', ()=>{ saveHistory(searchInput.value); applyFilters(); });
    searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ saveHistory(searchInput.value); applyFilters(); }});
    searchInput.addEventListener('input', onSuggest);
    suggestions.addEventListener('click', (e)=>{ const item = e.target.closest('.item'); if(item){ searchInput.value = item.dataset.q; suggestions.style.display='none'; applyFilters(); }});
    sceneRadios.forEach(r=>r.addEventListener('change', applyFilters));
    missingRadios.forEach(r=>r.addEventListener('change', applyFilters));
    sortSelect.addEventListener('change', applyFilters);
    document.querySelectorAll('input[name="fsize"], input[name="samples"], input[name="dims"], input[name="stars"], #certOnly, #communityPick, #recentOnly, #fmtChips input').forEach(el => el.addEventListener('change', applyFilters));
    const missingRange = document.getElementById('missingRange');
    if(missingRange){ missingRange.addEventListener('input', ()=>{ document.getElementById('missingValue').textContent = missingRange.value + '%'; applyFilters(); }); }

    // 分页器事件
    if (paginator) {
        firstPageBtn.addEventListener('click', ()=>{ page = 1; renderPage(); window.scrollTo({top:0, behavior:'smooth'}); });
        prevPageBtn.addEventListener('click', ()=>{ if(page>1){ page--; renderPage(); window.scrollTo({top:0, behavior:'smooth'});} });
        nextPageBtn.addEventListener('click', ()=>{ if(page<totalPages){ page++; renderPage(); window.scrollTo({top:0, behavior:'smooth'});} });
        lastPageBtn.addEventListener('click', ()=>{ page = totalPages; renderPage(); window.scrollTo({top:0, behavior:'smooth'}); });
        gotoBtn.addEventListener('click', ()=>{ const n = Math.max(1, Math.min(totalPages, parseInt(gotoInput.value,10) || 1)); page = n; renderPage(); window.scrollTo({top:0, behavior:'smooth'}); });
    }

    // Show user miniature (from session)
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    if(avatarEl && nameEl){
        const user = sessionStorage.getItem('currentUser') || '游客';
        avatarEl.src = 'vendor/avatar.svg';
        nameEl.textContent = user;
    }

    // Initial render
    applyFilters();
    renderHotAndHistory();
    renderRecommendations();

    function renderHotAndHistory(){
        const hot = ['碳中和','传感器','时序','医疗','空气质量'];
        hotChips.innerHTML = hot.map(w=>`<span class="chip" data-q="${LJDemo.escapeHTML(w)}">${LJDemo.escapeHTML(w)}</span>`).join('');
        hotChips.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ searchInput.value=c.dataset.q; applyFilters(); }));

        const hist = LJDemo.read(localStorage, 'SFLX_SEARCH_HISTORY', []);
        historyChips.innerHTML = hist.map(w=>`<span class="chip" data-q="${LJDemo.escapeHTML(w)}">${LJDemo.escapeHTML(w)}</span>`).join('');
        historyChips.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{ searchInput.value=c.dataset.q; applyFilters(); }));
    }

    function saveHistory(q){
        const val = (q||'').trim(); if(!val) return;
        let arr = LJDemo.read(localStorage, 'SFLX_SEARCH_HISTORY', []);
        arr = [val, ...arr.filter(x=>x!==val)].slice(0,8);
        localStorage.setItem('SFLX_SEARCH_HISTORY', JSON.stringify(arr));
        renderHotAndHistory();
    }

    function onSuggest(){
        const val = (searchInput.value||'').trim();
        if(!val){ suggestions.style.display='none'; return; }
        const libs = ALL.map(d => d.name);
        const items = libs.filter(x=>x.includes(val)).slice(0,6).map(x=>`<div class="item" data-q="${x}"><i class="fas fa-search"></i> ${x}</div>`).join('');
        if(items){ suggestions.innerHTML = items; suggestions.style.display='block'; } else { suggestions.style.display='none'; }
    }

    function renderRecommendations(){
        const liked = ALL.slice(0,8).map(recCard).join('');
        const newbie = ALL.slice(8,16).map(recCard).join('');
        if(likeRow) likeRow.innerHTML = liked;
        if(newbieRow) newbieRow.innerHTML = newbie;
        likeRow?.querySelectorAll('.rec-card')?.forEach(bindRecCard);
        newbieRow?.querySelectorAll('.rec-card')?.forEach(bindRecCard);
    }

    function recCard(d){
        const icon = '<i class="fas fa-database"></i>';
        const badge = `${d.rating}★ / ${d.downloads}`;
        const tags = d.formats.slice(0,3).map(t=>`<span class="chip">${t}</span>`).join('');
        return `
        <div class="rec-card" data-id="${d.id}">
            <div class="rec-top">
                <div class="rec-icon">${icon}</div>
                <div class="rec-title">${d.name}</div>
                <div class="rec-badge">${d.scene}</div>
            </div>
            <div class="rec-meta">
                <span><i class="fas fa-table"></i> ${d.rows}×${d.cols}</span>
                <span><i class="fas fa-file"></i> ${d.sizeMB}MB</span>
                <span><i class="fas fa-percent"></i> ${d.missingRate}%</span>
                <span><i class="fas fa-star"></i> ${d.rating}</span>
            </div>
            <div class="rec-tags">${tags}</div>
        </div>`;
    }

    function bindRecCard(card){
        card.addEventListener('click', ()=>{
            const id = card.getAttribute('data-id');
            location.href = `dataset-detail.html?id=${encodeURIComponent(id)}`;
        });
    }
})();
