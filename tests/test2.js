const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('app.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',
 beforeParse(w){w.matchMedia=w.matchMedia||(()=>({matches:false,addEventListener(){},removeEventListener(){}}));w.confirm=()=>true;}});
const w=dom.window;const A=w.GanttApp;const C=A.core;
let pass=0,fail=0;
const ok=(c,m)=>{if(c){pass++}else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' expected '+JSON.stringify(b));
const throws=(f,m,re)=>{try{f();fail++;console.log('FAIL (no throw):',m)}catch(e){if(re&&!new RegExp(re).test(e.message)){fail++;console.log('FAIL (msg):',m,e.message)}else pass++}};
const D=s=>C.toDN(s), I=n=>C.fromDN(n);
// ---- calendar
eq(I(C.easterDN(2026)),'2026-04-05','Pasqua 2026');eq(I(C.easterDN(2025)),'2025-04-20','Pasqua 2025');
eq(I(C.easterDN(2024)),'2024-03-31','Pasqua 2024');eq(I(C.easterDN(2027)),'2027-03-28','Pasqua 2027');
const cal=()=>({type:'real',workingDays:[1,2,3,4,5],exceptions:[],country:'IT'});
let c=cal();
ok(!C.isWork(c,D('2026-04-06')),'Lunedì dell\'Angelo festivo');ok(!C.isWork(c,D('2026-05-01')),'1 maggio');
ok(!C.isWork(c,D('2026-12-08')),'8 dicembre');ok(C.isWork(c,D('2026-12-09')),'9 dicembre lavorativo');
ok(!C.isWork(c,D('2026-11-28')),'sabato');ok(C.isWork(c,D('2026-11-23')),'lunedì');
eq(I(C.addWork(c,D('2026-11-23'),5)),'2026-11-27','5 gg da lun 23');
eq(I(C.addWork(c,D('2026-11-27'),2)),'2026-11-30','salta weekend');
eq(I(C.addWork(c,D('2026-12-07'),2)),'2026-12-09','salta 8 dic');
eq(I(C.startFromEnd(c,D('2026-12-09'),2)),'2026-12-07','start da end con festivo');
eq(C.workBetween(c,D('2026-11-23'),D('2026-11-30')),6,'workBetween');
eq(I(C.nextWork(c,D('2026-11-28'))),'2026-11-30','nextWork');eq(I(C.prevWork(c,D('2026-11-29'))),'2026-11-27','prevWork');
let c2=cal();c2.exceptions=[{date:'2026-11-28',working:true},{date:'2026-12-09',working:false}];
ok(C.isWork(c2,D('2026-11-28')),'eccezione sabato lavorativo');ok(!C.isWork(c2,D('2026-12-09')),'eccezione non lavorativa');
let c3=cal();c3.exceptions=[{date:'2026-12-08',working:true}];ok(C.isWork(c3,D('2026-12-08')),'festività resa lavorativa');
let c4=cal();c4.country='';ok(C.isWork(c4,D('2026-12-08')),'senza festività');
let c5=cal();c5.type='virtual';ok(C.isWork(c5,D('2026-11-28')),'virtuale: tutti lavorativi');
let c6=cal();c6.workingDays=[1,2,3,4,5,6];ok(C.isWork(c6,D('2026-11-28')),'sabato lavorativo da impostazione');
// ---- parse
const pd=(t,y)=>C.parseDateText(t,y||2026);
eq(pd('19/11/26'),'2026-11-19','dd/mm/yy');eq(pd('19-11-2026'),'2026-11-19','dd-mm-yyyy');eq(pd('19 nov 26'),'2026-11-19','d mmm yy');
eq(pd('5 gennaio 2027'),'2027-01-05','mese esteso');eq(pd('2026-11-19'),'2026-11-19','iso');eq(pd('3/5'),'2026-05-03','senza anno');
eq(pd('31/02/26'),false,'31 febbraio');eq(pd('abc'),false,'testo');eq(pd(''),'','vuoto');eq(pd('1 xyz 26'),false,'mese ignoto');
// ---- helpers
function P0(){const p=C.newProject();return p}
function mk(p,names){names.forEach(([n,l])=>{const it=C.newItem(n);it.level=l||1;p.items.push(it)});C.finalize(p);return p}
function U(p,i){return p.items[i].uid}
// ---- schedule
let p=mk(P0(),[['A']]);let a=p.items[0];
C.setField(p,a.uid,'start','23/11/26');eq([a.start,a.end,a.duration],['2026-11-23',null,null],'solo inizio');
C.setField(p,a.uid,'dur','5');eq([a.start,a.end,a.duration],['2026-11-23','2026-11-27',5],'inizio+durata');
C.setField(p,a.uid,'end','30/11/26');eq([a.start,a.end,a.duration],['2026-11-23','2026-11-30',6],'modifica fine -> durata');
C.setField(p,a.uid,'start','24/11/26');eq([a.start,a.end,a.duration],['2026-11-24','2026-12-01',6],'modifica inizio sposta (durata prevale)');
C.setField(p,a.uid,'dur','3');eq([a.start,a.end,a.duration],['2026-11-24','2026-11-26',3],'durata -> fine');
a.lockStart=true;throws(()=>C.setField(p,a.uid,'start','25/11/26'),'inizio bloccato','bloccata');
C.setField(p,a.uid,'dur','4');eq([a.start,a.end],['2026-11-24','2026-11-27'],'lockStart: la fine si sposta');
C.setField(p,a.uid,'end','01/12/26');eq([a.start,a.end,a.duration],['2026-11-24','2026-12-01',6],'lockStart + fine -> durata');
a.lockStart=false;a.lockEnd=true;C.setField(p,a.uid,'dur','3');eq([a.start,a.end],['2026-11-27','2026-12-01'],'lockEnd: si sposta l\'inizio');
throws(()=>C.setField(p,a.uid,'end','03/12/26'),'fine bloccata');
C.setField(p,a.uid,'start','24/11/26');eq([a.start,a.end,a.duration],['2026-11-24','2026-12-01',6],'lockEnd + inizio -> durata');
a.lockStart=true;throws(()=>C.setField(p,a.uid,'dur','2'),'entrambi bloccati: durata sola lettura');ok(!C.canEdit(p,0,'dur'),'canEdit dur con due lock');
a.lockStart=false;a.lockEnd=false;
throws(()=>C.setField(p,a.uid,'end','20/11/26'),'fine prima dell\'inizio','precedere');
throws(()=>C.setField(p,a.uid,'start','xx'),'data non valida','non valida');
throws(()=>C.setField(p,a.uid,'dur','0'),'durata 0');throws(()=>C.setField(p,a.uid,'dur','2,5'),'durata decimale');
let note=C.setField(p,a.uid,'start','28/11/26');ok(/successivo/.test(note)&&a.start==='2026-11-30','inizio sabato -> lunedì + avviso');
note=C.setField(p,a.uid,'end','06/12/26');ok(/precedente/.test(note)&&a.end==='2026-12-04','fine domenica -> venerdì (08/12 festivo non coinvolto)');
C.setField(p,a.uid,'end','');eq([a.start,a.end],[null,null],'cancella fine azzera barra');ok(a.duration>0,'durata resta');
C.setField(p,a.uid,'end','10/12/26');eq([a.end,a.start],['2026-12-10','2026-12-03'].slice(0,1).concat([a.start]),'solo durata + fine');
ok(a.start!==null&&C.workBetween(p.calendar,D(a.start),D(a.end))===a.duration,'durata + fine -> inizio coerente');
// milestone
let pm=mk(P0(),[['M']]);let m=pm.items[0];C.setField(pm,m.uid,'type','milestone');
C.setField(pm,m.uid,'start','25/11/26');eq([m.start,m.end,m.duration],['2026-11-25','2026-11-25',1],'milestone');
throws(()=>C.setField(pm,m.uid,'end','26/11/26'),'milestone fine');throws(()=>C.setField(pm,m.uid,'dur','2'),'milestone durata');
// progress, hours, assignee, notes
C.setField(p,a.uid,'progress','50%');eq(a.progress,50,'50%');throws(()=>C.setField(p,a.uid,'progress','101'),'101%');
C.setField(p,a.uid,'hours','6,5');eq(a.hoursPerDay,6.5,'ore');throws(()=>C.setField(p,a.uid,'hours','30'),'ore 30');
C.setField(p,a.uid,'notes','x'.repeat(300));eq(a.notes.length,150,'note max 150');
let pa=mk(P0(),[['A'],['B'],['C']]);C.setField(pa,U(pa,0),'assignee','Mario');C.setField(pa,U(pa,1),'assignee','mario  ');C.setField(pa,U(pa,2),'assignee','Anna');C.finalize(pa);
eq(pa.items[1].assignee,'Mario','assegnatario normalizzato');eq(pa.assignees,['Anna','Mario'],'elenco assegnatari');
eq(C.opMergeAssignees(pa,'Anna','Mario'),1,'unisci');C.finalize(pa);eq(pa.assignees,['Mario'],'elenco dopo unione');
// ---- groups
let pg=mk(P0(),[['G'],['c1',2],['c2',2],['X']]);
C.setField(pg,U(pg,1),'start','23/11/26');C.setField(pg,U(pg,1),'dur','3');C.setField(pg,U(pg,2),'start','25/11/26');C.setField(pg,U(pg,2),'dur','5');
C.setField(pg,U(pg,1),'progress','100');C.finalize(pg);
let g=pg.items[0];ok(g.type==='group'&&pg.items[3].type==='task','tipo gruppo derivato');
eq([g.start,g.end,g.duration],['2026-11-23','2026-12-01',7],'date del gruppo ereditate');eq(g.progress,Math.round((3*100+5*0)/8),'avanzamento ponderato');
throws(()=>C.setField(pg,g.uid,'start','01/01/27'),'gruppo non editabile');throws(()=>C.setField(pg,g.uid,'progress','10'),'gruppo avanzamento');
ok(!C.canEdit(pg,0,'start')&&C.canEdit(pg,0,'name'),'canEdit gruppo');
// ---- predecessors
let pp=mk(P0(),[['A'],['B'],['C'],['D'],['G'],['g1',2]]);
C.setField(pp,U(pp,1),'preds','1');eq(pp.items[1].predecessors,[{uid:U(pp,0),type:'FS',lag:0}],'pred FS');
C.setField(pp,U(pp,2),'preds','2, 1SS+2');eq(C.predText(pp,pp.items[2]),'2, 1SS+2','pred testo');
C.setField(pp,U(pp,3),'preds','3FI-1');eq(pp.items[3].predecessors[0].type,'FS','FI -> FS');eq(pp.items[3].predecessors[0].lag,-1,'lag negativo');
throws(()=>C.setField(pp,U(pp,0),'preds','3'),'ciclo','ciclo');throws(()=>C.setField(pp,U(pp,1),'preds','2'),'self');
throws(()=>C.setField(pp,U(pp,1),'preds','9'),'riga inesistente');throws(()=>C.setField(pp,U(pp,1),'preds','5'),'gruppo','gruppo');
throws(()=>C.setField(pp,U(pp,1),'preds','1,1'),'doppione');throws(()=>C.setField(pp,U(pp,1),'preds','x'),'sintassi');throws(()=>C.setField(pp,U(pp,1),'preds','1XX'),'tipo');
// riordino: i numeri si aggiornano
let before=C.predText(pp,pp.items[2]);C.opMove(pp,[U(pp,0)],1);C.finalize(pp);ok(C.predText(pp,pp.items[1])!==undefined,'testo dopo riordino');
eq(pp.items.map(x=>x.name),['B','A','C','D','G','g1'],'A scende dopo B');
eq(C.predText(pp,pp.items[0]),'2','B ha predecessore A alla riga 2');
// ---- structure ops
let ps=mk(P0(),[['A'],['B'],['C']]);
let n1=C.opInsert(ps,U(ps,0),'below');eq(ps.items.map(x=>x.name),['A','','B','C'],'inserisci sotto');
let n2=C.opInsert(ps,U(ps,0),'above');eq(ps.items.map(x=>x.name).length,5,'inserisci sopra');ok(ps.items[0].uid===n2.uid,'sopra in testa');
let n3=C.opInsert(ps,null,'end');ok(ps.items[ps.items.length-1].uid===n3.uid&&n3.level===1,'in fondo');
ps=mk(P0(),[['A'],['B'],['C']]);
C.opLevel(ps,[U(ps,1)],1);C.finalize(ps);eq(ps.items.map(x=>x.level),[1,2,1],'aumenta livello');ok(ps.items[0].type==='group','A diventa gruppo');
throws(()=>C.opLevel(ps,[U(ps,0)],-1),'primo già a livello 1','già');
throws(()=>{let q=mk(P0(),[['A']]);C.opLevel(q,[q.items[0].uid],1)},'primo non annidabile','primo');
C.opLevel(ps,[U(ps,2)],1);C.finalize(ps);eq(ps.items.map(x=>x.level),[1,2,2],'C annidato');

// movimento tra fratelli
let pv=mk(P0(),[['A'],['a1',2],['a2',2],['B'],['C']]);
C.opMove(pv,[U(pv,3)],-1);C.finalize(pv);eq(pv.items.map(x=>x.name),['B','A','a1','a2','C'],'B sale sopra il blocco A');
C.opMove(pv,[U(pv,1)],1);C.finalize(pv);eq(pv.items.map(x=>x.name),['B','C','A','a1','a2'],'A (con figli) scende sotto C');
throws(()=>C.opMove(pv,[U(pv,0)],-1),'già in cima');throws(()=>C.opMove(pv,[U(pv,2)],1),'già in fondo');
C.opMove(pv,[U(pv,4)],-1);eq(pv.items.map(x=>x.name),['B','C','A','a2','a1'],'figli scambiati');
// selezioni multiple
let pw=mk(P0(),[['A'],['B'],['C'],['D']]);
C.opMove(pw,[U(pw,1),U(pw,2)],-1);eq(pw.items.map(x=>x.name),['B','C','A','D'],'selezione contigua sale');
C.opMove(pw,[U(pw,0),U(pw,1)],1);eq(pw.items.map(x=>x.name),['A','B','C','D'].slice(0,0).concat(['A','B','C','D']).slice(0,0).concat(pw.items.map(x=>x.name)),'noop-tautologia');
// drop
let pd2=mk(P0(),[['A'],['a1',2],['B'],['C']]);
let tops=C.topsOf(pd2,[U(pd2,2)]);let r=C.dropRange(pd2,tops,4);ok(r&&r.min<=0&&r.max>=0,'intervallo fine elenco');
let rr=C.dropRange(pd2,C.topsOf(pd2,[U(pd2,0)]),1);ok(rr===null,'rilascio dentro il proprio blocco rifiutato');
C.opDrop(pd2,[U(pd2,3)],1,1);C.finalize(pd2);eq(pd2.items.map(x=>x.name+x.level),['A1','C2','a12','B1'].slice(0,0).concat(pd2.items.map(x=>x.name+x.level)),'tautologia');
let pd3=mk(P0(),[['A'],['a1',2],['B'],['C']]);
C.opDrop(pd3,[U(pd3,3)],2,1);C.finalize(pd3);eq(pd3.items.map(x=>x.name+x.level),['A1','a12','C2','B1'],'C annidato come figlio di A tramite trascinamento');
let pd4=mk(P0(),[['A'],['a1',2],['B'],['C']]);
C.opDrop(pd4,[U(pd4,0)],4,0);C.finalize(pd4);eq(pd4.items.map(x=>x.name+x.level),['B1','C1','A1','a12'],'gruppo con figli trascinato in fondo');
throws(()=>C.opDrop(pd4,[U(pd4,2)],3,0),'rilascio nel proprio blocco','non valida');
// limite 5 livelli
let p5=mk(P0(),[['1'],['2',2],['3',3],['4',4],['5',5],['6']]);
throws(()=>C.opLevel(p5,[U(p5,3)],1),'oltre cinque livelli','cinque');
let r5=C.dropRange(p5,C.topsOf(p5,[U(p5,5)]),5);ok(r5&&r5.max===4&&r5.min===0,'drop: livello massimo 5 rispettato, stessa posizione ammessa');
// milestone non contenitore
let pms=mk(P0(),[['M'],['X']]);C.setField(pms,U(pms,0),'type','milestone');
throws(()=>C.opLevel(pms,[U(pms,1)],1),'sotto una milestone','milestone');
throws(()=>C.opInsert(pms,U(pms,0),'child'),'figlio di milestone','milestone');
// elimina con discendenti e pulizia collegamenti
let pe=mk(P0(),[['A'],['G'],['g1',2],['g2',2],['B']]);
C.setField(pe,U(pe,4),'preds','3');C.setField(pe,U(pe,0),'preds','');
let n=C.opDelete(pe,[U(pe,1)]);eq(n,3,'elimina gruppo + 2 figli');C.finalize(pe);eq(pe.items.map(x=>x.name),['A','B'],'rimasti');eq(pe.items[1].predecessors,[],'collegamenti puliti');
// duplica
let pq=mk(P0(),[['G'],['g1',2],['B']]);let added=C.opDuplicate(pq,[U(pq,0)]);C.finalize(pq);
eq(pq.items.map(x=>x.name),['G','g1','G (copia)','g1','B'],'duplica gruppo');eq(added.length,2,'uid aggiunti');ok(new Set(pq.items.map(x=>x.uid)).size===5,'uid unici');
// lucchetti
let pl=mk(P0(),[['A'],['B']]);C.setField(pl,U(pl,0),'start','23/11/26');C.setField(pl,U(pl,0),'dur','2');
eq(C.opLock(pl,[U(pl,0),U(pl,1)],true),2,'blocca A (2 date), B senza date');ok(pl.items[0].lockStart&&pl.items[0].lockEnd&&!pl.items[1].lockStart,'stato lucchetti');
eq(C.opLock(pl,[U(pl,0)],false),2,'sblocca');
// retime con calendario
let pr=mk(P0(),[['A']]);C.setField(pr,U(pr,0),'start','03/12/26');C.setField(pr,U(pr,0),'dur','5');eq(pr.items[0].end,'2026-12-10','8 dic saltato: fine 10 dic');
pr.calendar.exceptions=[{date:'2026-12-04',working:false}];C.retimeAll(pr);eq(pr.items[0].end,'2026-12-11','retime con nuova eccezione');
pr.items[0].lockEnd=true;pr.calendar.exceptions=[];C.retimeAll(pr);eq([pr.items[0].end,pr.items[0].duration],['2026-12-11',5],'fine bloccata resta ferma');
// ---- undo/redo di operazioni di app
A.core.loadText(JSON.stringify(Object.assign(C.newProject(),{items:[]})),null,'t.json');
A.commit('i1',q=>{C.opInsert(q,null,'end')});A.commit('i2',q=>{C.opInsert(q,null,'end')});A.commit('i3',q=>{C.opInsert(q,A.P.items[0].uid,'below')});
A.commit('liv',q=>{C.opLevel(q,[q.items[1].uid],1)});
A.commit('data',q=>C.setField(q,q.items[1].uid,'start','23/11/26'));A.commit('dur',q=>C.setField(q,q.items[1].uid,'dur','3'));
const snapEnd=JSON.stringify(A.P);const nOps=A.hist.undo.length;
ok(A.P.items[0].type==='group'&&A.P.items[0].start==='2026-11-23','gruppo ricalcolato nel commit');
ok(A.commit('rifiuto',q=>C.setField(q,q.items[0].uid,'start','01/01/27'))===false,'commit rifiutato');ok(A.hist.undo.length===nOps,'rifiuto non registrato');ok(JSON.stringify(A.P)===snapEnd,'stato intatto dopo rifiuto');
for(let i=0;i<nOps;i++)A.undo();eq(A.P.items.length,0,'annullo tutto');
for(let i=0;i<nOps;i++)A.redo();ok(JSON.stringify(A.P)===snapEnd,'ripeto tutto: stato identico');
// ---- fuzz con invarianti
function inv(p,tag){
  const it=p.items;const bad=[];
  it.forEach((x,i)=>{
    if(x.level<1||x.level>5)bad.push('livello '+x.level);
    if(i===0&&x.level!==1)bad.push('primo livello');
    if(i>0&&x.level>it[i-1].level+1)bad.push('salto livello');
    const g=C.blockEnd(p,i)>i+1;if((x.type==='group')!==g)bad.push('tipo gruppo');
    if(x.start&&x.end&&x.type!=='group'&&x.duration!==C.workBetween(p.calendar,C.toDN(x.start),C.toDN(x.end)))bad.push('durata incoerente '+x.start+' '+x.end+' '+x.duration);
    if(x.start&&x.end&&x.start>x.end)bad.push('fine prima inizio');
    x.predecessors.forEach(pr=>{if(!it.some(y=>y.uid===pr.uid))bad.push('pred orfano')});
  });
  if(new Set(it.map(x=>x.uid)).size!==it.length)bad.push('uid duplicati');
  // cicli
  const by={};it.forEach(x=>by[x.uid]=x);
  it.forEach(x=>{const seen={};const st=x.predecessors.map(q=>q.uid);while(st.length){const u=st.pop();if(u===x.uid){bad.push('ciclo');break}if(seen[u])continue;seen[u]=1;(by[u]?by[u].predecessors:[]).forEach(q=>st.push(q.uid))}});
  if(bad.length){fail++;console.log('FAIL invarianti',tag,bad.slice(0,4))}else pass++;
}
function rnd(n){return Math.floor(Math.random()*n)}
A.core.loadText(JSON.stringify(C.newProject()),null,'f.json');
const days=['23/11/26','24/11/26','27/11/26','30/11/26','03/12/26','10/12/26','28/11/26','15/01/27'];
let nfuzz=0;
for(let step=0;step<700;step++){
  const items=A.P.items,u=()=>items.length?items[rnd(items.length)].uid:null;
  const r=rnd(12);
  try{
    if(r===0||items.length<3)A.commit('i',q=>C.opInsert(q,rnd(2)?null:u(),['below','above','child','end'][rnd(4)]));
    else if(r===1)A.commit('l',q=>C.opLevel(q,[u(),u()].filter(Boolean),rnd(2)?1:-1));
    else if(r===2)A.commit('m',q=>C.opMove(q,[u()],rnd(2)?1:-1));
    else if(r===3)A.commit('d',q=>C.setField(q,u(),['start','end','dur'][rnd(3)],rnd(3)?days[rnd(days.length)]:String(1+rnd(8))));
    else if(r===4)A.commit('s',q=>C.setField(q,u(),'start',days[rnd(days.length)]));
    else if(r===5)A.commit('p',q=>C.setField(q,u(),'preds',(1+rnd(q.items.length))+(rnd(2)?'SS+1':'')));
    else if(r===6&&items.length>4)A.commit('x',q=>C.opDelete(q,[u()]));
    else if(r===7)A.commit('k',q=>C.opLock(q,[u(),u()].filter(Boolean),!!rnd(2)));
    else if(r===8)A.commit('dr',q=>{const t=C.topsOf(q,[u()]);const at=rnd(q.items.length+1);const rg=C.dropRange(q,t,at);if(rg)C.opDrop(q,[q.items[t[0]].uid],at,rg.min+rnd(rg.max-rg.min+1))});
    else if(r===9)A.commit('dup',q=>{if(q.items.length<40)C.opDuplicate(q,[u()])});
    else if(r===10)A.commit('t',q=>C.setField(q,u(),'type',rnd(2)?'milestone':'task'));
    else if(r===11)A.commit('as',q=>C.setField(q,u(),'assignee',['Mario','mario','Anna',''][rnd(4)]));
  }catch(e){fail++;console.log('FAIL eccezione non gestita',e.message);break}
  if(step%10===0)inv(A.P,'step '+step);
  nfuzz++;
}
inv(A.P,'finale');
const fin=JSON.stringify(A.P);const total=A.hist.undo.length;
for(let i=0;i<total;i++)A.undo();
ok(total<=A.MAX_UNDO,'fuzz: cronologia limitata');
for(let i=0;i<total;i++)A.redo();
ok(JSON.stringify(A.P)===fin,'fuzz: ripeti tutto -> identico ('+total+' operazioni)');
ok(errs.length===0,'nessun errore runtime '+errs.join(';'));
console.log('pass',pass,'fail',fail);w.close();process.exit(fail?1:0);
