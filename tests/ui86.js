const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const ctx=await b.newContext({viewport:{width:1700,height:900}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});
const url='file://'+process.cwd()+'/app.html';
const A=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);
const isOpen=id=>p.evaluate(i=>document.getElementById(i).open,id);
await p.goto(url);await W(400);
// 1 browser automatizzato: nessuna schermata
ok(!(await isOpen('dlgStart')),'automatizzato: schermata iniziale non mostrata');
eq(await A(()=>[window.GanttApp.P.project.kind,document.getElementById('kindPill').textContent]),['schedule','Cronoprogramma'],'predefinito: cronoprogramma');
ok(await A(()=>window.GanttApp.P.view.scale)==='weeks','cronoprogramma: scala a settimane');
// 2 avvio forzato
await p.goto(url+'?start=1');await W(500);
ok(await isOpen('dlgStart'),'?start=1 apre la schermata iniziale');
eq(await p.locator('#dlgStart .stact').allInnerTexts().then(a=>a.map(t=>t.split('\n')[0])),['Nuovo progetto','Apri un progetto','Progetto di esempio','Guida introduttiva'],'quattro azioni');
ok((await p.locator('#dlgStart').innerText()).includes('SharePoint'),'cita SharePoint e OneDrive');
ok((await p.locator('#stPill').innerText())==='v0.14.0','versione nella schermata');
// 3 nuovo progetto roadmap
await p.locator('#dlgStart .stact[data-st="Nuovo progetto"]').click();await W(250);
ok(await isOpen('dlgNew')&&await isOpen('dlgStart'),'la scelta del tipo si apre sopra la schermata iniziale');
eq(await p.locator('#nwTitle').innerText(),'Nuovo progetto','titolo in modalità nuovo');
ok(await p.locator('#dlgNew input[value="schedule"]').isChecked(),'predefinito cronoprogramma');
ok(!(await p.locator('#nwSoon').isVisible()),'avviso roadmap nascosto per il cronoprogramma');
await p.locator('#dlgNew .kcard',{hasText:'Roadmap'}).click();await W(150);
ok(await p.locator('#nwSoon').isVisible(),'avviso roadmap visibile scegliendo Roadmap');
ok(await p.locator('#dlgNew svg').count()===2,'due miniature');
await p.locator('#nwGo').click();await W(500);
ok(!(await isOpen('dlgNew'))&&!(await isOpen('dlgStart')),'creazione: entrambe le finestre chiuse');
let r=await A(()=>{const P=window.GanttApp.P;return {k:P.project.kind,sc:P.view.scale,hid:P.view.hiddenColumns,sh:P.view.shownColumns,n:P.items.length,pill:document.getElementById('kindPill').textContent,cols:[...document.querySelectorAll('#itemsHead .c, .cols .c')].map(e=>e.textContent.trim()).join('|'),pulse:document.getElementById('gtQuick').classList.contains('pulse')}});
eq([r.k,r.sc,r.n,r.pill],['roadmap','months',0,'Roadmap'],'progetto roadmap: tipo, scala, vuoto, pill');
ok(r.hid.includes('dur')&&r.sh.includes('deadline'),'roadmap: durata nascosta, scadenza mostrata '+JSON.stringify([r.hid,r.sh]));
ok(!/Durata/.test(r.cols)&&/Scadenza/.test(r.cols),'intestazione: Scadenza sì, Durata no ('+r.cols+')');
ok(r.pulse,'Vai a data lampeggia sul progetto nuovo');
// 4 intestazione Nuovo > cronoprogramma
await p.locator('#hbtns .btn',{hasText:'Nuovo'}).first().click();await W(250);
ok(await isOpen('dlgNew')&&!(await isOpen('dlgStart')),'Nuovo dall\'intestazione apre la scelta');
await p.locator('#nwGo').click();await W(400);
eq(await A(()=>[window.GanttApp.P.project.kind,window.GanttApp.P.view.scale]),['schedule','weeks'],'nuovo cronoprogramma dall\'intestazione');
// Annulla non cambia nulla
await p.locator('#hbtns .btn',{hasText:'Nuovo'}).first().click();await W(200);await p.locator('#nwCancel').click();await W(150);
ok(!(await isOpen('dlgNew')),'Annulla chiude');
// 5 cambio tipo, undo/redo, dati intatti
await A(()=>document.activeElement.blur());await p.keyboard.press('Alt+Enter');await p.keyboard.type('Fondazioni');await p.keyboard.press('Enter');await W(100);
const items0=await A(()=>JSON.stringify(window.GanttApp.P.items));
await p.locator('#kindPill').click();await W(250);
eq(await p.locator('#nwTitle').innerText(),'Tipo di progetto','titolo in modalità cambio');
eq(await p.locator('#nwGo').innerText(),'Applica','pulsante Applica');
ok(await p.locator('#dlgNew input[value="schedule"]').isChecked(),'selezione = tipo corrente');
await p.locator('#dlgNew .kcard',{hasText:'Roadmap'}).click();await W(100);
ok(!(await p.locator('#nwSoon').isVisible()),'in modalità cambio niente avviso di creazione');
await p.locator('#nwGo').click();await W(400);
eq(await A(()=>[window.GanttApp.P.project.kind,document.getElementById('kindPill').textContent]),['roadmap','Roadmap'],'tipo cambiato');
ok(await A(()=>JSON.stringify(window.GanttApp.P.items))===items0,'gli item non cambiano');
ok(await A(()=>window.GanttApp.P.view.scale)==='weeks','il cambio non tocca la scala');
await A(()=>document.activeElement.blur());await p.keyboard.press('Control+z');await W(150);
eq(await A(()=>window.GanttApp.P.project.kind),'schedule','annullabile');
await p.keyboard.press('Control+y');await W(150);
eq(await A(()=>window.GanttApp.P.project.kind),'roadmap','ripristinabile');
// scelta uguale: nessuna operazione
const hl=await A(()=>window.GanttApp.hist.undo.length);
await p.locator('#kindPill').click();await W(200);await p.locator('#nwGo').click();await W(200);
eq(await A(()=>window.GanttApp.hist.undo.length),hl,'stesso tipo: nessuna operazione registrata');
// 6 salvataggio e caricamento
ok(await A(()=>JSON.parse(JSON.stringify(window.GanttApp.P)).project.kind)==='roadmap','il tipo è nel file');
const load=async(name,obj)=>{await p.setInputFiles('#fileInput',{name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});await W(350)};
const base=await A(()=>JSON.parse(JSON.stringify(window.GanttApp.P)));
const o1=JSON.parse(JSON.stringify(base));delete o1.project.kind;await load('vecchio.json',o1);
eq(await A(()=>[window.GanttApp.P.project.kind,document.getElementById('kindPill').textContent]),['schedule','Cronoprogramma'],'file senza tipo: cronoprogramma');
const o2=JSON.parse(JSON.stringify(base));o2.project.kind='roadmap';await load('r.json',o2);
eq(await A(()=>window.GanttApp.P.project.kind),'roadmap','file roadmap riaperto come roadmap');
const o3=JSON.parse(JSON.stringify(base));o3.project.kind='foo';await load('x.json',o3);
eq(await A(()=>window.GanttApp.P.project.kind),'schedule','tipo non valido: cronoprogramma');
const o4=JSON.parse(JSON.stringify(base));delete o4.project;await load('senza.json',o4);
eq(await A(()=>window.GanttApp.P.project.kind),'schedule','senza blocco project: cronoprogramma');
// 7 Apri dalla schermata iniziale (finta finestra di scelta del file)
await p.addInitScript(()=>{});
await p.goto(url+'?start=1');await W(400);
await p.evaluate(o=>{window.showOpenFilePicker=async()=>[{getFile:async()=>new File([JSON.stringify(o)],'aperto.json',{type:'application/json'}),createWritable:async()=>({})}]},o2);
await p.locator('#dlgStart .stact[data-st="Apri un progetto"]').click();await W(600);
ok(!(await isOpen('dlgStart')),'Apri: la schermata iniziale si chiude dopo l\'apertura');
eq(await A(()=>window.GanttApp.P.project.kind),'roadmap','Apri: tipo letto dal file');
// 8 esempio
await p.goto(url+'?start=1');await W(400);
await p.locator('#dlgStart .stact[data-st="Progetto di esempio"]').click();await W(700);
ok(!(await isOpen('dlgStart')),'Esempio: schermata chiusa');
ok(await A(()=>window.GanttApp.P.items.length)>10,'Esempio: progetto caricato');
eq(await A(()=>window.GanttApp.P.project.kind),'schedule','Esempio: cronoprogramma');
// 9 guida
await p.goto(url+'?start=1');await W(400);
await p.locator('#dlgStart .stact[data-st="Guida introduttiva"]').click();await W(400);
ok(await isOpen('dlgWelcome')&&!(await isOpen('dlgStart')),'Guida: si apre la guida a schede');
await p.keyboard.press('Escape');await W(150);
// 10 chiudi e non mostrare più (contesto separato, senza precaricamento delle preferenze)
{const c2=await b.newContext({viewport:{width:1700,height:900}});const q=await c2.newPage();q.on('dialog',d=>d.accept());
const QA=f=>q.evaluate(f);const qo=id=>q.evaluate(i=>document.getElementById(i).open,id);
await q.goto(url+'?start=1');await W(400);
ok(await qo('dlgStart'),'secondo contesto: schermata mostrata');
await q.locator('#stNever').check();await q.locator('#stClose').click();await W(200);
ok(await QA(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).welcomeOff===true),'preferenza salvata');
ok(await QA(()=>document.getElementById('gtQuick').classList.contains('pulse')),'Chiudi: Vai a data lampeggia sul progetto vuoto');
await q.goto(url+'?start=1');await W(400);
ok(!(await qo('dlgStart')),'Non mostrare più: rispettato');
await QA(()=>{const x=JSON.parse(localStorage.getItem('gantt.prefs.v1'));x.welcomeOff=false;localStorage.setItem('gantt.prefs.v1',JSON.stringify(x))});
await q.goto(url+'?start=1');await W(400);
ok(await qo('dlgStart'),'preferenza azzerata: torna a comparire');
await q.keyboard.press('Escape');await W(150);
ok(!(await qo('dlgStart')),'Esc chiude');
await c2.close();}
// 11 pulsante Nuovo con progetto modificato: conferma di scarto
await A(()=>document.activeElement.blur());await p.keyboard.press('Alt+Enter');await p.keyboard.type('X');await p.keyboard.press('Enter');await W(100);
let asked=0;p.removeAllListeners('dialog');p.on('dialog',d=>{asked++;d.dismiss()});
await p.locator('#hbtns .btn',{hasText:'Nuovo'}).first().click();await W(200);await p.locator('#nwGo').click();await W(300);
ok(asked===1,'progetto modificato: chiede conferma prima di sostituirlo ('+asked+')');
eq(await A(()=>window.GanttApp.P.items.length),2,'rifiutando, il progetto resta (due righe: Invio ne crea una nuova)');
ok(await isOpen('dlgNew'),'rifiutando, la scelta resta aperta');
ok(errs.length===0,'nessun errore: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
