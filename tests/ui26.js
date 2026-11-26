const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const A=f=>p.evaluate(f);const W=t=>p.waitForTimeout(t);
// calendario: eccezioni
await p.locator('#tlCmds [aria-label^="Calendario del progetto"]').click();await W(200);
ok(await p.locator('.pop .dbox .calb').count()===1,'eccezione: pulsante calendario');
await p.locator('.pop .dbox .calb').click();await W(150);
ok(await p.locator('.pop .cinl .calp').count()===1,'calendario a comparsa aperto');
await p.locator('.pop .cinl .d:not(.o)').nth(9).click();await W(100);
const v=await p.locator('.pop .dbox input').inputValue();console.log('valore',v);ok(/\d{1,2} [a-z]{3} \d{2}/.test(v),'data inserita nella casella');
ok(await p.locator('.pop .cinl').count()===0,'calendario chiuso dopo la scelta');
await p.locator('.pop .btn',{hasText:'Aggiungi'}).click();await W(200);
ok(await A(()=>window.GanttApp.P.calendar.exceptions.length)===1,'eccezione aggiunta');
await p.keyboard.press('Escape');await p.mouse.click(10,400);await W(100);
// marker
await p.evaluate(()=>document.querySelector('#tlCmds [data-act="mkList"]').click());await W(250);
ok(await p.locator('.pop .mkr .dbox .calb').count()>=2,'marker: pulsanti calendario');
await p.keyboard.press('Escape');await p.mouse.click(10,400);await W(100);
// periodi
await A(()=>{const a=window.GanttApp;a.commit('p',q=>{q.periods.push({uid:'pp1',name:'Fase',start:'2026-12-01',end:'2026-12-10',color:{c:'blu',v:1}})})});
await p.locator('#tlCmds [data-act="band"]').click().catch(()=>{});await W(250);
console.log('periodi dbox',await p.locator('.pop .pdr .dbox').count());
ok(await p.locator('.pop .pdr .dbox .calb').count()>=2,'periodi: pulsanti calendario');
if(await p.locator('.pop .pdr .dbox .calb').count()>=2){
await p.locator('.pop .pdr .dbox .calb').nth(1).click();await W(150);
await p.locator('.pop .cinl .d:not(.o)').nth(20).click();await W(250);
const e=await A(()=>window.GanttApp.P.periods.find(x=>x.uid==='pp1').end);console.log('fine periodo',e);ok(e!=='2026-12-10','fine periodo modificata dal calendario');}
console.log('pass',pass,'fail',fail);await b.close()})();
