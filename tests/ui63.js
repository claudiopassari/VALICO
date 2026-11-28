const {chromium}=require('playwright');const seed=require('./seed21.js');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:900}});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);
// molti item
await p.evaluate(()=>{const A=window.GanttApp;for(let i=0;i<90;i++){A.addItem();}});await W(300);
const n=await p.evaluate(()=>window.GanttApp.P.items.length);console.log('items',n);
await p.locator('[data-act="export"]').click();await W(300);
await p.locator('#expBody .xsegb[data-v="pdfv"]').click();await W(500);
ok(await p.locator('#expVecNote').isVisible(),'nota vettoriale visibile');
ok(!(await p.locator('#expBody .xrow:has-text("Risoluzione")').isVisible()),'risoluzione nascosta');
ok(await p.locator('#expBody .xrow:has-text("Carta")').isVisible(),'carta visibile');
ok(await p.locator('#expBody .xsegb[data-v="chart"].on').count()===1,'carta predefinita: adatta al grafico');
await p.locator('#expBody .xsegb[data-v="a4"]').nth(1).click();await W(200);
await p.locator('#expBody .xsegb[data-v="width"]').click();await W(700);
console.log(await p.locator('#expInfo').textContent());
ok(/vettoriale/.test(await p.locator('#expInfo').textContent()),'info vettoriale');
ok(await p.locator('#expCopy').isDisabled(),'copia disabilitata');
const pg=await p.evaluate(()=>{const A=window.GanttApp.act;const o=A.expOpts();const bb=A.expBuild(o);const d=A.expVecDoc(o,bb);return {pages:d.pages,len:d.html.length,html:d.html}});
console.log('pagine',pg.pages,'KB',Math.round(pg.len/1024));ok(pg.pages>=2,'più pagine');
fs.writeFileSync('pv_big.html',pg.html);
await p.locator('#expGo').click();await W(2500);
console.log(await p.locator('#expBody .xmsg').textContent());
ok(/Finestra di stampa aperta/.test(await p.locator('#expBody .xmsg').textContent()),'messaggio stampa');
ok(await p.locator('#expGo').isEnabled(),'go riabilitato');
console.log('iframes',await p.locator('iframe[data-exp-print]').count());
await W(2000);console.log('iframes dopo',await p.locator('iframe[data-exp-print]').count(), 'title',await p.title());
const q=await ctx.newPage();await q.setContent(pg.html);await q.waitForTimeout(800);await q.pdf({path:'pv_big.pdf',preferCSSPageSize:true,printBackground:true});
try{const inf=execSync('pdfinfo pv_big.pdf').toString();ok(/Pages:\s+2/.test(inf),'PDF stampato: 2 pagine');const tx=execSync('pdftotext pv_big.pdf -').toString();ok(/Nuovo progetto/.test(tx),'testo selezionabile nel PDF');ok(/Esportato il/.test(tx),'testo estraibile: data');const fo=execSync('pdffonts pv_big.pdf').toString();ok(/yes/.test(fo),'font incorporati');}catch(e){fail++;console.log('ERR poppler',e.message)}
// layout per fase e native
const r2=await p.evaluate(()=>{const A=window.GanttApp.act;const out={};['perphase','phases','report'].forEach(l=>{const o=A.expOpts();Object.assign(o,{fmt:'pdfv',layout:l,paper:'a4',orient:'land',fit:'page',size:'a4'});const bb=A.expBuild(o);const d=bb&&!bb.error?A.expVecDoc(o,bb):{error:bb&&bb.error||'null'};out[l]=d.error?('E:'+d.error):d.pages});return out});console.log(JSON.stringify(r2));
ok(typeof r2.phases==='number'&&r2.phases>=1,'layout phases vettoriale');

// formato del grafico: una pagina con le dimensioni del gantt (anche stretta e lunga)
const ch=await p.evaluate(()=>{const A=window.GanttApp.act;const o=A.expOpts();Object.assign(o,{fmt:'pdfv',paper:'chart',layout:'standard'});const bb=A.expBuild(o);const pl=A.expVecPlan(o,bb);return {n:pl.pages.length,pw:pl.pages[0].pw,ph:pl.pages[0].ph,w:bb.w,h:bb.h}});
ok(ch.n===1&&Math.abs(ch.pw-ch.w*0.75)<0.1&&Math.abs(ch.ph-ch.h*0.75)<0.1,'adatta: pagina = dimensioni del grafico '+JSON.stringify(ch));
// tavolozza 4x10
await p.keyboard.press('Escape');await p.evaluate(()=>{const d=document.querySelector('#dlgExp');if(d&&d.open)d.close()});await W(200);
await p.evaluate(()=>{const a=window.GanttApp;a.ui.sel=[a.P.items[0].uid];a.render();a.act.pickColorFor(document.querySelector('#hbtns'),a.ui.sel.slice())});await W(200);
const labs=await p.locator('.cpick .cdot').evaluateAll(e=>e.map(x=>x.getAttribute('aria-label')));
ok(labs.length===40,'4x10 punti: '+labs.length);
ok(labs.slice(0,10).join('|')==='rosso chiaro|arancio chiaro|giallo chiaro|verde chiaro|blu chiaro|viola chiaro|rosa chiaro|bianco chiaro|grigio chiaro|nero chiaro','prima riga: colonne in ordine di tonalità e neutri in coda');
ok(labs[10]==='rosso medio-chiaro'&&labs[20]==='rosso medio'&&labs[30]==='rosso scuro','righe: chiaro, medio-chiaro, medio, scuro');
await p.locator('.cpick .cdot').nth(13).click();await W(200);
const cv=await p.evaluate(()=>{const a=window.GanttApp;return a.P.items[0].color});
ok(cv&&cv.c==='verde'&&cv.v===3,'livello medio-chiaro salvato come v=3: '+JSON.stringify(cv));
const bg=await p.evaluate(()=>{const e=document.querySelector('.trow .bx.bar');return e?getComputedStyle(e).backgroundColor:''});console.log('barra',bg);

// colorazione dei periodi
await p.evaluate(()=>{GanttApp.commit('t',q=>{q.periods.push({uid:'pt1',name:'Alfa',start:'2026-11-23',end:'2026-12-10',color:{c:'blu',v:1}})})});await W(300);
const tc=()=>p.evaluate(()=>({t:document.querySelectorAll('.tper').length,b:document.querySelectorAll('.pbnd .pbar, .pbnd [data-p]').length,on:document.querySelector('[data-act="perTint"]').getAttribute('aria-pressed')}));
let t0=await tc();ok(t0.t>=1&&t0.on==='true','colorazione attiva: '+JSON.stringify(t0));
await p.locator('#mostraFly [data-act="perTint"]').dispatchEvent('click');await W(300);
let t1=await tc();ok(t1.t===0&&t1.on==='false','colorazione disattivata dal pulsante: '+JSON.stringify(t1));
ok(await p.evaluate(()=>GanttApp.P.view.periodTint===false&&GanttApp.P.view.periodBand!==false),'la fascia dei periodi resta visibile');
ok(await p.evaluate(()=>document.documentElement.classList.contains('hasband')),'fascia ancora presente');
await p.locator('#mostraFly [data-act="perTint"]').dispatchEvent('click');await W(300);
let t2=await tc();ok(t2.t>=1&&t2.on==='true','colorazione riattivata');
// interruttore nel pannello periodi
await p.locator('[data-act="band"]').click();await W(250);
ok(await p.locator('.pop .sw, .pop .switch').count()>=2,'pannello periodi con interruttori');
await p.keyboard.press('Escape');await W(100);

// priorità dei periodi (riordino con la maniglia)
await p.evaluate(()=>{GanttApp.commit('t',q=>{q.periods.length=0;q.periods.push({uid:'p1',name:'Primo',start:'2026-11-23',end:'2026-12-10',color:{c:'blu',v:1}});q.periods.push({uid:'p2',name:'Secondo',start:'2026-11-30',end:'2026-12-20',color:{c:'rosso',v:1}})})});await W(300);
const ord0=await p.evaluate(()=>[...document.querySelectorAll('.tper')].map(e=>e.getAttribute('data-p')));
ok(ord0.join()==='p2,p1','il primo periodo si dipinge per ultimo (prevale): '+ord0.join());
await p.locator('[data-act="band"]').click();await W(300);
ok(await p.locator('.pop .pdr .grip').count()===2,'maniglie nell\'elenco dei periodi');
const g1=await p.locator('.pop .pdr .grip').nth(0).boundingBox(),rr2=await p.locator(".pop .pdr").nth(1).boundingBox();
await p.mouse.move(g1.x+g1.width/2,g1.y+g1.height/2);await p.mouse.down();await p.mouse.move(g1.x+5,rr2.y+rr2.height-2,{steps:6});await p.mouse.up();await W(300);
const ord1=await p.evaluate(()=>GanttApp.P.periods.map(x=>x.uid).join());
ok(ord1==='p2,p1','trascinando la maniglia l\'ordine cambia: '+ord1);
const ord2=await p.evaluate(()=>[...document.querySelectorAll('.tper')].map(e=>e.getAttribute('data-p')).join());
ok(ord2==='p1,p2','dopo il riordino prevale il nuovo primo: '+ord2);
await p.evaluate(()=>GanttApp.undo());await W(250);
ok(await p.evaluate(()=>GanttApp.P.periods.map(x=>x.uid).join())==='p1,p2','riordino annullabile');
await p.keyboard.press('Escape');await W(100);

// gruppi: fondo, parentesi, riquadro
await p.evaluate(()=>GanttApp.act.loadExample());await W(500);
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(300);
for(const t of ['Fondo','Parentesi','Riquadro','Terminazione delle barre'])ok(await p.locator('.pop .vrow',{hasText:t}).count()>=1,'impostazione '+t);
ok(await p.locator('.pop .vrow',{hasText:'Contorno'}).count()===0,'«Contorno» assorbito dal riquadro');
const cnt0=await p.evaluate(()=>({par:document.querySelectorAll('#tlCv .bx.par').length,aln:document.querySelectorAll('#tlCv .bx.aln').length,gp:document.documentElement.getAttribute('data-gp'),gfr:document.documentElement.getAttribute('data-gfr')}));
ok(cnt0.par>0&&cnt0.gp==='on'&&cnt0.gfr==='none','predefinito: solo parentesi, nessun riquadro '+JSON.stringify(cnt0));
await p.locator('.pop .vrow',{hasText:'Riquadro'}).locator('button',{hasText:'Nessuno'}).click();await W(400);
const cnt1=await p.evaluate(()=>({gb:document.documentElement.getAttribute('data-gb'),vis:[...document.querySelectorAll('#tlCv .bx.aln')].filter(e=>e.getBoundingClientRect().width>0).length,par:[...document.querySelectorAll('#tlCv .bx.par')].filter(e=>e.getBoundingClientRect().width>0).length,pre:getComputedStyle(document.querySelector('#tlCv .bx.par'),'::before').borderTopLeftRadius}));
ok(cnt1.gb==='none'&&cnt1.vis===0&&cnt1.par>0&&parseFloat(cnt1.pre)>50,'senza riquadro resta la linea verticale con estremità arrotondate '+JSON.stringify(cnt1));
await p.locator('.pop .vrow',{hasText:'Parentesi'}).locator('button',{hasText:'Nessuna'}).click();await W(400);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-gp')==='none'&&[...document.querySelectorAll('#tlCv .bx.par')].filter(e=>e.getBoundingClientRect().width>0).length===0),'parentesi disattivata');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('gantt.prefs.v1')).gPar==='none'),'preferenza salvata');
await p.keyboard.press('Escape');await W(100);
console.log('pass',pass,'fail',fail);await b.close()})();
