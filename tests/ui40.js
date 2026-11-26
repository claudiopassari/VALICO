const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:2300,height:1200}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(400);const W=t=>p.waitForTimeout(t);
// 1 ordine e gruppi della barra timeline
const acts=await p.evaluate(()=>[...document.querySelectorAll('#tlCmds .tcap')].map(c=>[...c.children].map(e=>e.getAttribute('data-act')||'seg')));
console.log(JSON.stringify(acts));
ok(acts.length===6,'sei capsule: '+acts.length);
ok(JSON.stringify(acts[2])===JSON.stringify(['tlopts','calendar','todayHl','breakNW']),'ordine: Visualizza, Calendario, Evidenzia oggi, Interrompi barre');
ok(JSON.stringify(acts[5])===JSON.stringify(['baseline']),'Baseline isolata');
ok(await p.locator('#tlCmds .seg button',{hasText:'Estesa'}).count()===0,'Compatta/Estesa fuori dalla barra');
const bx=await p.evaluate(()=>{const g=document.querySelector('#tlCmds .vgap.far').getBoundingClientRect();return g.width});ok(bx>=18,'distanza della baseline: '+bx);
// icone distinte: marker, baseline, revisione
const ic=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s+' svg');return e?e.innerHTML:''};return [g('#tlCmds [data-act="mkList"]'),g('#tlCmds [data-act="baseline"]'),g('#hbtns .primary')]});
ok(new Set(ic).size===3&&ic.every(x=>x),'icone di marker, baseline e revisione distinte');
// 2 Visualizza: sezioni, gruppi, densità
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(200);
ok(await p.locator('.pop.pnl .vsec').count()===3,'tre sezioni');
const wv=await p.evaluate(()=>Math.round(document.querySelector('.pop').getBoundingClientRect().width));ok(wv===420,'larghezza pannello 420: '+wv);
ok(await p.locator('.pop .vrow',{hasText:'Gruppi'}).count()>=1&&await p.locator('.pop .vrow',{hasText:'Densità righe'}).count()===1,'Gruppi e densità in Visualizza');
await p.locator('.pop .vsh[data-sec="evi"]').click();await W(100);
ok(await p.locator('.pop .vsec:not(.open)').count()===1&&!(await p.locator('.pop .swrow',{hasText:'Attenua il passato'}).isVisible()),'sezione Evidenziazioni compressa');
// 3 trascinamento, x, Esc
const h3=p.locator('.pop h3').first();const bb=await h3.boundingBox();const before=await p.evaluate(()=>{const r=document.querySelector('.pop').getBoundingClientRect();return [r.left,r.top]});
await p.mouse.move(bb.x+30,bb.y+8);await p.mouse.down();await p.mouse.move(bb.x-120,bb.y+150,{steps:6});await p.mouse.up();await W(100);
const after=await p.evaluate(()=>{const r=document.querySelector('.pop').getBoundingClientRect();return [r.left,r.top]});
ok(Math.abs(after[0]-(before[0]-150))<4&&Math.abs(after[1]-(before[1]+142))<4,'pannello trascinato: '+JSON.stringify(before)+' → '+JSON.stringify(after));
// posizione conservata dopo una modifica (ricostruzione) e sezione compressa persistente
await p.locator('.pop .vrow',{hasText:'Densità righe'}).locator('button',{hasText:'Ampia'}).click();await W(300);
ok(await p.locator('.pop').count()===1,'pannello ancora aperto dopo la modifica');
const aft2=await p.evaluate(()=>{const r=document.querySelector('.pop').getBoundingClientRect();return [r.left,r.top]});ok(Math.abs(aft2[0]-after[0])<4&&Math.abs(aft2[1]-after[1])<4,'posizione conservata');
await p.keyboard.press('Escape');await W(100);ok(await p.locator('.pop').count()===0,'Esc chiude');
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(200);
const re=await p.evaluate(()=>{const r=document.querySelector('.pop').getBoundingClientRect();return [r.left,r.top]});ok(Math.abs(re[0]-before[0])<4&&Math.abs(re[1]-before[1])<4,'riapertura dal pulsante: '+JSON.stringify(re)+' vs '+JSON.stringify(before));
ok(await p.locator('.pop .vsec:not(.open)').count()===1,'sezione compressa ricordata');
await p.locator('.pop .pclose').click();await W(100);ok(await p.locator('.pop').count()===0,'x chiude');
await p.mouse.click(10,500);
await p.locator('[data-act="tlopts"]').click();await W(150);await p.mouse.click(10,500);await W(100);ok(await p.locator('.pop').count()===0,'clic fuori chiude ancora');
// 4 Aspetto senza densità; Guida con tastiera
await p.locator('[data-act="look"]').click();await W(200);
ok(!(await p.locator('.pop').textContent()).includes('Densità'),'densità tolta da Aspetto');
const wl=await p.evaluate(()=>Math.round(document.querySelector('.pop').getBoundingClientRect().width));ok(wl===580,'Aspetto resta a 580: '+wl);
await p.keyboard.press('Escape');await p.mouse.click(10,500);
await p.locator('[data-act="help"]').click();await W(200);
ok(await p.locator('.pop [data-act="scDlg"] svg').count()===1,'icona della voce Scorciatoie');
const wg=await p.evaluate(()=>Math.round(document.querySelector('.pop').getBoundingClientRect().width));ok(wg===420,'Guida 420: '+wg);
await p.keyboard.press('Escape');await p.mouse.click(10,500);
// 5 salvataggio automatico
ok(await p.locator('#autoBtn').count()===1,'pulsante accanto al pallino');
const pos=await p.evaluate(()=>{const a=document.querySelector('#autoBtn').getBoundingClientRect(),d=document.querySelector('#dirty').getBoundingClientRect();return a.left-d.right});ok(pos>=0&&pos<20,'accanto al pallino: '+pos);
await p.evaluate(()=>{window.showSaveFilePicker=window.showSaveFilePicker||function(){}});
await p.evaluate(()=>window.GanttApp&&0);
await p.locator('#autoBtn').click();await W(150);ok(await p.locator('#autoBtn.on').count()===1||await p.locator('#autoBtn').getAttribute('aria-pressed')==='true','attivazione dal pulsante');
await p.locator('[aria-label="Altre opzioni di salvataggio"]').click();await W(200);
ok(await p.locator('.pop .swrow',{hasText:'Salvataggio automatico'}).locator('.switch[aria-checked="true"]').count()===1,'interruttore sincronizzato');
await p.locator('.pop .vrow',{hasText:'Intervallo'}).locator('button',{hasText:'5 min'}).click();await W(150);
ok((await p.evaluate(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).autosaveMin))===5,'intervallo 5 minuti salvato');
ok((await p.locator('#autoBtn').getAttribute('data-tip')).includes('ogni 5 minuti'),'descrizione con intervallo');
await p.mouse.click(10,500);
// 6 barra stretta: nessun overflow orizzontale, menu «Altri comandi»
for(const w of [1300,1000,800]){await p.setViewportSize({width:w,height:800});await W(500);
 const ov=await p.evaluate(()=>{const b=document.querySelector('#tlCmds');return [b.scrollWidth,b.clientWidth,document.documentElement.scrollWidth,window.innerWidth]});
 ok(ov[0]<=ov[1]+1,'barra timeline senza overflow a '+w+': '+JSON.stringify(ov));ok(ov[2]<=ov[3]+1,'pagina senza scroll orizzontale a '+w);}
ok(await p.locator('#tlCmds .tlmore:visible').count()===1,'menu «Altri comandi» visibile a 800 px');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
