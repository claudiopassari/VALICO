const {chromium}=require('playwright');const seed=require('./seed21.js');const fs=require('fs');
(async()=>{const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const ctx=await b.newContext({viewport:{width:1920,height:900},acceptDownloads:true});const p=await ctx.newPage();
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL:',m)}};
p.on('pageerror',e=>{fail++;console.log('ERR',e.message)});
await p.goto('file://'+process.cwd()+'/app.html');await seed(p);await p.waitForTimeout(300);
const W=t=>p.waitForTimeout(t);
await p.locator('[data-act="export"]').click();await W(300);
ok(await p.locator('#dlgExp[open]').count()===1,'dialogo aperto');
async function dl(label){const [d]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.locator('#expGo').click()]);const path='/tmp/valico-tests/out_'+label;await d.saveAs(path);return {name:d.suggestedFilename(),buf:fs.readFileSync(path)}}
let r=await dl('a.png');console.log(r.name,r.buf.length);
ok(r.buf.slice(0,8).toString('hex')==='89504e470d0a1a0a','PNG valido');
const w=r.buf.readUInt32BE(16),h=r.buf.readUInt32BE(20);console.log('png',w,h);ok(w>1500&&h>400,'dimensioni plausibili');
console.log(await p.locator('#expBody .xmsg').textContent());
await p.locator('#expBody .xsegb[data-v="jpg"]').click();r=await dl('b.jpg');ok(r.buf[0]===0xff&&r.buf[1]===0xd8,'JPEG valido');console.log(r.name,r.buf.length);
await p.locator('#expBody .xsegb[data-v="pdf"]').click();r=await dl('c.pdf');ok(r.buf.slice(0,5).toString()==='%PDF-','PDF valido');ok(r.buf.slice(-6).toString().indexOf('%%EOF')>=0,'PDF chiuso');console.log(r.name,r.buf.length);
await p.locator('#expBody .xsegb[data-v="width"]').click();r=await dl('d.pdf');const pc=(r.buf.toString('latin1').match(/\/Type \/Page /g)||[]).length;console.log('pagine',pc);ok(pc>=1,'pagine');
console.log(await p.locator('#expBody .xmsg').textContent());
await p.screenshot({path:'exp28.png'});
console.log('pass',pass,'fail',fail);await b.close()})();
