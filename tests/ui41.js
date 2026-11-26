const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1900,height:900}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(400);const W=t=>p.waitForTimeout(t);
// ---- Componenti
const r1=await p.evaluate(()=>{const A=window.GanttApp,C=A.core;const base=C.core?0:0;
  const rep0=A.core.assigneeReport?0:0;return 1});
await p.evaluate(()=>{const A=window.GanttApp;A.commit('t',q=>{const it=q.items.find(i=>i.name==='Armature');it.hoursPerDay=6;A.core.setField(q,it.uid,'crew','3')})});
const hrs=await p.evaluate(()=>{const A=window.GanttApp;return A.core.assigneeReport(A.P).rows.find(r=>r.name==='Rossi')});
ok(hrs&&hrs.ch===hrs.cd*18,'ore = durata × 6 h × 3 componenti: '+JSON.stringify(hrs));
const bad=await p.evaluate(()=>{const A=window.GanttApp;try{A.commit('t',q=>A.core.setField(q,q.items.find(i=>i.name==='Armature').uid,'crew','0'));return 'nessun errore'}catch(e){return 'eccezione'}});
ok((await p.evaluate(()=>window.GanttApp.P.items.find(i=>i.name==='Armature').crew))===3,'valore non valido rifiutato (resta 3)');
// campo dettagli abilitato
await p.locator('#itemsBody .row[data-uid]',{hasText:'Armature'}).locator('.c-name .t').first().click();await W(200);
ok(!(await p.locator('#detailsBody [data-f="crew"]').isDisabled()),'campo Componenti abilitato su un task');
ok(!(await p.locator('#detailsBody [data-f="hours"]').isDisabled()),'campo Ore abilitato su un task');
await p.locator('#detailsBody [data-f="crew"]').fill('4');await p.locator('#detailsBody [data-f="crew"]').dispatchEvent('change');await W(200);
ok((await p.evaluate(()=>window.GanttApp.P.items.find(i=>i.name==='Armature').crew))===4,'Componenti modificabile dal pannello');
// colonne opzionali
await p.evaluate(()=>{const A=window.GanttApp;A.commit('t',q=>{q.view.shownColumns=['crew','deadline']})});await W(200);
ok(await p.locator('#itemsCols .c-crew').count()===1&&await p.locator('#itemsCols .c-deadline').count()===1,'colonne Comp. e Scadenza visibili su richiesta');
// ---- Attesa
await p.evaluate(()=>{const A=window.GanttApp;A.commit('t',q=>{const it=q.items.find(i=>i.name==='Casseri');A.core.setField(q,it.uid,'type','wait')})});await W(200);
const w=await p.evaluate(()=>{const A=window.GanttApp;const it=A.P.items.find(i=>i.name==='Casseri');return [it.type,it.assignee,A.core.canEdit(A.P,A.P.items.indexOf(it),'assignee'),A.core.assigneeReport(A.P).rows.some(r=>r.name==='Bianchi')]});
eq(w,['wait','',false,false],'Attesa: senza assegnatario, non modificabile, esclusa dal report');
ok(await p.locator('#tlCv .bar.wait').count()===1,'barra tratteggiata');
ok(await p.locator('#itemsBody .tdot.wdt').count()===1,'icona di attesa');
// ---- Scadenza
await p.locator('#itemsBody .row[data-uid]',{hasText:'Pilastri'}).locator('.c-name .t').first().click();await W(200);
await p.locator('#detailsBody [data-f="deadline"]').fill('01/12/26');await p.locator('#detailsBody [data-f="deadline"]').dispatchEvent('change');await W(250);
ok(await p.locator('#tlCv .dlm.late').count()===1,'segno rosso: fine prevista oltre la scadenza');
ok(await p.locator('#itemsBody .row',{hasText:'Pilastri'}).locator('.c-deadline.dlate').count()===1,'cella scadenza in evidenza');
ok((await p.locator('#status').textContent()).includes('1 scadenza superata'),'avviso nella barra di stato');
await p.locator('#detailsBody [data-f="deadline"]').fill('31/12/26');await p.locator('#detailsBody [data-f="deadline"]').dispatchEvent('change');await W(250);
ok(await p.locator('#tlCv .dlm.late').count()===0&&await p.locator('#tlCv .dlm').count()===1,'scadenza rispettata: segno neutro');
await p.locator('#detailsBody [data-f="deadline"]').fill('boh');await p.locator('#detailsBody [data-f="deadline"]').dispatchEvent('change');await W(250);
ok((await p.evaluate(()=>window.GanttApp.P.items.find(i=>i.name==='Pilastri').deadline))==='2026-12-31','scadenza non valida rifiutata');
// interruttore in Visualizza
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(200);
await p.locator('.pop .swrow',{hasText:'Scadenze sulla timeline'}).locator('.switch').click();await W(200);
ok(await p.locator('#tlCv .dlm').count()===0,'Scadenze nascoste da Visualizza');
await p.locator('.pop .swrow',{hasText:'Scadenze sulla timeline'}).locator('.switch').click();await W(150);
await p.keyboard.press('Escape');
// ---- Data inizio progetto
await p.locator('#tlCmds [data-act="calendar"]').click();await W(250);
ok(await p.locator('.pop .note',{hasText:'Automatica'}).count()===2,'modalità automatica descritta (inizio e fine)');
await p.locator('.pop .vrow',{hasText:'Modalità'}).first().locator('button',{hasText:'Manuale'}).click();await W(300);
ok((await p.evaluate(()=>window.GanttApp.P.calendar.projectStart))==='2026-11-23','manuale parte dalla data del primo task');
await p.locator('#calStart').fill('09/11/26');await p.locator('#calStart').dispatchEvent('change');await W(300);
const ex=await p.evaluate(()=>{const A=window.GanttApp;return [A.P.calendar.projectStart,A.core.fromDN(A.core.tlExtent?A.core.tlExtent(A.P).mn:0)]});
ok(ex[0]==='2026-11-09','data manuale salvata');
await p.keyboard.press('Escape');await W(100);
const mk=await p.evaluate(()=>{const A=window.GanttApp;const t=document.body.innerText;return t.includes('Inizio lavori')});ok(mk,'marker Inizio lavori presente');
await p.locator('#tlCmds [data-act="calendar"]').click();await W(250);
await p.locator('#calStart').fill('30/11/26');await p.locator('#calStart').dispatchEvent('change');await W(300);
ok(await p.locator('.pop .note.warn').count()===1,'avviso: item prima della data di inizio');
ok((await p.locator('#status').textContent()).includes('prima dell\'inizio progetto'),'avviso nella barra di stato');
await p.locator('.pop .vrow',{hasText:'Modalità'}).first().locator('button',{hasText:'Dal più precoce'}).click();await W(250);
ok((await p.evaluate(()=>window.GanttApp.P.calendar.projectStart))===null,'ritorno ad automatica');
await p.keyboard.press('Escape');
// ---- Percorso critico
const cp=await p.evaluate(()=>{const A=window.GanttApp,C=A.core;
  A.commit('crit',q=>{q.items.length=0;q.view.shownColumns=[];
   const mk=(n,s,d)=>{const it=C.newItem(n);q.items.push(it);C.setField(q,it.uid,'start',s);C.setField(q,it.uid,'dur',String(d));return it};
   const a=mk('A','23/11/26',2),bb=mk('B','07/12/26',2),c=mk('C','23/11/26',10);
   C.setField(q,bb.uid,'preds','1')});
  const out={};['visible','network'].forEach(m=>{A.commit('m',q=>{q.view.critMode=m});const r=C.criticalSet(A.P);out[m]=['A','B','C'].map(n=>!!r.uids[A.P.items.find(i=>i.name===n).uid])});return out});
eq(cp.visible,[false,true,false],'critico sulle date visibili: A con margine, B critico, C no');
eq(cp.network,[false,false,true],'critico sulla rete: C critico (B ricalcolato in anticipo)');
// predefinito
const dflt=await p.evaluate(()=>{const A=window.GanttApp;A.commit('m',q=>{delete q.view.critMode});return A.core.criticalSet(A.P).uids[A.P.items[1].uid]===1});ok(dflt,'predefinito: date visibili');
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(200);
ok(await p.locator('.pop .vrow',{hasText:'Calcolo critico'}).count()===1,'selettore del calcolo in Visualizza');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
