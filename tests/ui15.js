const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
const U=n=>AA(n=>window.GanttApp.P.items.find(i=>i.name===n).uid,n);
const D=n=>AA(n=>{const x=window.GanttApp.P.items.find(i=>i.name===n);return [x.start,x.end,x.type]},n);
// ---- Indicazione: creazione tramite tipo
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{const it=A.core.newItem('Nota fase');it.level=1;q.items.push(it)})});
const ui_=await U('Nota fase');
await AA(u=>{const A=window.GanttApp;A.commit('t',q=>A.core.setField(q,u,'type','indication'))},ui_);
eq((await D('Nota fase'))[2],'indication','tipo indicazione');
ok(await p.locator('#itemsBody .row:has-text("Nota fase") .idot').count()===1,'icona dell\'indicazione nell\'elenco');
// non è un gruppo; il gruppo ne include l'intervallo
const before=await D('Cantiere');
await AA(([u,a])=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,u,'start','01/02/27');A.core.setField(q,u,'dur','3')})},[ui_]);
eq((await D('Cantiere')).slice(0,2),before.slice(0,2),'un\'indicazione fuori dal gruppo non ne cambia le date');
// sotto un\'indicazione non si annida
const r1=await AA(()=>{const A=window.GanttApp,q=JSON.parse(JSON.stringify(A.P));try{const i=q.items.length;const x=A.core.newItem('X');x.level=2;q.items.push(x);A.core.finalize(q);return q.items[i].level+'|'+q.items[i-0].type}catch(e){return e.message}});
ok(r1.startsWith('1|'),'finalize riporta a livello 1 un figlio di indicazione: '+r1);
// copertura
await AA(([ui_,a,b])=>{const A=window.GanttApp;A.commit('t',q=>{A.core.opCover(q,ui_,a,true);A.core.opCover(q,ui_,b,true)})},[ui_,await U('Scavi'),await U('Pilastri')]);
const d1=await D('Nota fase');eq(d1.slice(0,2),['2026-11-23','2026-12-04'],'date derivate dai task coperti');
// date derivate in sola lettura
let rr=await AA(u=>{const A=window.GanttApp,q=JSON.parse(JSON.stringify(A.P));try{A.core.setField(q,u,'start','01/12/26');return 'ok'}catch(e){return e.message}},ui_);
ok(/derivano/.test(rr),'date derivate non modificabili: '+rr);
// si aggiorna al variare dei coperti
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>A.core.setField(q,q.items.find(i=>i.name==='Pilastri').uid,'dur','8'))});
ok((await D('Nota fase'))[1]>'2026-12-04','la fine segue il task coperto: '+(await D('Nota fase'))[1]);
await A(()=>window.GanttApp.undo());
// esclusa dalle dipendenze
let rl=await AA(([a,b])=>{const A=window.GanttApp,q=JSON.parse(JSON.stringify(A.P));try{A.core.opLink(q,a,b,'FS');return 'ok'}catch(e){return e.message}},[ui_,await U('Armature')]);
ok(/indicazion/i.test(rl),'indicazione non collegabile come predecessore: '+rl);
let rp=await AA(([u])=>{const A=window.GanttApp,q=JSON.parse(JSON.stringify(A.P));try{A.core.setField(q,u,'preds','3');return 'ok'}catch(e){return e.message}},[ui_]);
ok(/predecessori/.test(rp),'indicazione senza predecessori: '+rp);
// disegno: linea sottile con punti
ok(await p.locator('#tlCv .bx.ind').count()===1,'barra sottile dell\'indicazione');
// Details
await AA(u=>{const a=window.GanttApp;a.ui.sel=[u];a.ui.anchor=u;a.render()},ui_);await W(150);
ok(await p.locator('#detailsBody .chip').count()===2,'chip dei task coperti nei Dettagli');
await p.locator('#detailsBody .chip button').first().click();await W(150);
eq(await AA(u=>window.GanttApp.P.items.find(i=>i.uid===u).covers.length,ui_),1,'rimozione di un task coperto dal chip');
await p.locator('#detailsBody select[aria-label="Aggiungi un\'attività coperta"]').selectOption({index:1});await W(150);
eq(await AA(u=>window.GanttApp.P.items.find(i=>i.uid===u).covers.length,ui_),2,'aggiunta di un task coperto dal selettore');
// modalità collegamento: trascinando da indicazione a task si aggiunge la copertura
await p.locator('#tlCmds [data-act="link"]').click();await W(100);
const pt=async(n,e)=>{const u=await U(n);const bb=await p.locator('#tlCv .ldot[data-u="'+u+'"][data-e="'+e+'"]').boundingBox();return [bb.x+bb.width/2,bb.y+bb.height/2]};
const cvBefore=await AA(u=>window.GanttApp.P.items.find(i=>i.uid===u).covers.slice(),ui_);
const tgt=['Casseri','Solai'].find(n=>cvBefore.indexOf(null)<0);
const s0=await pt('Nota fase','e'),d0=await pt('Solai','s');
await p.mouse.move(s0[0],s0[1]);await p.mouse.down();await p.mouse.move(d0[0],d0[1],{steps:6});await p.mouse.up();await W(150);
ok(await AA(([u,s])=>window.GanttApp.P.items.find(i=>i.uid===u).covers.indexOf(s)>=0,[ui_,await U('Solai')]),'trascinamento indicazione→task aggiunge la copertura');
await p.keyboard.press('Escape');await W(80);
// salvataggio e ricarica: covers, periodi, baseline
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{q.periods.push({uid:'pp',name:'P',start:'2026-12-01',end:'2026-12-05',color:{c:'blu',v:1}});A.core.opSaveBaseline(q,'Piano','2026-11-24')})});
const rt=await A(()=>{const A=window.GanttApp;const t=JSON.stringify(A.core.prepareSave(A.P,{}));const before=JSON.parse(t);A.core.loadText(t,null,'x.json');const P=A.P;
  const nota=P.items.find(i=>i.name==='Nota fase');
  return {cov:nota.covers.length,type:nota.type,per:P.periods.length,bl:P.baselines.length,act:!!P.activeBaseline,blN:Object.keys(P.baselines[0].d).length,ver:before.app.version}});
eq([rt.type,rt.cov>=2,rt.per,rt.bl,rt.act,rt.blN>5,rt.ver],['indication',true,1,1,true,true,'0.9.4'],'salvataggio e ricarica: indicazione, periodi, baseline');
await W(200);
// ---- Ctrl + trascinamento verticale
await AA(()=>{const a=window.GanttApp;a.ui.sel=[];a.render()});await W(100);
const order0=await A(()=>window.GanttApp.P.items.map(i=>i.name));
const sol=await p.locator('#tlCv .bar[data-u="'+await U('Pilastri')+'"]').boundingBox();
const arm=await p.locator('#tlCv .bar[data-u="'+await U('Armature')+'"]').boundingBox();
await p.keyboard.down('Control');
await p.mouse.move(sol.x+sol.width/2,sol.y+sol.height/2);await p.mouse.down();
await p.mouse.move(sol.x+sol.width/2,sol.y-40,{steps:4});
ok(await p.locator('#tlCv .tdrop').count()===1,'linea di rilascio durante il riordino');
await p.mouse.move(arm.x+arm.width/2,arm.y-2,{steps:6});await p.mouse.up();await p.keyboard.up('Control');await W(200);
const order1=await A(()=>window.GanttApp.P.items.map(i=>i.name));
ok(JSON.stringify(order0)!==JSON.stringify(order1)&&order1.indexOf('Pilastri')<order0.indexOf('Pilastri'),'Ctrl+trascinamento verticale sposta la riga: '+order1.indexOf('Pilastri')+' vs '+order0.indexOf('Pilastri'));
eq(await A(()=>window.GanttApp.hist.undo.length>0),true,'operazione registrata');
await A(()=>window.GanttApp.undo());await W(100);
eq(await A(()=>window.GanttApp.P.items.map(i=>i.name)),order0,'annulla ripristina l\'ordine');
// ---- riepilogo scorciatoie
ok(!(await p.locator('#scItems').isVisible()),'riepilogo nascosto di default');
await AA(()=>{document.documentElement.classList.add('showsc')});await W(100);
ok(await p.locator('#scItems').isVisible()&&await p.locator('#scTl').isVisible(),'riepilogo visibile se attivo');
await AA(()=>{document.documentElement.classList.remove('showsc')});
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);
await b.close()})();
