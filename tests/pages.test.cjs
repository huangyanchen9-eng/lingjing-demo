const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// DOM/interaction checks only. Chart rendering and visual layout require Browser.
async function page(name, options = {}) {
  const errors = [], downloads = [], charts = new Map();
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!e.message.includes('navigation')) errors.push(e.message); });
  const dom = new JSDOM(fs.readFileSync(path.join(root, name), 'utf8'), { url: 'http://localhost:8000/' + name + (options.query || ''), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.scrollTo = () => {}; w.alert = () => {};
  w.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this }; };
  w.Chart = class {
    constructor(ctx, config) { this.data = config.data; charts.set(ctx.canvas.id, this); }
    static getChart(canvas) { return charts.get(canvas.id); }
    resize() {} getElementsAtEventForMode() { return []; }
  };
  w.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:demo'; };
  w.URL.revokeObjectURL = () => {};
  const realTimeout = w.setTimeout.bind(w);
  w.setTimeout = (fn, delay, ...args) => realTimeout(fn, Math.min(20, delay / 100), ...args);
  for (const [key, value] of Object.entries(options.session || {})) w.sessionStorage.setItem(key, JSON.stringify(value));
  for (const [key, value] of Object.entries(options.local || {})) w.localStorage.setItem(key, value);
  for (const script of w.document.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src');
    if (src.includes('chart.umd')) continue;
    try { w.eval(fs.readFileSync(path.join(root, src), 'utf8')); } catch (e) { errors.push(e.stack); }
  }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  w.dispatchEvent(new w.Event('load'));
  await sleep(50);
  return { dom, w, errors, downloads, charts, close: () => w.close() };
}

for (const name of fs.readdirSync(root).filter(n => n.endsWith('.html'))) {
  test(name + ' initializes without errors and loads only local resources', async () => {
    const p = await page(name);
    try {
      assert.deepEqual(p.errors, []);
      assert.ok(p.w.document.querySelector('.demo-notice'));
      assert.equal(p.w.document.querySelector('.loading-overlay'), null);
      for (const element of p.w.document.querySelectorAll('script[src],link[rel="stylesheet"],img[src]')) {
        const src = element.getAttribute('src') || element.getAttribute('href');
        assert.ok(!/^https?:/.test(src), src);
        assert.ok(fs.existsSync(path.join(root, src)), src);
      }
      const toggle = p.w.document.querySelector('.mobile-menu-toggle');
      assert.ok(toggle, 'mobile navigation exists');
      toggle.click(); assert.ok(p.w.document.querySelector('.nav').classList.contains('active'));
      toggle.click(); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      p.w.document.querySelector('a[href="#"]')?.click();
      assert.deepEqual(p.errors, []);
    } finally { p.close(); }
  });
}

test('upload uses imported dataset, presets and selected model in persisted results', async () => {
  const p = await page('upload.html', { session: { importDataset: { id: 'ds_4', name: 'old name' } } });
  try {
    const d = p.w.document;
    assert.match(d.getElementById('fileName').textContent, /金融科技/);
    assert.equal(p.w.sessionStorage.getItem('importDataset'), null);
    d.querySelector('[data-model="rnn"]').click(); d.querySelector('[data-preset="high-missing"]').click();
    d.getElementById('startImputation').click();
    await sleep(130);
    const run = JSON.parse(p.w.sessionStorage.getItem('LJ_DEMO_RUN_V1'));
    assert.equal(run.model, 'rnn'); assert.equal(run.missingRate, 40); assert.equal(run.epochs, 300);
    assert.match(run.name, /金融科技/);
    assert.equal(d.getElementById('progressFill').style.width, '100%');
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('CSV drop previews safely, rejected files do not replace selection, removal clears preview', async () => {
  const p = await page('upload.html');
  try {
    const d = p.w.document;
    const file = new p.w.File(['a,note\n1,"<img src=x onerror=alert(1)>"'], 'DATA.CSV', { type: 'text/csv' });
    const drop = new p.w.Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file] } });
    d.getElementById('uploadArea').dispatchEvent(drop); await sleep(30);
    assert.match(d.getElementById('previewBody').textContent, /<img/);
    assert.equal(d.querySelector('#previewBody img'), null);
    const input = d.getElementById('fileInput');
    Object.defineProperty(input, 'files', { value: [new p.w.File(['bad'], 'bad.txt')] });
    input.dispatchEvent(new p.w.Event('change'));
    assert.equal(d.getElementById('fileName').textContent, 'DATA.CSV');
    p.w.removeFile();
    assert.equal(d.getElementById('filePreview').style.display, 'none');
    assert.equal(d.getElementById('startImputation').disabled, false);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('file picker opens once per click', async () => {
  const p = await page('upload.html');
  try {
    let clicks = 0;
    p.w.document.getElementById('fileInput').addEventListener('click', () => clicks++);
    p.w.document.querySelector('#uploadArea button').click();
    assert.equal(clicks, 1); assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('results restore settings, paginate once, search all rows and download once', async () => {
  const p = await page('results.html', { session: { LJ_DEMO_RUN_V1: { version: 1, name: 'chosen.csv', model: 'rnn', missingRate: 40, batchSize: 128, epochs: 300 } } });
  try {
    const d = p.w.document;
    assert.match(d.getElementById('runSummary').textContent, /chosen.csv.*RNN.*40%/);
    assert.equal(p.charts.size, 3);
    assert.equal(d.querySelectorAll('#dataTableBody tr').length, 10);
    d.querySelector('[onclick="nextPage()"]').click();
    assert.equal(d.getElementById('currentPage').textContent, '2');
    const input = d.querySelector('.data-filter'); input.value = '填补'; input.dispatchEvent(new p.w.Event('input')); await sleep(30);
    assert.equal(d.getElementById('totalPages').textContent, '4');
    assert.ok([...d.querySelectorAll('#dataTableBody tr')].every(row => row.textContent.includes('填补')));
    input.value = 'no-match'; input.dispatchEvent(new p.w.Event('input')); await sleep(30);
    assert.match(d.getElementById('dataTableBody').textContent, /没有匹配/);
    d.getElementById('downloadReportBtn').click(); assert.equal(p.downloads.length, 1);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('market search, empty state and scene filters work with stable detail data', async () => {
  const p = await page('datasets.html');
  try {
    const d = p.w.document, input = d.getElementById('searchInput');
    input.value = '不存在'; d.getElementById('searchBtn').click();
    assert.match(d.getElementById('datasetGrid').textContent, /没有符合/);
    input.value = ''; d.getElementById('searchBtn').click();
    const radio = d.querySelector('input[name="scene"][value="医疗健康"]'); radio.checked = true; radio.dispatchEvent(new p.w.Event('change'));
    const titles = [...d.querySelectorAll('#datasetGrid .title')];
    assert.ok(titles.length); assert.ok(titles.every(t => t.textContent.includes('医疗健康')));
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('detail uses catalog name, opens preview tab and rejects unknown id', async () => {
  const p = await page('dataset-detail.html', { query: '?id=ds_4&tab=preview' });
  try {
    assert.equal(p.w.document.getElementById('title').textContent, p.w.LJDemo.dataset('ds_4').name);
    assert.equal(p.w.document.querySelector('.tab.active').dataset.tab, 'preview');
    assert.ok(p.w.document.querySelector('#tabContent table'));
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
  const invalid = await page('dataset-detail.html', { query: '?id=missing' });
  try { assert.match(invalid.w.document.getElementById('title').textContent, /未找到/); assert.equal(invalid.w.document.getElementById('btnImport').disabled, true); } finally { invalid.close(); }
});

test('FAQ toggles once', async () => {
  const p = await page('guide.html');
  try {
    const question = p.w.document.querySelector('.faq-question');
    question.click(); assert.ok(question.nextElementSibling.classList.contains('active'));
    question.click(); assert.equal(question.nextElementSibling.classList.contains('active'), false);
    assert.deepEqual(p.errors, []);
  } finally { p.close(); }
});

test('registration validates and stores demo profile without password', async () => {
  const p = await page('register.html');
  try {
    const d=p.w.document;
    for (const [id,value] of Object.entries({regUsername:'tester',regEmail:'test@example.com',regPassword:'test123',regConfirmPassword:'test123'})) d.getElementById(id).value=value;
    d.getElementById('agree').checked=true;
    d.getElementById('registerForm').dispatchEvent(new p.w.Event('submit',{cancelable:true}));
    await sleep(60);
    const users=JSON.parse(p.w.localStorage.getItem('registeredUsers'));
    assert.equal(users[0].username,'tester'); assert.equal(users[0].password,undefined);
    assert.deepEqual(p.errors,[]);
  } finally { p.close(); }
});

test('advanced size filters apply immediately and invalid page input stays on a real page', async () => {
  const p = await page('datasets.html');
  try {
    const d=p.w.document, radio=d.querySelector('input[name="fsize"][value="small"]');
    radio.checked=true; radio.dispatchEvent(new p.w.Event('change'));
    assert.equal(d.querySelectorAll('#datasetGrid .card').length,1);
    d.getElementById('gotoInput').value='invalid'; d.getElementById('gotoBtn').click();
    assert.doesNotMatch(d.getElementById('pageInfo').textContent,/NaN/);
    assert.deepEqual(p.errors,[]);
  } finally { p.close(); }
});

test('contact form validates, then completes locally without claiming to send a message', async () => {
  const p=await page('contact.html');
  try {
    const d=p.w.document;
    for(const [id,value] of Object.entries({name:'演示用户',email:'test@example.com',message:'这是用于验证演示表单的本地消息。'})) d.getElementById(id).value=value;
    d.getElementById('privacy').checked=true;
    d.getElementById('contactForm').dispatchEvent(new p.w.Event('submit',{cancelable:true}));
    await sleep(22);
    assert.ok(JSON.parse(p.w.localStorage.getItem('contact_submissions')).length);
    assert.deepEqual(p.errors,[]);
  } finally { p.close(); }
});

test('autocomplete suggestions resolve to matching catalog entries', async () => {
  const p=await page('datasets.html');
  try {
    const d=p.w.document, input=d.getElementById('searchInput');
    input.value='医疗'; input.dispatchEvent(new p.w.Event('input'));
    const suggestion=d.querySelector('#suggestions .item'); assert.ok(suggestion);
    suggestion.click();
    assert.ok(d.querySelectorAll('#datasetGrid .card').length > 0);
  } finally {p.close();}
});

test('comment statistics retain downloads and restore the saved rating on detail reload', async () => {
  const p=await page('dataset-detail.html',{query:'?id=ds_1&tab=comments'});
  let stats;
  try {
    const d=p.w.document;
    d.getElementById('commentText').value='演示评论';
    d.getElementById('submitComment').click();
    stats=p.w.localStorage.getItem('SFLX_DATASETS');
    assert.equal(JSON.parse(stats).ds_1.downloads,p.w.LJDemo.dataset('ds_1').downloads);
  } finally {p.close();}
  const reloaded=await page('dataset-detail.html',{query:'?id=ds_1',local:{SFLX_DATASETS:stats}});
  try {
    const saved=JSON.parse(stats).ds_1;
    assert.ok(reloaded.w.document.querySelector('#meta .rating').textContent.includes(String(saved.rating)));
    assert.ok(reloaded.w.document.querySelector('#meta .rating').textContent.includes('('+saved.reviews+')'));
  } finally {reloaded.close();}
});
