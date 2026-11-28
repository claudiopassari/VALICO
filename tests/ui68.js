// estensione di un'indicazione (intervallo): feedback grafico durante il trascinamento dei bordi
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>{GanttApp.commit('t',q=>{q.items=[];const g=GanttApp.core.newItem('Gruppo');const i=GanttApp.core.newItem('Assenza recinzione');i.level=2;i.type='indication';const a=GanttApp.core.newItem('Attivita');a.level=2;q.items.push(g,i,a);GanttApp.core.opBarRange(q,i.uid,'2026-12-03','2026-12-18');GanttApp.core.opBarRange(q,a.uid,'2026-12-03','2026-12-08')})});await W(400);
const u=await ev(()=>GanttApp.P.items[1].uid);
const geo=()=>ev(u=>{const e=document.querySelector('#tlBody .ind[data-u="'+u+'"]'),r=e.getBoundingClientRect();return {l:r.left,r:r.right,y:r.top+r.height/2,w:r.width}},u);
const g0=await geo();
// afferra il bordo destro e trascina di 120 px senza rilasciare
await p.mouse.move(g0.r-2,g0.y);await p.mouse.down();await p.mouse.move(g0.r+60,g0.y,{steps:6});await p.mouse.move(g0.r+120,g0.y,{steps:6});await W(100);
const g1=await geo();
ok(g1.w>g0.w+80,'durante il trascinamento l\'indicazione si allunga '+JSON.stringify([g0.w,g1.w]));
const lab=await ev(u=>{const l=document.querySelector('#tlBody .blab[data-u="'+u+'"]');return l?l.getBoundingClientRect().right:0},u);
ok(lab>0,'etichetta presente durante il trascinamento');
await p.mouse.up();await W(300);
const e1=await ev(()=>GanttApp.P.items[1].end);ok(e1>'2026-12-18','l\'estensione è applicata al rilascio '+e1);
eq(await ev(()=>GanttApp.P.items[0].end),e1,'il gruppo segue l\'estensione');
// bordo sinistro
const g2=await geo();
await p.mouse.move(g2.l+2,g2.y);await p.mouse.down();await p.mouse.move(g2.l-40,g2.y,{steps:5});await W(100);
const g3=await geo();ok(g3.l<g2.l-25,'bordo sinistro: anteprima durante il trascinamento '+JSON.stringify([g2.l,g3.l]));
await p.mouse.up();await W(250);
ok(await ev(()=>GanttApp.P.items[1].start)<'2026-12-03','estensione a sinistra applicata');
console.log('ui68 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');
await b.close()})();
