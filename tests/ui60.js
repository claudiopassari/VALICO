const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1900,height:1000}});const p=await c.newPage();let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};const W=t=>p.waitForTimeout(t);
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});p.on('dialog',d=>d.accept());
// nessuna traccia del progetto di origine
const src=fs.readFileSync('app.html','utf8');
ok(!/bolgian|BOLG|COGE|SIS_Perim|recinzion|consegna aree/i.test(src),'nessun riferimento al progetto di origine in app.html');
await p.goto('file://'+process.cwd()+'/app.html');await W(400);await p.evaluate(()=>GanttApp.act.loadExample());await W(400);
const ex=await p.evaluate(()=>{const P=GanttApp.P;const gl=[];P.items.forEach((x,i)=>{const nx=P.items[i+1];if(nx&&nx.level>x.level)gl.push(x.level)});return {n:P.items.length,maxG:Math.max.apply(null,gl),ms:P.items.filter(x=>x.type==='milestone').length,wt:P.items.filter(x=>x.type==='wait').length,title:P.project.title}});
ok(ex.n>=14&&ex.n<=18,'esempio: circa 15 righe ('+ex.n+')');ok(ex.maxG===3,'esempio: gruppi fino al terzo livello ('+ex.maxG+')');ok(ex.ms===2&&ex.wt===1,'esempio: 2 milestone e 1 attesa');ok(/ufficio/i.test(ex.title),'titolo neutro: '+ex.title);
// ordine coerente
await p.locator('#tlCmds [data-act="tlopts"]').click();await W(250);
const ord=await p.evaluate(()=>{const rows=[...document.querySelectorAll('.pop .vrow, .pop .vr, .pop div')].filter(r=>/Terminazione delle barre|^Riquadro$/.test(r.firstChild&&r.firstChild.textContent||'')&&r.querySelectorAll('button').length>=3);return rows.map(r=>[...r.querySelectorAll('button')].map(x=>x.textContent.trim()).join('-'))});
ok(ord.some(x=>x==='Nessuno-Arrotondato-Squadrato'),'ordine riquadro: '+JSON.stringify(ord));ok(ord.some(x=>x==='Rotonda-Stondata-Quadrata'),'ordine terminazione: '+JSON.stringify(ord));
await p.keyboard.press('Escape');await W(100);
const res=[];
for(const dens of ['compact','normal'])for(const asTask of [false,true])for(const fr of ['round','square','none'])for(const gap of [true,false])for(const px of [4,14,40])for(const be of ['soft']){
 const r=await p.evaluate(({fr,gap,px,be,dens})=>{const A=GanttApp;A.P.view.scale='days';
  document.documentElement.setAttribute('data-gfr',fr);
  A.ui.px=px;const pr=JSON.parse(localStorage.getItem('gantt.prefs.v1')||'{}');pr.gFrame=fr;pr.density=dens;pr.barGap=gap;pr.barEnd=be;pr.gBar='thin';pr.gFill='one';localStorage.setItem('gantt.prefs.v1',JSON.stringify(pr));
  return 1},{fr,gap,px,be,dens});
 await p.reload();await W(250);await p.evaluate(()=>GanttApp.act.loadExample());await W(250);
 const out=await p.evaluate(({px,asTask})=>{const A=GanttApp;if(asTask){A.commit('t',q=>{q.items.forEach(x=>{if(x.type==='milestone'){x.type='task';x.duration=1;x.end=x.start}});return 'ok'})}A.ui.px=px;A.P.view.scale='days';A.renderTimeline();
  const cv=document.getElementById('tlCv');const cr=cv.getBoundingClientRect();const items=A.P.items;const vis=[...cv.querySelectorAll('.trow')];
  const bad=[];const areas=[...cv.querySelectorAll('.bx.aln')];
  areas.filter(a=>a.getBoundingClientRect().width>0).forEach(a=>{const u=a.getAttribute('data-u');const i=items.findIndex(x=>x.uid===u);const lv=items[i].level;const ar=a.getBoundingClientRect();
   const cs=getComputedStyle(a);const bl=parseFloat(cs.borderLeftWidth)||0,bt=parseFloat(cs.borderTopWidth)||0;
   const inner={l:ar.left+bl,r:ar.right-bl,t:ar.top,b:ar.bottom};
   const rad=parseFloat(cs.borderTopLeftRadius)||0;
   // discendenti
   for(let q=i+1;q<items.length&&items[q].level>lv;q++){const els=cv.querySelectorAll('[data-u="'+items[q].uid+'"].bar,[data-u="'+items[q].uid+'"].ms,[data-u="'+items[q].uid+'"].ind,[data-u="'+items[q].uid+'"].gsum,[data-u="'+items[q].uid+'"].aln');
    els.forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;let rl=r.left,rr=r.right,rt=r.top,rb=r.bottom;
     const tol=0.6;let why=[];
     if(e.classList.contains('aln')||e.classList.contains('area')){ /* sottogruppo: deve stare dentro il padre */ if(rl<inner.l-tol||rr>inner.r+tol)why.push('sottogruppo fuori X');if(rb>ar.bottom+tol)why.push('sottogruppo fuori Y');}
     else { if(rl<inner.l-tol)why.push('esce a sinistra '+(inner.l-rl).toFixed(1));if(rr>inner.r+tol)why.push('esce a destra '+(rr-inner.r).toFixed(1));if(rb>inner.b+tol)why.push('esce in basso '+(rb-inner.b).toFixed(1));if(rt<inner.t-tol)why.push('esce in alto');
      // angoli arrotondati
      if(rad>2){const dxL=rl-ar.left,dyB=ar.bottom-rb;if(dxL<rad&&dyB<rad){const cx=rad-dxL,cy=rad-dyB;if(cx*cx+cy*cy>rad*rad+1)why.push('angolo inferiore sinistro');}
       const dxR=ar.right-rr;if(dxR<rad&&dyB<rad){const cx=rad-dxR,cy=rad-dyB;if(cx*cx+cy*cy>rad*rad+1)why.push('angolo inferiore destro');}}
     }
     if(why.length)bad.push((e.className.split(' ').filter(x=>/^(bar|ms|ind|gsum|aln)$/.test(x))[0])+' '+why.map(w=>w.replace(/[0-9.]+/g,'#')).join(', '));});}
  });
  return {n:areas.length,bad:[...new Set(bad)]}},{px,asTask});
 res.push({fr:fr+'/'+dens+'/'+(asTask?'task':'ms'),gap,px,be,n:out.n,bad:out.bad});
}

const tot=res.filter(r=>r.bad.length);ok(res.length>=30,'configurazioni verificate '+res.length);ok(tot.length===0,'barre e milestone sempre dentro il riquadro dei gruppi: '+JSON.stringify(tot.slice(0,3)));
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();
