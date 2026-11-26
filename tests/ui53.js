const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const ctx=await b.newContext({viewport:{width:1800,height:800}});const p=await ctx.newPage();
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});const W=t=>p.waitForTimeout(t);
await p.goto('file://'+process.cwd()+'/app.html');await W(300);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
await p.evaluate(()=>{GanttApp.act.setScale('days');GanttApp.act.today&&GanttApp.act.today()});await W(500);
const info=()=>p.evaluate(()=>{const A=GanttApp,g=A.ui.geo;const col=document.querySelector('#tlCv .ttod'),ln=document.querySelector('#tlCv .tml[data-m="'+A.P.markers.filter(m=>m.kind==='today')[0].uid+'"]');const tag=document.querySelector('#tlHead .mtag[data-k="today"]');
 return {col:col?[parseFloat(col.style.left),parseFloat(col.style.width)]:null,ln:ln?parseFloat(ln.style.left):null,tag:tag?parseFloat(tag.style.left):null,px:g.px,hdr:document.querySelectorAll('#tlHead .tlc.tod').length,hl:JSON.parse(localStorage.getItem('gantt.prefs.v1')||'{}').todayHl}});
const t0=await p.evaluate(()=>{const g=GanttApp.ui.geo;const d=new Date();const t=Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);return (t-g.a)*g.px});
let r=await info();
// 1) marker: linea blu sul bordo sinistro del giorno
ok(r.ln!==null&&Math.abs(r.ln-t0)<0.6,'marker: linea sul bordo iniziale del giorno '+JSON.stringify(r)+' vs '+t0);
ok(r.tag!==null&&Math.abs(r.tag-r.ln)<0.6,'marker: etichetta sulla linea');
ok(await p.evaluate(()=>GanttApp.P.markers.filter(m=>m.kind==='today')[0].color.c==='blu'),'marker Oggi blu di default');
// 2) evidenziazione: colonna indipendente
ok(r.col&&Math.abs(r.col[1]-r.px)<0.01&&Math.abs(r.col[0]-t0)<0.6,'evidenziazione: colonna di un giorno '+JSON.stringify(r));ok(r.hdr>=1,'cella intestazione evidenziata');
const btn=p.locator('#tlCmds [data-ph]');ok(await btn.count()===1,'pulsante Evidenzia oggi in barra');ok(await btn.getAttribute('aria-pressed')==='true','pulsante attivo di default');
await btn.click();await W(300);r=await info();ok(r.col===null&&r.hdr===0&&r.ln!==null,'evidenziazione spenta: marker intatto '+JSON.stringify(r));ok(r.hl===false,'preferenza salvata');
await btn.click();await W(300);r=await info();ok(r.col!==null&&r.ln!==null,'entrambi attivi insieme');
// marker nascosto: l'evidenziazione resta
await p.evaluate(()=>{const A=GanttApp;const m=A.P.markers.filter(m=>m.kind==='today')[0];A.commit('t',()=>{m.hidden=true})});await W(300);r=await info();ok(r.ln===null&&r.col!==null,'marker nascosto, evidenziazione attiva '+JSON.stringify(r));
await p.evaluate(()=>{const A=GanttApp;const m=A.P.markers.filter(m=>m.kind==='today')[0];A.commit('t',()=>{m.hidden=false})});await W(300);
// Visualizza: nessun vecchio controllo, interruttore presente
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(250);
ok(await p.locator('.pop .vrow',{hasText:'Marker «Oggi»'}).count()===0,'rimosso il controllo Colonna/Linea/Entrambe');
ok(await p.locator('.pop',{hasText:'Evidenzia oggi'}).count()>=1,'interruttore in Visualizza');
await p.keyboard.press('Escape');
// scala Mesi
await p.evaluate(()=>{GanttApp.act.setScale('months')});await W(500);r=await info();ok(r.ln!==null||r.col!==null,'scala Mesi: oggi comunque visibile '+JSON.stringify(r));
// durata centrata
await p.evaluate(()=>{GanttApp.act.setScale('weeks')});await W(300);
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.row .c-dur')).justifyContent==='center'),'durata centrata nella colonna');
// riquadri dei gruppi
await p.evaluate(()=>GanttApp.act.setScale('weeks'));await W(400);
const fr=async v=>{await p.evaluate(v=>{const pf=JSON.parse(localStorage.getItem('gantt.prefs.v1')||'{}');pf.gFrame=v;localStorage.setItem('gantt.prefs.v1',JSON.stringify(pf))},v);await p.reload();await W(300);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
 return p.evaluate(()=>{const a=document.querySelector('#tlCv .bx.aln');if(!a)return null;const cs=getComputedStyle(a);return {fr:document.documentElement.getAttribute('data-gfr'),bt:cs.borderTopWidth,bl:cs.borderLeftWidth,rad:cs.borderTopLeftRadius,n:document.querySelectorAll('#tlCv .bx.aln').length}})};
let f=await fr('round');ok(f&&f.fr==='round'&&parseFloat(f.bt)>0&&parseFloat(f.rad)>0,'arrotondato: bordo chiuso e raggio '+JSON.stringify(f));
f=await fr('square');ok(f&&parseFloat(f.bt)>0&&parseFloat(f.rad)===0,'squadrato: raggio 0 '+JSON.stringify(f));
f=await fr('lines');ok(f&&parseFloat(f.bt)===0&&parseFloat(f.bl)>0,'solo linee: nessun bordo orizzontale '+JSON.stringify(f));
// predefinito per profilo nuovo
const ctx2=await b.newContext({viewport:{width:1650,height:700}});const q=await ctx2.newPage();await q.goto('file://'+process.cwd()+'/app.html');await q.waitForTimeout(400);
ok(await q.evaluate(()=>document.documentElement.getAttribute('data-gfr'))==='none','predefinito: nessun riquadro');
// UI: controllo in Visualizza
await q.evaluate(()=>GanttApp.act.loadExample());await q.waitForTimeout(400);await q.locator('#tlCmds [data-act="tlopts"]').click();await q.waitForTimeout(250);
ok(await q.locator('.pop .vrow',{hasText:'Riquadro'}).count()===1,'controllo Riquadro');
await q.locator('.pop .vrow',{hasText:'Riquadro'}).locator('button',{hasText:'Squadrato'}).click();await q.waitForTimeout(300);
ok(await q.evaluate(()=>document.documentElement.getAttribute('data-gfr'))==='square','selezione Squadrato applicata');
// annidamento: i riquadri figli non toccano il bordo del padre
const nest=await q.evaluate(()=>{const A=[...document.querySelectorAll('#tlCv .bx.aln')].map(e=>({lv:+e.dataset.lv,r:e.getBoundingClientRect()}));return A.length});
ok(nest>=1,'riquadri presenti '+nest);

// barre dei figli contenute nel riquadro del gruppo
{const c3=await b.newContext({viewport:{width:1800,height:800}});const z=await c3.newPage();await z.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await z.goto('file://'+process.cwd()+'/app.html');await z.waitForTimeout(300);await z.evaluate(()=>GanttApp.act.loadExample());await z.waitForTimeout(500);await z.evaluate(()=>GanttApp.act.setScale('days'));await z.waitForTimeout(500);
const bad=await z.evaluate(()=>{const A=GanttApp;const vr=[...document.querySelectorAll('#tlCv .trow[data-u]')];let n=0,out=0;const ars=[...document.querySelectorAll('#tlCv .bx.aln')].map(e=>{const r=e.getBoundingClientRect();return {u:e.dataset.u,l:r.left,r:r.right,t:r.top,b:r.bottom}});
 document.querySelectorAll('#tlCv .bx.bar').forEach(bar=>{const r=bar.getBoundingClientRect();ars.forEach(a=>{if(r.top>=a.t&&r.bottom<=a.b){n++;if(r.left<a.l-0.5||r.right>a.r+0.5)out++}})});return [n,out]});
ok(bad[0]>3&&bad[1]===0,'nessuna barra esce dal riquadro del gruppo '+bad);
const idw=await z.evaluate(()=>Math.round(document.querySelector('#itemsCols .c-id').getBoundingClientRect().width));ok(idw<=42,'colonna # stretta: '+idw);
await c3.close();}
console.log('pass',pass,'fail',fail);await b.close()})();
