const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1800,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
await p.locator('#tgDetails').click();await p.waitForTimeout(500);
const it=(i)=>p.evaluate(i=>{const x=window.GanttApp.P.items[i];return {s:x.start,e:x.end,d:x.duration,ls:x.lockStart,le:x.lockEnd,n:x.name}},i);
// ---- motore
const eng=await p.evaluate(()=>{const c=window.GanttApp.core;return {w47:c.isoWeek(c.toDN('2026-11-16')),w1:c.isoWeek(c.toDN('2026-01-01')),w53:c.isoWeek(c.toDN('2026-12-31')),mon:c.fromDN(c.mondayOf(c.toDN('2026-11-22')))}});
eq(eng,{w47:47,w1:1,w53:53,mon:'2026-11-16'},'settimane ISO e lunedì');
const ex=await p.evaluate(()=>{const c=window.GanttApp;const e=c.core.tlExtent(c.P);return {a:c.core.fromDN(e.a),b:c.core.fromDN(e.b),mn:c.core.fromDN(e.mn),mx:c.core.fromDN(e.mx)}});
eq(ex.a,'2026-11-16','estensione: 1 settimana prima, al lunedì');ok(ex.b>='2027-01-10'&&ex.b<'2027-01-17','estensione: 3 settimane dopo '+ex.b);
const rg=await p.evaluate(()=>{const A=window.GanttApp,c=A.core,P=JSON.parse(JSON.stringify(A.P));
  const iScavi=P.items.findIndex(x=>x.name==='Scavi');
  const r={};
  try{c.opBarRange(P,P.items[iScavi].uid,'2026-11-21','2026-11-29');r.a=[P.items[iScavi].start,P.items[iScavi].end,P.items[iScavi].duration]}catch(e){r.a=e.message}
  const P2=JSON.parse(JSON.stringify(A.P));P2.items[iScavi].lockStart=true;
  try{c.opBarRange(P2,P2.items[iScavi].uid,'2026-11-24','2026-11-27');r.b='nessun errore'}catch(e){r.b=e.message}
  try{c.opBarMove(P2,P2.items[iScavi].uid,3);r.c='nessun errore'}catch(e){r.c=e.message}
  const P3=JSON.parse(JSON.stringify(A.P));const iG=P3.items.findIndex(x=>x.name==='Fondazioni');
  const before=P3.items.filter((x,i)=>i>iG&&i<iG+5).map(x=>x.start);
  c.opBarMove(P3,P3.items[iG].uid,7);r.d=P3.items[iG+1].start;
  return r});
eq(rg.a,['2026-11-23','2026-11-27',5],'opBarRange: estremi su giorni non lavorativi agganciati (sab 21->lun 23; dom 29->ven 27)');
ok(/bloccato/.test(rg.b),'opBarRange: inizio bloccato rifiutato');ok(/bloccata/.test(rg.c),'opBarMove: data bloccata rifiutata');
eq(rg.d,'2026-11-30','spostamento di un gruppo: figlio +7 giorni');
// ---- interfaccia: geometria
const geo=()=>p.evaluate(()=>{const g=window.GanttApp.ui.geo;return {a:g.a,px:g.px,W:g.W}});
const g0=await geo();
const rowBox=async k=>await p.locator('#tlCv .trow').nth(k).boundingBox();
const cvBox=async()=>await p.locator('#tlCv').boundingBox();
const xOf=async dn=>{const c=await cvBox();const g=await geo();return c.x+(dn-g.a)*g.px};
const dnOf=iso=>p.evaluate(iso=>window.GanttApp.core.toDN(iso),iso);
// righe allineate all'elenco
const lr=await p.locator('#itemsBody .row[data-uid]').nth(3).boundingBox(), tr=await rowBox(3);
ok(Math.abs(lr.y-tr.y)<1.5&&Math.abs(lr.height-tr.height)<1.5,'righe timeline allineate a quelle dell\'elenco '+lr.y+' '+tr.y);
// barre presenti
ok(await p.locator('#tlCv .bar').count()>=5,'barre disegnate');
ok(await p.locator('#tlCv .ms').count()===1,'milestone disegnata');
ok(await p.locator('#tlCv .area').count()>=1,'aree dei gruppi (compatta)');
// spostamento con trascinamento: Armature (riga 4 indice) di +7 giorni
const iArm=await p.evaluate(()=>window.GanttApp.P.items.findIndex(x=>x.name==='Armature'));
const k=await p.evaluate(i=>window.GanttApp.act.visRows().indexOf(i),iArm);
const s0=await it(iArm);const dn0=await dnOf(s0.s);
await p.locator('#tlBody').evaluate((el,x)=>{el.scrollLeft=x},0);await p.waitForTimeout(100);
let rb=await rowBox(k);let x0=await xOf(dn0);
let sx=x0+8, y=rb.y+rb.height/2;
// il trascinamento si basa sul corpo della barra
await p.mouse.move(sx+ (await geo()).px*0.2,y);await p.mouse.down();await p.mouse.move(sx+60,y,{steps:4});await p.mouse.move(sx+(await geo()).px*7,y,{steps:6});await p.mouse.up();
let s1=await it(iArm);
eq(s1.s,'2026-12-03','spostamento della barra di 7 giorni (da 26 nov)');eq(s1.d,s0.d,'durata invariata dopo lo spostamento');
await p.keyboard.press('Control+z');
eq((await it(iArm)).s,s0.s,'annulla lo spostamento');
// ridimensionamento: bordo destro di Armature di +2 giorni
const s2=await it(iArm);const e2=await dnOf(s2.e);
await p.waitForTimeout(100);rb=await rowBox(k);
let xr=await xOf(e2+1)+5;
await p.mouse.move(xr,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(xr+30,rb.y+rb.height/2,{steps:3});await p.mouse.move(xr+(await geo()).px*3,rb.y+rb.height/2,{steps:5});await p.mouse.up();
const s3=await it(iArm);ok(s3.e>s2.e&&s3.d>s2.d,'ridimensionamento del bordo finale: '+JSON.stringify(s3));eq(s3.s,s2.s,'l\'inizio non cambia');
await p.keyboard.press('Control+z');
// disegno su Collaudo (senza date)
const iCol=await p.evaluate(()=>window.GanttApp.P.items.findIndex(x=>x.name==='Collaudo'));
const kc=await p.evaluate(i=>window.GanttApp.act.visRows().indexOf(i),iCol);
const dd=await dnOf('2026-12-14');rb=await rowBox(kc);const gx=await geo();
const xa=await xOf(dd)+gx.px*0.4, xb=await xOf(dd+4)+gx.px*0.4;
await p.mouse.move(xa,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(xa+20,rb.y+rb.height/2,{steps:3});await p.mouse.move(xb,rb.y+rb.height/2,{steps:5});await p.mouse.up();
const sc=await it(iCol);eq([sc.s,sc.e,sc.d],['2026-12-14','2026-12-18',5],'disegno della barra su una riga senza date');
await p.keyboard.press('Control+z');eq((await it(iCol)).s,null,'annulla il disegno');
// un clic semplice seleziona e non crea
await p.mouse.click(xa,rb.y+rb.height/2);eq((await it(iCol)).s,null,'clic senza trascinamento non crea la barra');
ok(await p.evaluate(()=>window.GanttApp.ui.sel.length===1),'clic sulla timeline seleziona la riga');
ok(await p.locator('#tlCv .trow.sel').count()===1,'riga evidenziata nella timeline');
// barra bloccata non si sposta
await p.evaluate(i=>{const A=window.GanttApp;A.commit('lock',p=>{p.items[i].lockStart=true})},iArm);
await p.waitForTimeout(100);rb=await rowBox(k);x0=await xOf(await dnOf((await it(iArm)).s));
await p.mouse.move(x0+14,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(x0+60,rb.y+rb.height/2,{steps:4});await p.mouse.move(x0+14+(await geo()).px*4,rb.y+rb.height/2,{steps:4});await p.mouse.up();
eq((await it(iArm)).s,s0.s,'una data bloccata impedisce lo spostamento');
await p.evaluate(i=>{window.GanttApp.commit('unlock',p=>{p.items[i].lockStart=false})},iArm);
// scale
await p.locator('#tlCmds .seg button',{hasText:'Mesi'}).click();await p.waitForTimeout(200);
eq(await p.evaluate(()=>window.GanttApp.P.view.scale),'months','scala Mesi salvata nella vista');
ok(await p.locator('#tlHead .tlr').count()===2,'scala Mesi: due livelli di intestazione');
await p.locator('#tlCmds .seg button',{hasText:'Giorni'}).click();await p.waitForTimeout(200);
ok(await p.locator('#tlHead .tlr').count()===5,'scala Giorni: cinque livelli');
await p.locator('#tlCmds [data-act="tlopts"]').click();await p.locator('.pop .seg button',{hasText:'Estesa'}).click();await p.keyboard.press('Escape');await p.waitForTimeout(200);
ok(await p.locator('#tlCv .gsum').count()>=3&&await p.locator('#tlCv .area').count()===0,'gruppi estesi: barre di riepilogo');
await p.locator('#tlCmds [data-act="tlopts"]').click();await p.locator('.pop .seg button',{hasText:'Compatta'}).first().click();await p.keyboard.press('Escape');await p.waitForTimeout(200);
// opzioni timeline: livelli e margini
await p.locator('#tlCmds [data-act="tlopts"]').click();
await p.locator('.pop .xchip[data-lv="num"]').click();await p.waitForTimeout(150);
ok(await p.locator('#tlHead .tlr').count()===4,'livello Numero del giorno nascosto');
await p.keyboard.press('Escape');await p.mouse.click(10,400);
await p.locator('#tlCmds [aria-label^="Calendario del progetto"]').click();await p.waitForTimeout(150);
await p.locator('.pop input[aria-label="Prima del primo item"]').fill('10');await p.keyboard.press('Tab');await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.mouse.click(10,400);
await p.locator('#tlCmds [data-act="tlopts"]').click();await p.waitForTimeout(150);
const ex2=await p.evaluate(()=>{const c=window.GanttApp;const e=c.core.tlExtent(c.P);return c.core.fromDN(e.a)});
eq(ex2,'2026-09-14','margine iniziale di 10 settimane');
await p.locator('.pop .swrow',{hasText:'Attenua il passato'}).locator('.switch').click();await p.waitForTimeout(150);
ok(await p.locator('#tlCv .tveil').count()===1,'passato attenuato');
await p.keyboard.press('Escape');await p.mouse.click(10,400);
// Vai a oggi
await p.locator('#tlBody').evaluate(el=>{el.scrollLeft=0});
await p.locator('#tlCmds [aria-label="Vai a oggi"]').click();await p.waitForTimeout(100);
ok(await p.locator('#tlBody').evaluate(el=>el.scrollLeft)>0,'Vai a oggi scorre la timeline');
// zoom: trascina la maniglia sinistra verso destra restringe l'intervallo => px aumenta
const px0=(await geo()).px;const zl=await p.locator('#zbThumb .zl').boundingBox();
await p.mouse.move(zl.x+9,zl.y+9);await p.mouse.down();await p.mouse.move(zl.x+60,zl.y+9,{steps:4});await p.mouse.move(zl.x+120,zl.y+9,{steps:4});await p.mouse.up();await p.waitForTimeout(200);
ok((await geo()).px>px0,'zoom con la maniglia: più pixel per giorno '+px0+' -> '+(await geo()).px);
// calendario: il sabato diventa lavorativo
await p.locator('#tlCmds [aria-label^="Calendario del progetto"]').click();
await p.locator('.pop .wd',{hasText:'S'}).first().click();await p.waitForTimeout(150);
ok(await p.evaluate(()=>window.GanttApp.P.calendar.workingDays.indexOf(6)>=0),'sabato lavorativo');
await p.keyboard.press('Escape');await p.mouse.click(10,400);
await p.keyboard.press('Control+z');await p.waitForTimeout(100);
ok(await p.evaluate(()=>window.GanttApp.P.calendar.workingDays.indexOf(6)<0),'annulla la modifica del calendario');
// marker
{const hb0=await p.locator('#tlHead').boundingBox();await p.keyboard.down('Alt');await p.mouse.move(hb0.x+hb0.width/2,hb0.y+6);await p.mouse.click(hb0.x+hb0.width/2,hb0.y+6);await p.keyboard.up('Alt');await p.waitForTimeout(250);}
eq(await p.evaluate(()=>window.GanttApp.P.markers.length),4,'nuovo marker aggiunto');
ok(await p.locator('#tlHead .mtag',{hasText:'Nuovo marker'}).count()===1,'etichetta del marker in intestazione');
await p.keyboard.press('Escape');await p.mouse.click(10,400);
ok(await p.locator('#tlCv .tml').count()>=3,'linee dei marker nel grafico');
await p.screenshot({path:'t_ui8.png'});
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close()})();
