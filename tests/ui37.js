const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=(f,a)=>p.evaluate(f,a);
// individua una barra di task con almeno 3 giorni
const bar=await A(()=>{const g=window.GanttApp.P;const els=[...document.querySelectorAll('#tlCv .bar[data-u]')];
 for(const el of els){const it=g.items.find(x=>x.uid===el.getAttribute('data-u'));const r=el.getBoundingClientRect();if(it&&it.type==='task'&&r.width>60&&r.top>250&&r.bottom<1100)return {u:it.uid,l:r.left,r:r.right,t:r.top,b:r.bottom,s:it.start,e:it.end,n:g.items.length};}return null;});
console.log('bar',JSON.stringify(bar));
ok(!!bar,'barra trovata');
// 1) cursore e hint con Alt
await p.keyboard.down('Alt');
await p.mouse.move((bar.l+bar.r)/2,(bar.t+bar.b)/2);await W(100);
ok(await A(()=>document.body.getAttribute('data-alt'))==='cut','zona taglio su barra');
ok(await p.locator('#placeHint').count()===1,'hint visibile');
const cur=await A(()=>getComputedStyle(document.querySelector('#tlCv .bar')).cursor);
ok(/url\(/.test(cur),'cursore personalizzato forbici: '+cur.slice(0,40));
await p.mouse.move(bar.r+300,bar.b+300);await W(100);
ok(await A(()=>document.body.getAttribute('data-alt'))==='area','zona area su sfondo');
const hb=await p.locator('#tlHead').boundingBox();
await p.mouse.move(hb.x+300,hb.y+8);await W(100);
const z1=await A(()=>document.body.getAttribute('data-alt'));
console.log('zona header alto:',z1);
ok(z1==='marker','zona marker in intestazione');
const pb=await p.locator('#tlHead .pbnd').boundingBox();
await p.mouse.move(pb.x+300,pb.y+pb.height/2);await W(100);
ok(await A(()=>document.body.getAttribute('data-alt'))==='period','zona periodo');
await p.keyboard.up('Alt');await W(100);
ok(await A(()=>document.body.getAttribute('data-alt'))===null,'zona azzerata al rilascio');
ok(await p.locator('#placeHint').count()===0,'hint rimosso');
// 2) Alt+clic taglia
const nIt=bar.n;
await p.keyboard.down('Alt');
await p.mouse.move((bar.l+bar.r)/2,(bar.t+bar.b)/2);await W(50);
await p.mouse.down();await p.mouse.up();await W(300);
await p.keyboard.up('Alt');
const n2=await A(()=>window.GanttApp.P.items.length);
ok(n2===nIt+1,'taglio con Alt+clic: '+nIt+' -> '+n2);
// 3) Alt+clic in intestazione = marker
const m0=await A(()=>window.GanttApp.P.markers.length);
await p.keyboard.down('Alt');
await p.mouse.move(hb.x+600,hb.y+8);await W(50);await p.mouse.down();await p.mouse.up();await W(300);await p.keyboard.up('Alt');
ok(await A(()=>window.GanttApp.P.markers.length)===m0+1,'marker con Alt+clic');
await p.keyboard.press('Escape');await W(100);
// 4) Alt+trascina in fascia periodi
const p0=await A(()=>window.GanttApp.P.periods.length);
await p.keyboard.down('Alt');
await p.mouse.move(pb.x+700,pb.y+pb.height/2);await W(50);await p.mouse.down();await p.mouse.move(pb.x+800,pb.y+pb.height/2,{steps:5});
ok(await p.locator('#tlHead .pseg.ghost').count()===1,'ghost periodo');
await p.mouse.move(pb.x+900,pb.y+pb.height/2,{steps:5});await p.mouse.up();await W(300);await p.keyboard.up('Alt');
ok(await A(()=>window.GanttApp.P.periods.length)===p0+1,'periodo con Alt+trascina');
await p.keyboard.press('Escape');await W(100);
// 5) area: finestra vs intersezione
const tb=await p.locator('#tlBody').boundingBox();
const allBars=await A(()=>[...document.querySelectorAll('#tlCv .bar[data-u]')].map(el=>{const r=el.getBoundingClientRect();return {u:el.getAttribute('data-u'),l:r.left,r:r.right,t:r.top,b:r.bottom}}).filter(x=>x.t>250&&x.b<1100));
console.log('barre visibili',allBars.length);
const tgt=allBars[2];
await p.keyboard.press('Escape');
await p.keyboard.down('Alt');
await p.mouse.move(tb.x+3,tgt.t-3);await p.mouse.down();await p.mouse.move(tgt.r-20,tgt.b+3,{steps:6});
ok(await p.locator('#tlCv .mqbox.cross').count()===0&&await p.locator('#tlCv .mqbox.win').count()===1,'riquadro finestra');
await p.mouse.up();await W(200);await p.keyboard.up('Alt');
let sel=await A(()=>window.GanttApp.ui.sel.slice());
ok(sel.indexOf(tgt.u)<0,'finestra parziale: non seleziona');
await p.keyboard.down('Alt');
await p.mouse.move(tb.x+3,tgt.t-3);await p.mouse.down();await p.mouse.move(tgt.r+10,tgt.b+3,{steps:6});await p.mouse.up();await W(200);await p.keyboard.up('Alt');
sel=await A(()=>window.GanttApp.ui.sel.slice());
ok(sel.length>=1&&sel.indexOf(tgt.u)>=0,'finestra completa seleziona: '+sel.length);
await p.keyboard.down('Alt');
await p.mouse.move(tb.x+tb.width-60,tgt.b+3);await p.mouse.down();await p.mouse.move(tgt.r-5,tgt.t+3,{steps:6});
ok(await p.locator('#tlCv .mqbox.cross').count()===1,'riquadro intersezione');
await p.mouse.up();await W(200);await p.keyboard.up('Alt');
sel=await A(()=>window.GanttApp.ui.sel.slice());
ok(sel.indexOf(tgt.u)>=0,'intersezione seleziona toccate: '+sel.length);
// Maiusc all'inizio aggiunge
const t2=allBars[4];
await p.keyboard.down('Alt');await p.keyboard.down('Shift');
await p.mouse.move(tb.x+3,t2.t-3);await p.mouse.down();await p.keyboard.up('Shift');await p.mouse.move(t2.r+10,t2.b+3,{steps:6});await p.mouse.up();await p.keyboard.up('Alt');await W(200);
sel=await A(()=>window.GanttApp.ui.sel.slice());
ok(sel.indexOf(t2.u)>=0&&sel.indexOf(tgt.u)>=0,'Maiusc aggiunge alla selezione: '+sel.length);
// Esc annulla
const before=sel.length;
await p.keyboard.down('Alt');await p.mouse.move(tb.x+3,allBars[0].t-3);await p.mouse.down();await p.mouse.move(tb.x+800,allBars[1].b+3,{steps:5});await p.keyboard.press('Escape');await p.mouse.up();await p.keyboard.up('Alt');await W(200);
ok(await p.locator('#tlCv .mqbox').count()===0,'Esc rimuove riquadro');
// Alt+clic su collegamento
console.log('pass',pass,'fail',fail);await b.close()})();
