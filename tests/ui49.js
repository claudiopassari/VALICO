const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const c=await b.newContext({viewport:{width:2300,height:1200}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await A(()=>{const A=GanttApp,C=A.core;A.commit('seed',q=>{
 const rows=[['G1',1],['T1',2],['T2',2],['T3',2],['T4',2]];
 rows.forEach(([n,l])=>{const it=C.newItem(n);it.level=l;q.items.push(it)});
 const s=(i,d,n)=>{C.setField(q,q.items[i].uid,'start',d);C.setField(q,q.items[i].uid,'dur',String(n))};
 s(1,'23/11/26',4);s(2,'27/11/26',3);s(3,'30/11/26',2);s(4,'01/12/26',1);
 q.items[1].crew=3;
});A.ui.dirty=false;A.render();A.act.setScale('days')});await W(400);
// 1 capsule
const acts=await A(()=>[...document.querySelectorAll('#tlCmds .tcap')].map(c=>[...c.children].map(e=>e.getAttribute('data-act')||'seg')));
ok(acts.length===6,'sei capsule: '+JSON.stringify(acts));
ok(JSON.stringify(acts.slice(2))===JSON.stringify([['tlopts','calendar','mostra'],['mkList','band'],['link'],['baseline']]),'ordine capsule: '+JSON.stringify(acts.slice(2)));
// 2 zoom simmetrico con Ctrl
await A(()=>GanttApp.act.setScale('weeks'));await W(300);
await A(()=>{const A=GanttApp;A.act.setScale('days')});await W(300);
const th=async()=>A(()=>{const t=document.querySelector('#zbThumb');return [parseFloat(t.style.left),parseFloat(t.style.width)]});
const t0=await th();
const zl=await p.locator('#zbThumb .zl').boundingBox();
if(zl){await p.keyboard.down('Control');await p.mouse.move(zl.x+zl.width/2,zl.y+zl.height/2);await p.mouse.down();await p.mouse.move(zl.x+zl.width/2+12,zl.y+zl.height/2,{steps:4});await p.mouse.up();await p.keyboard.up('Control');await W(300);}
const t1=await th();
const c0=t0[0]+t0[1]/2,c1=t1[0]+t1[1]/2;
console.log('zoom',JSON.stringify([t0,t1]));ok(t1[1]<t0[1],'larghezza ridotta con Ctrl: '+JSON.stringify([t0,t1]));
ok(Math.abs(c0-c1)<1.5,'centro conservato con Ctrl: '+c0+' -> '+c1);
// 3 dettagli
await p.locator('#itemsBody .row .c-name').nth(1).click();await W(200);
const lab=await A(()=>[...document.querySelectorAll('#detailsBody label.fld > span:first-child')].map(e=>e.textContent));
const idx=k=>lab.findIndex(x=>x.startsWith(k));
ok(idx('Inizio')<idx('Fine')&&idx('Fine')<idx('Durata')&&idx('Durata')<idx('Avanzamento')&&idx('Avanzamento')<idx('Assegnatario')&&idx('Assegnatario')<idx('Scadenza')&&idx('Scadenza')<idx('Persone')&&idx('Persone')<idx('Ore lavorative'),'ordine campi: '+lab.join(' | '));
ok(lab.some(x=>x==='Scadenza (data limite)'),'etichetta Scadenza');
const mh=await A(()=>document.querySelector('#detailsBody .note[data-tip^="Durata"]').textContent);
ok(/Ore-uomo: 96/.test(mh),'Ore-uomo (4gg*8*3=96): '+mh);
// 4 selettore del tipo
await A(()=>document.querySelector('#itemsBody .row:nth-child(2) .tdot').click());await W(250);
ok(await p.locator('.pop .tpick .seg button').count()===4,'quattro tipi');
await p.locator('.pop .tpick .seg button',{hasText:'Milestone'}).click();await W(150);
ok(await A(()=>GanttApp.P.items[1].type)==='task','primo clic: nessuna modifica (item con perdita dati)');
ok(/perde/.test(await p.locator('.pop .tpick .note').textContent()),'avviso perdita dati');
await p.locator('.pop .tpick .seg button',{hasText:'Milestone'}).click();await W(250);
ok(await A(()=>GanttApp.P.items[1].type)==='milestone','secondo clic: convertito');
await A(()=>GanttApp.undo());await W(200);
ok(await A(()=>GanttApp.P.items[1].type)==='task','annullamento ripristina il tipo');
// senza perdita: applicazione diretta
await p.locator('#itemsBody .row .c-name').nth(4).click();await W(150);
await A(()=>document.querySelector('#itemsBody .row:nth-child(5) .tdot').click());await W(250);
await p.locator('.pop .tpick .seg button',{hasText:'Attesa'}).click();await W(250);
ok(await A(()=>GanttApp.P.items[4].type)==='wait','conversione diretta senza perdite');
// solo gruppo: nessun selettore tipo
await A(()=>document.querySelector('#itemsBody .row:nth-child(1) .gsym').click());await W(250);
ok(await p.locator('.pop .tpick').count()===0,'gruppo: nessun selettore del tipo');
await p.keyboard.press('Escape');
ok(errs.length===0,'errori '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
