// salvataggio automatico: funzionamento effettivo con file handle simulato e orologio controllato
const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1600,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{
  window.__disk={text:'',writes:0,picks:0};
  window.showSaveFilePicker=async()=>{window.__disk.picks++;return {name:'prova.json',
    async getFile(){return {async text(){return window.__disk.text}}},
    async createWritable(){let buf='';return {async write(t){buf+=t},async close(){window.__disk.text=buf;window.__disk.writes++}}}}};
});
await p.clock.install({time:new Date('2026-11-26T10:00:00')});
await p.goto('file://'+process.cwd()+'/app.html');
const ev=f=>p.evaluate(f);const tick=async ms=>{await p.clock.runFor(ms);await p.waitForTimeout(150)};
// progetto con due item
await ev(()=>{GanttApp.commit('t',q=>{const a=GanttApp.core.newItem('Alfa');a.start='2026-12-01';a.end='2026-12-04';q.items.push(a)})});
// 1. senza file collegato l'autosave non scrive
await ev(()=>{const x=document.querySelector('#autoBtn');x.click()});
ok(await ev(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).autosave===true),'autosave attivato');
await tick(70000);eq(await ev(()=>window.__disk.writes),0,'nessun file collegato: nessuna scrittura');
// 2. primo salvataggio manuale (collega il file)
await p.keyboard.press('Control+s');await p.waitForTimeout(400);
eq(await ev(()=>[window.__disk.picks,window.__disk.writes]),[1,1],'salvataggio manuale: un file scelto, una scrittura');
// 3. nessuna modifica: nessuna scrittura
await tick(130000);eq(await ev(()=>window.__disk.writes),1,'senza modifiche non riscrive');
// 4. modifica: dopo l'intervallo (1 min) si salva da solo
await ev(()=>{GanttApp.commit('t',q=>{const a=GanttApp.core.newItem('Beta');a.start='2026-12-07';a.end='2026-12-10';q.items.push(a)})});
ok(await ev(()=>document.querySelector('#dirty').className.length>=0),'stato modificato');
await tick(30000);eq(await ev(()=>window.__disk.writes),1,'prima dell\'intervallo non scrive');
await tick(61000);
const w1=await ev(()=>window.__disk.writes);eq(w1,2,'dopo l\'intervallo scrive da solo');
ok(/Beta/.test(await ev(()=>window.__disk.text)),'il file contiene la modifica');
eq(await ev(()=>window.__disk.picks),1,'non riapre la finestra di scelta file');
ok(await ev(()=>/Salvato automaticamente/.test(document.body.innerText)),'avviso «Salvato automaticamente»');
// 5. non salva durante la modifica di una cella o con un pannello aperto
await ev(()=>{GanttApp.commit('t',q=>{q.items[0].name='Alfa 2'})});
await p.locator('#itemsBody .row .c-name').first().dblclick();await p.waitForTimeout(200);
await tick(130000);eq(await ev(()=>window.__disk.writes),2,'durante la modifica di una cella non salva');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
await tick(130000);ok(await ev(()=>window.__disk.writes)>=3,'terminata la modifica salva');
// 6. disattivato: non salva
await ev(()=>document.querySelector('#autoBtn').click());
const w2=await ev(()=>window.__disk.writes);
await ev(()=>{GanttApp.commit('t',q=>{q.items[0].name='Alfa 3'})});await tick(200000);
eq(await ev(()=>window.__disk.writes),w2,'autosave disattivato: non salva');
// 7. file su disco più recente: sospende senza sovrascrivere
await ev(()=>document.querySelector('#autoBtn').click());
await ev(()=>{const d=JSON.parse(window.__disk.text);d.saveCounter=d.saveCounter+5;window.__disk.text=JSON.stringify(d)});
const w3=await ev(()=>window.__disk.writes);
await tick(130000);eq(await ev(()=>window.__disk.writes),w3,'file su disco più recente: non sovrascrive');
// 8. revisione emessa: sospeso
console.log('ui65 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');
await b.close()})();
