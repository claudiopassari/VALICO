const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const A=(f,a)=>p.evaluate(f,a);
// blocchi
await A(()=>{const A=window.GanttApp;A.commit('t',q=>{const f=n=>q.items.find(i=>i.name===n);const s=f('Scavi'),c=f('Casseri');A.core.opLock(q,[s.uid,c.uid],true)})});
await p.waitForTimeout(200);
const nl=await p.locator('#tlCv .lkd').count();ok(nl>=4,'pallini di blocco presenti '+nl);
await p.locator('#tlCmds [data-act="tlopts"]').click();await p.waitForTimeout(150);
await p.locator('.pop .swrow:has-text("Indicatori delle date bloccate") .switch').click();await p.waitForTimeout(150);
ok(await p.locator('#tlCv .lkd').count()===0,'pallini nascosti dal menu Visualizza');
await p.locator('.pop .swrow:has-text("Indicatori delle date bloccate") .switch').click();await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.mouse.click(5,5);
ok(await p.locator('#tlCv .lkd').count()===nl,'pallini di nuovo visibili');
// percorso critico
await A(()=>{const A=window.GanttApp;A.commit('t',q=>{const f=n=>q.items.find(i=>i.name===n).uid;q.items.find(i=>i.name==='Consegna').start='2026-12-14';A.core.opLink(q,f('Solai'),f('Consegna'),'FS');A.core.opLink(q,f('Pilastri'),f('Solai'),'FS')})});
const cs=await A(()=>{const A=window.GanttApp;const r=A.core.criticalSet(A.P);return Object.keys(r.uids).map(u=>A.P.items.find(i=>i.uid===u).name)});
console.log('critico',cs);
ok(cs.indexOf('Consegna')>=0&&cs.indexOf('Solai')>=0&&cs.indexOf('Pilastri')>=0&&cs.indexOf('Scavi')<0,'catena critica Consegna-Solai-Pilastri');
await A(()=>window.GanttApp.act.setView('showCritical',true));await p.waitForTimeout(200);
ok(await p.locator('#tlCv .bx.crit').count()>=1,'barre critiche evidenziate');
ok(await p.locator('#tlCv .dep.crit').count()===2,'due frecce critiche');
await p.screenshot({path:'crit44.png'});
// baseline + scostamenti
await A(()=>{const A=window.GanttApp;A.commit('b',q=>{A.core.opSaveBaseline(q,'B1')})});
await A(()=>{const A=window.GanttApp;A.commit('m',q=>{const s=q.items.find(i=>i.name==='Pilastri');s.start='2026-12-02';})});
await p.locator('#itemCmds [data-act="cols"]').click();await p.waitForTimeout(150);
const sw=p.locator('.pop .switch');ok(await sw.count()===16,'16 colonne nel dialogo');
await sw.nth(10).click();await sw.nth(11).click();await sw.nth(12).click();await p.waitForTimeout(200);
await p.keyboard.press('Escape');
const txt=await A(()=>[...document.querySelectorAll('#itemsBody .row[data-uid]')].map(r=>r.innerText.replace(/\s+/g,' ')));
console.log(txt.filter(t=>/Pilastri|Solai/.test(t)));
ok(await p.locator('#itemsCols .c-dstart').count()===1,'colonna Δ inizio visibile');
const dv=await A(()=>{const A=window.GanttApp;const it=A.P.items.find(i=>i.name==='Pilastri');return [A.core.devVal(it,'dstart'),A.core.devVal(it,'dend'),A.core.devVal(it,'ddur')]});
console.log('dev',dv);ok(dv[0]!==0,'Δ inizio diverso da zero');
await p.screenshot({path:'dev44.png'});
// pallino di salvataggio
ok(await p.locator('#dirty.few, #dirty.many').count()===1,'pallino: modifiche non salvate');
await A(()=>{const A=window.GanttApp;for(let i=0;i<10;i++)A.commit('x'+i,q=>{q.items[0].name='N'+i})});
ok(await p.locator('#dirty.many').count()===1,'pallino arancione dopo 10 modifiche');
// rotella
const bb=await p.locator('#tlBody').boundingBox();await p.mouse.move(bb.x+50,bb.y+50);await p.mouse.wheel(30,120);await p.waitForTimeout(150);
ok(await A(()=>tlBody.scrollLeft)===0,'rotella: nessuno scorrimento orizzontale');
ok(await p.locator('#itemCmds [data-act="more"]').isHidden(),'pulsante Altro nascosto con spazio sufficiente');
ok(errs.length===0,'nessun errore '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
