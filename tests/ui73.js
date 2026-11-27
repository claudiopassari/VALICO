// PDF vettoriale: la finestra di stampa si apre una sola volta (prima: due richieste di salvataggio)
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);
await p.evaluate(()=>GanttApp.act.loadExample());await p.waitForTimeout(500);
await p.evaluate(()=>{window.__pc=0;window.__pt=setInterval(()=>{const f=document.querySelector('iframe[data-exp-print]');if(f&&f.contentWindow&&!f.contentWindow.__p){f.contentWindow.__p=1;f.contentWindow.print=function(){window.__pc++}}},2)});
for(const lay of ['standard','perphase','report']){
  await p.evaluate(()=>{window.__pc=0});
  await p.evaluate(async(lay)=>{const o=GanttApp.act.expOpts();o.fmt='pdfv';o.layout=lay;o.area='all';try{await GanttApp.act.expRun(o,'export')}catch(e){window.__err=String(e)}},lay);
  await p.waitForTimeout(2600);
  const n=await p.evaluate(()=>window.__pc);ok(n===1,lay+': print() chiamata '+n+' volte (atteso 1)');
}
console.log('ui73 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
