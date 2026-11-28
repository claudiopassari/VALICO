const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:2100,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
// colonna calcolata Ore/giorno tot.
await A(()=>{const A=window.GanttApp;A.commit('v',q=>{q.view.shownColumns=(q.view.shownColumns||[]).concat(['hours','crew','hpd']).filter((x,i,a)=>a.indexOf(x)===i)})});await W(200);
await AA(()=>{const A=window.GanttApp;A.commit('c',q=>{const it=q.items.find(i=>i.name==='Scavi');it.hoursPerDay=6;it.crew=3})});await W(150);
const txt=await AA(()=>{const A=window.GanttApp;const r=document.querySelector('#itemsBody .row[data-uid="'+A.P.items.find(i=>i.name==='Scavi').uid+'"] .c-hpd');return r?r.textContent:null});
eq(txt,'18','Ore/giorno tot. = 6 x 3');
const ro=await AA(()=>{const A=window.GanttApp;return document.querySelector('#itemsBody .row[data-uid="'+A.P.items.find(i=>i.name==='Scavi').uid+'"] .c-hpd').classList.contains('ro')});
ok(ro,'colonna calcolata in sola lettura');
// riordino per trascinamento dell'intestazione
const order0=await A(()=>[...document.querySelectorAll('#itemsCols .c[data-hcol]')].map(x=>x.getAttribute('data-hcol')));
const pos=id=>AA(id=>{const r=document.querySelector('#itemsCols .c[data-hcol="'+id+'"]').getBoundingClientRect();return [r.left,r.right,r.top+r.height/2]},id);
const a=await pos('end'),t=await pos('start');
await p.mouse.move((a[0]+a[1])/2,a[2]);await p.mouse.down();await p.mouse.move((t[0]+t[1])/2-10,a[2],{steps:8});
ok(await p.locator('.hdmark').count()===1,'indicatore di destinazione visibile durante il trascinamento');
await p.mouse.up();await W(200);
const order1=await A(()=>[...document.querySelectorAll('#itemsCols .c[data-hcol]')].map(x=>x.getAttribute('data-hcol')));
ok(order1.indexOf('end')<order1.indexOf('start'),'Fine spostata prima di Inizio: '+order1.join(','));
eq(order1[0],'name','la colonna Nome resta prima');
ok(await A(()=>Array.isArray(window.GanttApp.P.view.colOrder)),'ordine salvato nel progetto');
await A(()=>window.GanttApp.undo&&0);
// Vai a data: calendario con trascinamento
await A(()=>{const i=document.querySelector('.gtin');if(i){i.value='';i.focus();i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))}});await W(250);
ok(await p.locator('.rngcal').count()===1,'calendario con selezione a trascinamento nel popover Vai a data');
const days=await A(()=>[...document.querySelectorAll('.rngcal button.d:not(.o)')].slice(9,13).map(x=>{const r=x.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,x.getAttribute('data-dn')]}));
await p.mouse.move(days[0][0],days[0][1]);await p.mouse.down();await p.mouse.move(days[3][0],days[3][1],{steps:5});
ok(await p.locator('.rngcal .d.rg').count()===4,'intervallo evidenziato durante il trascinamento: '+await p.locator('.rngcal .d.rg').count());
await p.mouse.up();await W(300);
ok(await p.locator('.gotop').count()===0,'popover chiuso dopo la selezione');
ok(errs.length===0,'nessun errore: '+errs.join('|'));
// calendario virtuale: Vai a data con griglia G1..G35 e trascinamento
await A(()=>{const A=window.GanttApp;A.commit('virt',q=>{A.core.opToVirtual(q)})});await W(300);
await A(()=>{const i=document.querySelector('.gtin');i.value='';i.focus();i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))});await W(250);
ok(await p.locator('.rngcal').count()===1,'calendario virtuale: selettore di giorni presente');
ok(await p.locator('.rngcal button.d').count()===35,'35 giorni numerati per pagina');
const vd=await A(()=>[...document.querySelectorAll('.rngcal button.d')].slice(2,6).map(x=>{const r=x.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,x.textContent]}));
eq(vd.map(x=>x[2]),['G3','G4','G5','G6'],'etichette G');
await p.mouse.move(vd[0][0],vd[0][1]);await p.mouse.down();await p.mouse.move(vd[3][0],vd[3][1],{steps:5});await p.mouse.up();await W(300);
ok(await p.locator('.gotop').count()===0,'popover chiuso dopo la selezione dell\'intervallo virtuale');
ok(errs.length===0,'nessun errore (virtuale): '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
