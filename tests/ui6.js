const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const names=()=>p.evaluate(()=>window.GanttApp.P.items.map(i=>i.name));
const ST=()=>p.evaluate(()=>({edit:!!window.GanttApp.ui.edit,n:window.GanttApp.P.items.length}));p.on('dialog',d=>d.accept());
// header Item: ordine ITEM | comandi ... toggle
const lay=await p.evaluate(()=>{const h=document.querySelector('#pItems .phead');const r=e=>h.querySelector(e).getBoundingClientRect();return {h2:r('h2').left,sep:r('.vsep').left,cmd:r('#itemCmds').left,tg:r('#tgItems').left}});
ok(lay.h2<lay.sep&&lay.sep<lay.cmd&&lay.cmd<lay.tg,'ordine header Item '+JSON.stringify(lay));
ok(await p.locator('#itemCmds [data-act="lock"]').count()===1,'lucchetto nel pannello Item');
ok(await p.locator('#tlCmds [data-act="lock"]').count()===0,'lucchetto non più nella barra');
// pulsanti salvataggio
const cls=await p.evaluate(()=>{const f=t=>[...document.querySelectorAll('#hbtns .btn')].find(b=>b.textContent.indexOf(t)>=0);return {s:f('Sovrascrivi')&&f('Sovrascrivi').className,a:f('Aggiorna revisione')&&f('Aggiorna revisione').className}});
ok(cls.s&&cls.s.indexOf('primary')<0,'Sovrascrivi normale '+cls.s);ok(cls.a&&cls.a.indexOf('primary')>=0,'Aggiorna revisione primary '+cls.a);
// navigazione
await p.evaluate(()=>{const A=window.GanttApp;A.ui.dirty=false});
const vis=await p.evaluate(()=>window.GanttApp.act.visRows? window.GanttApp.act.visRows().length : -1);
await p.locator('#itemsBody .row[data-uid]').first().locator('.c-name .t').click();
// vai all'ultima riga
await p.locator('#itemsBody .row[data-uid]').last().locator('.c-name .t').click();
const n0=(await ST()).n;
await p.keyboard.press('F2');await p.keyboard.press('End');await p.keyboard.type('Z');await p.keyboard.press('Enter');
let st=await ST();eq([st.n,st.edit],[n0+1,true],'Invio su ultima riga: nuova riga in modifica');
await p.keyboard.type('Y');await p.keyboard.press('Enter');
st=await ST();eq([st.n,st.edit],[n0+2,true],'Invio su riga nuova con testo: serie');
await p.keyboard.press('Enter');
st=await ST();eq([st.n,st.edit],[n0+1,false],'Invio su riga nuova vuota: la rimuove');
await p.keyboard.press('Control+Enter');await p.keyboard.press('Escape');
st=await ST();eq([st.n,st.edit],[n0+1,false],'Esc su riga nuova vuota: la rimuove');
// calendario: intervallo evidenziato
await p.evaluate(()=>{const A=window.GanttApp;A.ui.cell={uid:A.P.items[2].uid,col:'start'}});
const r2=p.locator('#itemsBody .row[data-uid]').nth(2);await r2.locator('.calb').first().click();await p.waitForTimeout(200);
const nin=await p.locator('.calp .d.in').count();ok(nin>=1,'giorni nell\'intervallo evidenziati '+nin);
await p.locator('.calp .d:not(.in):not(.o)').last().hover();await p.waitForTimeout(100);
ok(await p.locator('.calp .d.pv').count()>=0,'anteprima hover');
await p.screenshot({path:'c1.png'});await p.keyboard.press('Escape');
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close()})();
