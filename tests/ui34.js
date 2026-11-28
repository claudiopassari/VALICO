const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300},acceptDownloads:true});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await A(()=>{const a=window.GanttApp,C=a.core;a.commit('big',q=>{
 const ph=[['Autorizzazioni','rosso',['Comune','SNAM','ITALGAS']],['Allestimento cantiere','grigio',[]],['Recinzione perimetrale','blu',['Demolizione muro','Muretto CLS','Posa nuova recinzione']],['Vie cavo','arancio',['Attraversamenti','Posa cavidotto','Ripristini']]];
 let d=new Date(2026,10,16);const fmt=x=>('0'+x.getDate()).slice(-2)+'/'+('0'+(x.getMonth()+1)).slice(-2)+'/'+String(x.getFullYear()).slice(2);
 ph.forEach((f,k)=>{const g=C.newItem(f[0]);g.level=1;g.color={c:f[1],v:1};q.items.push(g);
  f[2].forEach((n,j)=>{const t=C.newItem(n);t.level=2;q.items.push(t);const st=new Date(2026,10,16+k*14+j*9);C.setField(q,t.uid,'start',fmt(st));C.setField(q,t.uid,'dur',String(6+j*3));t.progress=[0,30,100][(k+j)%3];if(j===1)t.assignee='Rossi'});
  if(!f[2].length){C.setField(q,g.uid,'start',fmt(new Date(2026,10,23)));C.setField(q,g.uid,'dur','12')}
  const m=C.newItem('Fine '+f[0]);m.level=2;q.items.push(m);C.setField(q,m.uid,'type','milestone');C.setField(q,m.uid,'start',fmt(new Date(2027,0,3+k*20)))});
});a.ui.dirty=false;a.render()});
await p.locator('[data-act="export"]').click();await W(250);
for(const lay of ['lanes','phases','mline','status','quarter']){
  await p.locator('#dlgExp .xlayb[data-v="'+lay+'"]').click();await W(100);
  await p.locator('#dlgExp .xsegb[data-v="png"]').click();await W(100);
  const dl=p.waitForEvent('download');await p.locator('#expGo').click();const d=await dl;await d.saveAs('lay/b_'+lay+'.png');
  ok(require('fs').statSync('lay/b_'+lay+'.png').size>8000,lay);
}
console.log('pass',pass,'fail',fail);await b.close()})();
