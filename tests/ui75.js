// margini dell'esportazione: lunedì precedente se la prima barra parte di lunedì; domenica successiva se l'ultimo elemento termina di domenica
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(400);
const dd=s=>Math.round(Date.parse(s+'T00:00:00Z')/86400000);
const wd=d=>new Date(d*86400000).getUTCDay();
const setp=async(s,e,s2,e2)=>{await ev(([s,e,s2,e2])=>{GanttApp.commit('t',q=>{const t=q.items.find(x=>x.type==='task');const base=JSON.parse(JSON.stringify(t));
 base.level=0;base.name='A';base.start=s;base.end=e;base.preds='';base.lockStart=false;base.lockEnd=false;base.hidden=false;
 const c2=JSON.parse(JSON.stringify(base));c2.uid='u2x'+Math.random().toString(36).slice(2,8);c2.name='B';c2.start=s2;c2.end=e2;base.uid='u1x'+Math.random().toString(36).slice(2,8);
 q.items=[base,c2];q.calendar.projectStart='';q.calendar.projectEnd='';q.markers=(q.markers||[]).filter(m=>m.kind!=='custom');q.periods=[]});GanttApp.act.setScale('days')},[s,e,s2,e2]);await W(500)};
const rng=()=>ev(()=>{const o=GanttApp.act.expOpts();o.area='active';o.layout='standard';const x=GanttApp.act.expBuild(o);return x&&x.meta?{d0:x.meta.d0,d1:x.meta.d1}:{err:x&&x.error}});
// caso 1: inizio di lunedì, fine di sabato
await setp('2026-12-07','2026-12-09','2026-12-10','2026-12-12');
let r=await rng();
ok(r.d0===dd('2026-11-30'),'prima barra di lunedì → lunedì precedente '+JSON.stringify(r));
ok(wd(r.d1)===0&&r.d1>=dd('2026-12-13')&&r.d1<=dd('2026-12-20'),'fine alla domenica di quella settimana (o successiva se l\'etichetta sconfina) '+JSON.stringify(r));
// caso 2: inizio di mercoledì
await setp('2026-12-09','2026-12-10','2026-12-11','2026-12-13');
r=await rng();
ok(r.d0===dd('2026-12-07'),'prima barra di mercoledì → lunedì della stessa settimana '+JSON.stringify(r));
ok(wd(r.d1)===0&&r.d1===dd('2026-12-20'),'ultimo elemento termina di domenica → domenica successiva '+JSON.stringify(r));
// caso 3: periodo oltre l'ultima barra
await ev(()=>{GanttApp.commit('t',q=>{q.periods=[{uid:'pz1',name:'P',start:'2026-12-14',end:'2026-12-23',lane:0,color:{c:'blu',v:0}}]})});await W(400);
r=await rng();ok(r.d1>=dd('2026-12-27')&&wd(r.d1)===0,'il periodo oltre le barre estende la fine '+JSON.stringify(r));
console.log('ui75 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
