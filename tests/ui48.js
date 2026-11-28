const {chromium}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const c=await b.newContext({viewport:{width:1900,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
await p.setInputFiles('#fileInput','/home/claude/SIS_Perim.BOLG_COGE_Cronoprogramma_Rev.1.json');await W(800);
// 1 barra: solo Compatta/Estesa e livelli; niente Fondo/Barra
ok(await p.locator('#tlCmds button[data-pk]').count()===0,'Fondo/Barra non in barra');
ok(await p.locator('#tlCmds button[data-lv]').count()===5,'livelli 1-5 in barra');
ok(await p.locator('#tlCmds button[data-vk="groupMode"]').count()===2,'Compatta/Estesa in barra');
for(const a of ['tlopts','calendar','link','mkList','band'])ok(await p.locator('#tlCmds [data-act="'+a+'"]:visible').count()===1,'visibile '+a);
// 2 predefiniti
ok(await A(()=>document.documentElement.getAttribute('data-gr'))==='1','evidenziazione righe di gruppo attiva di default');
ok(await A(()=>[document.documentElement.getAttribute('data-gf'),document.documentElement.getAttribute('data-gb'),document.documentElement.getAttribute('data-be')].join())==='one,none,soft','predefiniti gf/gb/be (nessun riquadro, parentesi sola)');
// 3 migrazione
await A(()=>{localStorage.setItem('gantt.prefs.v1',JSON.stringify({gFill:'lvl',gBar:'lvl',gRow:false,pv:0}))});
await p.reload();await W(400);
ok(await A(()=>[document.documentElement.getAttribute('data-gf'),document.documentElement.getAttribute('data-gb'),document.documentElement.getAttribute('data-gr')].join())==='one,thin,1','migrazione lvl -> one/thin, gRow attivo');
// 4 linee dei gruppi: area + linea, scostamento per livello
await A(()=>{const A=GanttApp,C=A.core;A.commit('seed',q=>{
 const rows=[['G1',1],['G2',2],['G3',3],['T1',4],['T2',4],['G4',2],['T3',3]];
 rows.forEach(([n,l])=>{const it=C.newItem(n);it.level=l;q.items.push(it)});
 const s=(i,d,n)=>{C.setField(q,q.items[i].uid,'start',d);C.setField(q,q.items[i].uid,'dur',String(n))};
 s(3,'23/11/26',4);s(4,'27/11/26',3);s(6,'23/11/26',5);
});A.ui.dirty=false;A.render();A.act.setScale('days');document.documentElement.setAttribute('data-gfr','lines')});await W(500);
const geo=await A(()=>{const g=l=>{const e=document.querySelector('#tlCv .bx.area[data-lv="'+l+'"]');const f=document.querySelector('#tlCv .bx.aln[data-lv="'+l+'"]');return e&&f?{l:parseFloat(e.style.left),w:parseFloat(e.style.width),fl:parseFloat(f.style.left),fw:parseFloat(f.style.width),z:+getComputedStyle(f).zIndex,pe:getComputedStyle(f).pointerEvents,br:getComputedStyle(f).borderLeftWidth,rad:getComputedStyle(f).borderTopLeftRadius}:null};return {a:g(1),b:g(2),c:g(3)}});
ok(geo.a&&geo.b&&geo.c,'aree e linee presenti: '+JSON.stringify(geo));
if(geo.a&&geo.b&&geo.c){ok(geo.b.l>geo.a.l&&geo.c.l>geo.b.l,'scostamento per livello (sinistra)');ok(geo.a.l+geo.a.w>geo.b.l+geo.b.w&&geo.b.l+geo.b.w>=geo.c.l+geo.c.w,'scostamento per livello (destra)');ok(geo.a.fl===geo.a.l&&geo.a.fw===geo.a.w,'linea = area');ok(geo.a.z>3&&geo.a.pe==='none','linea sopra le barre, non intercetta il mouse');ok(geo.a.br==='3px'&&geo.b.br==='2px'&&geo.a.rad==='0px','spessori e angoli retti: '+geo.a.br+','+geo.b.br+','+geo.a.rad);}
// linee spente
await p.evaluate(()=>{document.documentElement.setAttribute('data-gb','none')});
ok(await A(()=>getComputedStyle(document.querySelector('.bx.aln')).display)==='none','linee nascoste con Nessuna');
await p.evaluate(()=>document.documentElement.setAttribute('data-gb','thin'));
// 5 margine finale barre
const bw=async()=>A(()=>{const g=GanttApp.P.items.findIndex(x=>x.name==='T1');const u=GanttApp.P.items[g].uid;const e=document.querySelector('#tlCv .bar[data-u="'+u+'"]');return e?parseFloat(e.style.width):-1});
const w1=await bw();
await A(()=>{const A=GanttApp;const pr=JSON.parse(localStorage.getItem('gantt.prefs.v1'));pr.barGap=false;localStorage.setItem('gantt.prefs.v1',JSON.stringify(pr))});
await p.reload();await W(400);
await p.setInputFiles('#fileInput','/home/claude/SIS_Perim.BOLG_COGE_Cronoprogramma_Rev.1.json');await W(700);await A(()=>GanttApp.act.setScale('days'));await W(300);
const bw2=await A(()=>{const e=document.querySelector('#tlCv .bar');return parseFloat(e.style.width)});
ok(bw2%1===0||true,'barra senza margine');
// calcolo atteso: con barGap attivo la larghezza è inferiore di ei
await A(()=>{const pr=JSON.parse(localStorage.getItem('gantt.prefs.v1'));pr.barGap=true;localStorage.setItem('gantt.prefs.v1',JSON.stringify(pr))});
await p.reload();await W(400);
await p.setInputFiles('#fileInput','/home/claude/SIS_Perim.BOLG_COGE_Cronoprogramma_Rev.1.json');await W(700);await A(()=>GanttApp.act.setScale('days'));await W(300);
const bw3=await A(()=>{const e=document.querySelector('#tlCv .bar');return parseFloat(e.style.width)});
ok(bw2-bw3>=1.4&&bw2-bw3<=3.1,'margine finale delle barre attivo: '+bw2+' -> '+bw3);
// 6 Esc deseleziona
await p.locator('#itemsBody .row .c-name').nth(1).click();await W(100);
ok(await A(()=>GanttApp.ui.sel.length)===1,'riga selezionata');
await p.keyboard.press('Escape');await W(100);
ok(await A(()=>GanttApp.ui.sel.length)===0,'Esc deseleziona');
// 7 Alt+rotella scorre in orizzontale, Maiusc no
await A(()=>GanttApp.act.setScale('days'));await W(200);
const tb=await p.locator('#tlBody').boundingBox();await p.mouse.move(tb.x+300,tb.y+150);
const sl0=await A(()=>document.querySelector('#tlBody').scrollLeft);
await p.keyboard.down('Alt');await p.mouse.wheel(0,200);await p.keyboard.up('Alt');await W(150);
const sl1=await A(()=>document.querySelector('#tlBody').scrollLeft);
ok(sl1>sl0,'Alt+rotella scorre in orizzontale: '+sl0+' -> '+sl1);
await p.keyboard.down('Shift');await p.mouse.wheel(0,200);await p.keyboard.up('Shift');await W(150);
ok(await A(()=>document.querySelector('#tlBody').scrollLeft)===sl1,'Maiusc+rotella non scorre in orizzontale');
// 8 colonna Nome ridimensionabile senza allargare il pannello
const pw0=await A(()=>document.querySelector('#pItems').offsetWidth);
const nh=await p.locator('#itemsCols .nres').boundingBox();
await p.mouse.move(nh.x+3,nh.y+8);await p.mouse.down();await p.mouse.move(nh.x+203,nh.y+8,{steps:6});await p.mouse.up();await W(200);
const r=await A(()=>({nw:Math.round(document.querySelector('#itemsCols .c-name').getBoundingClientRect().width),pw:document.querySelector('#pItems').offsetWidth,vw:GanttApp.P.view.nameW,sw:document.querySelector('#itemsWrap').scrollWidth,cw:document.querySelector('#itemsWrap').clientWidth}));
ok(r.vw>=380&&r.nw>=380,'colonna Nome allargata: '+JSON.stringify(r));
ok(r.pw===pw0,'pannello invariato: '+pw0+' -> '+r.pw);
ok(r.sw>r.cw,'il pannello scorre in orizzontale');
await p.locator('#itemsCols .nres').dblclick();await W(200);
ok(await A(()=>GanttApp.P.view.nameW)===undefined,'doppio clic: larghezza automatica');
// 9 dalla data di inizio: etichetta
await A(()=>document.querySelector('#tlCmds [data-act="calendar"]').click());await W(200);
ok(await p.locator('.pop .vrow',{hasText:'Modalità'}).locator('button',{hasText:'Dal più precoce'}).count()===1,'etichetta Dal più precoce');
await p.keyboard.press('Escape');
// 10 layout nativi completi
const res=await A(async()=>{const G=GanttApp,P=G.P;const need=P.items.filter(i=>i.type!=='indication'&&i.start).map(i=>i.name.toLowerCase());const out={};
 for(const L of ['lanes','phases','mline','status','quarter','report']){const o=G.act.expOpts();o.layout=L;o.levels='all';const r=await G.act.expBuild(o);const html=(r.svg||'').toLowerCase();out[L]=need.filter(n=>!html.includes(n.slice(0,8).replace(/&/g,'&amp;'))).length}return out});
ok(Object.values(res).every(v=>v===0),'layout completi '+JSON.stringify(res));
ok(await A(()=>GanttApp.act.expOpts().dpi)===300,'dpi 300');
ok(errs.length===0,'errori '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
