const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const W=(p,t)=>p.waitForTimeout(t);
const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>{errs.push(e.message);fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(p,400);await p.evaluate(()=>GanttApp.act.loadExample());await W(p,500);
const st=()=>p.evaluate(()=>({tab:document.documentElement.getAttribute('data-tab'),cons:document.documentElement.hasAttribute('data-consult'),sheet:document.querySelector('#msheet').classList.contains('on'),sheetTxt:document.querySelector('#msheet').innerText,
 order:[...document.querySelectorAll('#mnav button[data-t]')].map(x=>x.dataset.t),warn:document.querySelector('#mwarn').innerText,warnVis:getComputedStyle(document.querySelector('#mwarn')).display,navTop:document.querySelector('#mnav').getBoundingClientRect().bottom,ih:innerHeight}));
let s=await st();
ok(s.order.join()==='det,items,tl','ordine schede Dettagli, Elenco, Timeline '+s.order);ok(s.tab==='items','scheda iniziale Elenco');ok(s.cons,'consultazione attiva di default');
ok(s.navTop<=s.ih+1,'barra inferiore nello schermo');
// consultazione: i dati non cambiano
const n0=await p.evaluate(()=>{const A=GanttApp;const u=A.P.items[3].uid;const r=A.commit('t',q=>{q.items[3].name='X'});return [r,A.P.items[3].name]});
ok(n0[0]===false&&n0[1]!=='X','commit bloccato in consultazione '+JSON.stringify(n0));
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#itemCmds')).display)==='none','comandi di modifica nascosti in consultazione');
// riepilogo rapido: tocco su una riga
await p.tap('#itemsBody .row[data-uid] .c-name',{position:{x:60,y:10}});await W(p,300);s=await st();
ok(s.sheet&&s.sheetTxt.length>10,'riepilogo rapido alla selezione: '+s.sheetTxt.replace(/\n/g,' | '));
// pulsante Dettagli del riepilogo
await p.tap('#msheet .msb .btn');await W(p,300);s=await st();ok(s.tab==='det'&&!s.sheet,'Dettagli: apre la scheda e nasconde il riepilogo');
// campi non modificabili in consultazione
ok(await p.evaluate(()=>{const i=document.querySelector('#pDetails input');return !i||getComputedStyle(i).pointerEvents==='none'}),'campi dettagli non interattivi');
// scorrimento: zona sicura (barra inferiore) verso sinistra => scheda successiva
const swipe=async(sel,dx,dy=0)=>{await p.evaluate(({sel,dx,dy})=>{const el=document.querySelector(sel),r=el.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+Math.min(r.height/2,20);
  const mk=(t,xx,yy)=>new Touch({identifier:1,target:el,clientX:xx,clientY:yy});const fire=(type,xx,yy)=>el.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:type==='touchend'?[]:[mk(type,xx,yy)],changedTouches:[mk(type,xx,yy)]}));
  fire('touchstart',x,y);fire('touchmove',x+dx/2,y+dy/2);fire('touchend',x+dx,y+dy);},{sel,dx,dy});await W(p,250)};
await swipe('#mnav',-120);s=await st();ok(s.tab==='items','swipe sinistra da Dettagli: Elenco '+s.tab);
await swipe('#mnav',-120);s=await st();ok(s.tab==='tl','swipe sinistra: Timeline '+s.tab);
await swipe('#mnav',-120);s=await st();ok(s.tab==='tl','oltre l\'ultima scheda: resta');
await swipe('#mnav',120);s=await st();ok(s.tab==='items','swipe destra: Elenco');
await swipe('#mnav',-30);s=await st();ok(s.tab==='items','spostamento breve: ignorato');
await swipe('#mnav',-120,100);s=await st();ok(s.tab==='items','gesto diagonale: ignorato');
// fuori dalle zone sicure: nessun cambio scheda
await p.evaluate(()=>{});await swipe('#itemsBody',-150);s=await st();ok(s.tab==='items','swipe sul corpo dell\'elenco: ignorato');
await p.tap('#mnav button[data-t="tl"]');await W(p,300);await swipe('#tlBody',-150);s=await st();ok(s.tab==='tl','swipe sul corpo della timeline: ignorato');
// zoom a due dita sulla timeline
const px0=await p.evaluate(()=>GanttApp.ui.geo.px);
await p.evaluate(()=>{const el=document.querySelector('#tlBody'),r=el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
 const T=(id,x,y)=>new Touch({identifier:id,target:el,clientX:x,clientY:y});const f=(type,a,b)=>el.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:a,changedTouches:b||a}));
 f('touchstart',[T(1,cx-30,cy),T(2,cx+30,cy)]);for(let k=1;k<=6;k++){const d=30+k*12;f('touchmove',[T(1,cx-d,cy),T(2,cx+d,cy)]);}f('touchend',[]);});
await W(p,500);const px1=await p.evaluate(()=>GanttApp.ui.geo.px);ok(px1>px0*1.5,'pinch aumenta lo zoom '+px0.toFixed(2)+' -> '+px1.toFixed(2));
// modalità modifica
await p.tap('#mnav .mmode');await W(p,300);s=await st();ok(!s.cons,'modalità modifica attiva');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#itemCmds')).display)!=='none','comandi di modifica visibili');
const n1=await p.evaluate(()=>{const A=GanttApp;const r=A.commit('t',q=>{q.items[3].name='Prova'});return [r!==false,A.P.items[3].name]});ok(n1[0]&&n1[1]==='Prova','modifica consentita dopo il passaggio '+JSON.stringify(n1));
await p.evaluate(()=>GanttApp.undo());
await p.tap('#mnav .mmode');await W(p,200);ok((await st()).cons,'ritorno alla consultazione');
// riga avvisi
await p.evaluate(()=>{const A=GanttApp;A.ui.consult=false;A.commit('t',q=>{q.items[3].deadline=q.items[3].start});A.ui.consult=true;A.render()});await W(p,300);
s=await st();ok(s.warn.length>0&&s.warnVis==='block','riga avvisi compatta visibile: '+JSON.stringify(s.warn));
// limite risoluzione export su touch
ok(await p.evaluate(()=>{const o={fmt:'png',px:20000};const bb={w:4000,h:3000};const r=GanttApp.core.expScale(o,bb);return (bb.w*r.s*bb.h*r.s<=16.1e6&&bb.w*r.s<=8192.5)}).then(v=>v===true),'limite di risoluzione su touch');
// PC: nessun effetto
{const c2=await b.newContext({viewport:{width:1500,height:800}});const q=await c2.newPage();await q.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await q.goto('file://'+process.cwd()+'/app.html');await W(q,400);await q.evaluate(()=>GanttApp.act.loadExample());await W(q,300);
 const r=await q.evaluate(()=>({cons:!!GanttApp.ui.consult,nav:getComputedStyle(document.querySelector('#mnav')).display,sheet:getComputedStyle(document.querySelector('#msheet')).display,warn:getComputedStyle(document.querySelector('#mwarn')).display,c:GanttApp.commit('t',q=>{q.items[3].name='Z'})!==false}));
 ok(!r.cons&&r.nav==='none'&&r.sheet==='none'&&r.warn==='none'&&r.c,'PC invariato '+JSON.stringify(r));await c2.close();}
ok(errs.length===0,'nessun errore JS');
console.log('pass',pass,'fail',fail);await b.close()})();
