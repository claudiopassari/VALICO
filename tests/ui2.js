const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
let dialogs=[];p.on('dialog',d=>{dialogs.push(d.message());d.accept()});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');
const S=()=>p.evaluate(()=>JSON.stringify(window.GanttApp.P.items.map(i=>i.name+':'+i.level)));
const ST=()=>p.evaluate(()=>({sel:window.GanttApp.ui.sel.map(u=>window.GanttApp.P.items.findIndex(i=>i.uid===u)),cell:window.GanttApp.ui.cell&&{r:window.GanttApp.P.items.findIndex(i=>i.uid===window.GanttApp.ui.cell.uid),c:window.GanttApp.ui.cell.col},edit:!!window.GanttApp.ui.edit}));
// seed: A, a1, a2, B, C
await p.evaluate(()=>{const A=window.GanttApp,C=A.core;A.commit('seed',q=>{q.view.hiddenColumns=['notes','label'];[['A',1],['a1',2],['a2',2],['B',1],['C',1]].forEach(([n,l])=>{const it=C.newItem(n);it.level=l;q.items.push(it)})});A.ui.dirty=false});
const row=i=>p.locator('#itemsBody .row[data-uid]').nth(i);
const cell=(i,c)=>p.locator(`#itemsBody .row[data-uid]:nth-of-type(${i+1}) .c-${c}`);
// 1. click selects, no edit
await cell(3,'name').click();let s=await ST();eq([s.sel,s.cell.c,s.edit],[[3],'name',false],'clic seleziona cella');
// 2. keyboard nav
await p.keyboard.press('ArrowDown');s=await ST();eq(s.sel,[4],'giù');
await p.keyboard.press('ArrowRight');s=await ST();eq([s.sel,s.cell.c],[[4],'start'],'destra: stessa riga');
await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');s=await ST();eq(s.cell.c,'dur','destra x2');
await p.keyboard.press('ArrowUp');s=await ST();eq([s.sel,s.cell.c],[[3],'dur'],'su mantiene colonna');
// 3. F2 edit duration on B, Enter, stays on cell
await p.keyboard.press('F2');ok((await ST()).edit,'F2 apre editor');await p.keyboard.type('4');await p.keyboard.press('Enter');
s=await ST();eq([s.edit,s.cell.c],[false,'dur'],'Invio conferma e resta');
eq(await p.evaluate(()=>window.GanttApp.P.items[3].duration),4,'durata 4 salvata (senza data: solo durata)');
// 4. Esc annulla
await p.keyboard.press('F2');await p.keyboard.type('9');await p.keyboard.press('Escape');
eq(await p.evaluate(()=>window.GanttApp.P.items[3].duration),4,'Esc annulla');
// 5. Tab chain: start field -> end -> dur
await cell(3,'start').dblclick();ok((await ST()).edit,'doppio clic apre editor');
await p.keyboard.type('23/11/26');await p.keyboard.press('Tab');
s=await ST();eq([s.edit,s.cell.c],[true,'end'],'Tab apre la cella successiva');
await p.keyboard.press('Shift+Tab');s=await ST();eq(s.cell.c,'start','Maiusc+Tab indietro');
await p.keyboard.press('Escape');
let it=await p.evaluate(()=>window.GanttApp.P.items[3]);eq([it.start,it.end,it.duration],['2026-11-23','2026-11-26',4],'inizio+durata -> fine');
// 6. read-only skip: group A cells start/end are ro; Tab from name of A goes to assignee? (skips start,end,dur,progress)
await cell(0,'name').dblclick();await p.keyboard.press('Tab');s=await ST();eq(s.cell.c,'assignee','Tab salta le celle non modificabili del gruppo');
await p.keyboard.press('Escape');
// 7. lock: click lock on B start
await p.locator('#itemsBody .row[data-uid]').nth(3).locator('.c-start .lockb').click();
eq(await p.evaluate(()=>window.GanttApp.P.items[3].lockStart),true,'lucchetto inizio attivo');
await cell(3,'start').dblclick();s=await ST();ok(!s.edit,'inizio bloccato: editor non si apre');
await p.locator('#itemsBody .row[data-uid]').nth(3).locator('.c-start .lockb').click();
eq(await p.evaluate(()=>window.GanttApp.P.items[3].lockStart),false,'sblocco');
// 8. multi-selection
await cell(1,'name').click();await p.keyboard.down('Shift');await cell(3,'name').click();await p.keyboard.up('Shift');
s=await ST();eq(s.sel,[1,2,3],'Maiusc+clic intervallo');
await p.keyboard.down('Control');await cell(2,'name').click();await p.keyboard.up('Control');
s=await ST();eq(s.sel,[1,3],'Ctrl+clic toglie');
// 9. level shortcuts
await cell(4,'name').click();await p.keyboard.press('Alt+ArrowRight');eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','B:1','C:2']),'Alt+→ annida C sotto B');
await p.keyboard.press('Alt+ArrowLeft');eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','B:1','C:1']),'Alt+← riporta');
await p.keyboard.press('Alt+ArrowUp');eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','C:1','B:1']),'Alt+↑');
await p.keyboard.press('Alt+ArrowDown');eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','B:1','C:1']),'Alt+↓');
// 10. collapse
await p.locator('#itemsBody .row[data-uid]').nth(0).locator('.chev').click();
eq(await p.locator('#itemsBody .row[data-uid]').count(),3,'gruppo compresso: 3 righe visibili');
eq(await p.locator('#tlBody .trow').count()>=28,true,'timeline mantiene righe');
await cell(0,'name').click();await p.keyboard.press('ArrowDown');s=await ST();eq(s.sel,[3],'frecce saltano le righe nascoste');
await p.locator('#itemsBody .row[data-uid]').nth(0).locator('.chev').click();
eq(await p.locator('#itemsBody .row[data-uid]').count(),5,'gruppo espanso');
// 11. drag: move C above B (vertical)
async function drag(fromRow,toY,dx){
  const r=await row(fromRow).boundingBox();await row(fromRow).hover();
  const g=await row(fromRow).locator('.g').boundingBox();
  await p.mouse.move(g.x+g.width/2,g.y+g.height/2);await p.mouse.down();
  await p.mouse.move(g.x+g.width/2+dx/2,g.y+g.height/2+(toY-(g.y+g.height/2))/2,{steps:4});
  await p.mouse.move(g.x+g.width/2+dx,toY,{steps:4});
  const line=await p.locator('.dropline').count(),lab=await p.locator('.droplab').textContent().catch(()=>null);
  await p.mouse.up();return {line,lab};
}
let rb=await row(3).boundingBox();
let d=await drag(4,rb.y+2,0);ok(d.line===1,'indicatore di rilascio visibile');
eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','C:1','B:1']),'trascinamento verticale: C sopra B');
// horizontal: drag B (index 4) right by ~1 level in place -> child of C
rb=await row(4).boundingBox();
d=await drag(4,rb.y+rb.height/2+1,40);
eq(await S(),JSON.stringify(['A:1','a1:2','a2:2','C:1','B:2']),'trascinamento orizzontale: B annidato sotto C');ok(/Livello 2/.test(d.lab||''),'etichetta livello: '+d.lab);
// drag group A (with children) to the end
rb=await row(4).boundingBox();const lastBox=await p.locator('#itemsBody .row.add').boundingBox();
d=await drag(0,lastBox.y+2,0);
eq(await S(),JSON.stringify(['C:1','B:2','A:1','a1:2','a2:2']),'gruppo trascinato con i figli');
// invalid drop inside own block: no change
const before=await S();rb=await row(2).boundingBox();
d=await drag(2,rb.y+rb.height*1.5,0);eq(await S(),before,'rilascio nel proprio blocco: nessun cambiamento');
// undo drag
await p.keyboard.press('Control+z');await p.keyboard.press('Control+z');
// 12. context menu
await cell(1,'name').click({button:'right'});
ok(await p.locator('.cmenu').count()===1,'menu contestuale');
const labels=await p.locator('.cmenu .menuitem span:first-child').allTextContents();
ok(['Rinomina','Inserisci sotto','Crea sottoattività','Duplica','Elimina'].every(x=>labels.includes(x)),'voci del menu: '+labels.join('|'));
await p.locator('.cmenu .menuitem',{hasText:'Duplica'}).click();
ok((await p.evaluate(()=>window.GanttApp.P.items.length))===6,'duplica dal menu');
await p.keyboard.press('Control+z');
// dots menu
await row(1).hover();await row(1).locator('.dots').click();ok(await p.locator('.cmenu').count()===1,'menu tre puntini');await p.keyboard.press('Escape');
// 13. delete group asks confirmation
await row(0).locator('.c-id').click();dialogs=[];
const n0=await p.evaluate(()=>window.GanttApp.P.items.length);await p.keyboard.press('Delete');
ok(dialogs.length===1&&/gruppo/.test(dialogs[0]),'conferma eliminazione gruppo: '+dialogs[0]);
eq(await p.evaluate(()=>window.GanttApp.P.items.length),n0-(await p.evaluate(()=>0))-3+0===0?0:n0-3,'gruppo eliminato con figli');
await p.keyboard.press('Control+z');
// 14. columns popover
await p.locator('[data-act="cols"]').click();ok(await p.locator('.pop .switch').count()===16,'16 interruttori colonne');
await p.locator('.pop .switch').nth(5).click(); // notes on
ok(await p.locator('#itemsCols .c-notes').count()===1,'colonna Note mostrata');
await p.locator('.pop .switch').nth(0).click(); // start off
ok(await p.locator('#itemsCols .c-start').count()===0,'colonna Inizio nascosta');await p.keyboard.press('Escape');
await cell(0,'name').click();await p.keyboard.press('ArrowRight');s=await ST();eq(s.cell.c,'end','navigazione salta colonna nascosta');
// 15. Details panel editing keeps focus & commits
await cell(3,'name').click();
const nm=p.locator('#detailsBody input[data-f="name"]');await nm.fill('Beta');await nm.press('Tab');
eq(await p.evaluate(()=>window.GanttApp.P.items[3].name),'Beta','dettagli: nome modificato');
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.getAttribute('data-f')),'dettagli: il focus resta in un campo dopo la conferma');
await p.locator('#detailsBody input[data-f="start"]').fill('xx');await p.locator('#detailsBody input[data-f="start"]').press('Enter');
ok(/non valida/.test(await p.locator('#toast').textContent()),'errore mostrato dai Dettagli');
// 16. resizer
const w0=await p.locator('#pItems').evaluate(e=>e.offsetWidth);
const rz=await p.locator('#itemsResizer').boundingBox();await p.mouse.move(rz.x+3,rz.y+200);await p.mouse.down();await p.mouse.move(rz.x+103,rz.y+200,{steps:5});await p.mouse.up();
await p.waitForTimeout(400);const w1=await p.locator('#pItems').evaluate(e=>e.offsetWidth);ok(Math.abs(w1-(w0+100))<8,'ridimensionamento pannello: '+w0+' -> '+w1);
// 17. save/load roundtrip keeps view & collapsed
const json=await p.evaluate(()=>{const A=window.GanttApp;A.P.items[0].collapsed=true;return JSON.stringify(A.core.prepareSave(A.P,{now:new Date()}))});
await p.evaluate(t=>window.GanttApp.core.loadText(t,null,'x.json'),json);
eq(await p.evaluate(()=>window.GanttApp.P.view.hiddenColumns.includes('start')),true,'colonne nascoste salvate');
eq(await p.locator('#itemsBody .row[data-uid]').count()<5,true,'gruppo compresso ripristinato dal file');
ok(errs.length===0,'nessun errore: '+errs.join(' | '));
await p.screenshot({path:'u3.png'});
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();
