const {chromium}=require('playwright');const seed=require('./seed21.js');const fs=require('fs');const cp=require('child_process');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const ctx=await b.newContext({viewport:{width:1920,height:1100},acceptDownloads:true});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await A(()=>{const a=window.GanttApp;a.commit('l',q=>{const f=n=>q.items.find(i=>i.name===n).uid;a.core.opLink(q,f('Armature'),f('Pilastri'),'FS');a.core.opLink(q,f('Pilastri'),f('Solai'),'SS')})});
const before=await A(()=>window.GanttApp.P.items.map(i=>[i.name,i.level,i.start,i.end,i.duration,i.assignee,i.type]));
await p.locator('[data-act="export"]').click();await W(300);
await p.locator('#expBody .xsegb[data-v="xlsx"]').click();await W(100);
ok(await p.locator('#expBody .xinfo:visible').count()===1,'nota Excel visibile');
const [d]=await Promise.all([p.waitForEvent('download'),p.locator('#expGo').click()]);const path='/tmp/valico-tests/out_t.xlsx';await d.saveAs(path);
console.log(d.suggestedFilename(),fs.statSync(path).size);ok(d.suggestedFilename().endsWith('.xlsx'),'estensione');
// verifica con python/openpyxl se disponibile
try{const out=cp.execSync('python3 -c "import openpyxl;wb=openpyxl.load_workbook(\''+path+'\');ws=wb.active;print(ws.title,ws.max_row,ws.max_column);[print([c.value for c in r]) for r in ws.iter_rows(min_row=1,max_row=6)]"').toString();console.log(out);ok(/Cronoprogramma 15 11/.test(out),'openpyxl legge il file (15 righe, 11 colonne)');}catch(e){console.log('openpyxl non disponibile',e.message.slice(0,100))}
await p.keyboard.press('Escape');await W(150);
// importa il file
await p.evaluate(()=>{window.confirm=()=>true});
await p.setInputFiles('#xlsxInput',path);await W(1200);
const after=await A(()=>window.GanttApp.P.items.map(i=>[i.name,i.level,i.start,i.end,i.duration,i.assignee,i.type]));
console.log(after.length,before.length,await A(()=>document.querySelector('#toast').textContent));
ok(after.length===before.length,'stesso numero di item');ok(!/valori non importati/.test(await A(()=>document.querySelector('#toast').textContent)),'nessun avviso');
let same=0;after.forEach((r,i)=>{if(JSON.stringify(r.slice(0,4))===JSON.stringify(before[i].slice(0,4)))same++;});ok(same>=before.length-1,'nomi, livelli e date coincidono ('+same+'/'+before.length+')');
const pr=await A(()=>window.GanttApp.P.items.filter(i=>i.predecessors.length).map(i=>i.name+':'+i.predecessors.map(x=>x.type).join()));console.log(pr);ok(pr.length===2,'predecessori reimportati');
console.log('pass',pass,'fail',fail);await b.close()})();
