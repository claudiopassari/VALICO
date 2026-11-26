const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const ctx=await b.newContext({viewport:{width:1700,height:950},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
const net=[];p.on('request',r=>{const u=r.url();if(!/^(file|data|blob|about):/.test(u))net.push(u)});
const W=t=>p.waitForTimeout(t);const url='file://'+process.cwd()+'/app.html';
await p.goto(url+'?welcome=1');await W(700);
const dlg=p.locator('#dlgWelcome');
ok(await dlg.evaluate(d=>d.open),'benvenuto aperto');
const txt=await dlg.textContent();
['Nessun account','Nessuna registrazione','Nessuna raccolta di dati','Funziona sul tuo computer','Un solo file, senza installazione'].forEach(t=>ok(txt.includes(t),'striscia: '+t));
const titles=await p.evaluate(()=>[...document.querySelectorAll('#wlTrack .wl-card h4')].map(h=>h.textContent));
console.log(JSON.stringify(titles));
ok(titles.length===7,'sette schede');
['Disegna e annota','Gruppi leggibili','Controlla il piano','Calendari su misura','Progetti in file e revisioni','Esporta e copia','Personalizza'].forEach(t=>ok(titles.indexOf(t)>=0,'scheda: '+t));
ok(await p.locator('#wlTrack .wl-card svg.wl-ani').count()===7,'un\'animazione per scheda');
// carosello
ok(await p.locator('#wlPrev').isDisabled(),'indietro disattivato all\'inizio');
const sc0=await p.evaluate(()=>document.getElementById('wlTrack').scrollLeft);
await p.locator('#wlNext').click();await W(900);
const sc1=await p.evaluate(()=>document.getElementById('wlTrack').scrollLeft);ok(sc1>sc0+100,'avanti scorre: '+sc0+' -> '+sc1);
ok(!(await p.locator('#wlPrev').isDisabled()),'indietro attivo dopo lo scorrimento');
for(let i=0;i<8;i++){ if(await p.locator('#wlNext').isDisabled())break; await p.locator('#wlNext').click();await W(600);}
ok(await p.locator('#wlNext').isDisabled(),'avanti disattivato alla fine');
await p.locator('#wlPrev').click();await W(800);ok((await p.evaluate(()=>document.getElementById('wlTrack').scrollLeft))>0&&!(await p.locator('#wlNext').isDisabled()),'indietro funziona');
// tastiera
await p.locator('#wlTrack').focus();await p.keyboard.press('Home');await W(200);
// nome e icona chiusi
ok(!(await p.evaluate(()=>document.getElementById('wlName').open)),'Il nome e l\'icona: chiuso');
await p.locator('#wlName summary').click();await W(200);ok(await p.evaluate(()=>document.getElementById('wlName').open),'si apre al clic');
// riservatezza
ok(await p.locator('#wlPriv').isVisible(),'collegamento Riservatezza e diritti');
await p.locator('#wlPriv').click();await W(400);
ok(await p.evaluate(()=>document.getElementById('dlgAbout').open&&document.getElementById('abPriv').open),'Informazioni aperto con la sezione Riservatezza');
const pv=await p.locator('#abPriv').textContent();
['Funzionamento locale','Dati dei progetti','Dati nel browser','Dati personali nei progetti','Distribuzione','Diritto d’uso','Diritti riservati','Esclusione di garanzia','Copyright © 2026 Claudio Passari','non compare alcuna richiesta'].forEach(t=>ok(pv.includes(t),'testo: '+t));
ok(!(await p.locator('#abMailLi').isVisible()),'contatti nascosti finché non impostati');
await p.locator('#abClose').click();await W(200);
ok(await dlg.evaluate(d=>d.open),'si torna al benvenuto');
// Informazioni normale: sezione chiusa
await p.locator('#wlStart').click();await W(200);
await p.locator('[data-act="help"]').click();await p.waitForTimeout(150);await p.locator('.pop [data-act="about"]').click();await W(300);
ok(!(await p.evaluate(()=>document.getElementById('abPriv').open)),'da Informazioni la sezione è chiusa');
await p.locator('#abClose').click();
// contatto impostato
await p.evaluate(()=>{window.__x=1});
// ---- nessuna richiesta di rete: uso reale (esempio, esportazione, copia)
await p.evaluate(()=>window.GanttApp.act.loadExample());await W(500);
await p.locator('[data-act="export"]').click();await W(700);
await p.locator('#expCopy').click();await W(3500);
ok(/Immagine copiata/.test(await p.locator('#expBody .xmsg').textContent()),'copia eseguita');
await p.locator('#expCancel').click();await W(200);
await p.locator('[data-act="help"]').click();await W(200);await p.locator('.pop [data-act="welcome"]').click();await W(300);
ok(await dlg.evaluate(d=>d.open),'riapertura dalla Guida');
await p.locator('#wlStart').click();
ok(net.length===0,'nessuna richiesta di rete: '+JSON.stringify(net));
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
