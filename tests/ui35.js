const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
const n0=await A(()=>[window.GanttApp.P.markers.length,window.GanttApp.P.periods.length]);
await p.mouse.click(960,650);  // focus neutro
await p.keyboard.press('Escape');
await p.keyboard.press('Alt+KeyM');await W(100);
ok(await p.locator('#placeHint').count()===1&&await A(()=>document.body.classList.contains('placing')),'modalità marker attiva');
const bx=await p.locator('#tlBody').boundingBox();
await p.mouse.click(bx.x+400,bx.y+200);await W(200);
let n1=await A(()=>[window.GanttApp.P.markers.length,window.GanttApp.P.periods.length]);
ok(n1[0]===n0[0]+1,'marker creato con un clic: '+n0+' -> '+n1);
ok(await p.locator('#placeHint').count()===0,'suggerimento rimosso');
await p.keyboard.press('Escape');await W(100);
// periodo: due clic
await p.keyboard.press('Alt+KeyP');await W(100);
await p.mouse.click(bx.x+300,bx.y+200);await W(100);
ok(await p.locator('#placeHint').count()===1,'attesa del secondo clic');
await p.mouse.click(bx.x+500,bx.y+200);await W(200);
let n2=await A(()=>[window.GanttApp.P.markers.length,window.GanttApp.P.periods.length,window.GanttApp.P.periods.slice(-1)[0]]);
ok(n2[1]===n1[1]+1,'periodo creato con due clic');
ok(n2[2]&&n2[2].end>n2[2].start,'periodo con intervallo: '+JSON.stringify(n2[2]));
await p.keyboard.press('Escape');await W(100);
// Esc annulla
await p.keyboard.press('Alt+KeyM');await W(100);await p.keyboard.press('Escape');await W(100);
ok(await A(()=>!document.body.classList.contains('placing')),'Esc annulla la modalità');
console.log('pass',pass,'fail',fail);await b.close()})();
