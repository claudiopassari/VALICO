const {chromium}=require('playwright');const fs=require('fs');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1900,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
const base=JSON.parse(fs.readFileSync('/home/claude/SIS_Perim.BOLG_COGE_Cronoprogramma_Rev.1.json'));
// 1 file senza marker
base.markers=[];fs.writeFileSync('/tmp/claude-0/nomk.json',JSON.stringify(base));
await p.setInputFiles('#fileInput','/tmp/claude-0/nomk.json');await W(800);
ok(await A(()=>GanttApp.P.markers.map(m=>m.kind).join())==='start,end,today','tre marker creati all\'apertura');
ok(await A(()=>[...document.querySelectorAll('#tlHead .mtag')].map(e=>e.textContent).join())==='Inizio lavori,Fine lavori,Oggi','marker visibili in intestazione');
// 2 file con marker personale e senza "Oggi"
base.markers=[{uid:'x1',kind:'custom',name:'Audit',color:{c:'viola',v:1},date:'2026-12-10',dateEnd:null},{uid:'x2',kind:'start',name:'Avvio',color:{c:'verde',v:1},date:null,dateEnd:null}];
fs.writeFileSync('/tmp/claude-0/mk2.json',JSON.stringify(base));
await p.setInputFiles('#fileInput','/tmp/claude-0/mk2.json');await W(800);
const k=await A(()=>GanttApp.P.markers.map(m=>m.kind+':'+m.name).join('|'));
ok(/custom:Audit/.test(k)&&/start:Avvio/.test(k)&&/end:Fine lavori/.test(k)&&/today:Oggi/.test(k),'completati senza toccare i personali: '+k);
ok(await A(()=>GanttApp.P.markers.filter(m=>m.kind==='start').length)===1,'nessun duplicato');
// 3 eliminazione non possibile (anche tramite annulla/ripeti)
await A(()=>{GanttApp.commit('t',q=>{q.markers=q.markers.filter(m=>m.kind==='custom')})});await W(150);
ok(await A(()=>GanttApp.P.markers.map(m=>m.kind).sort().join())==='custom,end,start,today','rimozione forzata: i marker di sistema tornano');
ok(errs.length===0,'errori '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
