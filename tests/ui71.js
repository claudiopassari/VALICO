// esportazione: aree Inizio–fine lavori / Periodo / Intervallo, sempre da lunedì a domenica; colonne data strette
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
ok(await ev(()=>{const c=[...document.querySelectorAll('#itemsCols .c-start,#itemsCols [data-col="start"]')][0];return c?c.getBoundingClientRect().width:0})<=140,'colonna Inizio stretta');
ok(await ev(()=>{const g=GanttApp.ui.geo;return ((new Date(g.a*86400000)).getUTCDay())})===1,'la timeline parte di lunedì');
// periodo di prova
await ev(()=>GanttApp.commit('t',q=>{q.periods.push({uid:'pp1',name:'Fase prova',start:'2026-12-03',end:'2026-12-16',lane:0,color:{c:'blu',v:0}})}));await W(200);
await p.keyboard.press('Control+e').catch(()=>{});
await ev(()=>{const b=document.querySelector('[data-act="export"],#btnExport');if(b)b.click()});await W(500);
ok(await p.locator('#dlgExp').isVisible(),'dialogo di esportazione aperto');
const sel=async(v)=>{await p.locator('#dlgExp .xseg [data-v="'+v+'"]').first().click();await W(250)};
const dim=()=>ev(()=>{const i=document.querySelector('#expPrev img,#expPrev canvas,#expPrev svg');return i?{w:i.naturalWidth||i.width||i.getBoundingClientRect().width}:null});
await sel('active');ok(await p.locator('#expPer').isHidden(),'selettore periodo nascosto con Inizio–fine lavori');
await sel('period');await W(400);
ok(await p.locator('#expPer').isVisible(),'selettore periodo visibile');
ok(await p.locator('#expPer option').count()>=1,'periodi elencati');
await p.selectOption('#expPer','pp1');await W(500);
const msg=await ev(()=>{const m=document.querySelector('#dlgExp .xmsg');return m?m.textContent:''});
ok(!/non valido|Seleziona/.test(msg),'nessun errore con periodo: '+msg);
const wd=d=>new Date(d*86400000).getUTCDay();
const rng=(extra)=>ev((ex)=>{const o=GanttApp.act.expOpts();Object.assign(o,ex);const x=GanttApp.act.expBuild(o);return x&&x.meta?{d0:x.meta.d0,d1:x.meta.d1,err:x.error||null}:{err:x&&x.error||'nulla'}},extra);
const mon=(r,m)=>ok(r.d0!==undefined&&wd(r.d0)===1&&wd(r.d1)===0,m+' lunedì→domenica '+JSON.stringify(r));
let q;
q=await rng({area:'all',layout:'standard'});mon(q,'Tutta');
q=await rng({area:'active',layout:'standard'});mon(q,'Inizio–fine lavori');
q=await rng({area:'period',period:'pp1',layout:'standard'});mon(q,'Periodo');
const dd=s=>Math.round(Date.parse(s+'T00:00:00Z')/86400000);
ok(q.d0<=dd('2026-12-03')&&q.d1>=dd('2026-12-16')&&q.d0>dd('2026-12-03')-7&&q.d1<dd('2026-12-16')+7,'periodo contenuto con al più una settimana di margine per lato');
q=await rng({area:'custom',from:'2026-12-02',to:'2026-12-10',layout:'standard'});mon(q,'Intervallo');
ok(q.d0===dd('2026-11-30')&&q.d1===dd('2026-12-13'),'Intervallo 2–10 dic → 30 nov–13 dic '+JSON.stringify(q));
q=await rng({area:'period',period:'',layout:'standard'});ok(q.d0!==undefined,'periodo vuoto → primo periodo');
// layout nativi
for(const L of ['perphase','lanes','phases']){
  const o=await ev((L)=>{const o=GanttApp.act.expOpts();o.layout=L;o.area='period';o.period='pp1';const x=GanttApp.act.expBuild(o);return x&&x.svg?{ok:1}:{err:x&&x.error}},L);
  ok(o.ok||/Nessun item|Seleziona/.test(o.err||''),'layout '+L+' accetta area Periodo: '+JSON.stringify(o));
}
console.log('ui71 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');
await b.close()})();
