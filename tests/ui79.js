// colonne dell'elenco: ordine modificabile dal pannello (trascinamento e Alt+↑/↓), Nome sempre prima, ripristino, gruppo Carico di lavoro
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1900,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const heads=()=>ev(()=>[...document.querySelectorAll('#itemsCols .c[data-hcol]')].map(e=>e.getAttribute('data-hcol')));
const openCols=async()=>{await p.click('[data-act="columns"],#btnCols,.icmds [data-act="columns"]').catch(async()=>{await ev(()=>{const b=document.querySelector('[data-act="cols"],[data-act="columns"]');if(b)b.click()})});await W(300)};
let h0=await heads();ok(h0[0]==='name','Nome prima: '+h0.join(','));
await openCols();
ok(await p.locator('.pop .cgrip').count()>=5,'maniglie nel pannello colonne');
// Carico di lavoro
await p.locator('.pop [data-act="loadCols"]').click();await W(300);
let h1=await heads();ok(['dur','hours','crew','manh'].every(x=>h1.includes(x)),'Carico di lavoro mostra dur/hours/crew/manh: '+h1.join(','));
// riordino con la tastiera: porta «crew» prima di «hours»
await openCols();
const grip=p.locator('.pop .swrow[data-col="crew"] .cgrip');await grip.focus();
const ixBefore=(await heads()).indexOf('crew');
await p.keyboard.press('Alt+ArrowUp');await W(300);
let h2=await heads();ok(h2.indexOf('crew')<ixBefore,'Alt+↑ sposta Persone a sinistra: '+h2.join(','));
ok(await ev(()=>Array.isArray(GanttApp.P.view.colOrder)),'ordine salvato nel progetto');
// trascinamento col mouse: porta «dur» in fondo al gruppo
const grip2=p.locator('.pop .swrow[data-col="dur"] .cgrip');const bx=await grip2.boundingBox();
const rowsN=await p.locator('.pop .swrow').count();
const last=await p.locator('.pop .swrow').nth(rowsN-1).boundingBox();
await p.mouse.move(bx.x+6,bx.y+6);await p.mouse.down();await p.mouse.move(bx.x+6,bx.y+120,{steps:8});await p.mouse.up();await W(300);
let h3=await heads();ok(h3.indexOf('dur')!==h2.indexOf('dur'),'trascinamento cambia la posizione di Durata: '+h3.join(','));
ok(h3[0]==='name','Nome resta prima');
// ripristino
await openCols();await p.locator('.pop [data-act="resetOrd"]').click();await W(300);
let h4=await heads();ok(h4.indexOf('dur')<h4.indexOf('hours'),'ordine predefinito ripristinato: '+h4.join(','));
// valori rapidi dal menu contestuale (Persone = 3 su una riga attività)
await ev(()=>{const r=GanttApp.P.items.findIndex(i=>i.type==='task');GanttApp.ui.sel=[GanttApp.P.items[r].uid];window.__u=GanttApp.P.items[r].uid});
await ev(()=>GanttApp.render());await W(200);
await p.locator('#itemsBody .row[data-uid="'+await ev(()=>window.__u)+'"] .c-crew').click({button:'right'});await W(250);
await p.locator('.cmenu .menuitem:has-text("Persone: 3")').click();await W(250);
ok(await ev(()=>GanttApp.P.items.find(i=>i.uid===window.__u).crew)==3,'valore rapido Persone: 3');
ok(await ev(()=>{const m=GanttApp.act.expBuild;return typeof m==='function'}),'expBuild presente');
console.log('ui79 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
