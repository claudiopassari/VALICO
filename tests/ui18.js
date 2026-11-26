const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
await p.evaluate(()=>{const A=window.GanttApp;A.commit('t',q=>{q.periods.push({uid:'p1',name:'Fase',start:'2026-11-30',end:'2026-12-04',color:{c:'viola',v:1}});q.markers.push({uid:'cm1',kind:'custom',name:'V',color:{c:'arancio',v:1},date:'2026-12-02',dateEnd:null})})});await W(700);
// nessuna selezione di testo in intestazione
eq(await p.locator('#tlHead').evaluate(e=>getComputedStyle(e).userSelect),'none','intestazione non selezionabile');
// trascinamento periodo
const px=await A(()=>window.GanttApp.ui.geo.px);
let bb=await p.locator('#tlHead .pseg[data-p="p1"]').boundingBox();
await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+bb.width/2+px*3,bb.y+bb.height/2,{steps:5});await p.mouse.up();await W(200);
eq(await A(()=>{const q=window.GanttApp.P.periods[0];return [q.start,q.end]}),['2026-12-03','2026-12-07'],'periodo spostato di 3 giorni');
ok(await p.locator('.pop').count()===0,'il trascinamento non apre il dialogo');
// ridimensionamento a destra
bb=await p.locator('#tlHead .pseg[data-p="p1"]').boundingBox();
await p.mouse.move(bb.x+bb.width-3,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+bb.width-3+px*2,bb.y+bb.height/2,{steps:5});await p.mouse.up();await W(200);
eq(await A(()=>window.GanttApp.P.periods[0].end),'2026-12-09','fine allungata di 2 giorni');
// ridimensionamento a sinistra
bb=await p.locator('#tlHead .pseg[data-p="p1"]').boundingBox();
await p.mouse.move(bb.x+3,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+3+px*1,bb.y+bb.height/2,{steps:4});await p.mouse.up();await W(200);
eq(await A(()=>window.GanttApp.P.periods[0].start),'2026-12-04','inizio spostato di 1 giorno');
await A(()=>window.GanttApp.undo());await A(()=>window.GanttApp.undo());await A(()=>window.GanttApp.undo());await W(100);
eq(await A(()=>window.GanttApp.P.periods[0].start),'2026-11-30','annullamento dei tre gesti');
// clic semplice apre il dialogo; colore inline nello stesso dialogo
bb=await p.locator('#tlHead .pseg[data-p="p1"]').boundingBox();
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await W(200);
ok(await p.locator('.pop .pdr').count()===1,'clic sul periodo apre il dialogo');
const popBox=await p.locator('.pop').boundingBox();
await p.locator('.pop .pdr .pc').click();await W(100);
ok(await p.locator('.pop .cinl .cdot').count()===40,'maschera colori inline nel dialogo');
ok(await p.locator('.pop').count()===1,'nessuna seconda finestra');
const mb=await p.locator('.pop .cinl').boundingBox();ok(mb.x>=popBox.x&&mb.y>=popBox.y&&mb.y<popBox.y+popBox.height,'maschera dentro il dialogo');
await p.locator('.pop .cinl .cdot').nth(3).click();await W(250);
eq(await A(()=>window.GanttApp.P.periods[0].color),{c:'verde',v:0},'colore del periodo scelto inline');
ok(await p.locator('.pop .pdr').count()===1,'dialogo ancora aperto');
await p.keyboard.press('Escape');
// marker: Auto e cestino su ogni voce
await p.evaluate(()=>document.querySelector('#tlCmds [data-act="mkList"]').click());await W(200);
eq(await p.locator('.pop .mkr .auto .switch').count(),4,'interruttore Auto su ogni marker');
eq(await p.locator('.pop .mkr .auto .switch[disabled]').count(),2,'disabilitato sui marker non automatici');
eq(await p.locator('.pop .mkr button[aria-label^="Elimina il marker"]').count(),4,'cestino su ogni voce');
const xs=await p.evaluate(()=>[...document.querySelectorAll('.pop .mkr')].map(r=>['.eye','button[aria-label^="Elimina"]','.auto'].map(s=>Math.round(r.querySelector(s).getBoundingClientRect().left))));
ok(new Set(xs.map(x=>x[0])).size===1&&new Set(xs.map(x=>x[1])).size===1&&new Set(xs.map(x=>x[2])).size===1,'colonne allineate '+JSON.stringify(xs));
ok(xs.every(x=>x[0]<x[1]&&x[1]<x[2]),'ordine occhio, cestino, auto');
await p.keyboard.press('Escape');await p.mouse.click(10,600);
// baseline: si disattiva
await p.locator('#tgDetails').click();await W(300);
await p.locator('#tlCmds [data-act="baseline"]').click();await W(150);
await p.locator('.pop .btn',{hasText:'Salva baseline'}).click();await W(200);
ok(await A(()=>!!window.GanttApp.P.activeBaseline),'attiva dopo il salvataggio');
await p.locator('.pop .bdr .radio').click();await W(200);
eq(await A(()=>window.GanttApp.P.activeBaseline),null,'clic sull\'attiva la disattiva');
eq(await A(()=>window.GanttApp.P.baselines.length),1,'la baseline resta salvata');
await p.locator('.pop .bdr .radio').click();await W(200);
ok(await A(()=>!!window.GanttApp.P.activeBaseline),'si riattiva');
ok(errs.length===0,'errori: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
