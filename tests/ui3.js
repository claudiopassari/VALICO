const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1800,height:820}});
const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
const dialogs=[];p.on('dialog',d=>{dialogs.push(d.message());d.accept()});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const names=()=>p.evaluate(()=>window.GanttApp.P.items.map(i=>i.name));
const row=i=>p.locator('#itemsBody .row[data-uid]').nth(i);
// ---- Calendario ----
await row(2).hover();await row(2).locator('.calb').first().click();
ok(await p.locator('.calp').count()===1,'calendario aperto');
ok(await p.locator('.calp .d.sel').innerText()==='23','giorno selezionato 23');
// naviga mese successivo e scegli 3 dicembre
await p.locator('.calp .ch button').nth(1).click();
ok((await p.locator('.calp .ch b').innerText()).toLowerCase().startsWith('dicembre'),'mese successivo');
await p.locator('.calp .d:not(.o)',{hasText:/^3$/}).click();
ok(await p.locator('.calp').count()===0,'calendario chiuso dopo la scelta');
let it=await p.evaluate(()=>{const i=window.GanttApp.P.items[2];return [i.start,i.end,i.duration]});
eq(it,['2026-12-03','2026-12-07',3],'inizio da calendario, durata mantenuta (3 gg lavorativi)');
// non lavorativo: sabato 5 dicembre su Fine di Scavi -> arretra al venerdì 4 (inizio 3) 
await row(2).hover();await row(2).locator('.calb').nth(1).click();
await p.locator('.calp .d:not(.o)',{hasText:/^5$/}).click();
it=await p.evaluate(()=>{const i=window.GanttApp.P.items[2];return [i.start,i.end,i.duration]});
eq(it,['2026-12-03','2026-12-04',2],'fine su sabato -> ultimo giorno lavorativo precedente');
ok(/non lavorativo/i.test(await p.locator('#toast').innerText()),'avviso giorno non lavorativo');
// gruppo: nessun calendario; data bloccata: nessun calendario
ok(await row(0).locator('.calb').count()===0,'gruppo senza calendario');
await p.evaluate(()=>{const A=window.GanttApp;A.commit('lock',q=>{q.items[2].lockStart=true})});
ok(await row(2).locator('.calb').count()===1,'bloccata inizio: calendario solo su Fine');
await p.evaluate(()=>{const A=window.GanttApp;A.commit('unlock',q=>{q.items[2].lockStart=false})});
// Dettagli: calendario
await row(4).locator('.c-name .t').click();
ok(await p.locator('#detailsBody .calb').count()===3,'dettagli: due pulsanti calendario');
await p.locator('#detailsBody .calb').first().click();ok(await p.locator('.calp').count()===1,'calendario dai dettagli');
await p.locator('.calp .d:not(.o)',{hasText:/^30$/}).click();
eq(await p.evaluate(()=>window.GanttApp.P.items[4].start),'2026-11-30','data da dettagli');
// Oggi
await row(5).hover();await row(5).locator('.calb').first().click();await p.locator('.calp .cf .btn').click();
const today=await p.evaluate(()=>{const d=new Date();const pad=n=>(n<10?'0':'')+n;return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())});
const s5=await p.evaluate(()=>window.GanttApp.P.items[5].start);ok(s5>=today,'Oggi imposta la data odierna (o successivo lavorativo): '+s5);
// ---- Scorciatoie ----
await p.evaluate(()=>{const A=window.GanttApp;A.ui.dirty=false});
await row(13).locator('.c-name .t').click();
const n0=(await names()).length;
await p.keyboard.press('Control+Shift+Enter');await p.keyboard.type('Sopra');await p.keyboard.press('Enter');await p.keyboard.press('Escape');
let nm=await names();eq([nm.length,nm[13]],[n0+1,'Sopra'],'Ctrl+Maiusc+Invio inserisce sopra');eq(nm[14],'Consegna','Consegna scesa');
await p.keyboard.press('Control+Enter');await p.keyboard.type('Sotto');await p.keyboard.press('Enter');await p.keyboard.press('Escape');
nm=await names();eq([nm[13],nm[14]],['Sopra','Sotto'],'Ctrl+Invio inserisce sotto');
const n1=nm.length;await p.keyboard.press('Shift+Enter');nm=await names();eq(nm.length,n1,'Maiusc+Invio da solo non inserisce più');
await p.keyboard.press('Alt+Enter');await p.keyboard.type('Fine');await p.keyboard.press('Enter');await p.keyboard.press('Escape');
nm=await names();eq(nm[nm.length-1],'Fine','Alt+Invio in fondo');
// durante la modifica Maiusc+Invio conferma soltanto
const n2=nm.length;await p.keyboard.press('F2');await p.keyboard.type('X');await p.keyboard.press('Shift+Enter');
eq((await names()).length,n2,'in modifica Maiusc+Invio non inserisce');
// ---- Pulsanti del pannello Item ----
await p.locator('#itemCmds [data-act="add"]').click();await p.keyboard.type('DaPulsante');await p.keyboard.press('Shift+Enter');
ok((await names()).indexOf('DaPulsante')>=0,'pulsante nuovo item');
await p.locator('#itemCmds [data-act="indent"]').click();
eq(await p.evaluate(()=>window.GanttApp.P.items.find(i=>i.name==='DaPulsante').level>1),true,'pulsante aumenta livello');
await p.locator('#itemCmds [data-act="outdent"]').click();
await p.locator('#itemCmds [data-act="del"]').click();
ok((await names()).indexOf('DaPulsante')<0,'pulsante elimina');
// undo/redo in testata
const before=(await names()).length;await p.locator('#hbtns [data-act="undo"]').click();eq((await names()).length,before+1,'annulla da testata');
await p.locator('#hbtns [data-act="redo"]').click();eq((await names()).length,before,'ripeti da testata');
ok(await p.locator('#tlCmds [data-act="undo"]').count()===0,'annulla non più nella barra strumenti');
// ---- Overflow nel pannello Item a 300 px ----
await p.evaluate(()=>{document.querySelector('#panels').style.setProperty('--w-items-open','300px')});await p.waitForTimeout(400);
await p.evaluate(()=>window.GanttApp.act.layoutItemCmds());
const ovf=await p.evaluate(()=>window.GanttApp.ui.ovf.slice());ok(ovf.length>0,'a 300 px alcuni comandi passano in Altro: '+ovf);
const vis=await p.locator('#itemCmds .tbtn:visible').count();ok(vis+ovf.length===12,'visibili+nascosti = 12 ('+vis+'+'+ovf.length+')');
await p.screenshot({path:'b1.png'});
await p.locator('#itemCmds [data-act="more"]').click();
ok(await p.locator('#itemCmds [data-act="cols"]:visible').count()===1,'Colonne… sempre visibile, anche a 300 px');
await p.keyboard.press('Escape');
await p.evaluate(()=>{document.querySelector('#panels').style.setProperty('--w-items-open','720px')});await p.waitForTimeout(400);
await p.evaluate(()=>window.GanttApp.act.layoutItemCmds());
eq(await p.evaluate(()=>window.GanttApp.ui.ovf.length),0,'a 720 px tutti i comandi visibili');
// ---- Pannello compresso ----
await p.locator('#tgItems').click();await p.waitForTimeout(450);
const w=await p.evaluate(()=>[document.querySelector('#pItems').offsetWidth,document.querySelector('#pDetails').offsetWidth]);
await p.locator('#tgDetails').click();await p.waitForTimeout(450);
const w2=await p.evaluate(()=>[document.querySelector('#pItems').offsetWidth,document.querySelector('#pDetails').offsetWidth]);
eq([w2[0],w2[1]],[44,44],'entrambi i pannelli compressi a 44 px (item '+w[0]+')');
ok(await p.evaluate(()=>document.activeElement===document.body||document.activeElement.id!=='tgItems'),'nessun focus residuo sul tasto del pannello');
ok(await p.locator('#pItems .phead h2').isHidden(),'titolo nascosto');ok(await p.locator('#itemCmds').isHidden(),'comandi nascosti');
await p.screenshot({path:'b2.png'});
await p.locator('#tgItems').click();await p.locator('#tgDetails').click();await p.waitForTimeout(450);
// ---- Densità ----
await p.locator('#tlCmds [data-act="tlopts"]').click();await p.locator('.pop .seg button',{hasText:'Ampia'}).click();
const rh=await p.evaluate(()=>document.querySelector('#itemsBody .row[data-uid]').offsetHeight);
await p.locator('.pop .seg button',{hasText:'Compatta'}).last().click();
const rh2=await p.evaluate(()=>document.querySelector('#itemsBody .row[data-uid]').offsetHeight);
ok(rh>rh2+12,'densità: ampia '+rh+' > compatta '+rh2);
const tl=await p.evaluate(()=>document.querySelector('.trow').offsetHeight);eq(tl,rh2,'timeline allineata alla densità');
await p.locator('.pop .seg button',{hasText:'Normale'}).click();await p.keyboard.press('Escape');
console.log('errors',errs);
console.log('pass',pass,'fail',fail);
await b.close()})();
