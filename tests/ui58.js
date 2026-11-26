const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1500,height:900}});const p=await c.newPage();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,x,m)=>ok(JSON.stringify(a)===JSON.stringify(x),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(x));
const W=t=>p.waitForTimeout(t);p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.accept()});
await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
// ---- Vai al giorno
await p.locator('#tlCmds [data-act="gotoDay"]').click();await W(250);
ok(await p.locator('.pop #gtFrom').count()===1&&await p.locator('.pop #gtTo').count()===1,'popover con i due campi data');
ok(await p.evaluate(()=>document.getElementById('gtFrom').type)==='date','calendario nativo');
// giorno singolo
await p.fill('#gtFrom','2026-12-10');await p.click('.pop [data-g="go"]');await W(400);
let g=await p.evaluate(()=>{const g=GanttApp.ui.geo,b=document.getElementById('tlBody');const t=Date.UTC(2026,11,10)/86400000;return {c:(b.scrollLeft+g.cw/2)/g.px+g.a,t,flash:document.querySelectorAll('.tgo').length,pop:!!document.querySelector('.pop')}});
ok(Math.abs(g.c-(g.t+0.5))<1.2,'giorno centrato '+JSON.stringify(g));ok(g.flash===1,'giorno evidenziato');ok(!g.pop,'popover chiuso');
// intervallo
await p.locator('#tlCmds [data-act="gotoDay"]').click();await W(250);
await p.fill('#gtFrom','2026-11-23');await p.fill('#gtTo','2026-12-04');await p.keyboard.press('Enter');await W(500);
g=await p.evaluate(()=>{const g=GanttApp.ui.geo,b=document.getElementById('tlBody');const a=Date.UTC(2026,10,23)/86400000,e=Date.UTC(2026,11,4)/86400000;const l=(a-g.a)*g.px-b.scrollLeft,r=(e+1-g.a)*g.px-b.scrollLeft;return {l,r,cw:g.cw,px:g.px,flash:document.querySelectorAll('.tgo').length}});
ok(g.l>=0&&g.r<=g.cw+1&&(g.r-g.l)>g.cw*0.8,'intervallo adattato alla vista '+JSON.stringify(g));ok(g.flash===1,'intervallo evidenziato');
// intervallo invertito
await p.locator('#tlCmds [data-act="gotoDay"]').click();await W(250);await p.fill('#gtFrom','2026-12-04');await p.fill('#gtTo','2026-11-23');await p.click('.pop [data-g="go"]');await W(400);
ok(await p.evaluate(()=>!document.querySelector('.pop')),'intervallo invertito accettato');
// vuoto: nessuna navigazione
await p.locator('#tlCmds [data-act="gotoDay"]').click();await W(250);await p.fill('#gtFrom','');await p.click('.pop [data-g="go"]');await W(300);
ok(await p.evaluate(()=>!!document.querySelector('.pop #gtFrom')),'campo vuoto: il popover resta aperto');await p.keyboard.press('Escape');
// ---- avviso modifiche non salvate con conteggio
await p.evaluate(()=>{const A=GanttApp;A.commit('Modifica uno',q=>{q.items[1].name='Uno';return 'ok'});A.commit('Modifica due',q=>{q.items[1].name='Due';return 'ok'})});
dlg.length=0;await p.evaluate(()=>GanttApp.act.loadExample());await W(300);
ok(dlg.length===1&&/Hai 2 modifiche non salvate/.test(dlg[0])&&/Modifica due/.test(dlg[0]),'avviso con conteggio e ultima modifica: '+dlg[0]);
// ---- Salva con nome: finestra
await p.evaluate(()=>{window.showSaveFilePicker=undefined});
await p.evaluate(()=>{const A=GanttApp;A.commit('Imposta avanzamento',q=>{q.items[4].progress=50;return 'ok'})});
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Sovrascrivi/.test(x.textContent));b.nextElementSibling.click()});await W(250);
await p.evaluate(()=>{const it=[...document.querySelectorAll('.menuitem')].find(x=>/Salva con nome/.test(x.textContent));it.click();});await W(300);
ok(await p.evaluate(()=>document.getElementById('dlgSaveAs').open),'finestra «Salva con nome» aperta dal menu');
ok(/Progetto «/.test(await p.textContent('#saInfo')),'riepilogo del progetto');
ok(await p.evaluate(()=>document.getElementById('saDer').hidden),'campi del derivato nascosti di default');
await p.click('#dlgSaveAs input[value="derive"]');await W(150);ok(await p.evaluate(()=>!document.getElementById('saDer').hidden),'scelta derivato: titolo e opzioni');
await p.fill('#saTitleIn','');await p.click('#saGo');await W(200);ok(await p.evaluate(()=>document.getElementById('dlgSaveAs').open),'titolo obbligatorio');
// derivato (download, senza File System API)
await p.fill('#saTitleIn','Progetto B');
const before=await p.evaluate(()=>({id:GanttApp.P.project.id,rev:GanttApp.P.rev}));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#saGo')]);await W(500);
ok(/Progetto_B|Progetto B/i.test(dl.suggestedFilename()),'nome file dal nuovo titolo: '+dl.suggestedFilename());
const after=await p.evaluate(()=>({id:GanttApp.P.project.id,title:GanttApp.P.project.title,rev:GanttApp.P.rev,log:GanttApp.P.revLog.length,state:GanttApp.P.revState,sc:GanttApp.P.saveCounter,prog:GanttApp.P.items.filter(i=>i.progress>0).length,bl:GanttApp.P.baselines.length,dirty:GanttApp.ui.dirty,undo:0,n:GanttApp.P.items.length}));
ok(after.id!==before.id&&after.title==='Progetto B','nuovo identificativo e titolo '+JSON.stringify(after));ok(after.rev===null&&after.log===0&&after.state==='draft'&&after.sc===1,'revisione e registro azzerati');
ok(after.prog===0&&after.bl===0,'avanzamento e baseline azzerati');ok(!after.dirty&&after.n===16,'righe conservate, stato salvato');
// copia: mantiene identità
await p.evaluate(()=>{const A=GanttApp;A.commit('x',q=>{q.items[4].progress=40;return 'ok'})});
const id2=await p.evaluate(()=>GanttApp.P.project.id);
const [dl2]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>GanttApp.act.saveFlow({mode:'saveas'}))]);await W(400);
ok(await p.evaluate(id=>GanttApp.P.project.id===id&&GanttApp.P.items.some(i=>i.progress===40),id2),'copia: identità e dati invariati');
console.log('pass',pass,'fail',fail);await b.close()})();
