const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:2100,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);

const it=n=>AA(n=>{const x=window.GanttApp.P.items.find(i=>i.name===n);return [x.start,x.end]},n);
const preds=n=>AA(n=>window.GanttApp.P.items.find(i=>i.name===n).predecessors,n);
const link=(a,b,t,lag)=>AA(([a,b,t,lag])=>{const A=window.GanttApp,P=A.P;const ua=P.items.find(i=>i.name===a).uid,ub=P.items.find(i=>i.name===b).uid;
  try{A.commit('t',q=>{A.core.opLink?A.core.opLink(q,ua,ub,t):null;if(lag){const s=q.items.find(i=>i.uid===ub).predecessors.find(x=>x.uid===ua);s.lag=lag}});return 'ok'}catch(e){return 'ERR '+e.message}},[a,b,t,lag||0]);

const dates=async n=>(await it(n)).join('>');
// base: Scavi 23>25/11, Armature 26/11>01/12, Casseri 27>30/11, Pilastri 30/11>04/12, Solai 07>11/12
eq(await link('Scavi','Armature','FS'),'ok','collegamento FS creato');
eq((await preds('Armature')).map(x=>x.type+x.lag),['FS0'],'predecessore registrato');
eq(await dates('Armature'),'2026-11-26>2026-12-01','FS già soddisfatto: nessuno spostamento');
// allungare il predecessore sposta il successore in avanti
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,q.items.find(i=>i.name==='Scavi').uid,'dur','5')})});
eq(await dates('Scavi'),'2026-11-23>2026-11-27','Scavi allungato');
eq(await dates('Armature'),'2026-11-30>2026-12-03','il successore scivola in avanti (durata conservata)');
// annulla: ripristina entrambi in un solo passo
await A(()=>window.GanttApp.undo());
eq([await dates('Scavi'),await dates('Armature')],['2026-11-23>2026-11-25','2026-11-26>2026-12-01'],'annulla ripristina predecessore e successore');
// accorciare il predecessore non tira indietro il successore (solo spinta in avanti)
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,q.items.find(i=>i.name==='Scavi').uid,'dur','1')})});
eq(await dates('Armature'),'2026-11-26>2026-12-01','nessun richiamo all\'indietro');
await A(()=>window.GanttApp.undo());
// ciclo rifiutato
const direct=(a,b)=>AA(([a,b])=>{const A=window.GanttApp,q=JSON.parse(JSON.stringify(A.P));const ua=q.items.find(i=>i.name===a).uid,ub=q.items.find(i=>i.name===b).uid;try{A.core.opLink(q,ua,ub,'FS');return 'ok'}catch(e){return e.message}},[a,b]);
let r=await direct('Armature','Scavi');ok(/ciclo/i.test(r),'ciclo rifiutato: '+r);
eq(await preds('Scavi'),[],'nessun predecessore creato dal ciclo');
// gruppi e se stessi
ok(/gruppi/i.test(await direct('Fondazioni','Pilastri')),'gruppo non collegabile');
ok(/stesso/i.test(await direct('Pilastri','Pilastri')),'auto-collegamento rifiutato');
// ritardo in giorni lavorativi: Pilastri (30/11>04/12) FS +2 -> Solai min start = 4/12 +1 wd +2 = 09/12
eq(await link('Pilastri','Solai','FS',2),'ok','FS con ritardo +2');
eq((await dates('Solai')),'2026-12-10>2026-12-15','Solai: ritardo +2 giorni lavorativi (8/12 festivo)');
await A(()=>window.GanttApp.undo());
// SS e FF
eq(await link('Casseri','Pilastri','SS'),'ok','SS');
eq((await dates('Pilastri')).split('>')[0],'2026-11-30','SS: Pilastri inizia con Casseri (27/11 < 30/11, nessuna spinta)');
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,q.items.find(i=>i.name==='Casseri').uid,'start','02/12/26')})});
eq((await dates('Pilastri')).split('>')[0],'2026-12-02','SS: Pilastri spinto a iniziare non prima di Casseri');
await A(()=>window.GanttApp.undo());
// lock: la data bloccata non si sposta, il conflitto è segnalato
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.opLock(q,[q.items.find(i=>i.name==='Pilastri').uid],true)})});
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,q.items.find(i=>i.name==='Casseri').uid,'start','03/12/26')})});
eq((await dates('Pilastri')).split('>')[0],'2026-11-30','data bloccata: il successore non si sposta');
await p.waitForTimeout(100);
ok(await p.locator('#tlCv .dep.bad').count()>=1,'frecce in conflitto evidenziate');
await A(()=>window.GanttApp.undo());await A(()=>window.GanttApp.undo());
// frecce disegnate
const nd=await p.locator('#tlCv .dep').count();ok(nd>=2,'frecce presenti: '+nd);
const gpx=await p.evaluate(()=>[...document.querySelectorAll('#tlCv .tdeps text')].map(t=>t.getAttribute('x')));
ok(gpx.every(x=>x!=='NaN'&&!isNaN(parseFloat(x))),'etichette di ritardo con coordinate valide');
// UI: modalità collegamento + trascinamento tra punti
await A(()=>{const a=window.GanttApp;a.P.items.forEach(i=>i.predecessors=[]);a.render()});await W(100);
await p.locator('#tlCmds [data-act="link"]').click();await W(100);
ok(await p.locator('#tlBody.linking').count()===1,'modalità collegamento attiva');
ok(await p.locator('#tlCmds [data-act="link"].on').count()===1,'pulsante acceso');
const pt=async(n,e)=>{const bb=await p.locator('#tlCv .ldot[data-u="'+await AA(n=>window.GanttApp.P.items.find(i=>i.name===n).uid,n)+'"][data-e="'+e+'"]').boundingBox();return [bb.x+bb.width/2,bb.y+bb.height/2]};
const s0=await pt('Scavi','e'),d0=await pt('Casseri','s');
await p.mouse.move(s0[0],s0[1]);await p.mouse.down();await p.mouse.move((s0[0]+d0[0])/2,(s0[1]+d0[1])/2,{steps:4});
ok(await p.locator('#tlCv .tlink').count()===1,'linea elastica durante il trascinamento');
await p.mouse.move(d0[0],d0[1],{steps:4});await p.mouse.up();await W(150);
eq((await preds('Casseri')).map(x=>x.type),['FS'],'trascinamento fine -> inizio crea FS');
ok(await p.locator('#tlCv .tlink').count()===0,'linea elastica rimossa');
// fine -> fine
const s1=await pt('Pilastri','e'),d1=await pt('Solai','e');
await p.mouse.move(s1[0],s1[1]);await p.mouse.down();await p.mouse.move(d1[0],d1[1],{steps:6});await p.mouse.up();await W(150);
eq((await preds('Solai')).map(x=>x.type),['FF'],'fine -> fine crea FF');
// colonna predecessori sincronizzata
const pt2=await AA(()=>{const a=window.GanttApp,i=a.P.items.find(x=>x.name==='Casseri');return a.core.predText(a.P,i)});
ok(/FS|^\d+$/.test(pt2)&&pt2.length>0,'predText: '+pt2);
// clic su una freccia: popover
const onPath=()=>p.evaluate(()=>{const e=document.querySelector('#tlCv .dephit'),m=e.getScreenCTM(),pt=e.getPointAtLength(e.getTotalLength()*0.5);return [m.a*pt.x+m.e,m.d*pt.y+m.f]});
let hp=await onPath();await p.mouse.click(hp[0],hp[1]);await W(150);
ok(await p.locator('.pop .seg').count()>=1,'popover della freccia con selettore tipo');
await p.locator('.pop .seg button',{hasText:'SS'}).click();await W(150);
ok((await AA(()=>window.GanttApp.P.items.flatMap(i=>i.predecessors||[]).map(x=>x.type))).indexOf('SS')>=0,'tipo cambiato a SS dal popover');
await p.keyboard.press('Escape');await W(80);
// Canc elimina il collegamento selezionato
const n0=await AA(()=>window.GanttApp.P.items.reduce((a,i)=>a+(i.predecessors||[]).length,0));
hp=await onPath();await p.mouse.click(hp[0],hp[1]);await W(120);
ok(await p.locator('#tlCv .dep.on').count()===1,'freccia selezionata');
await p.keyboard.press('Delete');await W(150);
eq(await AA(()=>window.GanttApp.P.items.reduce((a,i)=>a+(i.predecessors||[]).length,0)),n0-1,'Canc elimina il collegamento');
// Esc esce dalla modalità
await p.keyboard.press('Escape');await W(100);
ok(await p.locator('#tlBody.linking').count()===0,'Esc esce dalla modalità collegamento');
// Maiusc mostra i punti
await p.keyboard.down('Shift');await W(80);ok(await p.locator('#tlBody.linking').count()===1,'Maiusc mostra i punti');
await p.keyboard.up('Shift');await W(80);ok(await p.locator('#tlBody.linking').count()===0,'rilascio Maiusc nasconde i punti');
// opzione: nascondi dipendenze
await AA(()=>{window.GanttApp.P.view.showDeps=false;window.GanttApp.render()});await W(80);
eq(await p.locator('#tlCv .dep').count(),0,'dipendenze nascoste');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);
await b.close()})();
