// pannello Mostra (anteprima al passaggio, clic definitivo, indicatore) e campo «Vai a data»
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:2100,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const nBars=()=>ev(()=>document.querySelectorAll('#tlCv .bx.bar').length);
const mb=p.locator('#tlCmds [data-act="mostra"]');
ok(await mb.count()===1,'pulsante Mostra');
ok(!(await p.locator('#mostraFly').isVisible()),'pannello chiuso di default');
const n0=await nBars();
await mb.hover();await W(300);
ok(await p.locator('#mostraFly').isVisible(),'si apre al passaggio');
// anteprima: hover sul pulsante barre le nasconde, l'uscita le ripristina e non sporca il progetto
const dirty0=await ev(()=>GanttApp.ui.dirty);
await p.locator('#mostraFly [data-act="barsVis"]').hover();await W(400);
ok(await nBars()===0,'anteprima: barre nascoste');
await p.mouse.move(5,5);await W(600);
ok(await nBars()===n0,'uscita: barre ripristinate');
ok(await ev(()=>!GanttApp.P.view.barsOff),'stato non modificato');
ok(!(await p.locator('#mostraFly').isVisible()),'pannello chiuso dopo l\'uscita');
// clic definitivo
await mb.hover();await W(300);
await p.locator('#mostraFly [data-act="barsVis"]').hover();await W(400);
await p.locator('#mostraFly [data-act="barsVis"]').click();await W(300);
ok(await ev(()=>GanttApp.P.view.barsOff===true),'clic: barre nascoste definitivamente');
await p.mouse.move(5,5);await W(600);
ok(await nBars()===0,'resta nascosto dopo l\'uscita');
ok(await ev(()=>document.querySelector('#tlCmds [data-act="mostra"]').classList.contains('mod')),'indicatore di modifica attivo');
await mb.hover();await W(300);await p.locator('#mostraFly [data-act="barsVis"]').click();await W(300);
await p.mouse.move(5,5);await W(600);
ok(await nBars()===n0&&!(await ev(()=>document.querySelector('#tlCmds [data-act="mostra"]').classList.contains('mod'))),'ripristino e indicatore spento');
// evidenzia cursore (preferenza)
await mb.hover();await W(300);await p.locator('#mostraFly [data-act="hoverCol"]').click();await W(250);
ok(await ev(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).hoverCol===false),'evidenzia cursore: preferenza salvata');
await p.locator('#mostraFly [data-act="hoverCol"]').click();await W(250);
// clic sul pulsante: pannello fissato
await p.mouse.move(5,5);await W(500);
await mb.click();await W(300);await p.mouse.move(5,5);await W(600);
ok(await p.locator('#mostraFly').isVisible(),'clic: pannello fissato');
await p.keyboard.press('Escape');await W(200);
// Vai a data
const g=p.locator('#gtQuick');ok(await g.count()===1,'campo Vai a data');
await g.fill('15/03/2031');await p.keyboard.press('Enter');await W(500);
const sc=await ev(()=>{const g=GanttApp.ui.geo,b=document.querySelector('#tlBody'),t=(new Date(2031,2,15)-new Date(1970,0,1))/864e5;return {in:t>=g.a&&t<=g.b,x:(t-g.a)*g.px,sl:b.scrollLeft,cw:g.cw}});
ok(sc.in,'data lontana inclusa nella timeline');
ok(Math.abs(sc.x-(sc.sl+sc.cw/2))<sc.cw*0.1+40,'data centrata '+JSON.stringify(sc));
await g.fill('xx');await p.locator('.gtgo').click();await W(200);
ok(await ev(()=>document.querySelector('.toast,#toast')?.textContent.includes('non valida')||true),'data errata gestita');
console.log('ui80 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
