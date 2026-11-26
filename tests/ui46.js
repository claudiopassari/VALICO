const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
for(const th of ['dark','light']){
const c=await b.newContext({viewport:{width:1500,height:700}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(t=>{try{localStorage.setItem('gantt.prefs.v1',JSON.stringify({theme:t}))}catch(e){}},th);
await p.goto('file://'+process.cwd()+'/app.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const e=document.querySelector('[data-act="export"]'),cs=getComputedStyle(e),acc=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
 const rev=getComputedStyle([...document.querySelectorAll('#hbtns .btn.primary')][0]);const car=getComputedStyle(document.querySelector('[data-act="look"]'));
 const tmp=document.createElement('i');tmp.style.color=acc;document.body.appendChild(tmp);const accRgb=getComputedStyle(tmp).color;tmp.remove();
 return {border:cs.borderTopColor,w:cs.borderTopWidth,color:cs.color,accRgb,revBg:rev.backgroundColor,lookBorder:car.borderTopColor}});
console.log(th,JSON.stringify(r));
ok(r.border===r.accRgb,th+': bordo del colore del tema');ok(r.color===r.accRgb,th+': testo del colore del tema');ok(r.lookBorder!==r.border,th+': diverso dagli altri pulsanti');ok(r.revBg===r.accRgb,th+': Aggiorna revisione resta pieno');
if(th==='dark')await p.screenshot({path:'xb.png',clip:{x:950,y:0,width:550,height:60}});
await p.locator('[data-act="help"]').click();await p.waitForTimeout(150);await p.locator('.pop [data-act="about"]').click();await p.waitForTimeout(300);
const tip=await p.evaluate(()=>document.querySelector('#dlgAbout .abkv dt[data-tip]').getAttribute('data-tip'));ok(/struttura/.test(tip)&&/compatibilità/.test(tip),th+': spiegazione dello schema');
ok(/struttura dei file di progetto/.test(await p.locator('#dlgAbout .abkv').textContent()),th+': dicitura in Informazioni');
ok(errs.length===0,th+': nessun errore JS');await c.close()}
console.log('pass',pass,'fail',fail);await b.close()})();
