// disegno su riga vuota: i tasti 1-4 scelgono il tipo (attività, milestone, intervallo, attesa) con anteprima
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1700,height:1400}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(500);
const geo=()=>ev(()=>{const g=GanttApp.ui.geo,tb=document.querySelector('#tlBody'),r=tb.getBoundingClientRect(),rows=document.querySelectorAll('#tlCv .trow'),n=GanttApp.core?0:0;const vis=document.querySelectorAll('#tlCv .trow:not(.emp)').length;const rr=rows[vis]?rows[vis].getBoundingClientRect():null;return {l:r.left,px:g.px,a:g.a,sl:tb.scrollLeft,top:rr?rr.top:0,h:rr?rr.height:32,vis}});
let G=await geo();
const last=()=>ev(()=>{const P=GanttApp.P;let k=P.items.length-1;while(k>0&&!P.items[k].start&&!P.items[k].name)k--;const it=P.items[k];return {type:it.type,start:it.start,end:it.end,name:it.name,n:k+1}});
const n0=(await last()).n;
async function draw(key,dx){
  G=await geo();const y=G.top+G.h/2,x0=G.l+300;
  await p.mouse.move(x0,y);await p.mouse.down();
  if(key)await p.keyboard.press(key);
  await p.mouse.move(x0+dx,y,{steps:5});await W(120);
  const tag=await p.locator('.gtag').count();const gh=await ev(()=>document.querySelector('.bar.ghost')?document.querySelector('.bar.ghost').className:'');
  await p.mouse.up();await W(400);await p.keyboard.type('x');await p.keyboard.press('Enter');await W(250);
  return {tag,gh};
}
let r=await draw(null,150);let L=await last();ok(L.n===n0+1&&L.type==='task'&&L.end>L.start,'senza tasto: attività '+JSON.stringify(L));
r=await draw('2',150);L=await last();ok(L.type==='milestone',' tasto 2: milestone '+JSON.stringify(L));ok(r.tag===1&&/gt-milestone/.test(r.gh),'anteprima milestone con etichetta '+r.gh);
r=await draw('3',150);L=await last();ok(L.type==='indication'&&L.end>L.start,'tasto 3: intervallo '+JSON.stringify(L));
r=await draw('4',150);L=await last();ok(L.type==='wait',' tasto 4: attesa '+JSON.stringify(L));
r=await draw('1',150);L=await last();ok(L.type==='task','tasto 1: attività');
// cambio idea: 2 poi 1
G=await geo();let y=G.top+G.h/2;await p.mouse.move(G.l+300,y);await p.mouse.down();await p.keyboard.press('2');await p.keyboard.press('1');await p.mouse.move(G.l+450,y,{steps:4});await p.mouse.up();await W(400);await p.keyboard.type('x');await p.keyboard.press('Enter');await W(200);
L=await last();ok(L.type==='task','vale l\'ultimo tasto premuto (2 poi 1 → attività)');
// clic senza trascinare con 2: milestone
await p.keyboard.press('Escape');await W(300);G=await geo();y=G.top+G.h/2;const nb=(await last()).n;await p.mouse.move(G.l+320,y);await p.mouse.down();await p.keyboard.press('2');await p.mouse.up();await W(400);await p.keyboard.type('x');await p.keyboard.press('Enter');await W(200);
L=await last();ok(L.n===nb+1&&L.type==='milestone','clic con 2 premuto: milestone senza trascinare '+JSON.stringify(L));
console.log('ui78 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
