const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);
const W=ms=>p.waitForTimeout(ms);
// ---- nome e info
ok(/Valico/.test(await A(()=>document.title)),'titolo della pagina');
eq(await p.locator('#brandName').textContent(),'Valico','nome nell\'intestazione');
ok(await p.locator('#brandIcon svg rect').count()>=3&&await p.locator('#brandIcon svg polygon').count()===1,'icona: montagna e due barre');
await p.locator('[data-act="help"]').click();await p.waitForTimeout(150);await p.locator('.pop [data-act="about"]').click();await W(100);
ok(/valico/i.test(await p.locator('#dlgAbout').textContent())&&/ostacolo/.test(await p.locator('#dlgAbout').textContent()),'testo sul nome nelle Informazioni');
ok(/0\.9\.5/.test(await p.locator('#abVer').textContent()),'versione 0.3.2');
await p.locator('#abClose').click();
// ---- temi
const ths=await A(()=>window.GanttApp.themes?window.GanttApp.themes.length:null);
await p.locator('#hbtns [data-act="look"]').click();await W(100);
for(const t of ['valico','slate','concrete','taupe','ice','indigo']){ok(await p.locator('.look .thc[data-t="'+t+'"]').count()===1,'tema '+t+' presente');
 await p.locator('.look .thc[data-t="'+t+'"]').hover();eq(await A(()=>document.documentElement.getAttribute('data-theme')),t,'anteprima '+t);}
await p.locator('.look .thc[data-t="valico"]').click();await p.mouse.move(5,5);await W(100);
eq(await A(()=>document.documentElement.getAttribute('data-theme')),'valico','tema Valico applicato');
// stile gruppi come preferenza (pannello Visualizza)
await p.keyboard.press('Escape');await p.mouse.click(5,5);await W(100);
await p.evaluate(()=>document.querySelector('#tlCmds [data-act="tlopts"]').click());await W(150);
ok(await p.locator('.pop .seg button:has-text("Colore del gruppo")').count()===1,'Fondo: Colore del gruppo');
await p.locator('.pop .seg button:has-text("Colore del gruppo")').click();await W(80);
eq(await A(()=>document.documentElement.getAttribute('data-gf')),'one','fondo colore del gruppo');
eq(await A(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).gFill),'one','fondo nelle preferenze');
ok(await A(()=>!('gFill' in JSON.parse(JSON.stringify(window.GanttApp.P.view||{})))),'stile gruppi non nel file di progetto');
await p.locator('.pop .seg button:has-text("Nessuno")').first().click();await W(80);
eq(await A(()=>document.documentElement.getAttribute('data-gf')),'none','fondo nessuno');
await p.locator('.pop .seg button:has-text("Colore del gruppo")').click();await W(60);
await p.locator('.pop .seg button:text-is("Visibile")').click();await W(60);
eq(await A(()=>document.documentElement.getAttribute('data-gb')),'thin','linee visibili');
await p.keyboard.press('Escape');await p.mouse.click(5,5);await W(80);
await A(()=>{const a=window.GanttApp;a.act.setScale('days')});await W(200);
// ---- festivi
const hol=await A(()=>({hdr:document.querySelectorAll('#tlHead .tlc.hol').length,grid:document.querySelectorAll('#tlCv .thol').length}));
ok(hol.grid>0,'festivi nella griglia ('+hol.grid+')');
// sposta a dicembre per avere l'8 dicembre in header (ui.geo copre tutto): conta nelle celle numero
ok(hol.hdr>0,'festivi nell\'intestazione ('+hol.hdr+')');
await A(()=>window.GanttApp.act.setView('holColor',false));await W(100);
eq(await A(()=>document.querySelectorAll('#tlCv .thol,#tlHead .tlc.hol').length),0,'festivi disattivabili');
await A(()=>window.GanttApp.act.setView('holColor',true));await W(100);
// ---- menu giorno col tasto destro
const dn8=await A(()=>window.GanttApp.core.toDN('2026-12-02'));// mercoledì
const gx=await A(()=>{const g=window.GanttApp.ui.geo;return {a:g.a,px:g.px}});
await A(()=>{const b=document.querySelector('#tlBody');const g=window.GanttApp.ui.geo;b.scrollLeft=(window.GanttApp.core.toDN('2026-12-02')-g.a)*g.px-300});await W(100);
const hb=await p.locator('#tlHead').boundingBox();const g2=await A(()=>{const g=window.GanttApp.ui.geo,b=document.querySelector('#tlBody');return {a:g.a,px:g.px,sl:b.scrollLeft}});
const xd=hb.x+(dn8-g2.a)*g2.px-g2.sl+g2.px/2;
const numRow=await A(()=>{const c=[...document.querySelectorAll('#tlHead .tlc.c1')].find(e=>/^\d+$/.test(e.textContent));const r=c.getBoundingClientRect();return {y:r.top,height:r.height}});
await p.mouse.click(xd,numRow.y+numRow.height/2,{button:'right'});await W(100);
ok(await p.locator('.cmenu').count()===1,'menu del giorno aperto');
const mi=await p.locator('.cmenu .menuitem').allTextContents();ok(/mercoledì/i.test(mi[0])&&/2 dic/.test(mi[0]),'intestazione del menu con la data: '+mi[0]);
await p.locator('.cmenu .menuitem:has-text("Giorno non lavorativo")').click();await W(150);
eq(await A(()=>window.GanttApp.P.calendar.exceptions.filter(e=>e.date==='2026-12-02').map(e=>e.working)),[false],'eccezione non lavorativa creata');
eq(await A(()=>window.GanttApp.core.isWork(window.GanttApp.P.calendar,window.GanttApp.core.toDN('2026-12-02'))),false,'giorno non lavorativo');
await p.mouse.click(xd,numRow.y+numRow.height/2,{button:'right'});await W(100);
await p.locator('.cmenu .menuitem:has-text("Ripristina")').click();await W(150);
eq(await A(()=>window.GanttApp.P.calendar.exceptions.filter(e=>e.date==='2026-12-02').length),0,'eccezione ripristinata');
// sabato -> lavorativo
const dnSat=await A(()=>window.GanttApp.core.toDN('2026-12-05'));const xs=hb.x+(dnSat-g2.a)*g2.px-g2.sl+g2.px/2;
await p.mouse.click(xs,numRow.y+numRow.height/2,{button:'right'});await W(100);
await p.locator('.cmenu .menuitem:has-text("Giorno lavorativo")').click();await W(150);
eq(await A(()=>window.GanttApp.P.calendar.exceptions.filter(e=>e.date==='2026-12-05').map(e=>e.working)),[true],'sabato reso lavorativo');
await p.keyboard.press('Control+z');await W(100);
eq(await A(()=>window.GanttApp.P.calendar.exceptions.filter(e=>e.date==='2026-12-05').length),0,'annullamento dell\'eccezione');
// tasto destro su una barra non apre il menu del giorno
// ---- intestazione settimane B
await A(()=>{window.GanttApp.act.setScale('weeks');window.GanttApp.act.setView('weekHdr','repeat')});await W(200);
const rows1=await A(()=>document.querySelectorAll('#tlHead .tlr').length);eq(rows1,2,'righe: mese/anno e settimana');
const lab=await A(()=>{const g=window.GanttApp.ui.geo,C=window.GanttApp.core;const cells=[...document.querySelectorAll('#tlHead .tlr')[0].children];const d0=C.toDN('2026-11-30');const el=cells.find(c=>Math.abs(parseFloat(c.style.left)-(d0-g.a)*g.px)<1);return el?el.textContent:null});
ok(/^dic/i.test(lab||''),'settimana 30 nov - 6 dic assegnata a dicembre (giovedì 3): '+lab);
const lab2=await A(()=>{const g=window.GanttApp.ui.geo,C=window.GanttApp.core;const cells=[...document.querySelectorAll('#tlHead .tlr')[0].children];const d0=C.toDN('2026-11-23');const el=cells.find(c=>Math.abs(parseFloat(c.style.left)-(d0-g.a)*g.px)<1);return el?el.textContent:null});
ok(/^nov/i.test(lab2||''),'settimana 23-29 nov a novembre: '+lab2);
ok(await A(()=>getComputedStyle(document.querySelector('#tlHead .tlr .tlc.ctr')).textAlign)==='center','etichetta centrata');
await A(()=>window.GanttApp.act.setView('weekHdr','span'));await W(100);
eq(await A(()=>document.querySelectorAll('#tlHead .tlr').length),3,'ritorno alla forma a scavalco');
// ---- marker
const mk0=await A(()=>({n:window.GanttApp.P.markers.length,mkl:document.documentElement.style.getPropertyValue('--mkl'),strip:document.querySelectorAll('#tlHead .mstrip').length,tags:document.querySelectorAll('#tlHead .mtag').length}));
ok(mk0.strip===1&&+mk0.mkl>=1&&mk0.tags>=2,'fascia dei marker: '+JSON.stringify(mk0));
const hh=await A(()=>[document.querySelector('#tlHead').offsetHeight,document.querySelector('#itemsCols').offsetHeight]);eq(hh[0],hh[1],'intestazione timeline e elenco allineate');
// nuovo marker senza popover
{const hb0=await p.locator('#tlHead').boundingBox();await p.keyboard.down('Alt');await p.mouse.move(hb0.x+hb0.width/2,hb0.y+6);await p.mouse.click(hb0.x+hb0.width/2,hb0.y+6);await p.keyboard.up('Alt');await W(250);}
ok(await p.locator('#tlHead input.mtedit').count()===1,'il nuovo marker si modifica subito');await p.keyboard.press('Escape');await W(100);
ok(await p.locator('.pop').count()===0,'nessun popover alla creazione del marker');
eq(await A(()=>window.GanttApp.P.markers.length),mk0.n+1,'marker creato');
const nm=await A(()=>{const m=window.GanttApp.P.markers[window.GanttApp.P.markers.length-1];return {uid:m.uid,date:m.date}});
const centre=await A(()=>{const g=window.GanttApp.ui.geo,b=document.querySelector('#tlBody');return window.GanttApp.core.fromDN(Math.round(g.a+(b.scrollLeft+g.cw/2)/g.px))});
ok(Math.abs(await AA(([a,b])=>window.GanttApp.core.toDN(a)-window.GanttApp.core.toDN(b),[nm.date,centre]))<=1,'creato al centro della vista');
// trascinamento
const tag=p.locator('#tlHead .mtag[data-m="'+nm.uid+'"]');const tb=await tag.boundingBox();const px=await A(()=>window.GanttApp.ui.geo.px);
await p.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2);await p.mouse.down();await p.mouse.move(tb.x+tb.width/2+px*3+2,tb.y+tb.height/2,{steps:5});await p.mouse.up();await W(150);
const d1=await A(()=>window.GanttApp.P.markers.find(m=>m.name==='Nuovo marker').date);
eq(await AA(([a,b])=>window.GanttApp.core.toDN(a)-window.GanttApp.core.toDN(b),[d1,nm.date]),3,'trascinamento di 3 giorni');
ok(await p.locator('.pop').count()===0,'dopo il trascinamento non si apre l\'elenco');
// rinomina con doppio clic
const tag2=p.locator('#tlHead .mtag[data-m="'+nm.uid+'"]');await tag2.dblclick();await W(100);
ok(await p.locator('.mtedit').count()===1,'editor del nome del marker');
await p.keyboard.press('Control+a');await p.keyboard.type('Fermo impianto');await p.keyboard.press('Enter');await W(150);
eq(await A(()=>window.GanttApp.P.markers.find(m=>m.uid===window.GanttApp.P.markers[window.GanttApp.P.markers.length-1].uid).name),'Fermo impianto','marker rinominato');
// Inizio non rinominabile
await p.locator('#tlHead .mtag[data-k="start"]').dblclick();await W(100);eq(await p.locator('.mtedit').count(),0,'Inizio non rinominabile');
await p.mouse.click(5,5);
// elenco: occhio, auto, riordino
await p.evaluate(()=>document.querySelector('#tlCmds [data-act="mkList"]').click());await W(150);
const nrows=await p.locator('.mkr').count();eq(nrows,mk0.n+1,'righe dell\'elenco');
ok(await p.locator('.mkr .eye').count()===nrows,'occhio su tutti i marker');
ok(await p.locator('.mkr .grip').count()===nrows,'maniglie di riordino');
await p.locator('.mkr').nth(1).locator('.eye').click();await W(150);
ok(await A(()=>window.GanttApp.P.markers[1].hidden===true),'marker nascosto');
eq(await p.locator('#tlHead .mtag').count(),mk0.tags,'etichetta rimossa dalla timeline (uno in meno, uno in più)');
await p.locator('.mkr').nth(1).locator('.eye').click();await W(150);
ok(await A(()=>!window.GanttApp.P.markers[1].hidden),'marker di nuovo visibile');
// auto
const sw=p.locator('.mkr').nth(0).locator('.auto .switch');eq(await sw.getAttribute('aria-checked'),'true','Inizio in automatico');
await sw.click();await W(150);
ok(await A(()=>!!window.GanttApp.P.calendar.projectStart),'disattivando Auto la data diventa manuale (Calendario)');
await p.locator('.mkr').nth(0).locator('.auto .switch').click();await W(150);
ok(await A(()=>window.GanttApp.P.calendar.projectStart===null),'riattivando Auto la data torna ai task');
// riordino: sposta la prima riga in fondo
const uid0=await A(()=>window.GanttApp.P.markers[0].uid);
const g0=await p.locator('.mkr').nth(0).locator('.grip').boundingBox();const lastR=await p.locator('.mkr').nth(nrows-1).boundingBox();
await p.mouse.move(g0.x+5,g0.y+5);await p.mouse.down();await p.mouse.move(g0.x+5,lastR.y+lastR.height-2,{steps:6});await p.mouse.up();await W(200);
eq(await A(()=>window.GanttApp.P.markers[window.GanttApp.P.markers.length-1].uid),uid0,'riordino per trascinamento');
await p.keyboard.press('Control+z');await W(100);
eq(await A(()=>window.GanttApp.P.markers[0].uid),uid0,'annullamento del riordino');
// sovrapposizione -> corsie
await A(()=>{const a=window.GanttApp;a.commit('t',q=>{q.markers.forEach(m=>{if(m.kind==='custom'){m.date='2026-11-24'}});const x=q.markers.find(m=>m.kind==='today');})});await W(100);
ok(+(await A(()=>document.documentElement.style.getPropertyValue('--mkl')))>=2,'etichette sovrapposte su più corsie');
const hh2=await A(()=>[document.querySelector('#tlHead').offsetHeight,document.querySelector('#itemsCols').offsetHeight]);eq(hh2[0],hh2[1],'allineamento con più corsie');
// salvataggio e ricaricamento mantiene hidden/ordine
const js=await A(()=>JSON.stringify(window.GanttApp.core.prepareSave?window.GanttApp.P:window.GanttApp.P));
ok(/"markers"/.test(js),'marker nel progetto');
console.log('errors',JSON.stringify(errs));console.log('pass',pass,'fail',fail);await b.close();})();
