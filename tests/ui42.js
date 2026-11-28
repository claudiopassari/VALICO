const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:950}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
const W=t=>p.waitForTimeout(t);const url='file://'+process.cwd()+'/app.html';
// avvio automatizzato: nessuna finestra
await p.goto(url);await W(400);
ok(!(await p.evaluate(()=>document.getElementById('dlgWelcome').open)),'browser automatizzato: benvenuto non mostrato');
// avvio forzato
await p.goto(url+'?welcome=1');await W(500);
ok(await p.evaluate(()=>document.getElementById('dlgWelcome').open),'?welcome=1 apre la finestra');
ok(await p.locator('#dlgWelcome .wl-card').count()===15,'quindici schede presentate');
ok(await p.locator('#dlgWelcome svg.wl-ani').count()===15,'quindici animazioni SVG');
ok((await p.locator('#dlgWelcome').innerText()).includes('Claudio Passari'),'nota dello sviluppatore');
ok((await p.locator('#dlgWelcome').textContent()).includes('Il valico è il punto'),'spiegazione del nome');
ok(await p.locator('#dlgWelcome #wlLogo svg').count()===1,'logo presente');
const anim=await p.evaluate(()=>getComputedStyle(document.querySelector('#dlgWelcome .a-b1')).animationName);ok(/wlGrow/.test(anim),'animazione CSS attiva: '+anim);
await p.keyboard.press('Escape');await W(200);
ok(!(await p.evaluate(()=>document.getElementById('dlgWelcome').open)),'Esc chiude');
await p.goto(url+'?welcome=1');await W(400);
ok(await p.evaluate(()=>document.getElementById('dlgWelcome').open),'riaperta (opzione non attiva)');
await p.locator('#wlNever').check();await p.locator('#wlStart').click();await W(200);
await p.goto(url+'?welcome=1');await W(400);
ok(!(await p.evaluate(()=>document.getElementById('dlgWelcome').open)),'Non mostrare più: rispettato al riavvio');
// riapertura dalla Guida
await p.locator('[data-act="help"]').click();await W(200);
await p.locator('.pop [data-act="welcome"]').click();await W(300);
ok(await p.evaluate(()=>document.getElementById('dlgWelcome').open),'Guida > Finestra di benvenuto');
ok(await p.locator('#wlNever').isChecked(),'la casella riflette la preferenza');
await p.locator('#wlNever').uncheck();await p.locator('#wlStart').click();await W(150);
// esempio dalla Guida
await p.evaluate(()=>{window.GanttApp.ui.dirty=true});
await p.locator('[data-act="help"]').click();await W(200);
await p.locator('.pop [data-act="example"]').click();await W(600);
const r=await p.evaluate(()=>{const A=window.GanttApp,P=A.P,C=A.core;
  const today=C.todayDN();const t0=today-((new Date(today*86400000).getUTCDay()+6)%7)-7;
  return {n:P.items.length,title:P.project.title,groups:P.items.filter((i,k)=>P.items[k+1]&&P.items[k+1].level>i.level).length,wait:P.items.filter(i=>i.type==='wait').length,ms:P.items.filter(i=>i.type==='milestone').length,
   bl:P.baselines.length,per:P.periods.length,mk:P.markers.filter(m=>m.kind==='custom').length,ps:P.calendar.projectStart,first:P.items[1].start,exp:C.fromDN?C.fromDN(t0):null,
   deps:P.items.reduce((a,i)=>a+i.predecessors.length,0),dirty:A.ui.dirty,depth:Math.max(...P.items.map(i=>i.level)),gdepth:Math.max(...P.items.filter((i,k)=>P.items[k+1]&&P.items[k+1].level>i.level).map(i=>i.level)),prog:P.items.filter(i=>i.type==='task'&&i.progress>0&&i.progress<100).length}});
console.log(JSON.stringify(r));
ok(r.n===16,'16 righe: '+r.n);ok((r.title||'').includes('Esempio'),'titolo Esempio');
ok(r.groups===5,'cinque gruppi: '+r.groups);ok(r.wait===1,'una attesa');ok(r.ms===2,'due milestone');ok(r.gdepth===3,'gruppi annidati fino al terzo livello: '+r.gdepth);
ok(r.deps>=6,'dipendenze: '+r.deps);ok(r.prog>=3,'task in corso: '+r.prog);ok(r.bl===0&&r.per===0&&r.mk===0,'esempio semplice: nessuna baseline, periodo o marker aggiuntivo');
ok(r.dirty===false,'nessuna modifica non salvata');
eq(r.first,r.exp,'date relative a oggi: primo task');
ok(await p.locator('#itemsBody .row[data-uid]').count()>=16,'righe visualizzate');
ok(await p.locator('#tlCv .bar.wait').count()===1,'barra di attesa');
ok((await p.locator('#projTitle').textContent()).includes('Esempio'),'titolo in intestazione');
// pannello compresso: nessun controllo di zoom
await p.locator('#tgItems').click();await W(450);
const cl=await p.evaluate(()=>({zoom:getComputedStyle(document.getElementById('izoom')).display,w:document.getElementById('pItems').offsetWidth,vt:!!document.getElementById('vtItems')}));
eq(cl.zoom,'none','pannello Item compresso: cursore di zoom nascosto');ok(cl.w<=60,'larghezza compressa '+cl.w);
await p.locator('#tgItems').click();await W(450);
ok(await p.evaluate(()=>getComputedStyle(document.getElementById('izoom')).display!=='none'),'cursore di zoom di nuovo visibile alla riapertura');
// manipolabilità
const m=await p.evaluate(()=>{const A=window.GanttApp,C=A.core;const it=A.P.items[11];const before=A.P.items[12].start;A.commit('t',q=>C.setField(q,q.items[11].uid,'dur','12'));const after=A.P.items[12].start;A.undo();return [before!==after,A.P.items[12].start===before,A.P.items[11].duration]});
eq(m,[true,true,8],'modifica a cascata e annullamento');
// salvataggio e ricarica
const json=await p.evaluate(()=>JSON.stringify(window.GanttApp.P));
fs.writeFileSync('_ex.json',json);
await p.goto(url);await W(300);
await p.setInputFiles('#fileInput','_ex.json');await W(600);
const rt=await p.evaluate(()=>{const P=window.GanttApp.P;return [P.items.length,P.baselines.length,P.periods.length,P.items.filter(i=>i.type==='wait').length]});
eq(rt,[16,0,0,1],'ricarica da file');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
