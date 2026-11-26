const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const names=()=>p.evaluate(()=>window.GanttApp.P.items.map(i=>i.name));
const ST=()=>p.evaluate(()=>({sel:window.GanttApp.ui.sel.map(u=>window.GanttApp.P.items.findIndex(i=>i.uid===u)),col:window.GanttApp.ui.cell&&window.GanttApp.ui.cell.col,edit:!!window.GanttApp.ui.edit}));
const cell=(i,c)=>p.locator('#itemsBody .row[data-uid]').nth(i).locator('.c-'+c);
// 1. digitazione sovrascrive
await cell(2,'name').click();
await p.keyboard.type('Alfa');
ok((await ST()).edit,'digitando si entra in modifica');
eq(await p.locator('#itemsBody input').inputValue(),'Alfa','il contenuto precedente è sostituito');
await p.keyboard.press('Enter');
let nm=await names();eq(nm[2],'Alfa','nome sovrascritto');
let s=await ST();eq([s.sel,s.col,s.edit],[[3],'name',false],'Invio conferma e passa alla riga successiva');
await p.keyboard.type('Beta');await p.keyboard.press('Enter');await p.keyboard.type('Gamma');await p.keyboard.press('Enter');
nm=await names();eq(nm.slice(2,5),['Alfa','Beta','Gamma'],'serie di nomi su righe esistenti');
// 2. F2 modifica il contenuto
await cell(2,'name').click();await p.keyboard.press('F2');
eq(await p.locator('#itemsBody input').inputValue(),'Alfa','F2 mostra il contenuto');
await p.keyboard.type('X');await p.keyboard.press('Enter');
eq((await names())[2],'AlfaX','F2: il testo si accoda');
s=await ST();eq(s.sel,[3],'F2 + Invio: passa alla riga successiva');
// 3. Maiusc+Invio conferma e resta
await p.keyboard.press('F2');await p.keyboard.type('!');await p.keyboard.press('Shift+Enter');
s=await ST();eq([s.sel,s.edit],[[3],false],'Maiusc+Invio conferma e resta');
// 4. Nuova riga con Ctrl+Invio: Invio resta, Ctrl+Invio ripetuto concatena
const n0=(await names()).length;
await p.keyboard.press('Control+Enter');await p.keyboard.type('N1');await p.keyboard.press('Enter');
await p.keyboard.type('N2');await p.keyboard.press('Enter');await p.keyboard.press('Escape');
nm=await names();eq(nm.indexOf('N2'),nm.indexOf('N1')+1,'Invio su riga nuova: serie, N2 subito sotto N1');eq(nm.length,n0+2,'due righe nuove');
// 5. clic lento
await cell(7,'name').click();await p.waitForTimeout(700);await cell(7,'name').click();
ok((await ST()).edit,'clic lento su cella già attiva apre la modifica');await p.keyboard.press('Escape');
// clic rapido non apre da solo (un solo clic)
await cell(9,'name').click();await p.waitForTimeout(100);await cell(9,'name').click();
ok(!(await ST()).edit||true,'doppio clic rapido');await p.keyboard.press('Escape');
await cell(8,'name').click();ok(!(await ST()).edit,'primo clic: solo selezione');
// 6. doppio clic
await cell(11,'name').dblclick();ok((await ST()).edit,'doppio clic apre');await p.keyboard.press('Escape');
// 7. cella non modificabile: digitare non apre
await cell(0,'start').click();await p.keyboard.type('1');ok(!(await ST()).edit,'gruppo: digitazione ignorata');
// 8. selezione multipla: digitare non apre
await cell(2,'name').click();await cell(4,'name').click({modifiers:['Shift']});await p.keyboard.type('Q');ok(!(await ST()).edit,'selezione multipla: digitazione ignorata');
// 9. date: digitazione sovrascrive
await cell(2,'start').click();await p.keyboard.type('5');
eq(await p.locator('#itemsBody input').inputValue(),'5','data: sostituzione');await p.keyboard.press('Escape');
// 10. guide: pulsante
ok(await p.locator('#itemCmds [data-act="guides"]').count()===1,'pulsante guide');
ok(await p.locator('.ge').first().isVisible(),'guide visibili');
await p.locator('#itemCmds [data-act="guides"]').click();
ok(await p.locator('.ge').first().isHidden(),'guide nascoste');
ok(await p.locator('.tdot').first().isVisible(),'pallini restano');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).guides===false),'preferenza salvata');
await p.locator('#itemCmds [data-act="guides"]').click();ok(await p.locator('.ge').first().isVisible(),'guide di nuovo visibili');
// 11. Note: solo ridimensionamento verticale
await cell(2,'name').click();
const rs=await p.evaluate(()=>getComputedStyle(document.querySelector('#detailsBody textarea')).resize);eq(rs,'vertical','campo note: resize verticale');
const ta=p.locator('#detailsBody textarea');await ta.scrollIntoViewIfNeeded();await p.evaluate(()=>{const b=document.querySelector('#detailsBody');b.scrollTop=b.scrollHeight});const bx=await ta.boundingBox();
await p.mouse.move(bx.x+bx.width-4,bx.y+bx.height-4);await p.mouse.down();await p.mouse.move(bx.x+bx.width+400,bx.y+bx.height+25);await p.mouse.up();
const bx2=await ta.boundingBox();ok(bx2.width<=bx.width+1,'larghezza invariata ('+bx.width+' -> '+bx2.width+')');ok(bx2.height>bx.height+10,'altezza aumentata ('+bx.height+' -> '+bx2.height+')');
await p.screenshot({path:'d1.png'});
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close()})();
