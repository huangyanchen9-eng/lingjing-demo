const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('all page scripts parse', () => {
  for (const name of fs.readdirSync(path.join(root, 'scripts'))) {
    if (name.endsWith('.js')) new vm.Script(fs.readFileSync(path.join(root, 'scripts', name), 'utf8'), { filename: name });
  }
});

function demo() {
  const context = { window: {}, URL, Blob, setTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/demo.js'), 'utf8'), context);
  return context.window.LJDemo;
}

test('CSV preview handles quoted delimiters, escaped quotes, BOM and multiline cells', () => {
  const parsed = demo().parseCSV('\uFEFFtime,value,note\r\n0,2,"a,b"\r\n1,,"say ""hi""\nnext"');
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [['time','value','note'],['0','2','a,b'],['1','','say "hi"\nnext']]);
});

test('demo run is reproducible, respects missing rate and preserves known values', () => {
  const api = demo();
  const run = api.createRun({ name: 'sample.csv', model: 'rnn', missingRate: 40, batchSize: 128, epochs: 300 });
  assert.equal(run.model, 'rnn');
  assert.equal(run.rows.length, 100);
  assert.equal(run.rows.filter(r => r.original === null).length, 40);
  assert.ok(run.rows.filter(r => r.original !== null).every(r => r.original === r.imputed));
  assert.equal(JSON.stringify(run.rows), JSON.stringify(api.createRun({ missingRate: 40 }).rows));
  assert.match(api.resultsCSV(run), /演示/);
});

test('catalog detail resolves the same stable dataset as the listing', () => {
  const api = demo();
  const first = api.catalog()[0];
  assert.equal(api.dataset(first.id).name, first.name);
  assert.equal(api.dataset('invalid'), null);
  assert.equal(api.catalog().length, 120);
});
