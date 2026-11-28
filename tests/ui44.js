const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const ctx=await b.newContext({viewport:{width:1700,height:950},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
const W=t=>p.waitForTimeout(t);
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await W(300);
await p.evaluate(()=>window.GanttApp.act.loadExample());await W(500);
await p.locator('[data-act="export"]').click();await W(700);
// ---- Output: il formato sta nel pannello Output
const sec=await p.evaluate(()=>{const secs=[...document.querySelectorAll('#expBody .xsec')];const out=secs.find(s=>s.classList.contains('xs3'));const all=[...document.querySelectorAll('#expBody .xseg')].map(x=>x.querySelector('[data-v="xlsx"]')?1:0);return {has:!!out,fmtIn:out?!!out.querySelector('.xseg [data-v="png"]'):false,old:secs.some(s=>/Risoluzione e uscita/.test(s.textContent.slice(0,40))),fmtBefore:(()=>{const x=document.querySelector('#expBody .xseg [data-v="xlsx"]');return !!x&&!x.closest('.xsec')})()}});
ok(sec.has,'sezione Output');ok(sec.fmtIn,'formato dentro Output');ok(!sec.old,'vecchio titolo assente');ok(!sec.fmtBefore,'formato non più fuori dalle sezioni');
// ---- colonne: Nome bloccato
await p.locator('#expRows,#expBody').first();
const scegli=p.locator('#expBody .xrow:has(.xl:text("Colonne")) .xsegb[data-v="sel"]');await scegli.click();await W(200);
const nome=p.locator('#expBody .xchip[data-c="name"]');
ok(await nome.count()===1,'chip Nome presente');ok((await nome.getAttribute('aria-pressed'))==='true','Nome selezionato');
await nome.click({force:true});await W(150);ok((await nome.getAttribute('aria-pressed'))==='true','Nome non deselezionabile');
const chips=p.locator('#expBody .xchip:not([data-c="name"])');const nc=await chips.count();
for(let i=0;i<nc;i++){ if((await chips.nth(i).getAttribute('aria-pressed'))==='true'){ await chips.nth(i).click(); } }
await W(300);
let on=await p.evaluate(()=>[...document.querySelectorAll('#expBody .xchip.on')].map(c=>c.dataset.c));eq(on,['name'],'tutte le altre colonne deselezionabili');
const svgN=await p.evaluate(()=>{const A=window.GanttApp;const o=A.act.expOpts();return A.act.expBuild(o).svg});
ok(/c-name/.test(svgN)&&!/c c-start|c-start s|c-dur|c-assignee/.test(svgN.replace(/\.c-\w+/g,'')),'esportazione con il solo nome');
ok((await p.locator('#expInfo').textContent()).length>0,'anteprima aggiornata');
// riattiva una colonna
await chips.first().click();await W(200);on=await p.evaluate(()=>[...document.querySelectorAll('#expBody .xchip.on')].map(c=>c.dataset.c));ok(on.length===2&&on[0]==='name','Nome + una colonna: '+on);
// ---- area progetto attivo: etichette non tagliate
await p.locator('#expBody .xrow:has(.xl:text("Area")) .xsegb[data-v="active"]').click();await W(400);
const ar=await p.evaluate(()=>{const A=window.GanttApp;const o=A.act.expOpts();o.items=false;o.title=false;o.area='active';const bb=A.act.expBuild(o);
  const cv=document.getElementById('tlCv');let mn=1e9,mx=0,n=A.P.items.length;[...cv.querySelectorAll('.trow')].forEach((tr)=>{[...tr.querySelectorAll('.bx')].forEach(el=>{if(el.classList.contains('area'))return;const l=el.offsetLeft,r=l+el.offsetWidth;if(!r)return;mn=Math.min(mn,l);mx=Math.max(mx,r)})});
  return {w:bb.w,need:mx-mn,mn,mx,W:A.ui.geo.W}});
console.log(JSON.stringify(ar));
ok(ar.w>=ar.need,'area attiva contiene tutte le barre e le etichette ('+ar.w+' >= '+ar.need+')');
// ---- trasparenza
await p.locator('#expBody .xrow:has(.xl:text("Area")) .xsegb[data-v="all"]').click();
const tchk=p.locator('#expBody .xchk:has-text("Sfondo trasparente")');
ok(await tchk.isVisible(),'casella trasparenza visibile con PNG');
await tchk.locator('input').check();await W(600);
ok(await p.evaluate(()=>document.getElementById('expPrev').classList.contains('xck')),'anteprima a scacchiera');
const px=await p.evaluate(async()=>{const A=window.GanttApp;const o=A.act.expOpts();o.fmt='png';o.transp=true;o.px=1600;o.theme='light';o.title=true;
  const r=await A.act.expCanvas(o);const c=r.canvas,x=c.getContext('2d');const d=x.getImageData(0,0,c.width,c.height).data;let tr=0,op=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)tr++;else op++}
  const corner=x.getImageData(2,2,1,1).data[3];
  o.transp=false;const r2=await A.act.expCanvas(o);const c2=r2.canvas.getContext('2d').getImageData(2,2,1,1).data[3];
  return {corner,tr:tr/(tr+op),op,corner2:c2}});
console.log(JSON.stringify(px));
ok(px.corner===0,'angolo trasparente');ok(px.tr>0.5,'la maggior parte dell\'immagine è trasparente: '+px.tr.toFixed(2));ok(px.op>500,'il contenuto resta visibile');ok(px.corner2===255,'senza opzione lo sfondo è pieno');
// con trasparenza + tema chiaro, nessun pixel di sfondo scuro nell'area vuota della timeline
await p.locator('#expBody .xsegb[data-v="jpg"]').click();await W(250);
ok(!(await tchk.isVisible()),'casella nascosta con JPEG');
await p.locator('#expBody .xsegb[data-v="svg"]').click();await W(250);ok(await tchk.isVisible(),'casella visibile con SVG');
await p.locator('#expBody .xsegb[data-v="pdf"]').click();await W(250);ok(!(await tchk.isVisible()),'casella nascosta con PDF');
await p.locator('#expBody .xsegb[data-v="png"]').click();await W(250);
// ---- copia come immagine
await tchk.locator('input').uncheck();await W(300);
await p.locator('#expCopy').click();await W(4500);
const mtxt=await p.locator('#expBody .xmsg').textContent();console.log(mtxt);
ok(/Immagine copiata/.test(mtxt),'messaggio «Immagine copiata»');
const clip=await p.evaluate(async()=>{try{const it=await navigator.clipboard.read();const types=it[0].types;const bl=await it[0].getType('image/png');const bm=await createImageBitmap(bl);return {types,size:bl.size,w:bm.width,h:bm.height}}catch(e){return {err:String(e)}}});
console.log(JSON.stringify(clip));
ok(clip.types&&clip.types.indexOf('image/png')>=0,'negli appunti c\'è un\'immagine PNG');ok(clip.w===3000,'larghezza 3000 px: '+clip.w);ok(clip.size>5000,'dimensione plausibile: '+clip.size);
ok(!/scaricata/.test(mtxt),'nessun ripiego con il download');
// il messaggio dichiara le stesse dimensioni
ok(mtxt.indexOf(clip.w+' × '+clip.h)>=0,'dimensioni nel messaggio coerenti');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
