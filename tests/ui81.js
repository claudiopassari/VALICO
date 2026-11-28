// Excel: modello scaricabile, esportazione completa (ore, persone, scadenza, etichetta), anteprima degli errori e annullamento senza effetti
const {chromium}=require('playwright');const fs=require('fs');const cp=require('child_process');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const c=await b.newContext({viewport:{width:1900,height:1000},acceptDownloads:true});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:false}))}catch(e){}});
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);const W=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>GanttApp.act.loadExample());await W(400);
// campi nuovi
await ev(()=>{const A=GanttApp;const t=A.P.items.find(i=>i.type==='task'&&i.name==='Imbiancatura delle pareti');window.__t=t.name;A.commit('x',p=>{const it=p.items.find(i=>i.uid===t.uid);A.core.setField(p,it.uid,'hours','6');A.core.setField(p,it.uid,'crew','3');A.core.setField(p,it.uid,'label','Etichetta prova');A.core.setField(p,it.uid,'deadline','20/01/27')})});
// esportazione
await p.locator('[data-act="export"]').click();await W(300);
await p.locator('#expBody .xsegb[data-v="xlsx"]').click();await W(200);
ok(await p.locator('#expBody .xblk').first().isVisible(),'blocchi del pannello presenti');
ok((await p.locator('#expBody .xinfo:visible').allTextContents()).join(' ').includes('Guida'),'nota Excel aggiornata');
const [d]=await Promise.all([p.waitForEvent('download'),p.locator('#expGo').click()]);const f1='/tmp/ui81_exp.xlsx';await d.saveAs(f1);
await p.keyboard.press('Escape');await W(200);
const py=cp.execSync('python3 - <<EOF\nimport openpyxl\nwb=openpyxl.load_workbook("'+f1+'")\nws=wb["Cronoprogramma"]\nh=[c.value for c in ws[2]][:15]\nprint("|".join(str(x) for x in h))\nprint(len(ws.data_validations.dataValidation), ws.conditional_formatting is not None)\nfor r in ws.iter_rows(min_row=3,max_row=20,max_col=15):\n  if r[8].value==6: print("RIGA", r[3].value, r[8].value, r[9].value, r[6].value, r[13].value)\nprint(wb.sheetnames)\nEOF').toString();
console.log(py.trim());
ok(/Ore al giorno\|Persone/.test(py)&&/Scadenza/.test(py)&&/Etichetta/.test(py),'intestazioni complete');ok(/RIGA .* 6 3 .* Etichetta prova/.test(py),'valori ore, persone, scadenza, etichetta nel file');ok(/\['Cronoprogramma', 'Guida', 'Elenchi'\]/.test(py),'tre fogli');
// reimportazione: anteprima senza problemi, annullamento, conferma
const before=await ev(()=>JSON.stringify(GanttApp.P.items.map(i=>[i.uid,i.name])));
await p.setInputFiles('#xlsxInput',f1);await W(1200);
ok(await p.locator('#dlgXlPrev').evaluate(d=>d.open),'anteprima aperta');
ok((await p.locator('#xlpBody').textContent()).includes('Nessun problema'),'nessun problema nel file esportato: '+(await p.locator('#xlpBody').textContent()).slice(0,200));
ok(await ev(()=>JSON.stringify(GanttApp.P.items.map(i=>[i.uid,i.name])))===before,'progetto aperto intatto durante l\'anteprima');
await p.locator('#xlpNo').click();await W(300);
ok(await ev(()=>JSON.stringify(GanttApp.P.items.map(i=>[i.uid,i.name])))===before,'annulla: progetto intatto');
ok(await ev(()=>GanttApp.P.items.length>0&&document.querySelectorAll('#itemsBody .row').length>1),'annulla: interfaccia intatta');
await p.setInputFiles('#xlsxInput',f1);await W(1200);await p.locator('#xlpGo').click();await W(800);
const r=await ev(()=>{const t=GanttApp.P.items.find(i=>i.label==='x'||i.barLabel==='Etichetta prova');return t?{h:t.hoursPerDay,c:t.crew,l:t.barLabel,d:t.deadline}:null});
ok(r&&r.h===6&&r.c===3&&r.l==='Etichetta prova'&&r.d==='2027-01-20','conferma: ore, persone, etichetta e scadenza reimportate '+JSON.stringify(r));
// file con errori
const f2='/tmp/ui81_bad.xlsx';
cp.execSync('python3 - <<EOF\nimport openpyxl,datetime\nwb=openpyxl.Workbook();ws=wb.active;ws.title="Cronoprogramma"\nws.append(["N.","Livello","Tipo","Nome","Inizio","Fine","Durata","Ore al giorno","Persone","Predecessori"])\nws.append([1,1,"Attività","Fase A",datetime.date(2027,3,1),datetime.date(2027,3,10),None,None,None,None])\nws.append([2,3,"Attività","Salto di livello","31/02/2027",datetime.date(2027,3,12),None,"x",None,"9"])\nws.append([3,2,"Strano","Tipo ignoto",datetime.date(2027,3,15),datetime.date(2027,3,18),None,8,2,"1"])\nwb.save("'+f2+'")\nEOF');
await p.setInputFiles('#xlsxInput',f2);await W(1200);
const tx=await p.locator('#xlpBody').textContent();console.log(tx.slice(0,500));
ok(await p.locator('#xlpBody .xlp-t tbody tr').count()>=4,'problemi elencati riga per riga: '+await p.locator('#xlpBody .xlp-t tbody tr').count());
ok(/Livello/.test(tx)&&/Tipo/.test(tx)&&/Predecessori/.test(tx)&&/Inizio/.test(tx),'colonne dei problemi');
ok(/3 righe/.test(tx),'conteggio righe');
await p.locator('#xlpNo').click();await W(200);
// modello scaricabile dal menu «Altre opzioni di salvataggio»
await p.locator('[aria-label="Altre opzioni di salvataggio"]').click();await W(250);
ok(await p.locator('.menuitem:has-text("Scarica il modello Excel")').count()===1,'voce di menu del modello');
const [d3]=await Promise.all([p.waitForEvent('download'),p.locator('.menuitem:has-text("Scarica il modello Excel")').click()]);const f3='/tmp/ui81_tpl.xlsx';await d3.saveAs(f3);
ok(/modello/i.test(d3.suggestedFilename()),'nome del file modello: '+d3.suggestedFilename());
const pt=cp.execSync('python3 - <<EOF\nimport openpyxl\nwb=openpyxl.load_workbook("'+f3+'")\nws=wb["Cronoprogramma"]\nprint(ws["A1"].value,"|",ws["D2"].value,"|",ws["A3"].value,"|",ws.max_row)\ng=wb["Guida"]\nprint(g["A1"].value)\nEOF').toString();
ok(/Modello di cronoprogramma/.test(pt)&&/Nome/.test(pt),'modello leggibile: '+pt.trim().replace(/\n/g,' / '));
console.log('ui81 pass',pass,'fail',fail,errs.length?errs.slice(0,3):'');await b.close()})();
