const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1900,height:950}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
const W=t=>p.waitForTimeout(t);
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(300);
await p.evaluate(()=>window.GanttApp.act.loadExample());await W(500);await p.evaluate(()=>{GanttApp.commit('t',q=>{delete q.view.hdrLevels})});await W(300);
const rows=()=>p.locator('#tlHead .tlr').count();
const r0=await rows();
ok(await p.locator('#tlHead [data-wn]').count()===0,'riga progressiva spenta per impostazione predefinita');
// attivazione da Visualizza
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(250);
const chip=p.locator('.pop .xchip[data-lv="wprog"]');
ok(await chip.count()===1,'chip presente');ok((await chip.getAttribute('aria-pressed'))==='false','chip spento');
await chip.click();await W(350);
ok(await rows()===r0,'riga unificata con la settimana ISO: nessuna riga in più ('+r0+' -> '+await rows()+')');
const cells=await p.evaluate(()=>[...document.querySelectorAll('#tlHead [data-wn]')].map(c=>[+c.dataset.wn,c.textContent,c.classList.contains('wp1')]));
console.log(JSON.stringify(cells.slice(0,5)));
ok(cells.length>=8,'celle settimana: '+cells.length);
ok(!cells.some(c=>c[0]===0),'nessuna settimana zero');
ok(cells[0][0]<0&&cells[0][1].includes('−'),'settimane negative prima dell\'inizio: '+cells[0]);
const nums=cells.map(c=>c[0]);const mono=nums.every((n,i)=>i===0||n===nums[i-1]+1||(nums[i-1]===-1&&n===1));ok(mono,'sequenza progressiva: '+nums);
const w1=cells.find(c=>c[0]===1);ok(w1&&w1[2]&&/S1$|· 1$/.test(w1[1]),'settimana 1 evidenziata: '+JSON.stringify(w1));
// coerenza con la data di inizio: la settimana 1 contiene l'inizio
const left1=await p.evaluate(()=>{const A=window.GanttApp,g=A.ui.geo;const c=document.querySelector('#tlHead [data-wn="1"]');const dn=g.a+Math.round(parseFloat(c.style.left)/g.px);return [A.core.fromDN?A.core.fromDN(dn):dn,A.P.calendar.projectStart]});
console.log(JSON.stringify(left1));
// inizio manuale spostato di 2 settimane: la settimana 1 si sposta
await p.evaluate(()=>{const A=window.GanttApp;A.commit('ps',q=>{const d=new Date(q.calendar.projectStart+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+14);q.calendar.projectStart=d.toISOString().slice(0,10)})});await W(400);
const left2=await p.evaluate(()=>parseFloat(document.querySelector('#tlHead [data-wn="1"]').style.left));
const left1px=await p.evaluate(()=>0);
ok(left2>0,'settimana 1 ancora presente dopo lo spostamento dell\'inizio');
const nneg=await p.evaluate(()=>[...document.querySelectorAll('#tlHead [data-wn]')].filter(c=>+c.dataset.wn<0).length);ok(nneg>=3,'più settimane negative con inizio spostato: '+nneg);
// scala Giorni
await p.evaluate(()=>window.GanttApp.act.setScale('days'));await W(400);
ok(await p.locator('#tlHead [data-wn]').count()>0,'presente anche nella scala Giorni');
await p.evaluate(()=>window.GanttApp.act.setScale('months'));await W(400);
ok(await p.locator('#tlHead [data-wn]').count()===0,'assente nella scala Mesi');
await p.evaluate(()=>window.GanttApp.act.setScale('weeks'));await W(400);
// disattivazione
await p.keyboard.press("Escape");await W(200);
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(250);
await p.locator('.pop .xchip[data-lv="wprog"]').click();await W(350);
ok(await p.locator('#tlHead [data-wn]').count()===0&&await rows()===r0,'disattivata: torna com\'era');
// persistenza nel file
await p.locator('.pop .xchip[data-lv="wprog"]').click();await W(300);await p.keyboard.press('Escape');
const saved=await p.evaluate(()=>window.GanttApp.P.view.hdrLevels.wprog);eq(saved,true,'preferenza salvata nel progetto');
// ---- doppio clic sulla barra di scorrimento
await p.evaluate(()=>{const A=window.GanttApp;A.ui.px=null;});
await p.evaluate(()=>window.GanttApp.render());await W(300);
const st0=await p.evaluate(()=>{const g=window.GanttApp.ui.geo;return {px:g.px,min:g.pxMin,W:g.W,cw:g.cw}});
ok(st0.px>st0.min*1.05,'vista iniziale più ingrandita del minimo ('+st0.px.toFixed(2)+' > '+st0.min.toFixed(2)+')');
await p.locator('.zoombar').dblclick({position:{x:300,y:12}});await W(500);
const st1=await p.evaluate(()=>{const g=window.GanttApp.ui.geo,b=document.getElementById('tlBody'),t=document.getElementById('zbThumb');return {px:g.px,min:g.pxMin,W:g.W,cw:g.cw,sl:b.scrollLeft,tw:parseFloat(t.style.width)}});
ok(Math.abs(st1.px-st1.min)<1e-3,'doppio clic: zoom minimo, tutta la timeline visibile');ok(st1.W<=st1.cw+2,'larghezza timeline <= vista ('+st1.W+' / '+st1.cw+')');ok(st1.sl<=1,'scorrimento a sinistra');ok(st1.tw>=98,'cursore della barra al 100%: '+st1.tw);
await p.locator('.zoombar').dblclick({position:{x:300,y:12}});await W(500);
const st2=await p.evaluate(()=>{const g=window.GanttApp.ui.geo;return g.px});
ok(Math.abs(st2-st0.px)<0.05,'secondo doppio clic: vista precedente ('+st2.toFixed(2)+' vs '+st0.px.toFixed(2)+')');
// anche sul cursore
await p.locator('#zbThumb').dblclick();await W(500);
const st3=await p.evaluate(()=>{const g=window.GanttApp.ui.geo;return Math.abs(g.px-g.pxMin)<1e-3});ok(st3,'doppio clic sul cursore: adatta');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
