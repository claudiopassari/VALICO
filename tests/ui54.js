const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const W=(p,t)=>p.waitForTimeout(t);
// PC: nessuna modifica
{const c=await b.newContext({viewport:{width:1700,height:800}});const p=await c.newPage();p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await W(p,400);
const d=await p.evaluate(()=>({mob:document.documentElement.hasAttribute('data-mob'),nav:getComputedStyle(document.querySelector('#mnav')).display,cols:getComputedStyle(document.querySelector('#panels')).gridTemplateColumns.split(' ').length,st:getComputedStyle(document.querySelector('#status')).display,vis:['pDetails','pItems','pTimeline'].map(i=>getComputedStyle(document.getElementById(i)).visibility),sw:document.documentElement.scrollWidth,iw:innerWidth,idw:Math.round(document.querySelector('#itemsCols .c-id').getBoundingClientRect().width)}));
ok(!d.mob&&d.nav==='none'&&d.cols===3&&d.st!=='none'&&d.vis.every(v=>v==='visible'),'PC: layout a tre pannelli invariato '+JSON.stringify(d));ok(d.sw<=d.iw,'PC: nessuno scorrimento orizzontale della pagina');
await c.close();}
for(const [nm,vp] of [['verticale',{width:390,height:844}],['orizzontale',{width:844,height:390}],['piccolo',{width:360,height:640}]]){
 const c=await b.newContext({viewport:vp,hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();p.on('pageerror',e=>{fail++;console.log('ERR',nm,e.message)});
 await p.goto('file://'+process.cwd()+'/app.html');await W(p,400);await p.evaluate(()=>GanttApp.act.loadExample());await W(p,500);
 const st=()=>p.evaluate(()=>({mob:document.documentElement.hasAttribute('data-mob'),tab:document.documentElement.getAttribute('data-tab'),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,vis:['pItems','pTimeline','pDetails'].map(i=>getComputedStyle(document.getElementById(i)).visibility),nav:document.querySelectorAll('#mnav button[data-t]').length,navTop:Math.round(document.querySelector('#mnav').getBoundingClientRect().top),ih:innerHeight,mainH:Math.round(document.querySelector('#panels').getBoundingClientRect().height),hdrH:Math.round(document.querySelector('#hdr').getBoundingClientRect().height)}));
 let s=await st();
 ok(s.mob&&s.tab==='items','['+nm+'] modalità smartphone attiva, scheda Elenco');ok(s.sw<=s.cw,'['+nm+'] nessuno scorrimento orizzontale '+s.sw+'/'+s.cw);
 ok(s.vis.join()==='visible,hidden,hidden','['+nm+'] solo il pannello attivo è visibile '+s.vis);ok(s.nav===3,'['+nm+'] tre schede');ok(s.navTop+20<s.ih&&s.mainH>s.ih*0.35,'['+nm+'] barra inferiore dentro lo schermo e area utile sufficiente '+JSON.stringify([s.navTop,s.ih,s.mainH]));
 await p.tap('#mnav button[data-t="tl"]');await W(p,500);s=await st();ok(s.tab==='tl'&&s.vis.join()==='hidden,visible,hidden','['+nm+'] scheda Timeline');
 const tl=await p.evaluate(()=>({bars:document.querySelectorAll('#tlCv .bx.bar').length,w:Math.round(document.querySelector('#tlBody').getBoundingClientRect().width),hdr:document.querySelectorAll('#tlHead .tlr').length}));ok(tl.bars>5&&tl.w>=300,'['+nm+'] timeline disegnata '+JSON.stringify(tl));
 await p.tap('#mnav button[data-t="det"]');await W(p,300);s=await st();ok(s.vis.join()==='hidden,hidden,visible','['+nm+'] scheda Dettagli');
 // popover dentro lo schermo
 await p.tap('#mnav button[data-t="tl"]');await W(p,300);
 await p.evaluate(()=>{const b=document.querySelector('#tlCmds [data-act="tlopts"]');if(b)b.click();else{const m=document.querySelector('#tlCmds .tlmore');m&&m.click();}});await W(p,400);
 const pop=await p.evaluate(()=>{const e=document.querySelector('.pop');if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.top),Math.round(r.bottom),innerWidth,innerHeight]});
 ok(!pop||(pop[0]>=0&&pop[1]<=pop[4]&&pop[2]>=0&&pop[3]<=pop[5]),'['+nm+'] finestra dei comandi dentro lo schermo '+JSON.stringify(pop));
 await p.keyboard.press('Escape');
 // dati: lo stato del progetto non cambia con il cambio di modalità
 const n0=await p.evaluate(()=>GanttApp.P.items.length);ok(n0>10,'['+nm+'] progetto integro');
 await c.close();}
// passaggio dinamico PC <-> smartphone senza perdere il progetto
{const c=await b.newContext({viewport:{width:1700,height:800},hasTouch:true,isMobile:true});const p=await c.newPage();p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await W(p,400);await p.evaluate(()=>GanttApp.act.loadExample());await W(p,400);
const n=await p.evaluate(()=>GanttApp.P.items.length);
await p.setViewportSize({width:400,height:800});await W(p,600);ok(await p.evaluate(()=>document.documentElement.hasAttribute('data-mob')),'ridimensionando: smartphone attivo');
await p.setViewportSize({width:1700,height:800});await W(p,600);
const back=await p.evaluate(()=>({mob:document.documentElement.hasAttribute('data-mob'),cols:getComputedStyle(document.querySelector('#panels')).gridTemplateColumns.split(' ').length,vis:getComputedStyle(document.getElementById('pTimeline')).visibility,n:GanttApp.P.items.length}));
ok(!back.mob&&back.cols===3&&back.vis==='visible'&&back.n===n,'ritorno a PC: tre pannelli e progetto integro '+JSON.stringify(back));
// il file salvato non contiene impostazioni mobili
ok(await p.evaluate(()=>!/data-mob|mobTab/.test(JSON.stringify(GanttApp.P))),'il file di progetto non contiene stato mobile');
await c.close();}
{const c=await b.newContext({viewport:{width:700,height:800}});const p=await c.newPage();await p.goto('file://'+process.cwd()+'/app.html');await W(p,400);
ok(!(await p.evaluate(()=>document.documentElement.hasAttribute('data-mob'))),'finestra PC stretta (senza touch): layout invariato');await c.close();}
console.log('pass',pass,'fail',fail);await b.close()})();
