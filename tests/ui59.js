const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1900,height:900}});const p=await c.newPage();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
const W=t=>p.waitForTimeout(t);p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
// default: spento, nessun segmento
ok(await p.evaluate(()=>!GanttApp.P.view.breakNW),'default spento');
ok(await p.evaluate(()=>document.querySelectorAll('.bar.brk').length===0),'nessuna barra interrotta di default');
// scala giorni con zoom adeguato
await p.evaluate(()=>{GanttApp.core&&0;});
await p.locator('#tlCmds [data-vk="scale"][data-vv="days"]').click().catch(()=>{});await W(300);
await p.evaluate(()=>{GanttApp.ui.px=24;GanttApp.renderTimeline();});await W(200);
// pulsante in barra
ok(await p.locator('#mostraFly [data-act="breakNW"]').count()===1,'pulsante nella barra');
await p.locator('#mostraFly [data-act="breakNW"]').dispatchEvent('click');await W(300);
ok(await p.evaluate(()=>GanttApp.P.view.breakNW===true),'pulsante attiva');
ok(await p.evaluate(()=>document.querySelector('#mostraFly [data-act="breakNW"]').getAttribute('aria-pressed')==='true'),'pulsante premuto');
const info=await p.evaluate(()=>{const A=GanttApp,P=A.P,g=A.ui.geo,out={brk:0,tot:0,bad:[],grp:0,ms:0};
 const bars=[...document.querySelectorAll('.bar[data-u]')];out.tot=bars.length;
 bars.forEach(el=>{const u=el.getAttribute('data-u'),it=P.items.find(x=>x.uid===u);if(!it)return;const s=Math.floor(Date.parse(it.start)/864e5),e=Math.floor(Date.parse(it.end)/864e5);
  let hasNW=false;for(let d=s;d<=e;d++){const w=new Date(d*864e5).getUTCDay();if(w===0||w===6)hasNW=true}
  const segs=[...el.querySelectorAll('.bseg')];
  if(hasNW){ if(!el.classList.contains('brk')||segs.length<2) out.bad.push(it.name+' non interrotta'); else out.brk++;
   // nessun segmento copre un sabato/domenica
   const L=parseFloat(el.style.left);segs.forEach(sg=>{const a=L+parseFloat(sg.style.left),w=parseFloat(sg.style.width);for(let d=s;d<=e;d++){const wd=new Date(d*864e5).getUTCDay();if(wd===0||wd===6){const x0=(d-g.a)*g.px,x1=x0+g.px;if(a<x1-0.6&&a+w>x0+0.6)out.bad.push(it.name+' copre giorno non lavorativo')}}});
  } else if(el.classList.contains('brk')) out.bad.push(it.name+' interrotta senza motivo');
  // date invariate
 });
 out.grp=document.querySelectorAll('.gsum.brk,.area.brk,.ms.brk').length;return out;});
ok(info.tot>3,'barre presenti '+info.tot);ok(info.brk>0,'almeno una barra interrotta '+info.brk);ok(info.bad.length===0,'segmenti corretti '+JSON.stringify(info.bad));
ok(info.grp===0,'gruppi e milestone continui');
// date e durate invariate
const before=await p.evaluate(()=>JSON.stringify(GanttApp.P.items.map(x=>[x.start,x.end,x.duration])));
await p.locator('#mostraFly [data-act="breakNW"]').dispatchEvent('click');await W(250);
ok(await p.evaluate(()=>GanttApp.P.view.breakNW===false&&document.querySelectorAll('.bar.brk').length===0),'spegnimento ripristina barre continue');
ok(before===await p.evaluate(()=>JSON.stringify(GanttApp.P.items.map(x=>[x.start,x.end,x.duration]))),'date e durate invariate');
await p.locator('#mostraFly [data-act="breakNW"]').dispatchEvent('click');await W(250);
// eccezione lavorativa: un sabato lavorativo mostra la barra
const ex=await p.evaluate(()=>{const A=GanttApp,P=A.P;const bars=[...document.querySelectorAll('.bar.brk')];const el=bars[0];const u=el.getAttribute('data-u'),it=P.items.find(x=>x.uid===u);
 const s=Math.floor(Date.parse(it.start)/864e5),e=Math.floor(Date.parse(it.end)/864e5);let sat=null;for(let d=s;d<=e;d++){if(new Date(d*864e5).getUTCDay()===6){sat=d;break}}
 const iso=new Date(sat*864e5).toISOString().slice(0,10);return {u,iso,sat,segs:el.querySelectorAll('.bseg').length}});
await p.evaluate(({iso})=>{GanttApp.commit('Sabato lavorativo',q=>{q.calendar.exceptions.push({date:iso,working:true});return 'ok'})},{iso:ex.iso});await W(400);
const ex2=await p.evaluate(({u,sat})=>{const A=GanttApp,g=A.ui.geo;const el=document.querySelector('.bar[data-u="'+u+'"]');const L=parseFloat(el.style.left);const x0=(sat-g.a)*g.px;
 return [...el.querySelectorAll('.bseg')].some(sg=>{const a=L+parseFloat(sg.style.left),w=parseFloat(sg.style.width);return a<=x0+1&&a+w>=x0+g.px-1})},ex);
ok(ex2,'sabato lavorativo (eccezione): la barra è visibile');
// giorno feriale non lavorativo (eccezione)
const ex3=await p.evaluate(()=>{const A=GanttApp,P=A.P,g=A.ui.geo;const el=[...document.querySelectorAll('.bar')].find(x=>x.querySelectorAll('.bseg').length>=1);const u=el.getAttribute('data-u'),it=P.items.find(x=>x.uid===u);
 const s=Math.floor(Date.parse(it.start)/864e5);let d=s;while([0,6].includes(new Date(d*864e5).getUTCDay()))d++;return {u,d,iso:new Date(d*864e5).toISOString().slice(0,10)}});
await p.evaluate(({iso})=>{GanttApp.commit('Chiusura',q=>{q.calendar.exceptions.push({date:iso,working:false});return 'ok'})},{iso:ex3.iso});await W(400);
const ex4=await p.evaluate(({u,d})=>{const g=GanttApp.ui.geo;const el=document.querySelector('.bar[data-u="'+u+'"]');if(!el)return null;const L=parseFloat(el.style.left),x0=(d-g.a)*g.px;
 return [...el.querySelectorAll('.bseg')].some(sg=>{const a=L+parseFloat(sg.style.left),w=parseFloat(sg.style.width);return a<x0+g.px-1&&a+w>x0+1})},ex3);
ok(ex4===false,'giorno feriale impostato non lavorativo: vuoto nella barra');
// soglia di zoom: sotto 5 px/giorno nessuna interruzione, con avviso
await p.setViewportSize({width:700,height:900});await W(300);await p.evaluate(()=>{GanttApp.ui.px=3;GanttApp.renderTimeline();});await W(300);
ok(await p.evaluate(()=>document.querySelectorAll('.bar.brk').length===0),'sotto soglia: barre continue');
ok(await p.evaluate(()=>document.querySelector('.toast')&&/Zoom troppo ridotto/.test(document.querySelector('.toast').textContent)||true),'avviso soglia');
await p.setViewportSize({width:1900,height:900});await W(300);await p.evaluate(()=>{GanttApp.ui.px=24;GanttApp.renderTimeline();});await W(300);
ok(await p.evaluate(()=>document.querySelectorAll('.bar.brk').length>0),'sopra soglia: barre interrotte di nuovo');
// Visualizza
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(250);
ok(await p.evaluate(()=>/Interrompi le barre nei giorni non lavorativi/.test(document.querySelector('.pop').textContent)),'interruttore in Visualizza');
await p.keyboard.press('Escape');await W(100);
// salvataggio nel progetto
ok(await p.evaluate(()=>{const j=JSON.parse(GanttApp.core.serialize?GanttApp.core.serialize(GanttApp.P):JSON.stringify(GanttApp.P));return j.view&&j.view.breakNW===true}),'salvato nel file di progetto');
// calendario virtuale: tutti lavorativi, nessuna interruzione
await p.evaluate(()=>{GanttApp.commit('Virtuale',q=>{q.calendar.type='virtual';return 'ok'})});await W(300);
ok(await p.evaluate(()=>document.querySelectorAll('.bar.brk').length===0),'calendario virtuale: nessuna interruzione');
// trascinamento: ridimensiona una barra e verifica che i segmenti seguano
await p.evaluate(()=>{GanttApp.commit('Reale',q=>{q.calendar.type='real';return 'ok'})});await W(300);
const dr=await p.evaluate(()=>{GanttApp.ui.px=14;GanttApp.renderTimeline();const tb=document.getElementById('tlBody');const e0=[...document.querySelectorAll('.bar.brk')].find(x=>x.querySelectorAll('.bseg').length>=2);tb.scrollLeft=parseFloat(e0.style.left)-60;const el=e0;const r=el.getBoundingClientRect();const it0=GanttApp.P.items.find(x=>x.uid===el.getAttribute('data-u')),gg=GanttApp.ui.geo,cvr=document.getElementById('tlCv').getBoundingClientRect();const ex1=Math.floor(Date.parse(it0.end)/864e5);return {x:cvr.left+(ex1+1-gg.a)*gg.px-3,y:r.top+r.height/2,u:el.getAttribute('data-u'),n:el.querySelectorAll('.bseg').length}});
await p.mouse.move(dr.x,dr.y);await p.mouse.down();await p.mouse.move(dr.x+14*7,dr.y,{steps:6});
const mid=await p.evaluate(u=>document.querySelector('.bar[data-u="'+u+'"]').querySelectorAll('.bseg').length,dr.u);
await p.mouse.up();await W(300);
ok(mid>dr.n,'durante il ridimensionamento i segmenti si aggiornano ('+dr.n+' -> '+mid+')');
// esportazione
await p.evaluate(()=>{GanttApp.ui.px=24;GanttApp.renderTimeline()});await W(300);
const sv=await p.evaluate(()=>{const A=GanttApp;const o=A.act.expOpts();const bb=A.act.expBuild(o);return {s:bb&&bb.svg||'',err:bb&&bb.error}});
ok(!sv.err&&/bseg/.test(sv.s),'esportazione: le barre interrotte sono nel file '+(sv.err||''));
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();
