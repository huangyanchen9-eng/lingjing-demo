const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name)]); }

test('all local CSS font URLs and page links exist',()=>{
  for(const dir of ['styles','vendor']) for(const file of walk(path.join(root,dir)).filter(f=>f.endsWith('.css'))) {
    const css=fs.readFileSync(file,'utf8');
    for(const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) {
      const url=match[1]; if(url.startsWith('data:') || decodeURIComponent(url).startsWith('#')) continue;
      assert.ok(!/^https?:/.test(url),url);
      assert.ok(fs.existsSync(path.resolve(path.dirname(file),url.split(/[?#]/)[0])),file+': '+url);
    }
  }
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))) {
    const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));
    for(const a of dom.window.document.querySelectorAll('a[href]')) {
      const href=a.getAttribute('href');
      if(href.startsWith('#') || /^[a-z]+:/i.test(href)) continue;
      assert.ok(fs.existsSync(path.resolve(root,href.split(/[?#]/)[0])),file+': '+href);
    }
    dom.window.close();
  }
});
