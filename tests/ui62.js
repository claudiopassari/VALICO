const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1900,height:1000}});const p=await c.newPage();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
const eq=(a,x,m)=>ok(JSON.stringify(a)===JSON.stringify(x),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(x));
const W=t=>p.waitForTimeout(t);const pe=[];p.on('pageerror',e=>{pe.push(e.message);console.log('ERR',e.message)});p.on('dialog',d=>d.accept());
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
const ev=(f,a)=>p.evaluate(f,a);
// ---------- estensione con periodi e marker
const b0=await ev(()=>GanttApp.ui.geo.b);
await ev(()=>{GanttApp.commit('t',q=>{q.periods.push({uid:'pa1',name:'Alfa',start:'2026-11-16',end:'2026-12-20',color:{c:'blu',v:1}});q.periods.push({uid:'pa2',name:'Beta',start:'2026-12-10',end:'2027-03-10',color:{c:'rosso',v:1}})})});await W(300);
const b1=await ev(()=>({b:GanttApp.ui.geo.b,end:GanttApp.core.todayDN?0:0}));
ok(b1.b>b0+30,'i periodi allungano il calendario '+b0+' → '+b1.b);
await ev(()=>{GanttApp.commit('t',q=>{const m=GanttApp.core&&null;q.markers.push({uid:'mk1',kind:'custom',name:'Verifica',color:{c:'arancio',v:1},date:'2027-06-01',dateEnd:null})})});await W(300);
ok(await ev(()=>GanttApp.ui.geo.b)>b1.b+60,'i marker personali allungano il calendario');
await ev(()=>{GanttApp.commit('t',q=>{q.markers=q.markers.filter(m=>m.uid!=='mk1')})});await W(200);
// ---------- periodi sovrapposti su più righe
const L=await ev(()=>({pbr:document.documentElement.style.getPropertyValue('--pbr'),lanes:Object.fromEntries([...document.querySelectorAll('#tlHead .pseg[data-p]')].map(s=>[s.dataset.p,+s.dataset.lane])),h:document.querySelector('#tlHead .pbnd').getBoundingClientRect().height}));
eq(L.pbr,'2','due righe nella fascia');eq(L.lanes,{pa1:0,pa2:1},'corsie dei periodi sovrapposti');
const h1=await ev(()=>{const s=document.querySelector('#tlHead .pseg[data-p="pa1"]');return s.getBoundingClientRect().height});
ok(Math.abs(L.h-2*h1)<3,'altezza della fascia = 2 righe '+L.h+' / '+h1);
// periodo non sovrapposto: una riga
await ev(()=>{GanttApp.commit('t',q=>{q.periods.find(x=>x.uid==='pa2').start='2026-12-28'})});await W(250);
eq(await ev(()=>document.documentElement.style.getPropertyValue('--pbr')),'1','nessuna sovrapposizione: una riga');
await ev(()=>{GanttApp.commit('t',q=>{q.periods.find(x=>x.uid==='pa2').start='2026-12-10'})});await W(250);
// ---------- trascinamento verticale dalla timeline
async function box(sel){return await p.locator(sel).first().boundingBox()}
let sb=await box('#tlHead .pseg[data-p="pa2"]');
await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+sb.height/2);await p.mouse.down();await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+sb.height/2-8,{steps:3});await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+sb.height/2-20,{steps:4});await p.mouse.up();await W(300);
eq(await ev(()=>Object.fromEntries(GanttApp.P.periods.map(x=>[x.uid,x.lane]))),{pa1:1,pa2:0},'trascinato in alto: Beta in riga 1, Alfa scende');
eq(await ev(()=>GanttApp.P.periods.map(x=>x.start+'|'+x.end)),['2026-11-16|2026-12-20','2026-12-10|2027-03-10'],'date invariate dopo il trascinamento verticale');
await ev(()=>GanttApp.undo());await W(250);
ok(await ev(()=>GanttApp.P.periods[1].lane!==0||GanttApp.P.periods[1].lane===undefined),'annullamento ripristina la riga');
// trascinamento orizzontale
const s0=await ev(()=>GanttApp.P.periods[0].start);sb=await box('#tlHead .pseg[data-p="pa1"]');
await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+4);await p.mouse.down();await p.mouse.move(sb.x+Math.min(sb.width/2,40)+30,sb.y+4,{steps:5});await p.mouse.up();await W(300);
ok(await ev(()=>GanttApp.P.periods[0].start)>s0,'periodo spostato in orizzontale');await ev(()=>GanttApp.undo());await W(200);
// ---------- gestione periodi: frecce e duplica
await p.click('#tlCmds [data-act="band"]');await W(300);
eq(await p.locator('.pdr [aria-label="Duplica il periodo"]').count(),2,'pulsante Duplica per ogni periodo');
eq(await p.locator('.pdr [aria-label="Porta il periodo giù di una riga"]').count(),2,'frecce giù');
await p.locator('.pdr [aria-label="Porta il periodo giù di una riga"]').first().click();await W(300);
eq(await ev(()=>Object.fromEntries(GanttApp.P.periods.map(x=>[x.uid,x.lane]))),{pa1:1,pa2:0},'freccia giù dalla finestra');
await p.locator('.pdr [aria-label="Duplica il periodo"]').first().click();await W(300);
ok(await ev(()=>GanttApp.P.periods.length===3&&/\(copia\)/.test(GanttApp.P.periods.map(x=>x.name).join('|'))),'duplicazione dalla finestra');
ok(+await ev(()=>document.documentElement.style.getPropertyValue('--pbr'))>=3,'tre periodi sovrapposti: tre righe');
await p.keyboard.press('Escape');await W(200);
await ev(()=>{GanttApp.commit('t',q=>{q.periods=q.periods.filter(x=>x.uid==='pa1'||x.uid==='pa2');delete q.periods[0].lane;delete q.periods[1].lane})});await W(250);
// ---------- marker: duplica da finestra e da menu
await ev(()=>{GanttApp.commit('t',q=>{q.markers.push({uid:'mk2',kind:'custom',name:'Collaudo',color:{c:'arancio',v:1},date:'2026-12-04',dateEnd:null})})});await W(250);
await p.click('#tlCmds [data-act="mkList"]');await W(300);
ok(await p.locator('.mkr [aria-label="Duplica il marker"]').count()>=4,'pulsante Duplica nei marker');
ok(await p.locator('.mkr [aria-label="Duplica il marker"][disabled]').count()===3,'solo i marker personali si duplicano');
await p.locator('.mkr [aria-label="Duplica il marker"]:not([disabled])').first().click();await W(300);
ok(await ev(()=>GanttApp.P.markers.filter(m=>/Collaudo/.test(m.name)).length===2),'marker duplicato');
await p.keyboard.press('Escape');await W(200);
// ---------- Ctrl+Alt+trascina: periodo
await ev(()=>{GanttApp.commit('t',q=>{q.markers=q.markers.filter(m=>!/Collaudo \(copia\)/.test(m.name))})});await W(200);
const nP=await ev(()=>GanttApp.P.periods.length);
sb=await box('#tlHead .pseg[data-p="pa1"]');
await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+4);await p.keyboard.down('Control');await p.keyboard.down('Alt');await W(150);
ok(await ev(()=>document.body.hasAttribute('data-dup')),'cursore di duplicazione sul periodo con Ctrl+Alt');
await p.mouse.down();await p.mouse.move(sb.x+Math.min(sb.width/2,40)+40,sb.y+4,{steps:5});await W(100);
ok(await p.locator('#tlHead .pseg.ghost').count()===1,'anteprima fantasma del periodo duplicato');
await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Control');await W(300);
const per=await ev(()=>GanttApp.P.periods.map(x=>x.name+'|'+x.start));
eq(per.length,nP+1,'periodo duplicato trascinando');ok(/Alfa \(copia\)/.test(per.join(',')),'nome con (copia)');
ok(await ev(()=>GanttApp.P.periods[0].start==='2026-11-16'),'originale invariato');
await ev(()=>GanttApp.undo());await W(200);
// Esc annulla
sb=await box('#tlHead .pseg[data-p="pa1"]');await p.mouse.move(sb.x+Math.min(sb.width/2,40),sb.y+4);await p.keyboard.down('Control');await p.keyboard.down('Alt');await p.mouse.down();await p.mouse.move(sb.x+Math.min(sb.width/2,40)+40,sb.y+4,{steps:4});await p.keyboard.press('Escape');await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Control');await W(250);
eq(await ev(()=>GanttApp.P.periods.length),nP,'Esc annulla la duplicazione');
// ---------- Ctrl+Alt+trascina: marker
let mb=await box('#tlHead .mtag[data-m="mk2"]');
await p.mouse.move(mb.x+mb.width/2,mb.y+mb.height/2);await p.keyboard.down('Control');await p.keyboard.down('Alt');await p.mouse.down();await p.mouse.move(mb.x+mb.width/2+50,mb.y+mb.height/2,{steps:5});await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Control');await W(300);
const mks=await ev(()=>GanttApp.P.markers.filter(m=>/Collaudo/.test(m.name)).map(m=>m.name+'|'+m.date));
eq(mks.length,2,'marker duplicato trascinando');ok(mks.some(x=>x==='Collaudo|2026-12-04'),'marker originale al suo posto');
await ev(()=>GanttApp.undo());await W(200);
// marker spostato (senza duplicare) ancora funzionante
mb=await box('#tlHead .mtag[data-m="mk2"]');await p.mouse.move(mb.x+mb.width/2,mb.y+mb.height/2);await p.mouse.down();await p.mouse.move(mb.x+mb.width/2+40,mb.y+mb.height/2,{steps:5});await p.mouse.up();await W(300);
ok(await ev(()=>GanttApp.P.markers.find(m=>m.uid==='mk2').date>'2026-12-04'),'marker spostato');await ev(()=>GanttApp.undo());await W(200);
// ---------- Ctrl+Alt+trascina: barra
const idx=await ev(()=>GanttApp.P.items.findIndex(x=>x.type==='task'&&x.start));const n0=await ev(()=>GanttApp.P.items.length);
const bb=await ev((i)=>{const u=GanttApp.P.items[i].uid;const e=document.querySelector('#tlBody .bar[data-u="'+u+'"]');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,u}},idx);await W(200);
const bb2=await ev((u)=>{const r=document.querySelector('#tlBody .bar[data-u="'+u+'"]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}},bb.u);
const st0=await ev((i)=>GanttApp.P.items[i].start,idx);
await p.mouse.move(bb2.x+bb2.w/2,bb2.y+bb2.h/2);await p.keyboard.down('Control');await p.keyboard.down('Alt');await W(120);
ok(await ev(()=>document.body.hasAttribute('data-dup')),'cursore di duplicazione sulla barra');
await p.mouse.down();await p.mouse.move(bb2.x+bb2.w/2+60,bb2.y+bb2.h/2,{steps:6});await W(80);
ok(await p.locator('#tlBody .dupghost').count()>0,'barra fantasma durante il trascinamento');
await p.mouse.up();await p.keyboard.up('Alt');await p.keyboard.up('Control');await W(400);
eq(await ev(()=>GanttApp.P.items.length),n0+1,'barra duplicata');
const cp=await ev((i)=>({o:GanttApp.P.items[i],c:GanttApp.P.items[i+1]}),idx);
eq(cp.o.start,st0,'originale invariata');ok(/\(copia\)/.test(cp.c.name)&&cp.c.start>st0,'copia spostata '+cp.c.name+' '+cp.c.start);
ok(await ev(()=>GanttApp.ui.sel.length===1),'copia selezionata');
await ev(()=>GanttApp.undo());await W(250);eq(await ev(()=>GanttApp.P.items.length),n0,'annullamento della duplicazione');
// ---------- estensione elastica durante il trascinamento di una barra
await ev(()=>{GanttApp.ui.px=null});
const geo0=await ev(()=>({b:GanttApp.ui.geo.b,a:GanttApp.ui.geo.a}));
const lastIdx=await ev(()=>{let k=-1;GanttApp.P.items.forEach((x,i)=>{if(x.type==='task'&&x.end)k=i});return k});
const lb=await ev((i)=>{const u=GanttApp.P.items[i].uid;const e=document.querySelector('#tlBody .bar[data-u="'+u+'"]');e.scrollIntoView({block:'center',inline:'center'});return u},lastIdx);await W(250);
const r1=await ev((u)=>{const r=document.querySelector('#tlBody .bar[data-u="'+u+'"]').getBoundingClientRect();const t=document.getElementById('tlBody').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:t.right}},lb);
const e0=await ev((i)=>GanttApp.P.items[i].end,lastIdx);
await p.mouse.move(r1.x+r1.w/2,r1.y+r1.h/2);await p.mouse.down();await p.mouse.move(r1.x+r1.w/2+30,r1.y+r1.h/2,{steps:3});await p.mouse.move(r1.right-6,r1.y+r1.h/2,{steps:6});for(let q=0;q<40&&!(await ev(()=>GanttApp.ui.dragExt&&GanttApp.ui.dragExt.r>=28));q++)await W(500);await W(500);
const mid=await ev(()=>({b:GanttApp.ui.geo.b,ext:GanttApp.ui.dragExt}));
ok(mid.b>geo0.b+30&&mid.ext&&mid.ext.r>=28,'il calendario si allunga durante il trascinamento: b '+geo0.b+' → '+mid.b+' ext '+JSON.stringify(mid.ext));
await p.mouse.up();await W(400);
const e1=await ev((i)=>GanttApp.P.items[i].end,lastIdx);
ok(e1>e0,'la barra è stata portata oltre la vecchia fine del calendario '+e0+' → '+e1);
ok(await ev(()=>GanttApp.ui.dragExt===null),'estensione temporanea azzerata al rilascio');
ok(await ev(()=>{const g=GanttApp.ui.geo;return GanttApp.core.toDN?true:true}),'');
await ev(()=>GanttApp.undo());await W(300);
ok(await ev((b)=>GanttApp.ui.geo.b<=b+7,geo0.b),'dopo Annulla il calendario torna all\'estensione dei dati');
// Esc durante l'estensione
const r2=await ev((u)=>{document.querySelector('#tlBody .bar[data-u="'+u+'"]').scrollIntoView({block:'center',inline:'center'});const r=document.querySelector('#tlBody .bar[data-u="'+u+'"]').getBoundingClientRect();const t=document.getElementById('tlBody').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:t.right}},lb);await W(200);
await p.mouse.move(r2.x+r2.w/2,r2.y+r2.h/2);await p.mouse.down();await p.mouse.move(r2.right-6,r2.y+r2.h/2,{steps:8});for(let q=0;q<40&&!(await ev(()=>GanttApp.ui.dragExt&&GanttApp.ui.dragExt.r>=14));q++)await W(500);
await p.keyboard.press('Escape');await p.mouse.up();await W(300);
ok(await ev(()=>GanttApp.ui.dragExt===null),'Esc azzera l\'estensione');eq(await ev((i)=>GanttApp.P.items[i].end,lastIdx),e0,'Esc: barra invariata');
// avviso oltre la fine lavori
await ev(()=>{GanttApp.commit('t',q=>{q.calendar.projectEnd='2026-12-18'})});await W(250);
ok(/dopo la fine progetto|dopo la fine lavori/.test(await ev(()=>document.querySelector('#status').textContent)),'avviso in barra di stato');
// ---------- nuova indicazione
await ev(()=>GanttApp.act&&0);
const nI=await ev(()=>GanttApp.P.items.filter(x=>x.type==='indication').length);
const gIdx=await ev(()=>GanttApp.P.items.findIndex(x=>x.level===1));
await p.locator('#itemsBody .row .c-name').nth(0).click();await W(200);
ok(await p.locator('#itemCmds [data-act="ind"]').count()===0,'il pulsante Nuova indicazione non è più nella barra');
await p.locator('#itemsBody .row .c-name').nth(0).click({button:'right'});await W(250);
await p.locator('.cmenu .menuitem').filter({hasText:'Nuova indicazione'}).first().click();await W(400);
const ni=await ev(()=>{const A=GanttApp.P;const i=A.items.findIndex(x=>x.type==='indication');return {i,lv:A.items[i].level,pl:A.items[0].level,n:A.items.filter(x=>x.type==='indication').length}});
eq(ni.n,nI+1,'indicazione creata');ok(ni.lv===ni.pl+1,'dentro il gruppo selezionato (livello figlio) '+JSON.stringify(ni));
// menu riga
await p.locator('#itemsBody .row .c-name').nth(2).click({button:'right'});await W(250);
ok(await p.locator('.cmenu .menuitem').filter({hasText:'Nuova indicazione'}).count()>=1,'voce Nuova indicazione nel menu di riga');await p.keyboard.press('Escape');await W(100);
// etichetta: adattiva / a lato
await ev(()=>{GanttApp.commit('t',q=>{const it=q.items.find(x=>x.type==='indication');it.name='Avviso importante';it.start='2026-11-30';it.end='2026-12-11'})});await W(300);
const lab1=await ev(()=>{const e=document.querySelector('#tlBody .ind');const l=document.querySelector('#tlBody .blab[data-u="'+e.dataset.u+'"]');return {ind:e.className,lab:l.className}});
ok(/gap/.test(lab1.ind)&&/inl/.test(lab1.lab),'indicazione lunga: etichetta sovrapposta '+JSON.stringify(lab1));
await ev(()=>{GanttApp.commit('t',q=>{const it=q.items.find(x=>x.type==='indication');it.end='2026-12-01'})});await W(300);
const lab2=await ev(()=>{const e=document.querySelector('#tlBody .ind');const l=document.querySelector('#tlBody .blab[data-u="'+e.dataset.u+'"]');const r=e.getBoundingClientRect(),q=l.getBoundingClientRect();return {ind:e.className,lab:l.className,above:q.bottom<=r.top+r.height+2,top:r.top,bot:q.bottom}});
ok(/lo/.test(lab2.ind)&&/up/.test(lab2.lab)&&lab2.above,'indicazione corta: etichetta sopra la linea che scende '+JSON.stringify(lab2));
await ev(()=>{GanttApp.commit('t',q=>{q.view.indLabel='side'})});await W(300);
const lab3=await ev(()=>{const e=document.querySelector('#tlBody .ind');const l=document.querySelector('#tlBody .blab[data-u="'+e.dataset.u+'"]');return {ind:e.className,lab:l.className}});
ok(!/lo|gap/.test(lab3.ind)&&/out/.test(lab3.lab),'opzione «a lato»: comportamento precedente '+JSON.stringify(lab3));
await ev(()=>{GanttApp.commit('t',q=>{const it=q.items.find(x=>x.type==='indication');it.end='2026-12-11';q.view.indLabel='above'})});await W(300);
const lab4=await ev(()=>{const e=document.querySelector('#tlBody .ind');const l=document.querySelector('#tlBody .blab[data-u="'+e.dataset.u+'"]');return {ind:e.className,lab:l.className}});
ok(/lo/.test(lab4.ind)&&/up/.test(lab4.lab)&&!/gap/.test(lab4.ind),'opzione «sopra»: etichetta sempre sopra, anche se la linea è lunga '+JSON.stringify(lab4));
await p.click('#tlCmds [data-act="tlopts"]');await W(300);ok(await p.locator('.pop >> text=Etichetta delle indicazioni').count()>=1,'opzione in Visualizza');await p.keyboard.press('Escape');
// ---------- interruttori generali marker / periodi
const nm0=await ev(()=>document.querySelectorAll('#tlHead .mtag').length);ok(nm0>0,'marker visibili');
ok(await p.locator('#mostraFly [data-act="mkVis"]').count()===1&&await p.locator('#mostraFly [data-act="perVis"]').count()===1,'pulsanti generali marker e periodi nella barra');
await p.locator('#mostraFly [data-act="mkVis"]').dispatchEvent('click');await W(300);
eq(await ev(()=>document.querySelectorAll('#tlHead .mtag').length),0,'tutti i marker nascosti insieme');
ok(await ev(()=>GanttApp.P.markers.every(m=>!m.hidden)),'la visibilità del singolo marker non cambia');
await p.click('#tlCmds [data-act="mkList"]');await W(300);ok(await p.locator('.mkset .switch[aria-checked="false"]').count()>=1,'interruttore generale nel pannello dei marker');await p.keyboard.press('Escape');await W(150);
await p.locator('#mostraFly [data-act="mkVis"]').dispatchEvent('click');await W(300);ok(await ev(()=>document.querySelectorAll('#tlHead .mtag').length)===nm0,'marker di nuovo visibili');
await p.locator('#mostraFly [data-act="perVis"]').dispatchEvent('click');await W(300);
eq(await ev(()=>[document.querySelectorAll('#tlHead .pseg[data-p]').length,document.querySelectorAll('#tlBody .tper').length]),[0,0],'tutti i periodi nascosti (fascia e tinta)');
await p.locator('#mostraFly [data-act="perVis"]').dispatchEvent('click');await W(300);ok(await ev(()=>document.querySelectorAll('#tlHead .pseg[data-p]').length)>=2,'periodi di nuovo visibili');
ok(pe.length===0,'nessun errore JS: '+pe.join('|'));
console.log('pass',pass,'fail',fail);await b.close();})();
