const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:800},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const rows=()=>p.locator('#itemsBody .row[data-uid]');
const asg=i=>p.evaluate(i=>window.GanttApp.P.items[i].assignee,i);
const cell=(i,c)=>rows().nth(i).locator('.c-'+c);
// popola assegnatari
for(const [i,n] of [[2,'Rossi Mario'],[4,'Rossetti Anna'],[5,'Bianchi Luca']]){await cell(i,'assignee').click();await p.keyboard.type(n);await p.keyboard.press('Enter');}
eq(await asg(2),'Rossi Mario','assegnatario inserito');
// suggerimenti dinamici
await cell(7,'assignee').click();await p.keyboard.type('ros');
eq(await p.locator('.sug .sugi').count(),2,'ros: 2 suggerimenti');
await p.keyboard.type('s');await p.waitForTimeout(50);
eq(await p.locator('.sug .sugi').count(),2,'ross: 2');
await p.keyboard.type('i');
eq(await p.locator('.sug .sugi').count(),1,'rossi: 1 (si aggiorna ad ogni carattere)');
await p.screenshot({path:'s_sug.png',clip:{x:300,y:100,width:1100,height:500}});
await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');
eq(await asg(7),'Rossi Mario','freccia+Invio sceglie il suggerimento');
ok(await p.locator('.sug').count()===0,'elenco chiuso dopo la scelta');
// ArrowDown a campo vuoto: elenco completo; Esc chiude solo l'elenco
await cell(7,'assignee').click();await p.keyboard.press('F2');await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');await p.keyboard.press('ArrowDown');
eq(await p.locator('.sug .sugi').count(),3,'freccia giù a campo vuoto: tutti');
await p.keyboard.press('ArrowDown');await p.keyboard.press('Escape');
ok(await p.locator('.sug').count()===0,'Esc chiude l\'elenco');
ok(await p.evaluate(()=>!!window.GanttApp.ui.edit),'Esc con elenco aperto non annulla la modifica');
await p.keyboard.type('Nuovo Nome');await p.keyboard.press('Enter');
eq(await asg(7),'Nuovo Nome','Invio senza evidenziazione: valore digitato');
// clic su suggerimento
await cell(8,'assignee').click();await p.keyboard.type('bia');await p.locator('.sug .sugi').first().click();
eq(await asg(8),'Bianchi Luca','clic su suggerimento');
// pannello Dettagli
await rows().nth(8).locator('.c-name .t').click();
const f=p.locator('#detailsBody [data-f="assignee"]');await f.click();await f.fill('');await f.type('ros');
eq(await p.locator('.sug .sugi').count(),2,'Dettagli: suggerimenti');
await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');
await p.waitForTimeout(100);
ok((await asg(8))==='Rossetti Anna'||(await asg(8))==='Rossi Mario','Dettagli: scelta applicata '+await asg(8));
// avanzamento
await rows().nth(2).hover();
const dd=rows().nth(2).locator('.ddb');ok(await dd.count()===1,'tendina avanzamento presente');
ok(await rows().nth(3).locator('.ddb').count()===0,'assente sui gruppi');
await dd.click();eq(await p.locator('.pgm .menuitem').count(),11,'11 voci 0..100');
await p.screenshot({path:'s_pg.png',clip:{x:600,y:100,width:800,height:500}});
await p.locator('.pgm .menuitem',{hasText:'40%'}).click();
eq(await p.evaluate(()=>window.GanttApp.P.items[2].progress),40,'scelta 40%');
await rows().nth(2).hover();await dd.click();await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');
eq(await p.evaluate(()=>window.GanttApp.P.items[2].progress),50,'tastiera: da 40 a 50');
// revisione: maggiore prima
await p.evaluate(()=>window.GanttApp.act.openRevDialog&&window.GanttApp.act.openRevDialog());
const first=await p.evaluate(()=>{const d=document.querySelector('#dlgVer');return d.querySelector('input[name=kind]').value});
// titoli verticali
await p.evaluate(()=>{const d=document.querySelector('#dlgVer');if(d.open)d.close()});
await p.locator('#tgDetails').click();await p.waitForTimeout(400);
ok(await p.locator('#pDetails .vt').isVisible(),'titolo verticale Dettagli');
await p.locator('#tgItems').click();await p.waitForTimeout(500);
ok(await p.locator('#vtItems').isVisible(),'titolo verticale Item');
await p.screenshot({path:'s_vt.png',clip:{x:0,y:0,width:500,height:800}});
console.log('first radio',first);
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close()})();
