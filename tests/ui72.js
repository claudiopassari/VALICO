// interruttore «Mostra le barre»: barre e collegamenti nascosti, milestone/marker/periodi restano; persiste nel progetto
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1800,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const cnt=()=>ev(()=>({bar:document.querySelectorAll('#tlCv .bx.bar').length,grp:document.querySelectorAll('#tlCv .bx.area,#tlCv .bx.gsum').length,ms:document.querySelectorAll('#tlCv .bx.ms').length,deps:document.querySelectorAll('#tlCv .tdeps path,#tlCv .tdeps line').length,mk:document.querySelectorAll('#tlHead .mtag').length}));
const c0=await cnt();ok(c0.bar>3&&c0.ms>=1,'stato iniziale: barre e milestone presenti '+JSON.stringify(c0));
const btn=p.locator('#tlCmds [data-act="barsVis"]');ok(await btn.count()===1,'pulsante nella barra della timeline');
ok(await btn.getAttribute('aria-pressed')==='true','pulsante attivo di default');
await btn.click();await W(300);
const c1=await cnt();ok(c1.bar===0&&c1.grp===0,'barre e gruppi nascosti '+JSON.stringify(c1));ok(c1.ms===c0.ms,'milestone restano');ok(c1.deps===0,'collegamenti nascosti');ok(c1.mk===c0.mk,'marker restano');
ok(await btn.getAttribute('aria-pressed')==='false','pulsante spento');
ok(await ev(()=>GanttApp.P.items.every(i=>i.start)),'dati invariati (le date restano)');
// salvataggio e ricarica nel progetto
const j=await ev(()=>JSON.stringify(GanttApp.P.view.barsOff));ok(j==='true','barsOff nel progetto');
await btn.click();await W(300);const c2=await cnt();ok(c2.bar===c0.bar,'riattivando tornano le barre');
console.log('ui72 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
