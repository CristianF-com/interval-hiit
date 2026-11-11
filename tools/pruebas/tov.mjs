import { chromium } from 'playwright';
const SP=(process.env.OUT || '/tmp/inhiit') + '/shots/';
const b = await chromium.launch({executablePath: process.env.PW_CHROME || undefined});
const p = await (await b.newContext({locale:'es-ES',viewport:{width:390,height:844}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>setInterval(()=>{const x=document.querySelector('#aw-ok');if(x)x.click();},200));
await p.goto('http://localhost:8776/'); await p.waitForTimeout(400); await p.fill('#ob-name','Cris'); await p.click('#ob-go'); await p.waitForTimeout(200);
await p.evaluate(()=>{ S.weight=80; save(); });
// retos tab
await p.click('[data-tab=retos]'); await p.waitForTimeout(200); await p.screenshot({path:SP+'ov-retos.png'});
// coach: crear mancuernas + prueba
await p.click('[data-tab=coach]'); await p.waitForTimeout(200);
await p.evaluate(()=>setSubtab('coach','db')); await p.click('#db-setup'); await p.fill('#dbs-w','4, 6, 8, 10, 12.5'); await p.click('#dbs-ok'); await p.waitForTimeout(300);
await p.screenshot({path:SP+'ov-test.png'});
await p.fill('[data-r=db_goblet_squat]','14'); await p.click('[data-k=db_floor_press][data-a="1"]'); await p.fill('[data-r=db_floor_press]','10'); await p.fill('[data-r=db_row]','12'); await p.fill('[data-r=db_shoulder_press]','9');
await p.click('#dbt-ok'); await p.waitForTimeout(300); await p.screenshot({path:SP+'ov-test2.png'});
console.log('dumb', await p.evaluate(()=>JSON.stringify({lv:getDumb().level,e1:getDumb().e1,t:getDumb().tests[0].res})));
await p.evaluate(()=>closeSheet());
// smart activo
await p.evaluate(()=>setSubtab('coach','smart')); await p.click('#sm-start'); await p.waitForTimeout(250); await p.click('#sms-skip'); await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#dumb').scrollIntoView()); await p.screenshot({path:SP+'ov-card.png'});
// hacer HIIT inteligente → mancuernas a mañana
await p.evaluate(()=>startWorkout(clone(getSmart().next)));
await p.evaluate(()=>{ P.activeMs=10*60e3; finish(true,'done'); }); await p.waitForTimeout(300);
console.log('db next after HIIT (days)', await p.evaluate(()=>((getDumb().nextAt-dayStart(Date.now()))/864e5).toFixed(1)));
await p.evaluate(()=>{ document.querySelector('#d-fb [data-fb=ok]').click(); document.querySelector('#d-ok').click(); });
console.log('smart next (days)', await p.evaluate(()=>((getSmart().nextAt-dayStart(Date.now()))/864e5).toFixed(1)));
await p.click('[data-tab=cal]'); await p.waitForTimeout(300); await p.screenshot({path:SP+'ov-cal.png',fullPage:true});
console.log('agenda', await p.evaluate(()=>{const ag=buildAgenda(); const out=[]; for(let i=0;i<10;i++){const k=dkey(addDays(Date.now(),i)); out.push(i+':'+(ag[k]||[]).map(x=>x.type).join('+'));} return out.join(' ');}));
// builder con mancuernas
await p.click('[data-tab=coach]'); await p.evaluate(()=>{ S.useDb=true; save(); renderSetup(); });
await p.evaluate(()=>setSubtab('coach','custom')); await p.click('#gen'); await p.waitForTimeout(300);
console.log('coach db', await p.evaluate(()=>W.rounds.map(r=>r.join(',')).join(' | ')), await p.evaluate(()=>title(W)));
await p.screenshot({path:SP+'ov-pv.png'});
await p.click('#fav'); await p.click('#start'); await p.waitForTimeout(500);
// swap
await p.evaluate(()=>{ while(P.i<P.tl.length && !(P.tl[P.i].k==='work' && swapOf(P.tl[P.i].ex) && !P.tl[P.i].soft)) P.i++; render(); });
await p.screenshot({path:SP+'ov-swap.png'});
const before = await p.evaluate(()=>cur().ex); await p.click('#p-swap'); const after = await p.evaluate(()=>cur().ex);
console.log('swap', before, '->', after, await p.evaluate(b=>P.w.rounds.flat().includes(b), before));
await p.evaluate(()=>finish(false)); await p.waitForTimeout(200);
await p.evaluate(()=>{ const d=document.querySelector('#d-ok'); if(d) d.click(); });
await p.click('[data-tab=hist]'); await p.waitForTimeout(300); await p.screenshot({path:SP+'ov-hist.png',fullPage:true});
console.log(errs); await b.close();
