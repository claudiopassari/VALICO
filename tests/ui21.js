const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const A=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
const snap=()=>A(()=>{const A=window.GanttApp;return A.P.items.map(i=>[i.name,i.start,i.end,i.duration])});
const before=await snap();
// reale -> virtuale
await A(()=>{const A=window.GanttApp;A.commit('v',q=>A.core.opToVirtual(q))});await W(250);
const v=await snap();
const dur0=before.map(x=>x[3]),dur1=v.map(x=>x[3]);
eq(dur1,dur0,'durate invariate dopo il passaggio al virtuale');
const sc=v.find(x=>x[0]==='Scavi');
eq(await A(()=>window.GanttApp.core.virtOn()),true,'modalità virtuale');
eq(await p.locator('#itemsBody .row[data-uid]').nth(2).locator('.c-start .t').textContent(),'G1','Scavi inizia a G1');
const cur=await A(()=>{const A=window.GanttApp;return A.P.items.map(i=>i.start?A.core.toDN(i.start)-A.core.VBASE+1:null)});
console.log('giorni',cur);
ok(cur[2]===1&&cur[3]===4,'Getti a G4 (Scavi 3 gg)');
eq(await p.locator('#tlHead .tlc.nw, #tlCv .tnw').count(),0,'nessun weekend ombreggiato');
// header: nessuna riga mese/anno
const hd=await A(()=>document.querySelector('#tlHead').innerText.replace(/\s+/g,' ').slice(0,600));console.log('header',hd);
ok(/S1/.test(hd),'intestazione con S1');
// digitazione
await A(()=>{const A=window.GanttApp;A.commit('t',q=>A.core.setField(q,q.items.find(i=>i.name==='Quadri').uid,'start','G20'))});
eq(await A(()=>{const A=window.GanttApp;const q=A.P.items.find(i=>i.name==='Quadri');return A.core.toDN(q.start)-A.core.VBASE+1}),20,'inserimento G20');
// errore formato
const msg=await A(()=>{const A=window.GanttApp;try{A.core.setField(A.P,A.P.items.find(i=>i.name==='Quadri').uid,'start','12/12/26');return 'nessun errore'}catch(e){return e.message}});
ok(/G12/.test(msg),'messaggio di formato virtuale: '+msg);
// Oggi senza ancoraggio
eq(await A(()=>window.GanttApp.core.todayDN()===null||window.GanttApp.P.calendar.virtualAnchor!==null),true,'oggi dipende dall\'ancoraggio');
// virtuale -> reale con blocchi
await A(()=>{const A=window.GanttApp;A.commit('l',q=>A.core.opLock(q,[q.items.find(i=>i.name==='Scavi').uid],true))});
await A(()=>{const A=window.GanttApp;A.commit('r',q=>A.core.opToReal(q,'2026-11-23'))});await W(250);
const r=await snap();
const dur2=r.map(x=>x[3]);eq(dur2,dur1.map((d,i)=>i===dur1.length?d:d),'durate dopo ritorno al reale');
eq(await A(()=>window.GanttApp.core.virtOn()),false,'calendario reale');
eq(await A(()=>window.GanttApp.P.items.some(i=>i.lockStart||i.lockEnd)),false,'lucchetti sbloccati');
eq(r.find(x=>x[0]==='Scavi').slice(1,3),['2026-11-23','2026-11-25'],'Scavi: 23-25 nov');
// annulla
await A(()=>window.GanttApp.undo());await W(200);
eq(await A(()=>window.GanttApp.core.virtOn()),true,'annulla riporta al virtuale');
// finestra calendario
await p.locator('#tlCmds [data-act="calendar"]').click();await W(200);
const ptx=await p.locator('.pop').first().innerText();console.log(ptx.slice(0,200));ok(/virtuale/i.test(ptx)&&/ancoraggio/i.test(ptx),'dialogo calendario virtuale');
await p.keyboard.press('Escape');
// selettore giorno
await p.locator('#itemsBody .row[data-uid]').nth(4).locator('.c-start').click();await W(100);
await p.locator('#itemsBody .row[data-uid]').nth(4).locator('.c-start .calb').click({force:true});await W(200);
ok(await p.locator('.pop input[aria-label="Giorno del progetto"]').count()===1,'selettore del giorno virtuale');
await p.keyboard.press('Escape');
ok(errs.length===0,'nessun errore '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
