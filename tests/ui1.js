const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');
// Alt+Enter to add, type, Tab through
await p.keyboard.press('Alt+Enter');await p.keyboard.type('Fondazioni');await p.keyboard.press('Tab');
await p.keyboard.type('23/11/26');await p.keyboard.press('Tab');await p.keyboard.type('30/11/26');await p.keyboard.press('Tab');
await p.keyboard.press('Enter'); // dur confirmed unchanged
await p.screenshot({path:'u1.png'});
const st=()=>p.evaluate(()=>JSON.stringify(window.GanttApp.P.items.map(i=>[i.name,i.level,i.type,i.start,i.end,i.duration])));
console.log('1',await st());
await p.keyboard.press('Alt+Enter');await p.keyboard.type('Struttura');await p.keyboard.press('Enter');
await p.keyboard.press('Control+Enter');await p.keyboard.type('Impianti');await p.keyboard.press('Enter');
await p.keyboard.press('Control+ArrowRight');
console.log('2',await st());
await p.keyboard.press('Control+z');
console.log('3 undo level',await st());
await p.keyboard.press('Control+y');
console.log('errors',errs);
await p.screenshot({path:'u2.png'});
await b.close()})();
