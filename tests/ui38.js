const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=(f,a)=>p.evaluate(f,a);
const G=()=>A(()=>({n:window.GanttApp.P.items.length,sel:window.GanttApp.ui.sel.slice(),lv:window.GanttApp.P.items.map(x=>x.level+'|'+x.name)}));
// seleziona la riga 3 via clic sul nome
const rows=await p.locator('#itemsBody .row[data-uid] .c-name').all();
const leafIdx=await A(()=>{const P=window.GanttApp.P;for(let i=2;i<P.items.length-1;i++){if(P.items[i].type==='task'&&P.items[i+1].level<=P.items[i].level&&P.items[i].level>=1&&P.items[i-1].level>=P.items[i].level-0)return i;}return 2;});console.log('leaf',leafIdx);
await rows[leafIdx].click();await W(100);
let g0=await G();console.log('sel',g0.sel.length,g0.n);
const u=g0.sel[0];const lv0=await A(u=>window.GanttApp.P.items.find(x=>x.uid===u).level,u);
// Alt+Freccia destra = livello +1 (se possibile), Alt+sinistra = -1
await p.keyboard.press('Alt+ArrowRight');await W(150);
let lv1=await A(u=>window.GanttApp.P.items.find(x=>x.uid===u).level,u);
ok(lv1===lv0+1||lv1===lv0,'Alt+→ livello '+lv0+'->'+lv1);
await p.keyboard.press('Alt+ArrowLeft');await W(150);
let lv2=await A(u=>window.GanttApp.P.items.find(x=>x.uid===u).level,u);
ok(lv2<=lv1,'Alt+← livello '+lv1+'->'+lv2);
// Alt+Su/Giù sposta
const idx0=await A(u=>window.GanttApp.P.items.findIndex(x=>x.uid===u),u);
await p.keyboard.press('Alt+ArrowUp');await W(150);
const idx1=await A(u=>window.GanttApp.P.items.findIndex(x=>x.uid===u),u);
ok(idx1<idx0,'Alt+↑ sposta su '+idx0+'->'+idx1);
await p.keyboard.press('Alt+ArrowDown');await W(150);
ok(await A(u=>window.GanttApp.P.items.findIndex(x=>x.uid===u),u)===idx0,'Alt+↓ sposta giù');
// Ctrl+Freccia non sposta più
await p.keyboard.press('Control+ArrowUp');await W(100);
ok(await A(u=>window.GanttApp.P.items.findIndex(x=>x.uid===u),u)===idx0,'Ctrl+↑ non sposta');
// Ctrl+D duplica
const n0=g0.n;console.log('pre-dup',await A(()=>document.activeElement.tagName+' sel='+window.GanttApp.ui.sel.length+' n='+window.GanttApp.P.items.length+' pop='+!!document.querySelector('.pop')+' dlg='+!!document.querySelector('dialog[open]')));
await p.keyboard.press('Control+KeyD');await W(150);
console.log('toast:',await A(()=>document.getElementById('toast').textContent+'|'+window.GanttApp.P.items.length));ok(await A(()=>window.GanttApp.P.items.length)===n0+1,'Ctrl+D duplica');
// Ctrl+Canc elimina righe
await p.keyboard.press('Control+Delete');await W(200);
ok(await A(()=>window.GanttApp.P.items.length)===n0,'Ctrl+Canc elimina la riga');
// Canc da solo non elimina riga (svuota cella)
await rows[leafIdx].click();await W(80);
const nn=await A(()=>window.GanttApp.P.items.length);
await p.keyboard.press('Delete');await W(150);
ok(await A(()=>window.GanttApp.P.items.length)===nn,'Canc non elimina la riga');
await p.keyboard.press('Control+KeyZ');await W(100);
// Ctrl+A seleziona tutto
await rows[1].click();await W(80);
await p.keyboard.press('Control+KeyA');await W(150);
const all=await A(()=>[window.GanttApp.ui.sel.length,window.GanttApp.P.items.length]);
ok(all[0]>=all[1]-2&&all[0]>3,'Ctrl+A seleziona tutte: '+all);
// ---- personalizzazione
await p.locator('[data-act="help"]').click();await W(200);
await p.locator('[data-act="scDlg"]').click();await W(250);
ok(await A(()=>document.getElementById('dlgSc').open),'dialogo scorciatoie aperto');
const nrows=await p.locator('#dlgSc .scrow').count();ok(nrows===25,'25 comandi: '+nrows);
// assegna Ctrl+Alt+Shift+K? deve essere accettata; prima prova combinazione riservata
await p.locator('[data-sc="dup"]').click();await W(80);
await p.keyboard.press('Control+KeyT');await W(100);
ok((await p.locator('.scmsg').innerText()).length>0,'Ctrl+T rifiutata: '+await p.locator('.scmsg').innerText());
await p.keyboard.press('Control+KeyA');await W(100);   // conflitto con selAll
ok(/Già assegnata/.test(await p.locator('.scmsg').innerText()),'conflitto rilevato');
await p.keyboard.press('KeyK');await W(100);
ok(/Ctrl o Alt|riservat|tasto/.test(await p.locator('.scmsg').innerText()),'tasto semplice rifiutato');
await p.keyboard.press('Alt+KeyK');await W(150);
ok(await p.locator('[data-sc="dup"]').innerText()==='Alt+K','Alt+K assegnato: '+await p.locator('[data-sc="dup"]').innerText());
ok(await A(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).sc.dup)==='Alt+K','salvato nelle preferenze');
await p.locator('#scClose').click();await W(150);
await rows[leafIdx].click();await W(80);
const n3=await A(()=>window.GanttApp.P.items.length);
await p.keyboard.press('Control+KeyD');await W(100);
ok(await A(()=>window.GanttApp.P.items.length)===n3,'Ctrl+D non più attivo');
await p.keyboard.press('Alt+KeyK');await W(150);
ok(await A(()=>window.GanttApp.P.items.length)===n3+1,'Alt+K duplica');
// ripristina
await p.locator('[data-act="help"]').click();await W(150);await p.locator('[data-act="scDlg"]').click();await W(200);
await p.locator('#scResetAll').click();await W(100);
ok(await p.locator('[data-sc="dup"]').innerText()==='Ctrl+D','ripristino');
await p.locator('#scClose').click();await W(100);
// ---- zoom Ctrl+rotella e pan tasto centrale
const tb=await p.locator('#tlBody').boundingBox();
const px0=await A(()=>window.GanttApp.ui.px);
await p.mouse.move(tb.x+400,tb.y+200);await p.keyboard.down('Control');await p.mouse.wheel(0,-300);await p.keyboard.up('Control');await W(300);
const px1=await A(()=>window.GanttApp.ui.px);
ok(px1>px0,'Ctrl+rotella ingrandisce: '+px0+'->'+px1);
const sl0=await A(()=>document.getElementById('tlBody').scrollLeft);
await p.mouse.move(tb.x+400,tb.y+200);await p.mouse.down({button:'middle'});await p.mouse.move(tb.x+300,tb.y+200,{steps:4});await p.mouse.up({button:'middle'});await W(150);
const sl1=await A(()=>document.getElementById('tlBody').scrollLeft);
ok(sl1>sl0,'tasto centrale scorre: '+sl0+'->'+sl1);
// Ctrl simmetrico sul periodo
console.log('pass',pass,'fail',fail);await b.close()})();
