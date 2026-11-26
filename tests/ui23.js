const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1500,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
await p.evaluate(()=>{const A=window.GanttApp;A.P.revLog.push({major:0,minor:0,issuedAt:new Date().toISOString(),author:'Claudio',note:''},{major:0,minor:1,issuedAt:new Date().toISOString(),author:'Claudio',note:'prova'});A.P.rev={major:0,minor:1};A.P.revState='issued'});
await p.locator('#verPill').click().catch(()=>{});
await p.evaluate(()=>{const d=document.querySelector('#dlgLog');const b=document.querySelector('[data-act="log"]');if(b)b.click();});
await p.waitForTimeout(300);
if(!(await p.locator('#dlgLog[open]').count())){await p.evaluate(()=>{window.GanttApp.act.openLog&&window.GanttApp.act.openLog()})}
const info=await p.evaluate(()=>{const t=document.querySelector('#logBody table');if(!t)return null;const cs=getComputedStyle(t);const r=t.getBoundingClientRect();return {pos:cs.position,h:Math.round(r.height),w:Math.round(r.width),bg:cs.backgroundColor,op:cs.opacity,rows:t.querySelectorAll('tbody tr').length}});
console.log(info);
ok(info&&info.pos==='static'&&info.op==='1'&&info.rows===2&&info.h>60,'tabella del registro normale');
await p.screenshot({path:'log23.png'});
ok(errs.length===0,'nessun errore');
console.log('pass',pass,'fail',fail);await b.close()})();
