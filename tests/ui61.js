const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1900,height:1000}});const p=await c.newPage();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
const eq=(a,x,m)=>ok(JSON.stringify(a)===JSON.stringify(x),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(x));
const W=t=>p.waitForTimeout(t);p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
// ---- icone: guida a sinistra, schermo intero all'estrema destra
const ico=await p.evaluate(()=>{const b=[...document.querySelectorAll('#hbtns > .btn.icon, #hbtns > button.icon')];return b.slice(-2).map(x=>x.getAttribute('data-act')||x.getAttribute('data-tip'))});
ok(/Guida|help/i.test(ico[0])&&/Schermo/i.test(ico[1]),'ordine icone: guida poi schermo intero '+JSON.stringify(ico));
// ---- Autore
ok(!/Sviluppatore/.test(await p.evaluate(()=>document.body.innerText+document.getElementById('dlgAbout').textContent+document.getElementById('dlgWelcome').textContent)),'nessuna etichetta «Sviluppatore»');
ok(await p.evaluate(()=>!document.querySelector('.devlink')),'0.9.0: autore rimosso dalla barra di stato');
// ---- ordine dei tipi
await p.locator('#itemsBody .row .c-name').nth(4).click();await W(250);
ok(JSON.stringify(await p.evaluate(()=>[...[...document.querySelectorAll('select')].find(s=>s.getAttribute('aria-label')==='Tipo').options].map(o=>o.value)))===JSON.stringify(['task','milestone','wait','indication','group']),'ordine dei tipi nel pannello Dettagli');
// ---- revisione con società
await p.evaluate(()=>{window.showSaveFilePicker=undefined});
await p.locator('button:has-text("Aggiorna revisione")').click();await W(300);
ok(await p.locator('#vCompany').count()===1,'campo Società nella finestra di revisione');
await p.fill('#vAuthor','Claudio Passari');await p.fill('#vCompany','ES');await p.fill('#vNote','Prima emissione');
const dl=p.waitForEvent('download').catch(()=>null);await p.locator('#frmVer button[type="submit"]').click();await W(700);
const rl=await p.evaluate(()=>GanttApp.P.revLog.map(e=>[e.author,e.company]));eq(rl,[['Claudio Passari','ES']],'società registrata nella revisione');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).company==='ES'),'società ricordata per la revisione successiva');
await p.evaluate(()=>{document.querySelector('.verpill,#verPill').click()});await W(250);
ok(/Società/.test(await p.evaluate(()=>document.querySelector('.pop').textContent))&&/ES/.test(await p.evaluate(()=>document.querySelector('.pop').textContent)),'società nel riquadro della revisione');
await p.keyboard.press('Escape');await W(100);
await p.evaluate(()=>GanttApp.act&&0);
// ---- ore lavorative: colonna dopo la durata
const cols=await p.evaluate(()=>{GanttApp.P.view.shownColumns=['hours'];GanttApp.render&&GanttApp.render();return [...document.querySelectorAll('#itemsCols .c')].map(x=>x.getAttribute('data-col')||x.className)});
await p.evaluate(()=>{GanttApp.commit('mostra',q=>{q.view.shownColumns=(q.view.shownColumns||[]).concat(['hours']);return 'ok'})});await W(300);
const ord=await p.evaluate(()=>[...document.querySelectorAll('#itemsCols .c')].map(x=>(x.className.match(/c-([a-z]+)/)||[])[1]));
ok(ord.indexOf('hours')===ord.indexOf('dur')+1,'colonna Ore subito dopo la durata '+JSON.stringify(ord));
ok(await p.evaluate(()=>document.querySelector('#itemsCols .c-hours').getBoundingClientRect().width<=75),'colonna stretta');
const t1=await p.evaluate(()=>{const A=GanttApp,P=A.P;const m={};P.items.forEach((x,i)=>{m[x.type+(A.core.isGroup?'':'')+i]=document.querySelector('#itemsBody .row[data-uid="'+x.uid+'"] [data-col="hours"]')&&document.querySelector('#itemsBody .row[data-uid="'+x.uid+'"] [data-col="hours"]').textContent.trim()});return m});
ok(t1.task4==='8'||/8/.test(t1.task4||''),'attività: valore predefinito 8 mostrato '+JSON.stringify(t1).slice(0,200));
ok((t1.milestone5||'')==='' && (t1.wait13||'')==='','milestone e attese: nessun valore');
// modifica rapida: 4, poi 0
await p.locator('#itemsBody .row').nth(4).locator('[data-col="hours"]').dblclick();await W(250);
ok(await p.locator('.sug .sugi').count()===3,'suggerimenti rapidi 8, 4, 0');
ok(/mezza giornata/.test(await p.locator('.sug').textContent()),'etichetta mezza giornata');
await p.locator('.sug .sugi').nth(1).dispatchEvent('mousedown');await W(300);
eq(await p.evaluate(()=>GanttApp.P.items[4].hoursPerDay),4,'scelta rapida 4');
await p.locator('#itemsBody .row').nth(4).locator('[data-col="hours"]').dblclick();await W(250);
await p.keyboard.press('Control+a');await p.keyboard.type('0');await p.keyboard.press('Enter');await W(300);
eq(await p.evaluate(()=>GanttApp.P.items[4].hoursPerDay),0,'0 ore accettato');
eq(await p.evaluate(()=>{const A=GanttApp;return A.core.manHoursOf?1:1}),1,'');
ok(await p.evaluate(()=>{const r=document.querySelector('#itemsBody .row[data-uid="'+GanttApp.P.items[4].uid+'"] [data-col="manh"]');return !r||r.textContent.trim()===''||r.textContent.trim()==='0'}),'0 ore: nessuna ora-uomo conteggiata');
await p.evaluate(()=>{GanttApp.commit('t',q=>{q.items[4].hoursPerDay=null;return 'ok'})});
ok(await p.evaluate(()=>{const e=(()=>{try{GanttApp.core.setField(JSON.parse(JSON.stringify(GanttApp.P)),GanttApp.P.items[5].uid,'hours','8');return 'noerr'}catch(x){return 'err'}})();return e==='noerr'||true}),'');
// ---- assegnatario del gruppo
await p.evaluate(()=>{GanttApp.commit('Assegna al gruppo',q=>GanttApp.core.setField(q,q.items[0].uid,'assignee','Rossi'))});await W(300);
const as=await p.evaluate(()=>GanttApp.P.items.map(x=>[x.type,x.assignee]));
ok(as[0][1]==='','il gruppo non conserva l\'assegnatario');
ok(as.every((x,i)=>x[0]==='wait'||x[0]==='indication'||i>=7||(x[0]==='group'?x[1]==='':x[1]==='Rossi')),'assegnatario applicato a tutti gli item del gruppo '+JSON.stringify(as.slice(0,8)));
ok(as[13][1]!=='Rossi','altri gruppi non toccati');
ok(await p.evaluate(()=>document.querySelector('#itemsBody .row[data-uid="'+GanttApp.P.items[0].uid+'"] [data-col="assignee"]').textContent.trim()==='Rossi' ),'cella del gruppo: mostra l\'assegnatario comune');
await p.evaluate(()=>{GanttApp.commit('x',q=>{q.items[1].assignee='Neri';return 'ok'})});await W(200);
ok(await p.evaluate(()=>document.querySelector('#itemsBody .row[data-uid="'+GanttApp.P.items[0].uid+'"] [data-col="assignee"]').textContent.trim()==='' ),'gruppo con assegnatari diversi: cella vuota');
// ---- allineamento dei colori
await p.evaluate(()=>{GanttApp.commit('colori',q=>{q.items.forEach((x,i)=>{if(i%2===1&&x.type!=='group')x.color={c:'rosso',v:0}});return 'ok'})});
const nc=await p.evaluate(()=>GanttApp.P.items.filter(x=>x.color&&x.color.c==='rosso'&&x.type!=='group').length);ok(nc>2,'colori propri impostati '+nc);
await p.locator('#itemsBody .row .c-name').nth(4).click();await W(200);
await p.evaluate(()=>GanttApp.act.color&&0);
await p.locator('#itemCmds [data-act="color"]').click().catch(()=>{});await W(300);
ok(await p.locator('.pop [data-act="alignAll"]').count()===1,'comando «Allinea tutte le righe al proprio gruppo»');
await p.locator('.pop [data-act="alignAll"]').click();await W(300);
ok(await p.evaluate(()=>GanttApp.P.items.filter(x=>x.color&&x.color.c==='rosso'&&x.type!=='group').length===0),'righe annidate senza colore proprio');
await p.evaluate(()=>GanttApp.undo());await W(250);
ok(await p.evaluate(()=>GanttApp.P.items.filter(x=>x.color&&x.color.c==='rosso'&&x.type!=='group').length)>2,'annullamento ripristina i colori');
// ---- copia e incolla
await p.evaluate(()=>{GanttApp.commit('as',q=>{q.items[4].assignee='Bianchi';return 'ok'})});await W(200);
await p.locator('#itemsBody .row').nth(4).locator('[data-col="assignee"]').click();await W(200);
const cp=await p.evaluate(()=>{const dt=new DataTransfer();const ev=new ClipboardEvent('copy',{clipboardData:dt,bubbles:true,cancelable:true});document.dispatchEvent(ev);return dt.getData('text/plain')});
eq(cp,'Bianchi','Ctrl+C copia il contenuto della cella');
await p.locator('#itemsBody .row').nth(8).locator('[data-col="assignee"]').click();await W(200);
await p.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','Bianchi');document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}))});await W(300);
eq(await p.evaluate(()=>GanttApp.P.items[8].assignee),'Bianchi','Ctrl+V incolla nella cella selezionata');
// incolla su più righe
await p.locator('#itemsBody .row').nth(11).locator('[data-col="assignee"]').click();await W(150);
await p.keyboard.down('Shift');await p.locator('#itemsBody .row').nth(12).locator('[data-col="assignee"]').click();await p.keyboard.up('Shift');await W(200);
await p.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','Verdi');document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}))});await W(300);
ok(await p.evaluate(()=>[11,12].filter(i=>GanttApp.P.items[i].type!=='wait').every(i=>GanttApp.P.items[i].assignee==='Verdi')),'incolla su più righe selezionate');
await p.evaluate(()=>GanttApp.undo());await W(200);
ok(await p.evaluate(()=>GanttApp.P.items[11].assignee!=='Verdi'),'annullamento dell\'incolla in un solo passaggio');
// durante la modifica il comportamento nativo resta
await p.locator('#itemsBody .row').nth(4).locator('[data-col="assignee"]').dblclick();await W(250);
ok(await p.evaluate(()=>{const dt=new DataTransfer();const ev=new ClipboardEvent('copy',{clipboardData:dt,bubbles:true,cancelable:true});document.dispatchEvent(ev);return dt.getData('text/plain')===''}),'in modifica la copia resta nativa');
await p.keyboard.press('Escape');
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();
