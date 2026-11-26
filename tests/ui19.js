const {chromium}=require('playwright');const seed=require('./seed21.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' exp '+JSON.stringify(b));
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const p=await b.newPage({viewport:{width:1920,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);
const A=f=>p.evaluate(f);const AA=(f,a)=>p.evaluate(f,a);const W=ms=>p.waitForTimeout(ms);
// ovale del ritardo
await A(()=>{const A=window.GanttApp;A.commit('t',q=>{const f=n=>q.items.find(i=>i.name===n).uid;A.core.opLink(q,f('Scavi'),f('Casseri'),'FS');A.core.opLink(q,f('Pilastri'),f('Solai'),'FS');
 q.items.find(i=>i.name==='Casseri').predecessors[0].lag=2;q.items.find(i=>i.name==='Solai').predecessors[0].lag=-1})});await W(200);
eq(await p.locator('#tlCv .lagb.pos').count(),1,'ovale positivo');eq(await p.locator('#tlCv .lagb.neg').count(),1,'ovale negativo');
const col=await p.evaluate(()=>[...document.querySelectorAll('#tlCv .lagb rect')].map(r=>getComputedStyle(r).fill));
ok(col.includes('rgb(47, 180, 87)')&&col.includes('rgb(229, 56, 74)'),'verde per positivo, rosso per negativo: '+col);
ok((await p.locator('#tlCv .lagb.pos text').textContent())==='+2'&&(await p.locator('#tlCv .lagb.neg text').textContent())==='-1','testo +2 e -1');
// al centro del tracciato
const geo=await p.evaluate(()=>{const g=document.querySelector('#tlCv .lagb.pos'),to=g.getAttribute('data-to'),fr=g.getAttribute('data-from');const path=document.querySelector('#tlCv .dephit[data-to="'+to+'"][data-from="'+fr+'"]');const L=path.getTotalLength(),m=path.getPointAtLength(L/2),r=g.querySelector('rect');return {dx:Math.abs(+r.getAttribute('x')+(+r.getAttribute('width'))/2-m.x),dy:Math.abs(+r.getAttribute('y')+(+r.getAttribute('height'))/2-m.y)}});
ok(geo.dx<1.5&&geo.dy<1.5,'ovale a metà freccia '+JSON.stringify(geo));
// clic sull'ovale apre il popover del collegamento
await W(600);const bb=await p.locator('#tlCv .lagb.pos').boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await W(150);
ok(await p.locator('.pop .seg').count()>=1,'clic sull\'ovale apre la modifica del collegamento');
await p.keyboard.press('Escape');
// crea e poi modifica: marker dal tasto destro
await p.locator('#tlCmds .seg button',{hasText:'Giorni'}).click();await W(200);
const n0=await A(()=>window.GanttApp.P.markers.length);
await p.locator('#tlHead .tlc.c1').nth(8).click({button:'right'});await W(100);
await p.locator('.cmenu .menuitem').filter({hasText:'Aggiungi marker qui'}).first().click();await W(200);
ok(await p.locator('#tlHead input.mtedit').count()===1,'marker: campo nome subito attivo');
await p.keyboard.type('Collaudo FAT');await p.keyboard.press('Enter');await W(150);
eq(await A(()=>window.GanttApp.P.markers.length),n0+1,'un solo marker creato');
eq(await A(()=>window.GanttApp.P.markers.slice(-1)[0].name),'Collaudo FAT','nome digitato alla creazione');
// periodo dal tasto destro e doppio clic per rinominare
await p.locator('#tlHead .tlc.c1').nth(16).click({button:'right'});await W(100);
await p.locator('.cmenu .menuitem').filter({hasText:'Aggiungi periodo qui'}).first().click();await W(200);
ok(await p.locator('#tlHead input.ptedit').count()===1,'periodo: campo nome subito attivo');
await p.keyboard.press('Escape');await W(100);
eq(await A(()=>window.GanttApp.P.periods[0].name),'Nuovo periodo','Esc mantiene il nome predefinito');
await p.locator('#tlHead .pseg[data-p]').dblclick({position:{x:20,y:5}});await W(150);
ok(await p.locator('#tlHead input.ptedit').count()===1,'doppio clic sul periodo apre la modifica');
ok(await p.locator('.pop').count()===0,'senza aprire la finestra');
await p.keyboard.type('Montaggio');await p.keyboard.press('Enter');await W(150);
eq(await A(()=>window.GanttApp.P.periods[0].name),'Montaggio','periodo rinominato con doppio clic');
ok(errs.length===0,'errori: '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
