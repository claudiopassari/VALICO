const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000}});let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const W=t=>p.waitForTimeout(t);p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
const addEmpty=n=>p.evaluate(n=>{const A=GanttApp;A.commit('t',p=>{for(let k=0;k<n;k++)A.core.opInsert(p,null,'end');return 'ok'});},n);
await addEmpty(3);await W(400);
const info=()=>p.evaluate(()=>{const A=GanttApp,it=A.P.items;return {n:it.length,names:it.slice(-3).map(i=>i.name),dates:it.slice(-3).map(i=>!!i.start),edit:A.ui.edit?it.findIndex(i=>i.uid===A.ui.edit.uid):null,inp:document.activeElement&&document.activeElement.tagName}});
const rowY=async k=>p.evaluate(k=>{const rs=[...document.querySelectorAll('#itemsBody .row[data-uid]')];const r=rs[rs.length-3+k].getBoundingClientRect();return r.top+r.height/2},k);
const tb=await p.locator('#tlBody').boundingBox();
const drag=async(x0,x1,y)=>{await p.mouse.move(x0,y);await p.mouse.down();await p.mouse.move((x0+x1)/2,y);await p.mouse.move(x1,y);await p.mouse.up();await W(300)};
// 1) disegno su riga senza nome: editing immediato
let y0=await rowY(0);await drag(tb.x+300,tb.x+420,y0);let r=await info();
ok(r.dates[0]===true,'barra disegnata: '+JSON.stringify(r));ok(r.edit===r.n-3&&r.inp==='INPUT','campo del nome aperto subito sulla riga disegnata '+JSON.stringify(r));
await p.keyboard.type('Alfa');
// 2) nuovo disegno senza tasti: conferma e passa alla riga successiva
let y1=await rowY(1);await drag(tb.x+500,tb.x+640,y1);r=await info();
ok(r.names[0]==='Alfa','il testo digitato è confermato dal nuovo disegno: '+JSON.stringify(r.names));ok(r.edit===r.n-2&&r.inp==='INPUT','editing sulla seconda barra '+JSON.stringify(r));
await p.keyboard.type('Beta');
// 3) clic altrove conferma
await p.mouse.click(tb.x+tb.width-40,tb.y+tb.height-30);await W(250);r=await info();ok(r.names[1]==='Beta','clic altrove conferma: '+JSON.stringify(r.names));
// 4) Esc annulla
let y2=await rowY(2);await drag(tb.x+300,tb.x+400,y2);r=await info();ok(r.edit===r.n-1,'editing sulla terza barra');
await p.keyboard.type('Gamma');await p.keyboard.press('Escape');await W(250);r=await info();ok(r.names[2]===''&&r.edit===null&&r.dates[2]===true,'Esc annulla il testo e mantiene la barra: '+JSON.stringify(r));
// 5) riga con nome: nessun editing automatico
await p.evaluate(()=>{const A=GanttApp,it=A.P.items;A.commit('t',p=>{p.items[p.items.length-1].name='Fisso';return 'ok'})});await W(300);
y2=await rowY(2);await drag(tb.x+700,tb.x+800,y2);r=await info();ok(r.names[2]==='Fisso'&&r.edit===null,'riga con nome: nessuna apertura automatica '+JSON.stringify(r));
// 6) terminologia
const labels=await p.evaluate(()=>{GanttApp.ui.sel=[GanttApp.P.items[1].uid];return 0});
ok(await p.evaluate(()=>{GanttApp.render();return [...document.querySelectorAll('#detailsBody select option')].map(o=>o.textContent).includes('Attività')}),'selettore del tipo: «Attività»');
ok(!(await p.evaluate(()=>[...document.querySelectorAll('#detailsBody select option')].map(o=>o.textContent).includes('Task'))),'nessun «Task» residuo nel selettore');
console.log('pass',pass,'fail',fail);await b.close()})();
