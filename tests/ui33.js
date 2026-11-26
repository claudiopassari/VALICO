const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300},acceptDownloads:true});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await A(()=>{const a=window.GanttApp;a.commit('t',q=>{const f=n=>q.items.find(i=>i.name===n);f('Fondazioni').color={c:'rosso',v:1};f('Struttura').color={c:'verde',v:1};f('Impianti').color={c:'arancio',v:1};f('Scavi').progress=100;f('Getti').progress=40;f('Armature').assignee='Rossi'})});
await p.locator('[data-act="export"]').click();await W(250);
ok(await p.locator('#dlgExp .xlayb').count()===8,'8 layout');
for(const lay of ['lanes','phases','mline','status','quarter']){
  await p.locator('#dlgExp .xlayb[data-v="'+lay+'"]').click();await W(100);
  await p.locator('#dlgExp .xsegb[data-v="svg"]').click();await W(100);
  let dl=p.waitForEvent('download');await p.locator('#expGo').click();let d=await dl;
  const f='lay/'+lay+'.svg';await d.saveAs(f);
  const t=require('fs').readFileSync(f,'utf8');
  ok(t.startsWith('<svg')&&t.length>1500,lay+' svg generato '+t.length);
  ok(!/NaN|undefined/.test(t),lay+' senza NaN/undefined: '+(t.match(/.{40}(NaN|undefined).{40}/)||[''])[0]);
  await p.locator('#dlgExp .xsegb[data-v="png"]').click();await W(100);
  dl=p.waitForEvent('download');await p.locator('#expGo').click();d=await dl;await d.saveAs('lay/'+lay+'.png');
  ok(require('fs').statSync('lay/'+lay+'.png').size>5000,lay+' png');
}
await p.locator('#dlgExp .xlayb[data-v="standard"]').click();await W(100);
let dl=p.waitForEvent('download');await p.locator('#expGo').click();let d=await dl;await d.saveAs('lay/standard.png');ok(require('fs').statSync('lay/standard.png').size>5000,'standard png ancora ok');
console.log('pass',pass,'fail',fail);await b.close()})();
