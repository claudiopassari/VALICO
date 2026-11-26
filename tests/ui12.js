const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
const sel=async name=>{await AA(n=>{const a=window.GanttApp;const it=a.P.items.find(x=>x.name===n);a.ui.sel=[it.uid];a.ui.anchor=it.uid;a.render()},name);await W(80)};
const col=n=>AA(n=>window.GanttApp.P.items.find(x=>x.name===n).color,n);
// selettore dal pannello Timeline
await sel('Armature');
await await A(()=>{const a=window.GanttApp;a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(100);
eq(await p.locator('.cpick .cdot').count(),40,'40 tonalità');
await p.locator('.cpick .cdot').nth(20).click();await W(150);
eq(await col('Armature'),{c:'rosso',v:1},'colore rosso medio');
const bg=await p.locator('#tlCv .bar[data-u]').evaluateAll(els=>els.map(e=>[e.getAttribute('data-c'),getComputedStyle(e).backgroundColor]).filter(x=>x[0]==='rosso'));
ok(bg.length===1&&bg[0][1]==='rgb(229, 56, 74)','barra con il nuovo colore: '+JSON.stringify(bg));
// gruppo con discendenti
await sel('Fondazioni');
await await A(()=>{const a=window.GanttApp;a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(100);
ok(await p.locator('.cpick .swrow').count()===1,'opzione discendenti per i gruppi');
await p.locator('.cpick .swrow .switch').click();
await p.locator('.cpick .cdot').nth(3).click();await W(150);
eq([(await col('Fondazioni')),(await col('Scavi')),(await col('Armature'))],[{c:'verde',v:0},{c:'verde',v:0},{c:'verde',v:0}],'colore applicato ai discendenti');
// figlio: allinea al gruppo
await sel('Scavi');
await await A(()=>{const a=window.GanttApp;a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(100);
await p.locator('.cpick .crow .btn:has-text("Allinea al gruppo")').click();await W(150);
eq(await col('Scavi'),null,'allineato al gruppo (eredita)');
// nuovo colore sul gruppo senza cascata: Scavi (che eredita) segue
await sel('Cantiere');
await await A(()=>{const a=window.GanttApp;a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(100);
ok(await A(()=>{const sw=document.querySelector('.cpick .switch');return sw.getAttribute('aria-checked')==='true'}),'l\'opzione ricorda la scelta precedente');
await p.locator('.cpick .cdot').nth(30).click();await W(150);
// pannello Dettagli
await p.locator('#tgDetails').click();await W(300);
await sel('Armature');await W(120);
ok(await p.locator('#detailsBody .cmask .cdot').count()===40,'maschera colori nei Dettagli');
// bianco e nero
await sel('Solai');await await A(()=>{const a=window.GanttApp;a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(100);await p.locator('.cpick .cdot').nth(7).click();await W(150);
await A(()=>{window.GanttApp.ui.sel=[];window.GanttApp.render()});await W(100);
const w=await p.locator('#tlCv .bar[data-c="bianco"]').evaluate(e=>getComputedStyle(e).boxShadow);
ok(/inset/.test(w),'bordo sottile sulla barra bianca: '+w);
// menu contestuale sulla barra
const bb=await p.locator('#tlCv .bar[data-c="bianco"]').boundingBox();
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2,{button:'right'});await W(100);
ok(await p.locator('.cmenu .cmask .cdot').count()===40,'menu della barra con la maschera dei colori inline');
await p.locator('.cmenu .cmask .cdot').nth(23).click();await W(150);
eq(await A(()=>{const a=window.GanttApp;return a.P.items.find(i=>i.name==='Solai').color}),{c:'verde',v:1},'colore scelto direttamente dal menu della barra');
ok(await p.locator('.cmenu').count()===0,'il menu si chiude dopo la scelta');
// clic sul puntino della riga nell'elenco
await p.locator('#itemsBody .row:has-text("Pilastri") .tdot').click();await W(120);
ok(await p.locator('.pop .cmask .cdot').count()===40,'clic sul puntino della riga apre la maschera');
await p.locator('.pop .cmask .cdot').nth(6).click();await W(150);
eq(await A(()=>window.GanttApp.P.items.find(i=>i.name==='Pilastri').color),{c:'rosa',v:0},'colore dal puntino della riga');
ok(await p.locator('#itemCmds [data-act="color"]').count()===0&&await p.locator('#tlCmds [data-act="color"]').count()===0,'icone Colore rimosse dalle barre degli strumenti');
// Dettagli: scelta diretta
await sel('Armature');await W(100);
if(!(await p.locator('#detailsBody .cmask .cdot').first().isVisible()))await p.locator('#tgDetails').click();await W(300);
await p.locator('#detailsBody .cmask .cdot').nth(3).click();await W(150);
eq(await col('Armature'),{c:'verde',v:0},'colore scelto dalla maschera nei Dettagli');
await p.keyboard.press('Escape');await p.mouse.click(5,5);
// marker: menu e colore
const mt=p.locator('#tlHead .mtag[data-k="start"]');const mb=await mt.boundingBox();
await p.mouse.click(mb.x+mb.width/2,mb.y+mb.height/2,{button:'right'});await W(100);
ok(await p.locator('.cmenu .menuitem:has-text("Cambia colore")').count()===1,'menu del marker');
await p.locator('.cmenu .menuitem:has-text("Cambia colore")').click();await W(100);
await p.locator('.cpick .cdot').nth(4).click();await W(150);
eq(await A(()=>window.GanttApp.P.markers[0].color),{c:'blu',v:0},'colore del marker cambiato');
// undo
await p.keyboard.press('Control+z');await W(100);
ok(await A(()=>window.GanttApp.P.markers[0].color.c)==='verde','annullamento del colore del marker');
console.log('errors',JSON.stringify(errs));console.log('pass',pass,'fail',fail);await b.close();})();
