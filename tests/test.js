const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('app.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+e.message));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',
 beforeParse(w){w.matchMedia=w.matchMedia||(()=>({matches:false,addEventListener(){},removeEventListener(){}}));w.confirm=()=>true;}});
const w=dom.window;const A=w.GanttApp;
let pass=0,fail=0;
const ok=(c,m)=>{if(c){pass++}else{fail++;console.log('FAIL:',m)}};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m+' | got '+JSON.stringify(a)+' expected '+JSON.stringify(b));
ok(!!A,'GanttApp exists');
ok(errs.length===0,'no load errors '+errs.join(';'));
const C=A.core;
// project defaults
let P0=C.newProject();
eq(P0.rev,null,'initial rev null');eq(P0.revState,'draft','initial state');eq(P0.saveCounter,0,'initial counter');eq(P0.schemaVersion,2,'schema 2');
eq(P0.markers.map(m=>m.kind),['start','end','today'],'markers');
eq(P0.markers.map(m=>m.color.c),['verde','rosso','blu'],'marker colors');
// revisions
eq(C.nextRev(null,'minor'),{major:1,minor:0},'first emission Rev 1.0');
eq(C.nextRev({major:1,minor:0},'minor'),{major:1,minor:1},'1.0->1.1');
eq(C.nextRev({major:1,minor:3},'major'),{major:2,minor:0},'1.3->2.0');
eq(C.nextRev({major:2,minor:0},'minor'),{major:2,minor:1},'2.0->2.1');
eq(C.baseName('Prog_Rev1.2.json'),'Prog','strip rev suffix');eq(C.baseName('Prog.json'),'Prog','strip ext');eq(C.baseName('A_Rev1.0_Rev2.0.json'),'A_Rev1.0','strip only last');
eq(C.revFileName('Prog_Rev1.0.json',{major:1,minor:1}),'Prog_Rev1.1.json','file name replaces suffix');
eq(C.revFileName('Prog',{major:1,minor:0}),'Prog_Rev1.0.json','file name first');
// prepareSave
let s1=C.prepareSave(P0,{now:new Date('2026-01-01T10:00:00Z')});
eq(s1.saveCounter,1,'counter 1');eq(s1.rev,null,'plain save keeps rev null');eq(s1.revLog.length,0,'no log on plain save');ok(P0.saveCounter===0&&P0.revLog.length===0,'source not mutated');
let s2=C.prepareSave(s1,{now:new Date('2026-01-02T10:00:00Z')});eq(s2.saveCounter,2,'counter 2');
let s3=C.prepareSave(s2,{issue:{kind:'minor',author:'Claudio',note:'n1'}});
eq(s3.rev,{major:1,minor:0},'first issue 1.0');eq(s3.revState,'issued','state issued');eq(s3.revLog.length,1,'log 1');eq(s3.revLog[0].note,'n1','note');eq(s3.revLog[0].author,'Claudio','author');
let s4=C.prepareSave(s3,{issue:{kind:'minor',author:'A',note:''}});eq(s4.rev,{major:1,minor:1},'second issue 1.1');eq(s4.revLog.map(e=>e.major+'.'+e.minor),['1.0','1.1'],'log order');
let s5=C.prepareSave(s4,{issue:{kind:'major'}});eq(s5.rev,{major:2,minor:0},'major issue 2.0');
let s6=C.prepareSave(s5,{modified:true,now:new Date()});eq(s6.revState,'draft','overwrite after change -> draft');eq(s6.rev,{major:2,minor:0},'rev unchanged on overwrite');
let s7=C.prepareSave(s5,{modified:false,now:new Date()});eq(s7.revState,'issued','overwrite without change keeps issued');
let s8=C.prepareSave(P0,{modified:true,now:new Date()});eq(s8.revState,'draft','no rev: draft');
// normalizeLoaded
const bad=[null,[],{},{schemaVersion:1},{schemaVersion:99,items:[]},{schemaVersion:'1',items:[]}];
bad.forEach((b,i)=>{let t=false;try{C.normalizeLoaded(b)}catch(e){t=true}ok(t,'reject bad #'+i)});
let n=C.normalizeLoaded({schemaVersion:1,items:[{uid:'a',level:9,name:5},{uid:'a',level:0},null,{}],version:{major:'x'}});
eq(n.items.length,4,'4 items');ok(n.items[0].level===1,'first item level forced to 1');ok(n.items[1].level===1,'level clamp 1');
ok(new Set(n.items.map(i=>i.uid)).size===4,'unique uids');ok(n.items[0].name==='','name coerced');
eq(n.rev,null,'rev fallback null');eq(n.revState,'draft','state fallback');ok(n.markers.length===3,'markers default');ok(n.project.id.length>0,'project id');
// migration schema 1 -> 2
let m1=C.normalizeLoaded({schemaVersion:1,items:[],revision:7,version:{major:1,minor:2},versionLog:[{major:1,minor:0,savedAt:'2026-01-01T10:00:00.000Z',author:'A',note:'x'},{major:1,minor:2,savedAt:'2026-02-01T10:00:00.000Z',author:'B',note:'y'}]});
eq(m1.saveCounter,7,'migr counter');eq(m1.rev,{major:1,minor:2},'migr rev');eq(m1.revLog.length,2,'migr log');eq(m1.revLog[1].issuedAt,'2026-02-01T10:00:00.000Z','migr issuedAt');eq(m1.revState,'draft','migr state');eq(m1.schemaVersion,2,'migr schema');ok(!('revision' in m1)&&!('version' in m1)&&!('versionLog' in m1),'old keys removed');
let m0=C.normalizeLoaded({schemaVersion:1,items:[],revision:3,version:{major:1,minor:0},versionLog:[]});eq(m0.rev,null,'migr no log -> rev null');
// roundtrip
let rt=C.normalizeLoaded(JSON.parse(JSON.stringify(s5)));
eq(rt.rev,s5.rev,'roundtrip rev');eq(rt.revLog,s5.revLog,'roundtrip log');eq(rt.saveCounter,s5.saveCounter,'roundtrip counter');eq(rt.revState,'issued','roundtrip state');
// fuzz diff/apply
function rnd(n){return Math.floor(Math.random()*n)}
function mut(o){const c=JSON.parse(JSON.stringify(o));
 const r=rnd(8);
 if(r===0)c.items.push(C.newItem('n'+rnd(99)));
 else if(r===1&&c.items.length)c.items.splice(rnd(c.items.length),1);
 else if(r===2&&c.items.length)c.items[rnd(c.items.length)].name='x'+rnd(999);
 else if(r===3&&c.items.length){const it=c.items[rnd(c.items.length)];it.predecessors=it.predecessors.concat([{uid:'u'+rnd(9),type:'FS'}]);}
 else if(r===4&&c.items.length>1){const i=rnd(c.items.length),it=c.items.splice(i,1)[0];c.items.splice(rnd(c.items.length+1),0,it);}
 else if(r===5)c.project.title='T'+rnd(99);
 else if(r===6&&c.items.length){const it=c.items[rnd(c.items.length)];it.start=rnd(2)?null:'2026-0'+(1+rnd(9))+'-1'+rnd(9);it.lockStart=!it.lockStart;}
 else c.view.hiddenColumns=rnd(2)?[]:['a','b'].slice(0,rnd(3));
 return c}
let fuzzOK=true;
for(let k=0;k<300;k++){
  let a=JSON.parse(JSON.stringify(C.newProject()));
  for(let j=0;j<rnd(6);j++)a=mut(a);
  let b=a;for(let j=0;j<1+rnd(4);j++)b=mut(b);
  const ch=[];C.diff(a,b,[],ch);
  const f=JSON.parse(JSON.stringify(a));C.applyChanges(f,ch,'fwd');
  const r=JSON.parse(JSON.stringify(b));C.applyChanges(r,ch,'rev');
  if(JSON.stringify(f)!==JSON.stringify(b)){fuzzOK=false;console.log('fwd mismatch',k);break}
  if(JSON.stringify(r)!==JSON.stringify(a)){fuzzOK=false;console.log('rev mismatch',k);break}
}
ok(fuzzOK,'fuzz diff/apply roundtrip 300');
// app-level undo/redo
const snap=()=>JSON.stringify(A.P);
const s0=snap();
A.addItem();ok(A.P.items.length===1,'addItem');
const s_1=snap();
A.commit('rin',p=>{p.items[0].name='Alfa'});
A.addItem();A.commit('rin',p=>{p.items[1].name='Beta'});
const s_3=snap();
A.undo();A.undo();A.undo();A.undo();
eq(A.P.items.length,0,'undo x3 -> empty');ok(snap()===s0,'state equals initial');
A.redo();A.redo();A.redo();A.redo();ok(snap()===s_3,'redo x3 -> same');
A.undo();A.undo();A.undo();A.undo();ok(snap()===s0,'undo again');
// new commit clears redo
A.commit('x',p=>{p.project.title='Z'});ok(A.hist.redo.length===0,'redo cleared');
// deletion undo
A.undo();
A.addItem();A.addItem();A.addItem();
A.ui.sel=[A.P.items[0].uid,A.P.items[2].uid];const pre=snap();A.deleteSelected();
ok(A.P.items.length===1,'delete 2 of 3');A.undo();ok(snap()===pre,'undo delete multi');A.redo();ok(A.P.items.length===1,'redo delete');A.undo();
// no-op commit
const hl=A.hist.undo.length;ok(A.commit('noop',p=>{})===false&&A.hist.undo.length===hl,'noop commit not recorded');
// limit
for(let i=0;i<260;i++)A.commit('t',p=>{p.project.title='T'+i});
ok(A.hist.undo.length===A.MAX_UNDO,'undo limited to '+A.MAX_UNDO+' got '+A.hist.undo.length);
// loadText
const txt=JSON.stringify(s4);
ok(A.core.loadText(txt,null,'prova.json')===true,'loadText valid');
eq(A.P.rev,{major:1,minor:1},'loaded rev');ok(A.hist.undo.length===0,'history reset on load');ok(A.ui.dirty===false,'not dirty after load');
ok(A.core.loadText('{no',null,'x.json')===false,'loadText invalid json');
ok(A.core.loadText('{"schemaVersion":1}',null,'x.json')===false,'loadText no items');
eq(A.P.rev,{major:1,minor:1},'state untouched after failed load');
// DOM checks
const d=w.document;
ok(!!d.querySelector('#itemsBody'),'#itemsBody');
A.render();
ok(errs.length===0,'no runtime errors: '+errs.join(';'));
console.log('pass',pass,'fail',fail);
w.close();process.exit(fail?1:0);
