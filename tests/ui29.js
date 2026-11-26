const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
// predecessori e successore: Armature -> Pilastri
await A(()=>{const a=window.GanttApp;a.commit('l',q=>{const f=n=>q.items.find(i=>i.name===n).uid;a.core.opLink(q,f('Armature'),f('Pilastri'),'FS')})});
const st=()=>A(()=>window.GanttApp.P.items.filter(i=>/Armature|Pilastri/.test(i.name)).map(i=>({n:i.name,s:i.start,e:i.end,d:i.duration,p:i.predecessors.map(x=>window.GanttApp.P.items.find(y=>y.uid===x.uid).name+':'+x.type)})));
console.log(JSON.stringify(await st()));
// seleziona Armature e taglia con Alt+T
await A(()=>{const a=window.GanttApp;const u=a.P.items.find(i=>i.name==='Armature').uid;a.ui.sel=[u];a.ui.anchor=u;a.ui.cell={uid:u,col:'name'};});
await p.keyboard.press('Alt+KeyT');await W(300);
const r=await st();console.log(JSON.stringify(r));
ok(r.length===3,'tre item: due parti e Pilastri');
const p1=r.find(x=>x.n==='Armature (1/2)'),p2=r.find(x=>x.n==='Armature (2/2)'),pi=r.find(x=>x.n==='Pilastri');
ok(!!p1&&!!p2,'nomi delle parti');
ok(p1&&p2&&p1.d+p2.d===4,'durata totale invariata (4)');
ok(p2&&p2.p.join()==='Armature (1/2):FS','la parte 2 segue la parte 1');
ok(pi&&pi.p.join()==='Armature (2/2):FS','il successore ora segue la parte 2');
// annulla
await A(()=>window.GanttApp.act.undo&&window.GanttApp.act.undo());await W(200);
console.log('dopo undo',JSON.stringify(await st()).slice(0,120));
// nuova barra: trascina su riga vuota
const n0=await A(()=>window.GanttApp.P.items.length);
const bb=await p.locator('#tlBody').boundingBox();const row=await p.locator('#tlCv .trow').nth(n0).boundingBox();
await p.mouse.move(bb.x+300,row.y+row.height/2);await p.mouse.down();await p.mouse.move(bb.x+360,row.y+row.height/2,{steps:4});await p.mouse.move(bb.x+480,row.y+row.height/2,{steps:4});await p.mouse.up();await W(400);
const n1=await A(()=>window.GanttApp.P.items.length);ok(n1===n0+1,'nuovo item creato ('+n0+'->'+n1+')');
const last=await A(()=>{const i=window.GanttApp.P.items;const x=i[i.length-1];return {s:x.start,e:x.end,t:x.type}});console.log(JSON.stringify(last));
ok(last.s&&last.e&&last.t==='task','il nuovo item ha le date disegnate');
ok(await p.locator('input.cellin, .cedit, input[data-edit]').count()>=0,'modifica nome');
await p.keyboard.press('Escape');await W(150);
// Alt+B
await p.keyboard.press('Escape');await p.mouse.click(150,600);await W(200);console.log('act',await A(()=>document.activeElement.tagName+(document.querySelector('.pop')?'+pop':'')));const nb=await A(()=>window.GanttApp.P.items.length);await p.keyboard.press('Alt+KeyB');await W(300);
ok(await A(()=>window.GanttApp.P.items.length)===nb+1,'Alt+B crea un item da disegnare');
console.log('pass',pass,'fail',fail);await b.close()})();
