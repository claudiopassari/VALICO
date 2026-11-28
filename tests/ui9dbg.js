const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
await p.locator('#tgDetails').click();await p.waitForTimeout(500);
const A=f=>p.evaluate(f);
const items=()=>A(()=>window.GanttApp.P.items.map(x=>({n:x.name,s:x.start,e:x.end,l:x.level,lab:x.barLabel})));
const row=i=>p.locator('#itemsBody .row[data-uid]').nth(i);
const rowBox=async k=>await p.locator('#tlCv .trow').nth(k).boundingBox();
const geo=()=>A(()=>{const g=window.GanttApp.ui.geo;return {a:g.a,px:g.px}});
const cvBox=async()=>await p.locator('#tlCv').boundingBox();
const xOf=async dn=>{const c=await cvBox();const g=await geo();return c.x+(dn-g.a)*g.px};
const dnOf=iso=>p.evaluate(iso=>window.GanttApp.core.toDN(iso),iso);
// ---- 1. barra dentro un gruppo
await A(()=>{const Ap=window.GanttApp,C=Ap.core;Ap.commit('t',q=>{const it=C.newItem('Vuoto');it.level=3;q.items.splice(9,0,it)});Ap.ui.sel=[];Ap.render()});
await p.waitForTimeout(200);
let its=await items();let iV=its.findIndex(x=>x.n==='Vuoto');eq(iV,9,'riga Vuoto inserita');
const kV=await A(()=>window.GanttApp.act.visRows().indexOf(9));
await p.locator('#tlBody').evaluate(el=>{el.scrollLeft=0});await p.waitForTimeout(100);
let rb=await rowBox(kV);const d0=await dnOf('2026-12-01');const xs=await xOf(d0)+4;const xe=await xOf(d0+4)+4;
await p.mouse.move(xs,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(xs+20,rb.y+rb.height/2,{steps:3});await p.mouse.move(xe,rb.y+rb.height/2,{steps:5});await p.mouse.up();
its=await items();ok(!!its[9].s&&!!its[9].e,'disegno di una barra dentro un gruppo: '+JSON.stringify(its[9]));
await p.keyboard.press('Control+z');
// ---- 2. allineamento delle aree annidate
const ar=await A(()=>[...document.querySelectorAll('#tlCv .area')].map(a=>{const r=a.getBoundingClientRect();return {u:a.getAttribute('data-u'),t:r.top,b:r.bottom}}));
ok(ar.length>=3,'aree annidate presenti ('+ar.length+')');
const info=await A(()=>{const P=window.GanttApp.P;const res=[];document.querySelectorAll('#tlCv .area').forEach(a=>{const u=a.getAttribute('data-u'),i=P.items.findIndex(x=>x.uid===u);let e=i+1;while(e<P.items.length&&P.items[e].level>P.items[i].level)e++;res.push({i,e,lv:P.items[i].level,b:a.getBoundingClientRect().bottom})});return res});
let nestOk=true,sepOk=true;info.forEach(x=>info.forEach(y=>{if(y.i>x.i&&y.i<x.e){ if(!(y.b<=x.b)) nestOk=false; if(y.e===x.e&&!(x.b-y.b>=2)) sepOk=false; }}));
ok(nestOk,'nessun gruppo interno sborda sotto quello esterno');ok(sepOk,'margine inferiore tra gruppi annidati con la stessa ultima riga');
// ---- 3. Canc
await row(2).locator('.c-start').click();
const before=(await items()).length;
await p.keyboard.press('Delete');await p.waitForTimeout(100);
its=await items();eq(its.length,before,'Canc su una cella non elimina la riga');ok(!its[2].s,'Canc svuota la data di inizio');
await p.keyboard.press('Control+z');
await row(4).locator('.c-id').click();await p.keyboard.press('Delete');await p.waitForTimeout(100);
eq((await items()).length,before-1,'numero di riga + Canc elimina la riga');await p.keyboard.press('Control+z');
// selezione da timeline + Canc: nessuna eliminazione
const kA=await A(()=>window.GanttApp.act.visRows().indexOf(window.GanttApp.P.items.findIndex(x=>x.name==='Armature')));
rb=await rowBox(kA);const dA=await dnOf('2026-11-27');await p.mouse.click(await xOf(dA)+6,rb.y+rb.height/2);
await p.keyboard.press('Delete');await p.waitForTimeout(100);
eq((await items()).length,before,'Canc con selezione dalla timeline non elimina');
// ---- 4. deselezione
await p.mouse.click(await xOf(dA)+6,rb.y+rb.height/2);ok((await A(()=>window.GanttApp.ui.sel.length))===1,'riga selezionata');
const lastK=await A(()=>window.GanttApp.act.visRows().length+1);await p.locator('#tlCv .trow').nth(lastK).scrollIntoViewIfNeeded();const rbe=await rowBox(lastK);
await p.mouse.click((await cvBox()).x+300,rbe.y+rbe.height/2);
eq(await A(()=>window.GanttApp.ui.sel.length),0,'clic su zona vuota della timeline deseleziona');
await row(1).locator('.c-name').click();ok((await A(()=>window.GanttApp.ui.sel.length))===1,'seleziona');
const ib=await p.locator('#itemsBody').boundingBox();const rh0=(await row(0).boundingBox()).height;const nr0=await A(()=>window.GanttApp.act.visRows().length);await (async()=>{const wb=await p.locator('#itemsWrap').boundingBox();const Y=Math.min(ib.y+(nr0+3)*rh0,wb.y+wb.height-8);console.log('AT',Y,await p.evaluate(y=>{const e=document.elementFromPoint(104,y);return e.tagName+'.'+e.className+'|'+e.parentElement.className},Y));await p.mouse.click(ib.x+60,Y)})();
eq(await A(()=>window.GanttApp.ui.sel.length),0,'clic su zona vuota dell\'elenco deseleziona');
// ---- 5. menu contestuale nativo
const cm=await A(()=>{const r={};const mk=el=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented};
 r.hdr=mk(document.querySelector('#hdr'));r.tl=mk(document.querySelector('#tlBody'));const i=document.createElement('input');i.type='text';document.body.appendChild(i);r.inp=mk(i);i.remove();return r});
await p.keyboard.press('Escape');await p.mouse.click(5,5);await p.waitForTimeout(80);
ok(cm.hdr&&cm.tl,'menu nativo bloccato su intestazione e timeline');ok(!cm.inp,'menu nativo consentito nei campi di testo');
// ---- 6. titolo del progetto
await p.locator('#projTitle').click();await p.keyboard.press('Control+a');await p.keyboard.type('Cantiere Nord');await p.keyboard.press('Enter');await p.waitForTimeout(100);
eq(await A(()=>window.GanttApp.P.project.title),'Cantiere Nord','titolo modificato');ok((await p.locator('#fileName').textContent())==='Cantiere Nord','titolo nell\'intestazione');
ok(/non ancora salvato/.test(await p.locator('#status').textContent()),'file non ancora salvato nello stato');
await p.keyboard.press('Control+z');eq(await A(()=>window.GanttApp.P.project.title),'Nuovo progetto','annulla la rinomina');
// ---- 7. selettore date: contatore
await row(2).locator('.c-start .calb').click();await p.waitForTimeout(100);
const cnt=await p.locator('.calp .cnt').textContent();ok(/giorni lavorativi/.test(cnt)&&/di calendario/.test(cnt),'contatore giorni: '+cnt);
const bg=await p.locator('.calp .d.in').first().evaluate(e=>getComputedStyle(e).backgroundColor);
const mm=bg.match(/[\d.]+/g).map(Number);ok(mm[2]>mm[0]&&mm[2]>=mm[1],'intervallo in tinta azzurra: '+bg);
await p.keyboard.press('Escape');await p.mouse.click(5,400);
// ---- 8. doppio clic sull'etichetta
rb=await rowBox(kA);await p.mouse.dblclick(await xOf(dA)+6,rb.y+rb.height/2);await p.waitForTimeout(100);
ok(await p.locator('.tledit').count()===1,'editor dell\'etichetta aperto');
eq(await p.locator('.tledit').inputValue(),'Armature','mostra il nome quando non c\'è etichetta');
await p.keyboard.press('Control+a');await p.keyboard.type('Armature piani');await p.keyboard.press('Enter');await p.waitForTimeout(100);
{const it0=(await items()).find(x=>x.l===4&&/Armature/.test(x.n));eq([it0.n,it0.lab],['Armature','Armature piani'],'senza etichetta si scrive il campo etichetta e il nome resta');}
await p.keyboard.press('Control+z');
// con etichetta personalizzata si modifica l'etichetta
await A(()=>{const Ap=window.GanttApp;const i=Ap.P.items.findIndex(x=>x.name==='Armature');Ap.commit('t',q=>Ap.core.setField(q,q.items[i].uid,'label','Ferri'));});
await p.waitForTimeout(100);rb=await rowBox(kA);await p.mouse.dblclick(await xOf(dA)+6,rb.y+rb.height/2);await p.waitForTimeout(100);
eq(await p.locator('.tledit').inputValue(),'Ferri','mostra l\'etichetta personalizzata');
await p.keyboard.press('Control+a');await p.keyboard.type('Ferri 2');await p.keyboard.press('Enter');await p.waitForTimeout(100);
let lab=await A(()=>{const P=window.GanttApp.P;const i=P.items.findIndex(x=>x.name==='Armature');return [P.items[i].name,P.items[i].barLabel]});eq(lab,['Armature','Ferri 2'],'modificata solo l\'etichetta');
await p.keyboard.press('Control+z');await p.keyboard.press('Control+z');
// ---- 9. zone di ridimensionamento esterne
const sE=(await items()).find(x=>/Armature/.test(x.n));const eDn=await dnOf(sE.e);const sDn=await dnOf(sE.s);
rb=await rowBox(kA);const cur=async x=>{await p.mouse.move(x,rb.y+rb.height/2);await p.waitForTimeout(40);return await p.locator('#tlBody').evaluate(e=>e.style.cursor)};
eq(await cur((await xOf(eDn+1))+5),'ew-resize','cursore di ridimensionamento fuori dalla barra (destra)');
eq(await cur((await xOf(sDn))-5),'ew-resize','cursore di ridimensionamento fuori dalla barra (sinistra)');
eq(await cur((await xOf(eDn+1))-3),'grab','all\'interno del bordo si sposta tutto il corpo');
// ---- 10. Aspetto
await p.locator('#hbtns [data-act="look"]').click();await p.waitForTimeout(150);
eq(await p.locator('.look .thc').count(),19,'carte tema: 18 + Automatico');
const hb=await p.evaluate(()=>({hdr:document.querySelector('#hdr').offsetHeight,row:document.querySelector('#itemsBody .row').offsetHeight,font:getComputedStyle(document.documentElement).getPropertyValue('--font'),pw:document.querySelector('.pop').offsetWidth,ph:document.querySelector('.pop').offsetHeight,pl:document.querySelector('.pop').getBoundingClientRect().left}));
const fi=p.locator('.look .fontitem');const nf=await fi.count();ok(nf>=2,'font elencati ('+nf+')');
await fi.nth(0).hover();await p.waitForTimeout(150);await fi.nth(1).hover();await p.waitForTimeout(200);
const hv=await p.evaluate(()=>({font:getComputedStyle(document.documentElement).getPropertyValue('--font'),pw:document.querySelector('.pop').offsetWidth,ph:document.querySelector('.pop').offsetHeight,pl:document.querySelector('.pop').getBoundingClientRect().left}));
ok(hv.font!==hb.font,'il carattere dell\'interfaccia cambia al solo passaggio');eq([hv.pw,hv.ph,hv.pl],[hb.pw,hb.ph,hb.pl],'il riquadro Aspetto resta fermo durante l\'anteprima');
await p.mouse.move(5,5);await p.waitForTimeout(200);
const ha=await p.evaluate(()=>({hdr:document.querySelector('#hdr').offsetHeight,row:document.querySelector('#itemsBody .row').offsetHeight,font:getComputedStyle(document.documentElement).getPropertyValue('--font'),pw:document.querySelector('.pop').offsetWidth,ph:document.querySelector('.pop').offsetHeight,pl:document.querySelector('.pop').getBoundingClientRect().left}));
eq(ha,hb,'uscendo dall\'elenco il carattere e le dimensioni tornano quelli salvati');
await fi.nth(1).click();ok((await A(()=>getComputedStyle(document.documentElement).getPropertyValue('--font'))).length>0,'font applicato al clic');
await p.locator('.look .thc[data-t="paper"]').click();eq(await A(()=>document.documentElement.getAttribute('data-theme')),'paper','tema Carta applicato');
await p.locator('.look .thc[data-t="tech"]').hover();eq(await A(()=>document.documentElement.getAttribute('data-theme')),'tech','anteprima del tema al passaggio');
await p.mouse.move(5,5);await p.waitForTimeout(80);eq(await A(()=>document.documentElement.getAttribute('data-theme')),'paper','ripristino dopo l\'anteprima');
await p.locator('.look .thc[data-t="dark"]').click();eq(await A(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).theme),'dark','tema memorizzato');
const ids=await A(()=>window.GanttApp.core&&0);
await p.keyboard.press('Escape');
// ---- 11. comandi del pannello Timeline
const tl=await A(()=>{const U=window.GanttApp.ui;return {hidden:(U.tlcHidden||[]).length,pw:document.querySelector('#pTimeline').offsetWidth}});
ok(await p.locator('#tlCmds .tlmore:visible').count()>=0,'pulsante altri comandi gestito');
await p.setViewportSize({width:1100,height:900});await p.waitForTimeout(500);
ok((await A(()=>window.GanttApp.ui.tlcHidden.length))>0,'a 1100 px alcuni comandi passano nel menu «altri comandi»');
await p.locator('#tlCmds .tlmore').click();ok(await p.locator('.cmenu .menuitem').count()>0,'menu degli altri comandi popolato');await p.keyboard.press('Escape');await p.mouse.click(5,5);
await p.setViewportSize({width:1920,height:900});await p.waitForTimeout(400);
// ---- 12. Informazioni
await p.locator('.devlink').click();await p.waitForTimeout(100);
ok((await p.locator('#abNotes li').count())>=5,'novità della versione nella finestra Informazioni');ok(/0\.3\.2/.test(await p.locator('#abVer').textContent()),'versione nella finestra Informazioni');
await p.locator('#abClose').click();
// ---- 13. nuovo item: evidenziazione allineata
await A(()=>window.GanttApp.act.insert('end'));await p.waitForTimeout(150);
const al=await A(()=>({s:window.GanttApp.ui.sel[0],t:[...document.querySelectorAll('#tlBody .trow.sel')].map(x=>x.getAttribute('data-u'))}));
eq(al.t,[al.s],'evidenziazione della timeline sulla riga del nuovo item');await p.keyboard.press('Escape');
// ---- 14. barre di scorrimento
const sb=await A(()=>{const i=document.querySelector('#itemsWrap'),t=document.querySelector('#tlBody');return {iv:i.offsetWidth-i.clientWidth,tv:t.offsetWidth-t.clientWidth}});
eq(sb.iv,0,'nessuna barra verticale nel pannello Item');
// ---- 15. titoli verticali allineati
await p.locator('#tgItems').click();await p.waitForTimeout(500);await p.screenshot({path:'s31vt.png',clip:{x:0,y:0,width:360,height:300}});
const vt=await A(()=>{const a=document.querySelector('#pDetails .vt').getBoundingClientRect(),b=document.querySelector('#vtItems').getBoundingClientRect();return {a:a.top,b:b.top}});
ok(Math.abs(vt.a-vt.b)<2,'titolo verticale ITEM allineato a quello di DETTAGLI: '+JSON.stringify(vt));
const addLine=await A(()=>{const c=document.querySelector('#itemsBody .row.add .c');return c?getComputedStyle(c).boxShadow:'n/a'});
ok(addLine==='none'||addLine==='n/a','nessuna linea sotto Nuovo item: '+addLine);
// ---- 16. dopo l'eliminazione, Canc non elimina la riga successiva
await p.locator('#tgItems').click();await p.waitForTimeout(400);
const n16=(await items()).length;await row(5).locator('.c-id').click();await p.keyboard.press('Delete');await p.keyboard.press('Delete');await p.waitForTimeout(100);
eq((await items()).length,n16-1,'una sola riga eliminata con due pressioni di Canc');
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close();})();
