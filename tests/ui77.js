// selettore data del pannello Item: trascinando da un giorno all'altro si scrivono inizio e fine; il clic singolo resta immediato
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const uid=await ev(()=>{const P=GanttApp.P;const it=P.items.find(x=>x.type==='task'&&!x.lockStart&&!x.lockEnd&&!x.preds);return it.uid});
const dates=()=>ev((u)=>{const it=GanttApp.P.items.find(x=>x.uid===u);return [it.start,it.end]},uid);
const open=async(col)=>{const row=p.locator('#itemsBody .row[data-uid="'+uid+'"]');await row.hover();await row.locator('.c[data-col="'+col+'"] .calb').click();await W(250)};
await open('start');
const days=p.locator('.calp .d:not(.o)');
const n=await days.count();ok(n>=28,'calendario aperto');
await days.nth(9).hover();await p.mouse.down();await days.nth(15).hover();await W(100);
const pv=await p.locator('.calp .d.pv').count();ok(pv===7,'anteprima di 7 giorni durante il trascinamento ('+pv+')');
const cnt=await p.locator('.calp .cnt').textContent();ok(/dal .* al /.test(cnt),'contatore: '+cnt.slice(0,60));
await p.mouse.up();await W(300);
const d1=await dates();
const[y,m]=await days.first().evaluate(e=>{const x=new Date(+e.getAttribute('data-dn')*86400000);return [x.getUTCFullYear(),x.getUTCMonth()]}).catch(()=>[0,0]);
ok(d1[0]&&d1[1]&&(Date.parse(d1[1])-Date.parse(d1[0]))/86400000===6,'inizio e fine scritti insieme: '+JSON.stringify(d1));
ok(await p.locator('.calp').count()===0,'il selettore si chiude');
// annulla: una sola operazione
await ev(()=>GanttApp.undo());await W(200);const d2=await dates();ok(JSON.stringify(d2)!==JSON.stringify(d1),'un solo annulla ripristina entrambe le date');
// clic singolo: immediato
await open('end');await p.locator('.calp .d:not(.o)').nth(20).click();await W(300);
const d3=await dates();ok(d3[1]&&d3[1]!==d2[1],'clic singolo sulla fine: immediato '+JSON.stringify(d3));
// trascinamento dalla parte opposta (verso sinistra)
await open('start');const dd=p.locator('.calp .d:not(.o)');await dd.nth(18).hover();await p.mouse.down();await dd.nth(12).hover();await p.mouse.up();await W(300);
const d4=await dates();ok((Date.parse(d4[1])-Date.parse(d4[0]))/86400000===6,'trascinamento verso sinistra: inizio < fine '+JSON.stringify(d4));
console.log('ui77 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
