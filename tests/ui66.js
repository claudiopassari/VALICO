// righe vuote nascoste, disegno di nuove barre sotto l'ultimo item, riga «Progetto» nei periodi
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');const W=ms=>p.waitForTimeout(ms);const ev=f=>p.evaluate(f);
// progetto con 35 item (oltre le 28 righe minime)
await ev(()=>{GanttApp.commit('t',q=>{for(let i=0;i<35;i++){const a=GanttApp.core.newItem('Att '+(i+1));a.start='2026-12-01';a.end='2026-12-04';q.items.push(a)}})});await W(400);
// righe vuote: nessuna zebra di default
const bg=await ev(()=>{const r=[...document.querySelectorAll('#tlBody .trow.emp')];return {n:r.length,bg:r.map(x=>getComputedStyle(x).backgroundColor).filter((v,i,a)=>a.indexOf(v)===i)}});
ok(bg.n>=1&&bg.bg.every(c=>c==='rgba(0, 0, 0, 0)'||c==='transparent'),'righe vuote senza colore di fondo '+JSON.stringify(bg));
// disegno sotto l'ultimo item, in una zona lontana dalla riga libera
await ev(()=>{const t=document.querySelector('#tlBody');t.scrollTop=t.scrollHeight});await W(200);
const geo=await ev(()=>{const t=document.querySelector('#tlBody').getBoundingClientRect(),rows=[...document.querySelectorAll('#tlBody .trow')],e=rows[rows.length-1].getBoundingClientRect();return {l:t.left,t:t.top,b:t.bottom,eb:e.bottom,eh:e.height}});
const n0=await ev(()=>GanttApp.P.items.length);
const y=Math.min(geo.b-6,geo.eb-geo.eh/2);
await p.mouse.move(geo.l+300,y);await p.mouse.down();await p.mouse.move(geo.l+420,y,{steps:6});await p.mouse.move(geo.l+520,y,{steps:6});await p.mouse.up();await W(400);
eq(await ev(()=>GanttApp.P.items.length),n0+1,'nuova barra creata disegnando sotto l\'ultimo item');
const nb=await ev(()=>{const it=GanttApp.P.items[GanttApp.P.items.length-1];return {s:it.start,e:it.end}});
ok(nb.s&&nb.e&&nb.e>=nb.s,'la nuova barra ha date '+JSON.stringify(nb));await p.keyboard.press('Escape');await W(200);
// progetto vuoto: disegno nelle righe
await ev(()=>{GanttApp.commit('t',q=>{q.items=[]})});await W(300);
const g2=await ev(()=>{const t=document.querySelector('#tlBody').getBoundingClientRect();return {l:t.left,t:t.top,b:t.bottom}});
await p.mouse.move(g2.l+400,g2.t+300);await p.mouse.down();await p.mouse.move(g2.l+520,g2.t+300,{steps:5});await p.mouse.up();await W(400);
eq(await ev(()=>GanttApp.P.items.length),1,'progetto vuoto: barra creata anche in basso nell\'area vuota');
await p.keyboard.press('Escape');await W(200);
// interruttore righe vuote
await p.click('#tlCmds [data-act="tlopts"]');await W(300);
ok(await p.locator('.pop >> text=Mostra le righe vuote').count()>=1,'interruttore «Mostra le righe vuote» in Visualizza');
await p.locator('.pop .swrow',{hasText:'Mostra le righe vuote'}).locator('.switch').click();await W(250);
eq(await ev(()=>document.documentElement.getAttribute('data-er')),'1','righe vuote attivate');
const bg2=await ev(()=>[...document.querySelectorAll('#tlBody .trow.emp')].map(x=>getComputedStyle(x).backgroundColor).filter((v,i,a)=>a.indexOf(v)===i));
ok(bg2.some(c=>c!=='rgba(0, 0, 0, 0)'),'con l\'interruttore le righe vuote tornano a zebra '+JSON.stringify(bg2));
await p.locator('.pop .swrow',{hasText:'Mostra le righe vuote'}).locator('.switch').click();await W(200);await p.keyboard.press('Escape');await W(150);
// riga Progetto nei periodi
await ev(()=>{GanttApp.commit('t',q=>{q.items=[];const a=GanttApp.core.newItem('A');a.start='2026-12-01';a.end='2026-12-10';q.items.push(a)})});await W(300);
ok(await ev(()=>document.querySelectorAll('#tlHead .pseg.act').length)===1,'progetto attivo visibile');
await p.click('#tlCmds [data-act="band"]');await W(300);
ok(await p.locator('.apj').count()===1,'riga «Progetto» nell\'elenco dei periodi');
await p.locator('.apj .eye').click();await W(300);
eq(await ev(()=>GanttApp.P.view.activeProj),false,'occhio: progetto nascosto');
await p.keyboard.press('Escape');await W(200);
eq(await ev(()=>document.querySelectorAll('#tlHead .pseg.act').length),0,'fascia Progetto nascosta nella timeline');
await p.click('#tlCmds [data-act="band"]');await W(300);await p.locator('.apj .eye').click();await W(300);
eq(await ev(()=>GanttApp.P.view.activeProj),true,'occhio: progetto di nuovo visibile');
console.log('ui66 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');
await b.close()})();
