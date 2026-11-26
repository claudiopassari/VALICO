const {chromium}=require('playwright');const seed=require('./seed21.js');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:1300}});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.addInitScript(()=>{try{if(!localStorage.getItem('gantt.prefs.v1'))localStorage.setItem('gantt.prefs.v1',JSON.stringify({detailsOpen:true,density:'normal',itemScale:100,gFrame:'round',gBar:'thin',gPar:'on',gRow:true,pv:2}))}catch(e){}});await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);const A=f=>p.evaluate(f);
// Armature (4 gg, Rossi) e Casseri (Bianchi) dal 26/11 e 27/11, 4 e 2 giorni; ore 6/giorno per Armature
const exp=await A(()=>{const a=window.GanttApp;a.commit('t',q=>{const it=q.items.find(i=>i.name==='Armature');it.hoursPerDay=6});
 const r=[];a.P.items.forEach(i=>{if(i.assignee)r.push([i.name,i.assignee,i.start,i.end,i.duration])});return r});
await p.locator('#itemCmds [data-act="hours"]').click();await W(200);
ok(await p.locator('#dlgRep[open]').count()===1,'dialogo aperto da pulsante');
ok((await p.locator('#dlgRep .rtab').textContent()).includes('Rossi'),'riepilogo con Rossi');
await p.locator('#dlgRep .xsegb[data-v="week"]').click();await W(150);
const t=await p.locator('#dlgRep .rtab').innerText();
ok(/Maestranze/.test(t)&&/Totale ore/.test(t),'righe totali e maestranze: '+t.slice(0,200));
const data=await A(()=>{const hp=null;return [...document.querySelectorAll('#dlgRep .rtab tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent))});
const rossi=data.find(r=>r[0]==='Rossi'),bia=data.find(r=>r[0]==='Bianchi'),peak=data.find(r=>/Maestranze/.test(r[0])),tot=data.find(r=>r[0]==='Totale ore');
const hrsR=exp.find(x=>x[1]==='Rossi'),hrsB=exp.find(x=>x[1]==='Bianchi');
ok(rossi&&rossi[2]==String(hrsR[4]*6),'Rossi ore totali = giorni × 6 → '+JSON.stringify(rossi));
ok(bia&&bia[2]==String(hrsB[4]*8),'Bianchi ore totali = giorni × 8 → '+JSON.stringify(bia));
ok(peak&&+peak[2]===2,'picco maestranze 2 (sovrapposizione): '+JSON.stringify(peak));
ok(tot&&+tot[2].replace(',','.')===data.filter(r=>!/^(Totale ore|Maestranze)/.test(r[0])).reduce((a,r)=>a+(+r[2].replace(',','.')),0),'totale ore = somma righe: '+JSON.stringify(tot));
// somma delle celle settimanali = totale riga
ok(rossi&&rossi.slice(3).reduce((a,x)=>a+(+x.replace(',','.')||0),0)===+rossi[2].replace(',','.'),'somma settimane = totale');
await p.locator('#dlgRep .xsegb[data-v="month"]').click();await W(150);
ok(await p.locator('#dlgRep .rtab thead th').count()>=4,'vista mensile con colonne');
const dl=p.waitForEvent('download');await p.locator('#repCsv').click();const d=await dl;ok(/\.csv$/.test(d.suggestedFilename()),'CSV scaricato: '+d.suggestedFilename());
await p.locator('#repClose').click();await W(100);ok(await p.locator('#dlgRep[open]').count()===0,'dialogo chiuso');
console.log('pass',pass,'fail',fail);await b.close()})();
