const {chromium}=require('playwright');const seed=require('./seed21.js');const fs=require('fs');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const ctx=await b.newContext({viewport:{width:1600,height:900},acceptDownloads:true});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const D='/tmp/valico-tests/';
await p.locator('[data-act="export"]').click();await W(300);
const seg=(v)=>p.locator('#dlgExp .xsegb[data-v="'+v+'"]').first();
async function dl(label){const [d]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.locator('#expGo').click()]);const path=D+'out72_'+label;await d.saveAs(path);return {name:d.suggestedFilename(),buf:fs.readFileSync(path),path};}
// 1 anteprima
await W(700);
ok(await p.locator('#expPrev img.xprevimg').count()===1,'anteprima presente');
const info0=await p.locator('#expInfo').textContent();ok(/3000 × \d+ px/.test(info0),'info con larghezza 3000: '+info0);
// 2 pixel
await seg('1600').click();await W(700);ok(/1600 × \d+ px/.test(await p.locator('#expInfo').textContent()),'info 1600');
let r=await dl('a.png');ok(r.buf.readUInt32BE(16)===1600,'PNG largo 1600: '+r.buf.readUInt32BE(16));
await p.locator('#expPx').fill('2400');await p.locator('#expPx').dispatchEvent('change');await W(700);
r=await dl('b.png');ok(r.buf.readUInt32BE(16)===2400,'PNG largo 2400 da campo: '+r.buf.readUInt32BE(16));
// 3 intestazione senza revisione/data e titolo personalizzato
await p.locator('#expTitle').fill('Titolo prova');await p.locator('#expTitle').dispatchEvent('change');
await p.locator('#dlgExp .xchk:has-text("Data di esportazione") input').uncheck();await W(700);
const svgU=await p.evaluate(()=>window.GanttApp&&0);
// 4 colonne
const wFull=await p.evaluate(()=>0);
await seg('sel').click();await W(200);
const chips=await p.locator('#dlgExp .xchip').count();ok(chips>=4,'chip colonne: '+chips);
const wAll=(await dl('c.png')).buf.readUInt32BE(16);
// restringo: tolgo tutte le colonne tranne una
const nChips=await p.locator('#dlgExp .xchip.on').count();
for(let i=0;i<chips-1;i++){const c=p.locator('#dlgExp .xchip.on:not(.locked)').first();if(await c.count()) await c.click();}
await W(200);ok(await p.locator('#dlgExp .xchip.on').count()===1,'resta solo il nome (sempre presente)');
await seg('svg').click();await W(300);
r=await dl('d.svg');const sv=r.buf.toString('utf8');const m=sv.match(/<svg[^>]* width="(\d+)"/);
ok(m&&+m[1]>0,'svg valido');ok(sv.includes('Titolo prova'),'titolo personalizzato nell\'SVG');ok(!sv.includes('Esportato il'),'data di esportazione omessa');
const wNarrow=+m[1];
await seg('all').click();await W(200);
r=await dl('e.svg');const m2=r.buf.toString('utf8').match(/<svg[^>]* width="(\d+)"/);ok(+m2[1]>wNarrow,'colonne «come a schermo» più larghe di una sola: '+m2[1]+' > '+wNarrow);
// 5 livelli: calendario/marker/collegamenti
await p.locator('#dlgExp .xchk:has-text("Marker") input').uncheck();await W(200);
r=await dl('f.svg');const s3=r.buf.toString('utf8');ok(!s3.includes('Fine lavori'),'marker omessi'); 
await p.locator('#dlgExp .xchk:has-text("Marker") input').check();await W(200);
r=await dl('g.svg');ok(r.buf.toString('utf8').includes('Fine lavori'),'marker presenti');
// 6 PDF: dpi e carta
await seg('pdf').click();await W(300);
ok(await p.locator('#dlgExp .xsegb[data-v="300"]').count()===1,'dpi 300 presente');
await seg('96').click();await W(200);const sz96=(await dl('h.pdf')).buf.length;
await seg('300').click();await W(200);const sz300=(await dl('i.pdf')).buf.length;
ok(sz300>sz96,'PDF 300 dpi più pesante di 96 dpi: '+sz300+' > '+sz96);
// 7 una pagina per fase
await p.locator('#dlgExp .xlayb[data-v="perphase"]').click();await W(700);
const ip=await p.locator('#expInfo').textContent();console.log(ip);
r=await dl('j.pdf');const pages=(r.buf.toString('latin1').match(/\/Type \/Page /g)||[]).length;
const nPh=await p.evaluate(()=>window.GanttApp.P.items.filter(i=>i.level===1&&i.type==='group').length);
ok(pages===Math.max(1,nPh)||pages===nPh+1,'pagine per fase: '+pages+' (gruppi livello 1: '+nPh+')');ok(r.name.includes('fasi'),'nome file con «fasi»: '+r.name);
// 8 report
await p.locator('#dlgExp .xlayb[data-v="report"]').click();await W(700);
r=await dl('k.pdf');ok(r.buf.slice(0,5).toString()==='%PDF-','report PDF valido');ok(r.name.includes('report'),'nome file report: '+r.name);
await seg('svg').click();await W(300);r=await dl('l.svg');const rs=r.buf.toString('utf8');
ok(rs.includes('Avanzamento complessivo')&&rs.includes('Assegnatario')&&rs.includes('Atteso'),'report con riepilogo e colonne');ok(!rs.includes('Oggi'),'report senza linea di oggi');
// 9 viste predefinite
await p.locator('#expProf').selectOption('status');await W(500);
ok(await p.locator('#dlgExp .xlayb[data-v="report"].on').count()===1,'profilo Avanzamento applica layout report');
ok(await p.locator('#dlgExp .xsegb[data-v="pdfv"].on').count()===1,'profilo applica PDF vettoriale');
await p.locator('#expProf').selectOption('site');await W(500);
ok(await p.locator('#dlgExp .xlayb[data-v="standard"].on').count()===1,'profilo Cantiere: standard');ok(await p.locator('#dlgExp .xchip').count()>=1,'profilo Cantiere: colonne scelte');
// salva vista
await p.locator('#expProfSave').click();await p.locator('#expProfName').fill('Mia vista');await p.locator('#expProfOk').click();await W(300);
let pf=await p.evaluate(()=>window.GanttApp.P.exportProfiles);ok(pf&&pf.length===1&&pf[0].name==='Mia vista'&&pf[0].o.layout==='standard','vista salvata nel progetto: '+JSON.stringify(pf&&pf.map(x=>x.name)));
ok(await p.locator('#expProf option:has-text("Mia vista")').count()===1,'vista nel menu');
ok(await p.locator('#expProfDel').isVisible(),'Elimina visibile per vista salvata');
// vista sopravvive a salvataggio/ricarica del progetto
const js=await p.evaluate(()=>JSON.stringify(window.GanttApp.P));ok(js.includes('Mia vista'),'vista nel JSON del progetto');
await p.locator('#expProfDel').click();await W(300);pf=await p.evaluate(()=>window.GanttApp.P.exportProfiles);ok(pf.length===0,'vista eliminata');
// annulla ripristina
await p.locator('#expCancel').click();await W(200);await p.keyboard.press('Control+z');await W(300);
ok((await p.evaluate(()=>window.GanttApp.P.exportProfiles.length))===1,'annulla ripristina la vista eliminata');
// 10 intervallo personalizzato su standard
await p.locator('[data-act="export"]').click();await W(300);
await p.locator('#dlgExp .xlayb[data-v="standard"]').click();await p.locator('#dlgExp .xsegb[data-v="custom"]').click();
await p.locator('#expFrom').fill('23/11');await p.locator('#expTo').fill('29/11');await p.locator('#expTo').dispatchEvent('change');await W(700);
ok(await p.locator('#expPrev img').count()===1,'anteprima con intervallo');
await p.locator('#expFrom').fill('xx');await p.locator('#expFrom').dispatchEvent('change');await W(700);
ok((await p.locator('#expPrev').textContent()).includes('non valido'),'intervallo errato: messaggio in anteprima');
// 11 Excel
await seg('xlsx').click();await W(500);ok((await p.locator('#expPrev').textContent()).includes('Excel'),'anteprima Excel: messaggio');
ok(errs.length===0,'nessun errore JS: '+errs.join('|'));
console.log('pass',pass,'fail',fail);
await b.close()})();
