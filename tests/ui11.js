const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');
const A=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
// ---- default margini
eq(await A(()=>{const v=window.GanttApp.core.newProject().view;return [v.marginBeforeWeeks,v.marginAfterWeeks]}),[1,2],'margini predefiniti 1 e 2');
// ---- primo blocco a 1/4
await p.locator('#itemsBody .row.add, #itemsBody .add').first().click();await W(150);
await p.keyboard.type('Primo');await p.keyboard.press('Enter');await W(200);
await p.keyboard.press('Escape');await W(100);
const cvb=await p.locator('#tlCv').boundingBox();const rb=await p.locator('#tlCv .trow').nth(0).boundingBox();
const x0=cvb.x+600;
await p.mouse.move(x0,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(x0+60,rb.y+rb.height/2,{steps:4});await p.mouse.move(x0+160,rb.y+rb.height/2,{steps:4});await p.mouse.up();await W(250);
const f=await A(()=>{const g=window.GanttApp.ui.geo,b=document.querySelector('#tlBody');return {sl:b.scrollLeft,sx:(g.mn-g.a)*g.px-b.scrollLeft,cw:g.cw,has:!!window.GanttApp.P.items[0].start}});
ok(f.has,'barra disegnata');console.log('PRIMO',JSON.stringify(f));
ok(Math.abs(f.sx-f.cw/4)<=2||f.sl===0,'primo blocco a circa 1/4 della schermata: '+JSON.stringify(f));
// ---- suggerimenti + zone + Ctrl (su dati di prova)
await p.reload();await seed(p);
const rows=()=>p.locator('#itemsBody .row[data-uid]');
const cell=(i,c)=>rows().nth(i).locator('.c-'+c);
const asg=i=>p.evaluate(i=>window.GanttApp.P.items[i].assignee,i);
await cell(2,'assignee').click();await p.keyboard.press('F2');await W(100);
eq(await p.locator('.sug .sugi').count(),2,'suggerimenti subito all\'apertura (senza freccia)');
eq(await p.locator('.sug .sugi.on').count(),0,'a campo vuoto nessuna voce preselezionata');
await p.keyboard.type('b');await W(80);
eq(await p.locator('.sug .sugi.on').count(),1,'digitando, la prima voce è selezionata');
await p.keyboard.press('Enter');await W(120);
eq(await asg(2),'Bianchi','Invio conferma il suggerimento');
await cell(7,'assignee').click();await p.keyboard.press('F2');await p.keyboard.type('ro');await p.keyboard.press('Tab');await W(120);
eq(await asg(7),'Rossi','Tab conferma il suggerimento');
await p.keyboard.press('Escape');
// frecce: giù seleziona la successiva
await cell(7,'assignee').click();await p.keyboard.press('F2');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await W(120);
ok(['Rossi','Bianchi'].includes(await asg(7)),'navigazione con le frecce e conferma: '+await asg(7));
// zone di ridimensionamento
const kA=await A(()=>window.GanttApp.act.visRows().indexOf(window.GanttApp.P.items.findIndex(x=>x.name==='Armature')));
await p.locator('#tlBody').evaluate(el=>{el.scrollLeft=0});await W(100);
const geo=()=>A(()=>{const g=window.GanttApp.ui.geo;return {a:g.a,px:g.px}});
const dnOf=iso=>p.evaluate(iso=>window.GanttApp.core.toDN(iso),iso);
const rowBox=async k=>await p.locator('#tlCv .trow').nth(k).boundingBox();
const xOf=async dn=>{const c=await p.locator('#tlCv').boundingBox();const g=await geo();return c.x+(dn-g.a)*g.px};
const it=()=>A(()=>{const x=window.GanttApp.P.items.find(x=>x.name==='Armature');return [x.start,x.end]});
const [s0,e0]=await it();const sDn=await dnOf(s0),eDn=await dnOf(e0);const g=await geo();
let rb2=await rowBox(kA);const y=rb2.y+rb2.height/2;
const cur=async x=>{await p.mouse.move(x,y);await W(40);return await p.locator('#tlBody').evaluate(e=>e.style.cursor)};
eq(await cur(await xOf(eDn+1)-5),'ew-resize','5 px dentro il bordo destro: ridimensionamento');
eq(await cur(await xOf(sDn)+5),'ew-resize','5 px dentro il bordo sinistro: ridimensionamento');
eq(await cur(await xOf(eDn+1)-16),'grab','più all\'interno: spostamento');
// Ctrl simmetrico: bordo sinistro verso destra di 1 giorno
await p.keyboard.down('Control');
const xs=await xOf(sDn);await p.mouse.move(xs-3,y);await p.mouse.down();await p.mouse.move(xs-3+g.px*0.6,y,{steps:3});await p.mouse.move(xs-3+g.px*1.1,y,{steps:3});await p.mouse.up();await p.keyboard.up('Control');await W(200);
const [s1,e1]=await it();
eq([s1,e1],['2026-11-27','2026-11-30'],'Ctrl: compressione simmetrica (inizio +1 giorno, fine -1 giorno): '+s0+' '+e0);
await p.keyboard.press('Control+z');await W(100);
eq(await it(),[s0,e0],'annullata');
// senza Ctrl: solo un lato
const xs2=await xOf(sDn);await p.mouse.move(xs2-3,y);await p.mouse.down();await p.mouse.move(xs2-3+g.px*0.6,y,{steps:3});await p.mouse.move(xs2-3+g.px*1.1,y,{steps:3});await p.mouse.up();await W(200);
eq((await it())[1],e0,'senza Ctrl la fine non cambia');
await p.keyboard.press('Control+z');await W(100);
// ---- cronologia e log
eq(await p.locator('#hbtns [data-act="redo"]').getAttribute('aria-label'),'Ripristina','etichetta Ripristina');
await A(()=>{const a=window.GanttApp;a.commit('Prova uno',q=>{q.project.title='A1'});a.commit('Prova due',q=>{q.project.title='A2'});a.commit('Prova tre',q=>{q.project.title='A3'})});await W(100);
const n0=await A(()=>window.GanttApp.hist?window.GanttApp.hist.undo.length:null);
await p.locator('[data-act="undoMore"]').click();await W(100);
const labs=await p.locator('.histl .menuitem span:first-child').allTextContents();
eq(labs.slice(0,3),['Prova tre','Prova due','Prova uno'],'elenco delle operazioni annullabili, dalla più recente');
await p.locator('.histl .menuitem').nth(1).click();await W(150);
eq(await A(()=>window.GanttApp.P.project.title),'A1','annullate due operazioni in una volta');
await p.locator('[data-act="redoMore"]').click();await W(100);
eq((await p.locator('.histl .menuitem span:first-child').allTextContents()).slice(0,2),['Prova due','Prova tre'],'elenco delle operazioni ripristinabili');
await p.locator('.histl .menuitem').nth(1).click();await W(150);
eq(await A(()=>window.GanttApp.P.project.title),'A3','ripristinate due operazioni');
await p.locator('#hbtns .btn[aria-label^="Registro delle attività"]').click();await W(150);
ok(await p.locator('#dlgAct[open]').count()===1,'finestra Log aperta');
const txt=await p.locator('#actBody').textContent();
ok(/Prova tre/.test(txt)&&/Annullat/.test(txt)&&/\d{2}:\d{2}:\d{2}/.test(txt),'il Log riporta attività, annullamenti e orario');
await p.locator('#actClose').click();
console.log('errors',JSON.stringify(errs));console.log('pass',pass,'fail',fail);await b.close();})();
