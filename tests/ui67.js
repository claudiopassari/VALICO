// occhio di visibilità per riga, tipo di item nel menu del tasto destro
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const N=await ev(()=>GanttApp.P.items.length);
const vis=()=>ev(()=>document.querySelectorAll('#itemsBody .row[data-uid]').length);
const tl=()=>ev(()=>document.querySelectorAll('#tlBody .trow[data-u]').length);
eq(await vis(),N,'tutte le righe visibili');
ok(await p.locator('#itemsCols .eyh').count()===0,'nessun occhio in intestazione senza righe nascoste');
// nascondi una riga non gruppo (la prima attività)
const idx=await ev(()=>{const a=GanttApp.P.items;return a.findIndex((x,i)=>x.type==='task'&&!(a[i+1]&&a[i+1].level>x.level)&&x.start&&x.end&&x.start!==x.end)});
const u=await ev(i=>GanttApp.P.items[i].uid,idx);
const row=p.locator('#itemsBody .row[data-uid="'+u+'"]');await row.hover();await W(150);
ok(await row.locator('.eyb').isVisible(),'occhio visibile al passaggio del cursore');
await row.locator('.eyb').click();await W(300);
eq(await vis(),N-1,'riga nascosta dall\'elenco');eq(await tl(),N-1,'riga nascosta anche nella timeline');
ok(await ev(i=>GanttApp.P.items.some(x=>x.hidden),0),'campo hidden salvato nel progetto');
ok(await p.locator('#itemsCols .eyh').count()===1,'occhio in intestazione');
ok(/1 riga nascosta/.test(await ev(()=>document.querySelector('#status').innerText)),'indicatore nella barra di stato');
// dati invariati
ok(await ev(i=>!!GanttApp.P.items[i].start,idx),'date invariate');
// mostra le nascoste
await p.locator('#itemsCols .eyh').click();await W(300);
eq(await vis(),N,'occhio globale: righe nascoste visibili');
ok(await p.locator('#itemsBody .row.hid').count()===1,'riga nascosta attenuata');
ok(await p.locator('#itemsBody .row.hid .eyb').isVisible(),'occhio barrato sempre visibile sulla riga nascosta');
// riattiva
await p.locator('#itemsBody .row.hid .eyb').click();await W(300);
ok(!(await ev(()=>GanttApp.P.items.some(x=>x.hidden))),'riga riattivata');
// annulla/ripristina
await p.locator('#itemsBody .row[data-uid="'+u+'"]').hover();await p.locator('#itemsBody .row[data-uid="'+u+'"] .eyb').click();await W(250);
ok(await ev(()=>GanttApp.P.items.some(x=>x.hidden)),'nascosta di nuovo');
await ev(()=>GanttApp.undo());await W(250);
ok(!(await ev(()=>GanttApp.P.items.some(x=>x.hidden))),'annulla ripristina la visibilità');
if(await p.locator('#itemsCols .eyh').count()){await p.locator('#itemsCols .eyh').click();await W(250);}
// gruppo nascosto con figli
const gi=await ev(()=>GanttApp.P.items.findIndex((x,i,a)=>x.type==='group'&&a[i+1]&&a[i+1].level>x.level));
const nb=await ev(i=>{const a=GanttApp.P.items;let j=i+1;while(j<a.length&&a[j].level>a[i].level)j++;return j-i},gi);
const gu=await ev(i=>GanttApp.P.items[i].uid,gi);
await p.locator('#itemsBody .row[data-uid="'+gu+'"]').hover();await p.locator('#itemsBody .row[data-uid="'+gu+'"] .eyb').click();await W(300);
eq(await vis(),N-nb,'gruppo nascosto con i suoi figli ('+nb+' righe)');
eq(await ev(()=>GanttApp.P.items.filter(x=>x.hidden).length),1,'solo il gruppo porta il flag');
// salvataggio e ricarica
const txt=await ev(()=>JSON.stringify(GanttApp.P));
const q=JSON.parse(txt);ok(q.items.filter(x=>x.hidden).length===1,'il flag è nel file');
await p.goto('file://'+process.cwd()+'/app.html');await W(300);
await ev(t=>{const f=new File([t],'x.json',{type:'application/json'});const dt=new DataTransfer();dt.items.add(f);const i=document.querySelector('#fileInput');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))},txt);await W(600);
eq(await vis(),N-nb,'dopo la ricarica la riga resta nascosta');
// riattiva tutto via occhio globale
await p.locator('#itemsCols .eyh').click();await W(250);await p.locator('#itemsBody .row.hid .eyb').click();await W(250);
eq(await vis(),N,'tutto di nuovo visibile');
// menu del tasto destro: tipo
const ti=idx;
const tu=await ev(i=>GanttApp.P.items[i].uid,ti);
await p.locator('#itemsBody .row[data-uid="'+tu+'"] .c-name').click({button:'right'});await W(250);
ok(await p.locator('.cmenu .tpick').count()===1,'selettore del tipo nel menu del tasto destro');
await p.locator('.cmenu .tpick button',{hasText:'Milestone'}).click();await W(250);ok(await p.locator('.cmenu .tpick .note').innerText().then(x=>/perde/.test(x)),'avviso di perdita dati come nel pannello Dettagli');await p.locator('.cmenu .tpick button',{hasText:'Milestone'}).click();await W(300);
eq(await ev(i=>GanttApp.P.items[i].type,ti),'milestone','il tipo cambia da menu');
ok(await p.locator('.cmenu').count()===0,'menu chiuso dopo la scelta');
// anche dal clic destro su una barra
const bar=p.locator('#tlBody .trow[data-u="'+tu+'"] .bx').first();
if(await bar.count()){await bar.click({button:'right'});await W(250);ok(await p.locator('.cmenu .tpick').count()===1,'selettore del tipo anche dal menu sulla barra');await p.keyboard.press('Escape');}
// Ctrl+Maiusc+Invio: inserisce sopra
await p.locator('#itemsBody .row[data-uid="'+tu+'"] .c-name').click();await W(150);
const n0=await ev(()=>GanttApp.P.items.length);
await p.keyboard.press('Control+Shift+Enter');await W(250);await p.keyboard.type('Nuova');await p.keyboard.press('Enter');await p.keyboard.press('Escape');await W(150);
eq(await ev(()=>GanttApp.P.items.length),n0+1,'Ctrl+Maiusc+Invio aggiunge una riga');
eq(await ev(i=>GanttApp.P.items.findIndex(x=>x.uid===i),tu),ti+1,'la nuova riga è sopra quella selezionata');
// indicazione dentro un gruppo: il gruppo ne include l'intervallo
await ev(()=>{GanttApp.commit('t',q=>{q.items=[];const g=GanttApp.core.newItem('G');g.type='group';const a=GanttApp.core.newItem('A');a.level=2;a.start='2026-12-07';a.end='2026-12-11';const i=GanttApp.core.newItem('Assenza');i.level=2;i.type='indication';i.start='2026-12-16';i.end='2027-01-05';q.items.push(g,a,i);GanttApp.core.opBarRange(q,a.uid,'2026-12-07','2026-12-11');GanttApp.core.opBarRange(q,i.uid,'2026-12-16','2027-01-05')})});await W(300);
const gr=await ev(()=>{const g=GanttApp.P.items[0];return [g.start,g.end]});
eq(gr,['2026-12-07','2027-01-05'],'il gruppo include l\'intervallo dell\'indicazione');
console.log('ui67 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');
await b.close()})();
