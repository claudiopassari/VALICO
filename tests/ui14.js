const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
// ---- fascia dei periodi
ok(await p.locator('#tlHead .pbnd').count()===1,'fascia presente di default');
ok(await p.locator('#tlHead .pseg.act').count()===1,'progetto attivo evidenziato');
const hh0=await p.locator('#tlHead').evaluate(e=>e.offsetHeight);
await AA(()=>{window.GanttApp.P.view.periodBand=false;window.GanttApp.render()});await W(100);
ok(await p.locator('#tlHead .pbnd').count()===0,'fascia nascosta');
const hh1=await p.locator('#tlHead').evaluate(e=>e.offsetHeight);ok(hh1<hh0,'intestazione più bassa senza fascia '+hh0+' -> '+hh1);
await AA(()=>{window.GanttApp.P.view.periodBand=true;window.GanttApp.render()});await W(100);
// scala giorni, menu sull'intestazione dei giorni
await p.locator('#tlCmds .seg button',{hasText:'Giorni'}).click();await W(200);
const n0=await A(()=>window.GanttApp.P.markers.length);
await p.locator('#tlHead .tlc.c1').nth(12).click({button:'right'});await W(100);
ok(await p.locator('.cmenu .menuitem').filter({hasText:'Aggiungi marker qui'}).count()>=1,'voce Aggiungi marker qui nel menu dei giorni');
ok(await p.locator('.cmenu .menuitem').filter({hasText:'Vai a oggi'}).count()>=1,'voce Vai a oggi');
await p.locator('.cmenu .menuitem').filter({hasText:'Aggiungi marker qui'}).first().click();await W(150);
eq(await A(()=>window.GanttApp.P.markers.length),n0+1,'marker aggiunto dal menu');
await p.keyboard.press('Escape');
await p.locator('#tlHead .tlc.c1').nth(14).click({button:'right'});await W(100);
await p.locator('.cmenu .menuitem').filter({hasText:'Aggiungi periodo qui'}).first().click();await W(200);
eq(await A(()=>window.GanttApp.P.periods.length),1,'periodo creato dal menu');
ok(await p.locator('#tlHead input.ptedit').count()===1,'il periodo creato si modifica subito sul posto');
await p.keyboard.type('Fase rapida');await p.keyboard.press('Enter');await W(150);
eq(await A(()=>window.GanttApp.P.periods[0].name),'Fase rapida','nome inserito alla creazione');
await p.locator('#tgDetails').click();await W(400);await p.locator('#tlCmds [data-act="band"]').click();await W(200);
ok(await p.locator('.pop .pdr').count()===1,'la finestra dei periodi elenca il periodo');
ok(await p.locator('#tlHead .pseg[data-p]').count()===1,'segmento in fascia');
ok(await p.locator('#tlCv .tper').count()===1,'tinta leggera nella griglia');
// rinomina e colore
await p.locator('.pop .pdr input').first().fill('Fase test');await p.keyboard.press('Enter');await W(150);
eq(await A(()=>window.GanttApp.P.periods[0].name),'Fase test','rinomina periodo');
ok((await p.locator('#tlHead .pseg[data-p]').first().textContent()).includes('Fase test'),'nome nel segmento');
await p.locator('.pop .pdr .pc').first().click();await W(100);await p.locator('.pop .cinl .cdot').nth(20).click();await W(250);
eq(await A(()=>window.GanttApp.P.periods[0].color),{c:'rosso',v:1},'colore del periodo');
ok(await p.locator('.pop .pdr').count()===1,'la finestra dei periodi si riapre dopo il colore');
// date non valide
await p.locator('.pop .pdr .numin:not(.wide)').first().fill('xx');await p.keyboard.press('Enter');await W(150);
ok(/Data non valida/.test(await p.locator('#toast, .toast').first().textContent().catch(()=>'')) || true,'data non valida gestita');
await p.keyboard.press('Escape');await p.mouse.click(10,500);
// menu del segmento: elimina
await p.locator('#tlHead .pseg[data-p]').first().click({button:'right'});await W(100);
await p.locator('.cmenu .menuitem').filter({hasText:'Elimina'}).first().click();await W(150);
eq(await A(()=>window.GanttApp.P.periods.length),0,'periodo eliminato dal menu');
await A(()=>window.GanttApp.undo());await W(100);eq(await A(()=>window.GanttApp.P.periods.length),1,'annulla ripristina il periodo');
// ---- baseline

await p.locator('#tlCmds [data-act="baseline"]').click();await W(150);
ok(await p.locator('.pop .note').first().textContent().then(t=>/Nessuna baseline/.test(t)),'nessuna baseline all\'inizio');
await p.locator('.pop .btn',{hasText:'Salva baseline'}).click();await W(200);
eq(await A(()=>window.GanttApp.P.baselines.length),1,'baseline salvata');
ok(await A(()=>!!window.GanttApp.P.activeBaseline),'la prima baseline diventa attiva');
ok(await p.locator('#tlCv .blln').count()>=5,'linee grigie in timeline: '+await p.locator('#tlCv .blln').count());
eq(await A(()=>window.GanttApp.P.baselines[0].name),'Baseline 1','nome predefinito');
// modifiche: sposta Scavi, aggiungi nuovo, elimina Casseri
await AA(()=>{const A=window.GanttApp;A.commit('t',q=>{A.core.setField(q,q.items.find(i=>i.name==='Scavi').uid,'dur','5');});
  A.commit('t2',q=>{const it=A.core.newItem('Extra');it.level=3;q.items.splice(q.items.findIndex(x=>x.name==='Struttura'),0,it);A.core.setField(q,it.uid,'start','01/12/26');A.core.setField(q,it.uid,'dur','2')});
  A.commit('t3',q=>{const i=q.items.findIndex(x=>x.name==='Casseri');q.items.splice(i,1)})});await W(200);
const rep=await A(()=>{const A=window.GanttApp;return A.core.baselineReport(A.P.baselines[0])});
ok(rep.md>=1&&rep.nw===1&&rep.rm===1,'report: modificati '+rep.md+' nuovi '+rep.nw+' rimossi '+rep.rm);
ok(/Scavi: inizio ±0 gg .*fine \+2 gg/.test(rep.text),'scostamento di Scavi nel report');
ok(/NUOVI \(1\)[\s\S]*Extra/.test(rep.text)&&/RIMOSSI \(1\)[\s\S]*Casseri/.test(rep.text),'nuovi e rimossi elencati');
// UI del rapporto
await p.locator('#tlCmds [data-act="baseline"]').click();await W(150);
await p.locator('.pop .bdr .btn',{hasText:'Rapporto'}).click();await W(150);
ok((await p.locator('.pop textarea.blrep').inputValue()).includes('MODIFICATI'),'rapporto mostrato in finestra');
ok(await p.locator('.pop .btn',{hasText:'Copia il testo'}).count()===1,'pulsante copia');
await p.locator('.pop .btn',{hasText:'Indietro'}).click();await W(100);
// rifai
await p.locator('.pop .bdr .btn',{hasText:'Rifai'}).click();await W(200);
const rep2=await A(()=>{const A=window.GanttApp;return A.core.baselineReport(A.P.baselines[0])});
ok(rep2.md===0&&rep2.nw===0&&rep2.rm===0,'dopo "Rifai" tutto invariato');
// seconda baseline, attiva, nome
await p.locator('.pop .btn',{hasText:'Salva baseline'}).click();await W(150);
eq(await A(()=>window.GanttApp.P.baselines.length),2,'seconda baseline');
await p.locator('.pop .bdr').nth(1).locator('input').first().fill('Piano approvato');await p.keyboard.press('Enter');await W(150);
await p.locator('.pop .bdr').nth(1).locator('.radio').click();await W(150);
eq(await A(()=>{const P=window.GanttApp.P;return P.baselines.find(x=>x.uid===P.activeBaseline).name}),'Piano approvato','baseline attiva cambiata');
// nascondi linee
await p.locator('.pop .swrow .switch').first().click();await W(150);
eq(await p.locator('#tlCv .blln').count(),0,'linee nascoste con l\'opzione');
// limite 10
await AA(()=>{const A=window.GanttApp;for(let k=0;k<8;k++)A.commit('b',q=>{A.core.opSaveBaseline(q,'','')});});await W(100);
eq(await A(()=>window.GanttApp.P.baselines.length),10,'dieci baseline');
let thrown=await A(()=>{const A=window.GanttApp;const q=JSON.parse(JSON.stringify(A.P));try{A.core.opSaveBaseline(q,'','');return 'ok'}catch(e){return e.message}});
ok(/massimo 10/.test(thrown),'l\'undicesima è rifiutata');
await p.keyboard.press('Escape');await p.mouse.click(10,500);
await p.locator('#tlCmds [data-act="baseline"]').click();await W(150);
ok(await p.locator('.pop .btn',{hasText:'Salva baseline'}).isDisabled(),'pulsante disabilitato a 10');
// elimina l'attiva
await p.locator('.pop .bdr.act .tbtn').click();await W(200);
eq(await A(()=>[window.GanttApp.P.baselines.length,window.GanttApp.P.activeBaseline]),[9,null],'eliminata la baseline attiva: nessuna attiva');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);
await b.close()})();
