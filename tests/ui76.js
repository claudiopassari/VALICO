// pannello Item: selezione ad area con Alt+trascina (giù: righe contenute, su: righe toccate, Maiusc aggiunge, Esc annulla); nome troncato con suggerimento
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false,tooltips:true}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const rect=n=>ev((n)=>{const r=document.querySelectorAll('#itemsBody .row[data-uid]')[n];const b=r.getBoundingClientRect();return {l:b.left,t:b.top,h:b.height}},n);
const sel=()=>ev(()=>GanttApp.ui.sel.length);
const r2=await rect(2),r6=await rect(6);
// giù: contenute. Parto a metà della riga 2 → le righe 3..5 sono contenute, la 2 e la 6 solo toccate
await p.keyboard.down('Alt');
await p.mouse.move(r2.l+150,r2.t+r2.h/2);await p.mouse.down();await p.mouse.move(r2.l+150,r6.t+r6.h/2,{steps:8});await p.mouse.up();await p.keyboard.up('Alt');await W(200);
let n=await sel();ok(n===3,'giù: 3 righe contenute (3..5; la 2 e la 6 sono solo toccate) → '+n);
// su: toccate
await p.keyboard.down('Alt');
await p.mouse.move(r6.l+150,r6.t+r6.h/2);await p.mouse.down();await p.mouse.move(r6.l+150,r2.t+r2.h/2,{steps:8});await p.mouse.up();await p.keyboard.up('Alt');await W(200);
n=await sel();ok(n===5,'su: 5 righe toccate (2..6) → '+n);
// Maiusc all'inizio: aggiunge
const r10=await rect(10),r11=await rect(11);
await p.keyboard.down('Shift');await p.keyboard.down('Alt');
await p.mouse.move(r10.l+150,r10.t-1);await p.mouse.down();await p.mouse.move(r11.l+150,r11.t+r11.h+1,{steps:6});await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Shift');await W(200);
n=await sel();ok(n===7,'Maiusc: aggiunge due righe (5+2) → '+n);
// Esc annulla
const before=n;await p.keyboard.down('Alt');
await p.mouse.move(r2.l+150,r2.t+2);await p.mouse.down();await p.mouse.move(r2.l+150,r6.t+r6.h,{steps:6});await p.keyboard.press('Escape');await p.mouse.up();await p.keyboard.up('Alt');await W(200);
n=await sel();ok(n===before,'Esc ripristina la selezione precedente ('+n+')');
// suggerimento sul nome troncato
await ev(()=>{GanttApp.commit('t',q=>{q.items[1].name='Nome molto lungo che non può stare nella colonna del pannello Item e viene quindi troncato con i puntini di sospensione'})});await W(300);
const nm=p.locator('#itemsBody .row[data-uid] .c-name').nth(1);await nm.hover();await W(900);
const tip=await ev(()=>{const t=document.querySelector('.tip.on,#tip.on');return t?t.textContent:''});
ok(/Nome molto lungo/.test(tip),'suggerimento con il nome completo: '+tip.slice(0,60));
const nm0=p.locator('#itemsBody .row[data-uid] .c-name').nth(2);await nm0.hover();await W(900);
const tip2=await ev(()=>{const t=document.querySelector('.tip.on,#tip.on');return t?t.textContent:''});
ok(!/Nome molto lungo/.test(tip2),'nome non troncato: nessun suggerimento col nome');
console.log('ui76 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
