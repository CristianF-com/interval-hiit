import { chromium } from 'playwright';
const SP=(process.env.OUT || '/tmp/inhiit') + '/shots/';
const b = await chromium.launch({executablePath: process.env.PW_CHROME || undefined});
const p = await (await b.newContext({locale:'es-ES',viewport:{width:390,height:844}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{errs.push('DIALOG '+d.message()); d.accept();});
await p.addInitScript(()=>setInterval(()=>{const b=document.querySelector('#aw-ok'); if(b) b.click()},80));
for (let i=0;i<20;i++){ try{ await p.goto('http://localhost:8776/'); break; }catch(e){ await p.waitForTimeout(300);} }
await p.waitForTimeout(400); await p.fill('#ob-name','K'); await p.click('#ob-go'); await p.waitForTimeout(200);
await p.click('#sm-start'); await p.waitForTimeout(250); await p.click('#sms-skip'); await p.waitForTimeout(200);
await p.click('[data-tab=plans]'); await p.click('[data-fam=transformacion]'); await p.click('#ps-go'); await p.waitForTimeout(200);
await p.click('[data-tab=cal]'); await p.waitForTimeout(300); await p.screenshot({path:SP+'c1.png',fullPage:true});
// abrir el primer item próximo
await p.evaluate(()=>[...document.querySelectorAll('.ag')].find(x=>x.textContent.includes('Plan')).click()); await p.waitForTimeout(300); await p.screenshot({path:SP+'c2.png',fullPage:true});
await p.click('#ai-off'); await p.waitForTimeout(300);
console.log('offDates', await p.evaluate(()=>getPlan().offDates));
// cambiar días
await p.click('#cal-wd [data-wd="6"]'); await p.waitForTimeout(200);
console.log('weekdays', await p.evaluate(()=>[getPlan().weekdays, getPlan().days]));
// abrir sesión del entrenador y posponer
await p.evaluate(()=>{ const b=[...document.querySelectorAll('.ag')].find(x=>x.textContent.includes('Entrenador')); b.click(); });
await p.waitForTimeout(300); await p.screenshot({path:SP+'c3.png',fullPage:true});
await p.click('#ai-post'); await p.waitForTimeout(200);
console.log('nextAt in days', await p.evaluate(()=>((getSmart().nextAt-Date.now())/864e5).toFixed(2)));
// cancelar plan desde calendario
await p.evaluate(()=>{ const b=[...document.querySelectorAll('.ag')].find(x=>x.textContent.includes('Plan')); b.click(); });
await p.waitForTimeout(200); await p.click('#ai-quit'); await p.waitForTimeout(200); await p.screenshot({path:SP+'c4.png'}); await p.click('#cf-ok'); await p.waitForTimeout(200);
console.log('plan after cancel', await p.evaluate(()=>getPlan()));
console.log(errs); await b.close();
