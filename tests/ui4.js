const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
const dialogs=[];let answer=true;p.on('dialog',d=>{dialogs.push(d.message());answer?d.accept():d.dismiss()});
await p.addInitScript(()=>{
  window.__files={};window.__sugg=[];window.__next=null;
  window.showSaveFilePicker=async(o)=>{const name=window.__next||o.suggestedName;window.__next=null;window.__sugg.push(o.suggestedName);
    return {name,async createWritable(){let buf='';return {async write(t){buf=t},async close(){window.__files[name]=buf}}},async getFile(){return {name,async text(){return window.__files[name]}}}}};
});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');
const F=n=>p.evaluate(n=>JSON.parse(window.__files[n]),n);
const st=()=>p.evaluate(()=>({pill:document.querySelector('#verPill').textContent,status:document.querySelector('#status').textContent,file:window.GanttApp.ui.fileName,dirty:window.GanttApp.ui.dirty}));
await p.evaluate(()=>{const A=window.GanttApp;A.commit('x',q=>{q.items.push(A.core.newItem('Uno'))});});
// 1. Salva con nome
await p.evaluate(()=>{window.__next='Prog.json';return window.GanttApp.act.saveFlow({mode:'saveas'})});
let f=await F('Prog.json');eq([f.saveCounter,f.rev,f.revState,f.schemaVersion],[1,null,'draft',2],'saveas: contatore 1, nessuna revisione');
eq(f.project.title,'Nuovo progetto','il titolo non dipende dal nome del file');
let s=await st();eq(s.pill,'Nessuna revisione emessa','pill non emessa');ok(/Nessuna revisione emessa/.test(s.status),'stato: non emessa');
// 2. Dialogo: prima emissione
await p.locator('#hbtns .btn',{hasText:'Aggiorna revisione'}).click();
ok(await p.locator('#vFirst').isVisible(),'dialogo: prima emissione visibile');ok(await p.locator('#vOpts').isHidden(),'dialogo: opzioni nascoste');
await p.locator('#vAuthor').fill('Claudio');await p.locator('#vNote').fill('Prima emissione');
await p.locator('#frmVer button[type=submit]').click();await p.waitForTimeout(200);
eq(await p.evaluate(()=>window.__sugg.slice(-1)[0]),'Prog_Rev1.0.json','nome suggerito Rev1.0');
f=await F('Prog_Rev1.0.json');eq([f.rev,f.revState,f.saveCounter],[{major:1,minor:0},'issued',2],'Rev 0.0 emessa');
eq([f.revLog.length,f.revLog[0].author,f.revLog[0].note],[1,'Claudio','Prima emissione'],'registro');
eq((await F('Prog.json')).saveCounter,1,'file di lavoro precedente intatto');
s=await st();eq([s.pill,s.file,s.dirty],['Rev. 1.0','Prog_Rev1.0.json',false],'pill Rev. 1.0, app sul nuovo file');ok(/Rev\. 1\.0 \(emessa il /.test(s.status),'stato con data di emissione: '+s.status);
// 3. Modifica -> in lavorazione
await p.evaluate(()=>{window.GanttApp.commit('m',q=>{q.items[0].name='Uno bis'})});
s=await st();ok(/in lavorazione/.test(s.pill)&&/in lavorazione/.test(s.status),'dopo la modifica: in lavorazione');
// 4. Sovrascrivi su revisione emessa: conferma richiesta, rifiuto = nessuna scrittura
dialogs.length=0;answer=false;
await p.evaluate(()=>window.GanttApp.act.saveFlow({mode:'overwrite'}));
ok(dialogs.length===1&&/Rev\. 1\.0 già emessa/.test(dialogs[0]),'conferma su sovrascrittura di revisione emessa');
eq((await F('Prog_Rev1.0.json')).saveCounter,2,'rifiutato: file invariato');
answer=true;dialogs.length=0;
await p.evaluate(()=>window.GanttApp.act.saveFlow({mode:'overwrite'}));
f=await F('Prog_Rev1.0.json');eq([f.saveCounter,f.revState,f.rev],[3,'draft',{major:1,minor:0}],'sovrascritto: stato draft, rev invariata');
s=await st();ok(!s.dirty&&/in lavorazione/.test(s.pill),'dopo sovrascrittura resta in lavorazione ma non sporco');
// 5. Seconda sovrascrittura: nessuna conferma
dialogs.length=0;await p.evaluate(()=>{window.GanttApp.commit('m',q=>{q.items[0].name='Uno ter'})});
await p.evaluate(()=>window.GanttApp.act.saveFlow({mode:'overwrite'}));eq(dialogs.length,0,'nessuna conferma se già in lavorazione');
// 6. Emissione minore e maggiore
await p.locator('#hbtns .btn',{hasText:'Aggiorna revisione'}).click();
ok(await p.locator('#vFirst').isHidden()&&await p.locator('#vOpts').isVisible(),'dialogo: opzioni minore/maggiore');
ok(/Rev\. 1\.0 → 1\.1/.test(await p.locator('#vMinor').innerText()),'etichetta minore');ok(/Rev\. 1\.0 → 2\.0/.test(await p.locator('#vMajor').innerText()),'etichetta maggiore');
await p.locator('#frmVer button[type=submit]').click();await p.waitForTimeout(200);
eq(await p.evaluate(()=>window.__sugg.slice(-1)[0]),'Prog_Rev1.1.json','suffisso sostituito, non accumulato');
await p.locator('#hbtns .btn',{hasText:'Aggiorna revisione'}).click();await p.locator('#frmVer input[value=major]').check();
await p.locator('#frmVer button[type=submit]').click();await p.waitForTimeout(200);
eq(await p.evaluate(()=>window.__sugg.slice(-1)[0]),'Prog_Rev2.0.json','maggiore: 1.0');
f=await F('Prog_Rev2.0.json');eq(f.revLog.map(e=>e.major+'.'+e.minor),['1.0','1.1','2.0'],'registro completo');
eq(Object.keys(await p.evaluate(()=>window.__files)).sort(),['Prog.json','Prog_Rev1.0.json','Prog_Rev1.1.json','Prog_Rev2.0.json'],'tutti i file di revisione conservati');
eq((await F('Prog_Rev1.1.json')).revState,'issued','Rev 0.1 conservata come emessa');
// 7. Salva con nome da revisione: nome base senza suffisso, titolo senza suffisso, stato conservato se non sporco
await p.evaluate(()=>{window.__next='Altro_Rev9.9.json';return window.GanttApp.act.saveFlow({mode:'saveas'})});
eq(await p.evaluate(()=>window.__sugg.slice(-1)[0]),'Prog.json','saveas propone il nome base');
eq(await p.evaluate(()=>window.GanttApp.P.project.title),'Nuovo progetto','il titolo resta quello del progetto');
eq((await F('Altro_Rev9.9.json')).revState,'issued','saveas senza modifiche: stato emessa');
// 8. Riapertura file: stato ripristinato
const txt=await p.evaluate(()=>window.__files['Prog_Rev1.1.json']);
await p.evaluate(t=>window.GanttApp.core.loadText(t,null,'Prog_Rev1.1.json'),txt);
s=await st();eq(s.pill,'Rev. 1.1','riapertura: Rev. 1.1 emessa (non in lavorazione)');
// 9. Registro e info
await p.locator('#verPill').click();ok(/Revisione corrente/.test(await p.locator('.pop').innerText()),'popover revisione');
await p.locator('.pop .btn',{hasText:'Registro delle revisioni'}).click();
eq(await p.locator('#logBody tbody tr').count(),2,'registro: 2 righe (Rev. 1.0 e 0.1)');
await p.screenshot({path:'c1.png'});
console.log('errors',errs);console.log('pass',pass,'fail',fail);await b.close()})();
