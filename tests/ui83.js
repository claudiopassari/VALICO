const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:2100,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
const dates=n=>AA(n=>{const x=window.GanttApp.P.items.find(i=>i.name===n);return x.start+'>'+x.end},n);
const uidOf=n=>AA(n=>window.GanttApp.P.items.find(i=>i.name===n).uid,n);
const run=(label,fnsrc,args)=>AA(([label,fnsrc,args])=>{const A=window.GanttApp;try{const r=A.commit(label,q=>(new Function('q','C','args','U','return ('+fnsrc+')(q,C,args,U)'))(q,A.core,args,n=>q.items.find(i=>i.name===n).uid));return {r}}catch(e){return {err:e.message}}},[label,fnsrc,args]);
const toastTxt=()=>A(()=>document.getElementById('toast').textContent);
const undo=()=>A(()=>window.GanttApp.undo());
// base: Scavi 23>25/11, Armature 26/11>01/12, Casseri 27>30/11, Pilastri 30/11>04/12, Solai 07>11/12
const d0={S:await dates('Scavi'),A:await dates('Armature'),C:await dates('Casseri'),P:await dates('Pilastri')};
// 1) creazione di un collegamento rigido SS Scavi -> Casseri
let r=await run('rig','(q,C,a,U)=>C.opLink(q,U("Scavi"),U("Casseri"),"SS",true)');
ok(r.r===true||!r.err,'collegamento rigido creato '+JSON.stringify(r));
await W(0);const pr=await AA(()=>window.GanttApp.P.items.find(i=>i.name==='Casseri').predecessors);
eq(pr.map(x=>x.type+'/'+x.lag+'/'+x.rigid),['SS/4/true'],'ritardo calcolato (4 gg lavorativi) e flag rigido');
eq(await AA(()=>{const A=window.GanttApp;return A.core.predText(A.P,A.P.items.find(i=>i.name==='Casseri'))}).then(t=>/SS\+4!/.test(t)),true,'testo predecessori con !');
eq(await dates('Casseri'),d0.C,'la creazione non sposta nulla');
// 2) spostare il predecessore trascina il successore
await run('mv','(q,C,a,U)=>C.opBarMove(q,U("Scavi"),7)');
eq(await dates('Scavi'),'2026-11-30>2026-12-02','Scavi spostato di una settimana');
eq(await dates('Casseri'),'2026-12-04>2026-12-07','Casseri segue (stesso scarto di 2 gg lavorativi)');
await undo();eq(await dates('Casseri'),d0.C,'annulla ripristina entrambe in un solo passo');
// 3) spostare il successore trascina il predecessore (verso opposto)
await run('mv','(q,C,a,U)=>C.opBarMove(q,U("Casseri"),7)');
eq(await dates('Scavi'),'2026-11-30>2026-12-02','spostando Casseri si sposta anche Scavi');
await undo();
// 4) tutto o niente: data bloccata sul predecessore
await AA(()=>{const A=window.GanttApp;A.commit('lk',q=>{q.items.find(i=>i.name==='Scavi').lockStart=true})});
r=await run('mv','(q,C,a,U)=>C.opBarMove(q,U("Casseri"),3)');
{const t=await toastTxt();ok(r.r===false&&/bloccata/.test(t)&&/Scavi/.test(t)&&/Casseri/.test(t)&&/Insieme rigido/.test(t),'messaggio esplicativo con insieme e barra bloccante: '+t);}
eq([await dates('Scavi'),await dates('Casseri')],[d0.S,d0.C],'nessuna barra spostata (tutto o niente)');
await AA(()=>{const A=window.GanttApp;A.commit('lk',q=>{q.items.find(i=>i.name==='Scavi').lockStart=false})});
// 5) catena: Casseri -> Pilastri rigido FS
r=await run('rig2','(q,C,a,U)=>C.opLink(q,U("Casseri"),U("Pilastri"),"FS",true)');
ok(!r.err,'secondo collegamento rigido '+JSON.stringify(r));
const setS=await AA(()=>{const A=window.GanttApp;return A.core.rigidSet?'x':'no'});
await run('mv','(q,C,a,U)=>C.opBarMove(q,U("Scavi"),7)');
eq([await dates('Scavi'),await dates('Casseri')],['2026-11-30>2026-12-02','2026-12-04>2026-12-07'],'catena: i primi due si spostano');
const dP=await dates('Pilastri');ok(dP!==d0.P,'terza barra della catena spostata: '+dP);
await undo();eq(await dates('Pilastri'),d0.P,'annulla ripristina la catena');
// 6) multipli collegamenti sulla stessa barra: ciclo rifiutato
r=await run('cyc','(q,C,a,U)=>C.opLink(q,U("Pilastri"),U("Scavi"),"FS",true)');
{const t=await toastTxt();ok(r.r===false&&/ciclo/i.test(t),'ciclo rifiutato anche per rigidi: '+t);}
// 7) conversione rigido -> flessibile e viceversa
await AA(()=>{const A=window.GanttApp,P=A.P;const a=P.items.find(i=>i.name==='Scavi').uid,b=P.items.find(i=>i.name==='Casseri').uid;A.commit('flex',q=>A.core.opSetRigid(q,a,b,false))});
eq(await AA(()=>window.GanttApp.P.items.find(i=>i.name==='Casseri').predecessors[0].rigid||false),false,'reso flessibile');
await run('mv','(q,C,a,U)=>C.opBarMove(q,U("Scavi"),-7)');
eq(await dates('Casseri'),d0.C,'flessibile: il successore non segue il predecessore all\'indietro');
await undo();
// 8) rendering
await A(()=>window.GanttApp.act&&0);
await AA(()=>{const A=window.GanttApp,P=A.P;const a=P.items.find(i=>i.name==='Scavi').uid,b=P.items.find(i=>i.name==='Casseri').uid;A.commit('rig',q=>A.core.opSetRigid(q,a,b,true))});
await W(200);
ok(await p.locator('#tlBody .tdeps .dep.rigid').count()>=1,'freccia rigida con classe dedicata');
ok((await p.locator('#tlBody .tdeps .lagb').allTextContents()).some(t=>/R/.test(t)),'badge R presente');
// 9) gesto a due clic con Maiusc
await AA(()=>{const A=window.GanttApp,P=A.P;A.commit('clr',q=>{q.items.forEach(x=>{x.predecessors=[]})})});await W(150);
const ctr=async(n,e)=>AA(([n,e])=>{const el=document.querySelector('#tlBody .ldot[data-u="'+window.GanttApp.P.items.find(i=>i.name===n).uid+'"][data-e="'+e+'"]');const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]},[n,e]);
const bar=async n=>AA(n=>{const el=document.querySelector('#tlBody .bar[data-u="'+window.GanttApp.P.items.find(i=>i.name===n).uid+'"]');const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]},n);
await p.keyboard.down('Shift');await W(120);
ok(await p.locator('#tlBody .ldot').count()>0,'punti di collegamento visibili con Maiusc');
let c=await ctr('Scavi','e');
await p.mouse.move(c[0],c[1]);await p.mouse.down();await p.mouse.move(c[0]+30,c[1]+5);await p.mouse.up();   /* rilascio nel vuoto con Maiusc: la freccia resta */
await W(100);
ok(await p.locator('svg.tlink').count()===1,'la freccia resta agganciata dopo il rilascio (Maiusc premuto)');
let tg=await bar('Armature');await p.mouse.move(tg[0],tg[1]);await W(60);
ok(await p.locator('svg.tlink').count()===1,'la freccia segue il puntatore');
await p.keyboard.up('Shift');await W(100);
ok(await p.locator('svg.tlink').count()===0,'rilascio di Maiusc annulla la freccia');
eq(await AA(()=>window.GanttApp.P.items.find(i=>i.name==='Armature').predecessors.length),0,'nessun collegamento creato dall\'annullamento');
// ripeti: secondo clic su una barra con Ctrl -> rigido
await p.keyboard.down('Shift');await W(100);
c=await ctr('Scavi','e');await p.mouse.move(c[0],c[1]);await p.mouse.down();await p.mouse.move(c[0]+30,c[1]+5);await p.mouse.up();await W(80);
tg=await bar('Armature');await p.mouse.move(tg[0]-20,tg[1]);
await p.keyboard.down('Control');await p.mouse.down();await p.mouse.up();await p.keyboard.up('Control');await p.keyboard.up('Shift');await W(150);
const pa=await AA(()=>window.GanttApp.P.items.find(i=>i.name==='Armature').predecessors);
eq(pa.map(x=>x.type+'/'+!!x.rigid),['FS/true'],'secondo clic con Ctrl: collegamento rigido FS');
ok(await p.locator('svg.tlink').count()===0,'freccia temporanea rimossa');
// senza Ctrl: flessibile, con trascinamento classico
await AA(()=>{const A=window.GanttApp;A.commit('clr',q=>{q.items.forEach(x=>{x.predecessors=[]})})});await W(120);
await p.keyboard.down('Shift');await W(100);
c=await ctr('Scavi','e');let t2=await ctr('Armature','s');
await p.mouse.move(c[0],c[1]);await p.mouse.down();await p.mouse.move(t2[0],t2[1],{steps:5});await p.mouse.up();await p.keyboard.up('Shift');await W(120);
eq((await AA(()=>window.GanttApp.P.items.find(i=>i.name==='Armature').predecessors)).map(x=>x.type+'/'+!!x.rigid),['FS/false'],'trascinamento classico: flessibile');
// Esc annulla
await p.keyboard.down('Shift');await W(80);
c=await ctr('Scavi','e');await p.mouse.move(c[0],c[1]);await p.mouse.down();await p.mouse.move(c[0]+30,c[1]+5);await p.mouse.up();await W(60);
await p.keyboard.press('Escape');await W(60);await p.keyboard.up('Shift');
ok(await p.locator('svg.tlink').count()===0,'Esc annulla la freccia agganciata');
// 10) analisi del testo dei predecessori con !
r=await run('pt','(q,C,a,U)=>{const it=q.items.find(i=>i.name==="Solai");const t=C.parsePreds?C.parsePreds(q,it,"3FS+1!"):null;return true}');
const pt=await AA(()=>{const A=window.GanttApp;const q=A.P;const it=q.items.find(i=>i.name==='Solai');const num=q.items.findIndex(i=>i.name==='Scavi')+1;
  try{A.commit('pt',p=>{A.core.setField(p,p.items.find(i=>i.name==='Solai').uid,'preds',num+'FS+1!')});}catch(e){return 'ERR '+e.message}
  return A.P.items.find(i=>i.name==='Solai').predecessors});
ok(Array.isArray(pt)&&pt.some(x=>x.rigid&&x.lag===1&&x.type==='FS'),'cella Predecessori accetta il punto esclamativo: '+JSON.stringify(pt));
ok(errs.length===0,'nessun errore: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
