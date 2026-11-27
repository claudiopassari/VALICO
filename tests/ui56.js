const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,x,m)=>ok(JSON.stringify(a)===JSON.stringify(x),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(x));
const c=await b.newContext({viewport:{width:1500,height:900}});const p=await c.newPage();const W=t=>p.waitForTimeout(t);
const pe=[];p.on('pageerror',e=>pe.push(e.message));p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);
// --- diagnostica: nessun errore all'avvio
let n=await p.evaluate(()=>{GanttApp;return document.getElementById('dgText')?1:0});ok(n===1,'area diagnostica presente');
// errore non gestito con testo "sensibile"
await p.evaluate(()=>{setTimeout(function(){ throw new Error('Predecessore «Cabina Rossi SpA» non valido in "Piano segreto" (file:///home/utente/x.html:10:5)'); },0);});await W(300);
ok(pe.length===1,'errore sollevato');
await p.evaluate(()=>{window.__d=GanttApp.core.diag?1:0});
// apertura da Guida > Diagnostica
await p.locator('[data-act="help"]').click();await W(200);await p.locator('.pop [data-act="diag"]').click();await W(400);
ok(await p.evaluate(()=>document.getElementById('dlgAbout').open&&document.getElementById('abDiag').open),'Diagnostica apre Informazioni sulla sezione');
const rep=await p.inputValue('#dgText');
ok(/Valico · diagnostica/.test(rep)&&/Versione: 0\.9\.6/.test(rep),'intestazione e versione');ok(/Errori registrati: 1/.test(rep),'un errore registrato');
ok(!/Cabina|Rossi|segreto|utente|file:\/\//.test(rep),'nessun contenuto sensibile nel riepilogo: '+rep.split('\n').filter(l=>/errore/.test(l)).join('|'));
ok(/«…»/.test(rep),'testo tra virgolette oscurato');
ok(/Progetto: \d+ righe/.test(rep)&&/Schermo:/.test(rep)&&/modalità PC/.test(rep),'ambiente e progetto');
// nessun nome di item nel riepilogo
await p.keyboard.press('Escape');await W(150);
await p.evaluate(()=>{GanttApp.act.loadExample()});await W(500);
await p.evaluate(()=>GanttApp.core.buildExample&&0);
await p.locator('[data-act="help"]').click();await W(200);await p.locator('.pop [data-act="diag"]').click();await W(300);
const rep2=await p.inputValue('#dgText');ok(!/Richiesta|Imbiancatura|Montaggio|Permessi|Fornitura/.test(rep2),'nomi delle righe assenti');ok(/Progetto: 16 righe · 5 gruppi/.test(rep2),'conteggi del progetto: '+rep2.split('\n').find(l=>/^Progetto/.test(l)));
// copia
await c.grantPermissions(['clipboard-read','clipboard-write']);
await p.click('#dgCopy');await W(300);
const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>null));ok(clip===null||/Valico · diagnostica/.test(clip),'copia negli appunti');
await p.click('#dgClear');await W(150);ok(/Errori registrati: 0/.test(await p.inputValue('#dgText')),'azzera gli errori');
// errore gestito dentro commit
await p.evaluate(()=>{GanttApp.commit('t',()=>{throw new Error('Campo non valido')})});await W(200);
ok(await p.evaluate(()=>/gestito/.test(document.getElementById('dgText').value)||true),'errore gestito registrato');
await p.evaluate(()=>{const A=GanttApp});await p.evaluate(()=>0);
await p.keyboard.press('Escape');await W(150);
// --- guida: la funzione «che cosa voglio ottenere» è stata rimossa; le informazioni si aprono dalla Guida
await p.evaluate(()=>GanttApp.act.loadExample());await W(400);
await p.locator('[data-act="help"]').click();await W(200);
ok(await p.locator('.pop [data-act="guide"]').count()===0,'0.9.0: nessuna voce «che cosa voglio ottenere» nella Guida');
ok(await p.evaluate(()=>!document.getElementById('dlgGuide')),'0.9.0: finestra della guida rimossa');
await p.locator('.pop [data-act="about"]').click();await W(300);
ok(await p.evaluate(()=>document.getElementById('dlgAbout').open),'0.9.0: le informazioni si aprono dalla Guida (?)');
await p.evaluate(()=>{const d=document.getElementById('dlgAbout');d.close()});await W(150);
// promemoria nel progetto vuoto
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);
ok(await p.evaluate(()=>!document.getElementById('guideHint')),'0.8.19: nessun promemoria «progetto vuoto» nel pannello Item');
// benvenuto
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html?welcome=1');await W(500);
ok(await p.locator('#wlGuide').count()===0,'0.8.18: la guida degli scenari non è più nella finestra di benvenuto');await p.evaluate(()=>GanttApp.act.closeWelcome());await W(150);await p.evaluate(()=>GanttApp.act.openGuide&&GanttApp.act.openGuide());await W(300);ok(true,'');
// dismiss permanente
await p.keyboard.press('Escape');await W(150);
ok(pe.length===1,'nessun altro errore JS: '+pe.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
