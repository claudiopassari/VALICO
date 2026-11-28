// selezione ad area additiva: Ctrl+Alt+trascina su zone vuote aggiunge all'area già selezionata
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1900,height:1100}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const rect=nm=>ev(n=>{const u=GanttApp.P.items.find(i=>i.name===n).uid;const e=document.querySelector('#tlCv .bar[data-u="'+u+'"],#tlCv .ms[data-u="'+u+'"]');const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom}},nm);
const names=()=>ev(()=>GanttApp.ui.sel.map(u=>GanttApp.P.items.find(i=>i.uid===u).name).sort());
async function area(nm,mods){const r=await rect(nm);for(const m of mods)await p.keyboard.down(m);
 await p.mouse.move(r.l-34,r.t-3);await p.mouse.down();await p.mouse.move(r.r+34,r.b+3,{steps:8});await p.mouse.up();for(const m of mods.reverse())await p.keyboard.up(m);await W(250);}
await area('Imbiancatura delle pareti',['Alt']);
let s1=await names();ok(s1.length===1&&s1[0]==='Imbiancatura delle pareti','prima area: '+JSON.stringify(s1));
await area('Ordine dei materiali',['Alt']);
let s2=await names();ok(s2.length===1&&s2[0]==='Ordine dei materiali','senza Ctrl sostituisce: '+JSON.stringify(s2));
await area('Imbiancatura delle pareti',['Control','Alt']);
let s3=await names();ok(s3.length===2&&s3.includes('Ordine dei materiali')&&s3.includes('Imbiancatura delle pareti'),'Ctrl+Alt aggiunge in un\'altra zona: '+JSON.stringify(s3));
await area('Montaggio degli arredi',['Control','Alt']);
let s4=await names();ok(s4.length===3,'terza zona: '+JSON.stringify(s4));
ok(await ev(()=>GanttApp.P.items.length)===16,'nessuna barra duplicata dal gesto');
// righe del pannello Item: Alt+Ctrl+trascina aggiunge
await ev(()=>{GanttApp.ui.sel=[];GanttApp.render()});await W(200);
const rows=await ev(()=>[...document.querySelectorAll('#itemsBody .row[data-uid]')].slice(0,12).map(r=>{const b=r.getBoundingClientRect();return {y:b.top,h:b.height,x:b.left+b.width*0.6}}));
await p.keyboard.down('Alt');await p.mouse.move(rows[1].x,rows[1].y-2);await p.mouse.down();await p.mouse.move(rows[2].x,rows[2].y+rows[2].h+2,{steps:5});await p.mouse.up();await p.keyboard.up('Alt');await W(200);
const n1=await ev(()=>GanttApp.ui.sel.length);
await p.keyboard.down('Control');await p.keyboard.down('Alt');await p.mouse.move(rows[7].x,rows[7].y-2);await p.mouse.down();await p.mouse.move(rows[8].x,rows[8].y+rows[8].h+2,{steps:5});await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Control');await W(200);
const n2=await ev(()=>GanttApp.ui.sel.length);
ok(n1>=1&&n2>n1,'righe: la seconda area si aggiunge ('+n1+' -> '+n2+')');
console.log('ui82 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
