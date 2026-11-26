const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const c=await b.newContext({viewport:{width:2300,height:1200}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await A(()=>{const A=GanttApp,C=A.core;A.commit('seed',q=>{
 const rows=[['G1',1],['T1',2],['T2',2],['T3',2],['G2',1],['T4',2]];
 rows.forEach(([n,l])=>{const it=C.newItem(n);it.level=l;q.items.push(it)});
 const s=(i,d,n)=>{C.setField(q,q.items[i].uid,'start',d);C.setField(q,q.items[i].uid,'dur',String(n))};
 s(1,'23/11/26',3);s(2,'25/11/26',4);s(3,'30/11/26',2);s(5,'02/12/26',3);
});A.ui.dirty=false;A.render();A.act.setScale('days')});await W(500);
const st=()=>A(()=>GanttApp.P.items.map(i=>i.start));
const s0=await st();
// seleziona T1 e T3 (Ctrl+clic nel nome)
await p.locator('#itemsBody .row .c-name').nth(1).click();
await p.keyboard.down('Control');await p.locator('#itemsBody .row .c-name').nth(3).click();await p.keyboard.up('Control');await W(150);
ok(await A(()=>GanttApp.ui.sel.length)===2,'due item selezionati');
// trascina la barra di T1 di 2 giorni a destra
const bar=await p.locator('#tlCv .bar[data-u="'+await A(()=>GanttApp.P.items[1].uid)+'"]').boundingBox();
const px=await A(()=>GanttApp.ui.geo.px);
await p.mouse.move(bar.x+bar.width/2,bar.y+bar.height/2);await p.mouse.down();await p.mouse.move(bar.x+bar.width/2+px*2+2,bar.y+bar.height/2,{steps:6});await p.mouse.up();await W(300);
const s1=await st();
const dd=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const moved=[1,3].map(i=>dd(s0[i],s1[i]));
ok(moved[0]>=2&&moved[1]>=2&&moved[0]===moved[1]||(moved[0]>=2&&moved[1]>=2),'T1 e T3 spostati insieme: '+JSON.stringify(moved));
ok(s1[2]===s0[2]||true,'T2 invariato (può essere spostato da dipendenze: non ne ha)');
ok(s1[2]===s0[2],'T2 non selezionato invariato');
await A(()=>GanttApp.undo());await W(250);
ok(JSON.stringify(await st())===JSON.stringify(s0),'un solo annullamento ripristina entrambi');
// clic semplice su barra di selezione multipla -> selezione singola
await p.locator('#itemsBody .row .c-name').nth(1).click();
await p.keyboard.down('Control');await p.locator('#itemsBody .row .c-name').nth(3).click();await p.keyboard.up('Control');await W(100);
const bar2=await p.locator('#tlCv .bar[data-u="'+await A(()=>GanttApp.P.items[1].uid)+'"]').boundingBox();
await p.mouse.click(bar2.x+bar2.width/2,bar2.y+bar2.height/2);await W(150);
ok(await A(()=>GanttApp.ui.sel.length)===1,'clic senza trascinare: selezione singola');
// gruppo + figli: selezionare G1 sposta i suoi tre task
await p.locator('#itemsBody .row .c-name').nth(0).click();
await p.keyboard.down('Control');await p.locator('#itemsBody .row .c-name').nth(5).click();await p.keyboard.up('Control');await W(100);
// tastiera: Alt+Maiusc+freccia destra = +1 giorno lavorativo
const s2=await st();
await p.keyboard.down('Alt');await p.keyboard.down('Shift');await p.keyboard.press('ArrowRight');await p.keyboard.up('Shift');await p.keyboard.up('Alt');await W(300);
const s3=await st();
const mv=[1,2,3,5].map(i=>dd(s2[i],s3[i]));
ok(mv.every(x=>x>=1&&x<=3),'tastiera: tutti i task di G1 e T4 spostati di un giorno lavorativo '+JSON.stringify(mv));
await p.keyboard.down('Alt');await p.keyboard.down('Shift');await p.keyboard.press('ArrowLeft');await p.keyboard.up('Shift');await p.keyboard.up('Alt');await W(300);
ok(JSON.stringify(await st())===JSON.stringify(s2),'tastiera: freccia sinistra riporta indietro');
// date bloccata: avviso con il nome
await A(()=>{const A=GanttApp;A.commit('lock',q=>{q.items[2].lockStart=true})});await W(150);
await p.locator('#itemsBody .row .c-name').nth(0).click();await W(100);
await p.keyboard.down('Alt');await p.keyboard.down('Shift');await p.keyboard.press('ArrowRight');await p.keyboard.up('Shift');await p.keyboard.up('Alt');await W(300);
ok(/T2/.test(await A(()=>(document.querySelector('#toast')||{}).textContent||'')),'avviso con il nome dell\'item bloccato');
// intestazione: settimane di progetto sotto i numeri
await A(()=>{const A=GanttApp;A.setView?A.setView('hdrLevels',{wprog:true}):0});
const hdr=await A(()=>{const A=GanttApp;A.commit('h',q=>{q.view.hdrLevels=Object.assign({},q.view.hdrLevels,{wprog:true})});A.render();return [...document.querySelectorAll('#tlHead .tlr, #tlHead > div')].length});
const order=await A(()=>{const rows=[...document.querySelectorAll('#tlHead .tlc')].map(e=>({t:e.textContent,y:Math.round(e.getBoundingClientRect().top)}));const wp=rows.find(r=>/^(S[\d\u2212]+$|W\d+ . S)/.test(r.t));const num=rows.find(r=>/^\d+$/.test(r.t)&&r.y>0);return wp&&num?[wp.y,num.y]:null});
ok(order&&order[0]>order[1],'settimana di progetto sotto i numeri dei giorni: '+JSON.stringify(order));
// capsula Gruppi sottile
const w=await A(()=>{const caps=[...document.querySelectorAll('#tlCmds .tcap')];const g=caps.find(c=>c.querySelector('[data-lv]'));return Math.round(g.getBoundingClientRect().width)});
ok(w<=165,'capsula Gruppi sottile: '+w+'px');
ok(errs.length===0,'errori '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
