const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
// tema automatico
for(const cs of ['dark','light']){
 const ctx=await b.newContext({colorScheme:cs,viewport:{width:1600,height:800}});const p=await ctx.newPage();
 p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
 await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(500);
 const t=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));
 ok(t===(cs==='dark'?'dark':'light'),'tema automatico '+cs+' -> '+t);
 const pr=await p.evaluate(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')||'{}').theme);
 ok(pr===undefined||pr==='auto','pref tema auto: '+pr);
 await ctx.close();
}
const ctx=await b.newContext({viewport:{width:1900,height:800}});const p=await ctx.newPage();
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(400);
const W=t=>p.waitForTimeout(t);
// intestazione W·S
await p.evaluate(()=>{const A=GanttApp;A.P.view.scale='days';A.P.view.hdrLevels={year:true,month:true,week:true,wprog:true,day:true,num:true};A.render();});await W(300);
let r=await p.evaluate(()=>{const hd=document.querySelector('#tlHead');const rows=[...hd.querySelectorAll('.tlr')];return {n:rows.length,top:Math.round(rows[0].getBoundingClientRect().top-hd.getBoundingClientRect().top),txt:rows.map(x=>x.textContent.slice(0,30)),merged:[...hd.querySelectorAll('.tlc .wpS')].length,tip:(hd.querySelector('.tlc[data-tip*="ISO"]')||{getAttribute(){return ''}}).getAttribute('data-tip')}});
ok(r.n<=5,'al più 5 righe: '+r.n);ok(r.top>=-2,'riga anno non tagliata '+r.top);
ok(/^20\d\d/.test(r.txt[0]),'prima riga = anno '+r.txt[0]);
ok(/W\d+ · S/.test(r.txt[r.n-1]),'riga unificata '+r.txt[r.n-1]);ok(r.merged>3,'parti S evidenziate');ok(/ISO 8601/.test(r.tip||''),'tooltip');
// spenta la settimana ISO: resta solo S
await p.evaluate(()=>{GanttApp.P.view.hdrLevels.week=false;GanttApp.render();});await W(200);
r=await p.evaluate(()=>[...document.querySelectorAll('#tlHead .tlr')].map(x=>x.textContent.slice(0,20)));
ok(/^S[\d−]+/.test(r[r.length-1])&&!/W\d/.test(r[r.length-1]),'solo S: '+r[r.length-1]);
await p.evaluate(()=>{GanttApp.P.view.hdrLevels.week=true;GanttApp.P.view.hdrLevels.wprog=false;GanttApp.render();});await W(200);
r=await p.evaluate(()=>[...document.querySelectorAll('#tlHead .tlr')].map(x=>x.textContent.slice(0,20)));
ok(/^W\d+/.test(r[r.length-1])&&!/·/.test(r[r.length-1]),'solo W: '+r[r.length-1]);
// inizio/fine manuali
await p.evaluate(()=>{GanttApp.P.view.hdrLevels.wprog=true;GanttApp.render();});
const st=await p.evaluate(()=>{const A=GanttApp;const mk=A.P.markers.map(m=>m.kind+':'+m.date);return {mk,cs:A.P.calendar.projectStart,ce:A.P.calendar.projectEnd}});
ok(st.ce===null,'fine automatica di default');
const tag=k=>p.locator('#tlHead .mtag[data-k="'+k+'"]');
ok(!(await tag('start').getAttribute('class')).includes('dg'),'inizio non trascinabile in automatico');
ok(/Manuale/.test(await tag('start').getAttribute('data-tip')),'tooltip automatico');
// imposta manuale da Calendario
await p.evaluate(()=>{const A=GanttApp;A.commit('t',p=>{p.calendar.projectStart='2026-11-23';p.calendar.projectEnd='2027-02-26';});});await W(300);
ok((await tag('start').getAttribute('class')).includes('dg')&&(await tag('end').getAttribute('class')).includes('dg'),'trascinabili in manuale');
const x0=await tag('start').boundingBox();const bx=x0.x+x0.width/2, by=x0.y+x0.height/2;
await p.mouse.move(bx,by);await p.mouse.down();await p.mouse.move(bx+40,by,{steps:8});
await p.mouse.up();await W(300);
let cs=await p.evaluate(()=>GanttApp.P.calendar.projectStart);
ok(cs>'2026-11-23','trascinamento aggiorna il Calendario: '+cs);
ok(await p.evaluate(()=>GanttApp.P.markers.filter(m=>m.kind==='start')[0].date===null),'marker.date resta null');
await p.evaluate(()=>GanttApp.undo());await W(200);
ok(await p.evaluate(()=>GanttApp.P.calendar.projectStart)==='2026-11-23','undo ripristina');
// lucchetto
await p.evaluate(()=>{GanttApp.commit('t',p=>{p.calendar.projectStartLock=true;});});await W(300);
ok(!(await tag('start').getAttribute('class')).includes('dg'),'lucchetto: non trascinabile');
ok(/bloccata/.test(await tag('start').getAttribute('data-tip')),'tooltip lucchetto');
// pannello calendario
await p.locator('#tlCmds [data-act="calendar"]').click();await W(400);
const pn=await p.evaluate(()=>({s:!!document.querySelector('#calStart'),e:!!document.querySelector('#calEnd'),sd:document.querySelector('#calStart')&&document.querySelector('#calStart').disabled,lb:!!document.querySelector('#calStartLock.on'),modes:[...document.querySelectorAll('.pop .vrow')].filter(x=>/Modalità/.test(x.textContent)).length}));
ok(pn.s&&pn.e,'campi inizio e fine nel Calendario');ok(pn.sd,'campo bloccato disabilitato');ok(pn.lb,'lucchetto attivo');ok(pn.modes===2,'due righe Modalità '+pn.modes);
await p.click('#calStartLock');await W(300);
ok(await p.evaluate(()=>GanttApp.P.calendar.projectStartLock)===false,'sblocco da pannello');
// barra Progetto segue le date manuali
const ar=await p.evaluate(()=>{const e=document.querySelector('#tlHead .pseg.act');return e?e.getAttribute('title'):''});
ok(/23\/11\/26|23\/11\/2026|26-11-23/.test(ar)||/23/.test(ar),'barra Progetto: '+ar);
// fine prima dell'inizio -> rifiutata
const rr=await p.evaluate(()=>{const A=GanttApp;return A.commit('t',p=>{p.calendar.projectEnd='2026-01-01';});});
// migrazione da file con marker.date
const mg=await p.evaluate(()=>{const A=GanttApp;const o=JSON.parse(JSON.stringify(A.P));o.calendar.projectStart=null;o.calendar.projectEnd=null;o.markers.forEach(m=>{if(m.kind==='start')m.date='2026-11-30';if(m.kind==='end')m.date='2027-03-05';});const q=A.core?A.core.normalizeLoaded(o):null;return q?[q.calendar.projectStart,q.calendar.projectEnd,q.markers.filter(m=>m.kind!=='custom'&&m.kind!=='today').map(m=>m.date)]:null});
console.log('migr',JSON.stringify(mg));
if(mg) ok(mg[0]==='2026-11-30'&&mg[1]==='2027-03-05'&&mg[2].every(d=>d===null),'migrazione marker.date -> Calendario');

// sicurezza: uid manipolati non iniettano markup
const sec=await p.evaluate(()=>{const A=GanttApp;const o=JSON.parse(JSON.stringify(A.P));const bad='x" onmouseover="window.__pwn=1" y="';o.items[1].uid=bad;if(o.items[2])o.items[2].predecessors=[{uid:bad,type:'FS',lag:0}];o.markers.push({uid:'m"><img src=x onerror=window.__pwn=2>',kind:'custom',name:'<b>x</b>',color:{c:'blu',v:1},date:'2026-12-01',dateEnd:null});const q=A.core.normalizeLoaded(o);const ok1=q.items.every(i=>/^[A-Za-z0-9_.:-]{1,64}$/.test(i.uid));const ref=q.items[2]?(q.items[2].predecessors||[]).every(d=>q.items.some(i=>i.uid===d.uid)):true;return [ok1,ref,q.markers.every(m=>/^[A-Za-z0-9_.:-]{1,64}$/.test(m.uid))]});
ok(sec[0]&&sec[1]&&sec[2],'uid non conformi rigenerati e riferimenti allineati '+sec);
console.log('pass',pass,'fail',fail);await b.close()})();
