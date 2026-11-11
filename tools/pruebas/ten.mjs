import { chromium } from 'playwright';
import { fonts } from './fontroute.mjs';
const SP=(process.env.OUT || '/tmp/inhiit') + '/en/';
const b = await chromium.launch({executablePath: process.env.PW_CHROME || undefined});
const ctx = await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2, locale:'en-US'}); await fonts(ctx); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ window.__said=[]; setInterval(()=>{const x=document.querySelector('#aw-ok');if(x)x.click();},200); });
const found = new Map();
const scan = async (name) => { await p.waitForTimeout(350); const r = await p.evaluate(()=>{ const out=[]; const sp=/[áéíóúñ¿¡]|\b(de|la|el|los|las|que|con|para|por|una|un|en|tu|tus|del|al|se|sin|más|es|cada|hoy|días?|semana|minutos?|segundos?|serie|reto|ejercicios?|Toca|Empezar|Guardar|Nivel|Prueba|Sesión|Descanso|Siguiente|Ronda|Entrenamiento|entrenamiento|Calentamiento|Estiramiento|Pausa|Semana|Día|Mañana|Retos?|Historial|Planes|Calendario|mancuernas?)\b/;
  const vis = el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; };
  const w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())){ const v=n.nodeValue.trim(); if(v && sp.test(v) && n.parentElement && vis(n.parentElement) && !n.parentElement.closest('[data-noi18n],script,style')) out.push(v); }
  document.querySelectorAll('[placeholder],[aria-label]').forEach(e=>{ ['placeholder','aria-label'].forEach(a=>{ const v=e.getAttribute(a); if(v&&sp.test(v)&&vis(e)) out.push('@'+a+': '+v); }); });
  return out; }); r.forEach(x=>{ if(!found.has(x)) found.set(x,name); }); await p.screenshot({path:SP+name+'.png'}); };
await p.goto('http://localhost:8776/'); await p.waitForTimeout(500);
console.log('lang', await p.evaluate(()=>LANG));
await scan('00-onboarding');
await p.fill('#ob-name','Cris'); await p.click('#ob-go'); await p.waitForTimeout(300);
await p.evaluate(()=>{ const o=say; window.say=t=>{__said.push(t); return o(t)}; say=window.say; });
await scan('01-coach');
await p.evaluate(()=>window.scrollTo(0,900)); await scan('01b-coach');
await p.click('#sm-start'); await scan('01c-smart-setup'); await p.click('#sms-skip'); await p.waitForTimeout(300); await p.evaluate(()=>window.scrollTo(0,0)); await scan('02-coach-smart');
await p.evaluate(()=>setSubtab('coach','smart')); await p.click('#sm-go'); await scan('03-preview');
await p.click('#start'); await p.waitForTimeout(400); await scan('04-player-prep');
await p.evaluate(()=>step(P.tl.findIndex(s=>s.k==='work'&&!s.soft))); await scan('05-player-work');
await p.click('#p-close'); await scan('06-menu'); await p.evaluate(()=>{ closeMenu(); P.activeMs=600e3; finish(true,'done'); }); await scan('07-done');
await p.evaluate(()=>{ const d=document.querySelector('#d-fb [data-fb=ok]'); if(d) d.click(); }); await scan('07b-done');
await p.click('#d-ok'); await p.waitForTimeout(300);
await p.click('[data-tab=plans]'); await scan('08-plans');
await p.click('[data-fam=transformacion]'); await scan('09-plan-setup'); await p.click('#ps-go'); await scan('10-plan');
await p.click('[data-day="0"]'); await scan('11-plan-preview');
await p.click('[data-tab=retos]'); await scan('12-retos');
await p.click('[data-reto=situps]'); await scan('13-reto-setup'); await p.click('#rs-go'); await scan('14-reto-detail');
await p.click('#rd-go'); await scan('15-reto-prep'); await p.evaluate(()=>{RP.restEnd=0}); await p.waitForTimeout(400); await scan('16-reto-work');
await p.click('#rp-close'); await scan('17-reto-pause'); await p.click('#rx-quit');
await p.click('[data-tab=cal]'); await scan('18-cal');
await p.click('[data-tab=hist]'); await scan('19-hist'); await p.evaluate(()=>window.scrollTo(0,1200)); await scan('19b-hist');
await p.click('#who'); await scan('20-profile');
await p.evaluate(()=>closeSheet()); await p.evaluate(()=>openVoiceSettings()); await scan('21-voice');
await p.evaluate(()=>closeSheet()); await p.click('[data-tab=coach]'); await p.evaluate(()=>setSubtab('coach','db')); await p.click('#db-setup'); await scan('22-db-setup'); await p.click('#dbs-skip'); await p.waitForTimeout(200);
await p.evaluate(()=>openDbStart()); await scan('23-db-start');
await p.evaluate(()=>closeSheet()); await p.evaluate(()=>setSubtab('coach','custom')); await p.click('#open-lib'); await scan('24-lib');
await p.evaluate(()=>closeSheet()); await p.evaluate(()=>{ show('hist'); openAward && openAward(Object.keys(AWARDS_BY_ID||{})[0]); }).catch(()=>{});
await p.evaluate(()=>closeSheet()); await p.click('[data-tab=hist]'); await p.waitForTimeout(200);
await p.evaluate(()=>setSubtab('hist','list')); const det = await p.$('[data-det]'); if (det) { await det.click(); await scan('25-hist-detail'); await p.evaluate(()=>closeSheet()); }
await p.evaluate(()=>openBackup()); await scan('26-backup'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>openTestSetup()); await scan('27-test-setup'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>openDbTest()); await scan('28-db-test'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>openRetoSetup('dbhammer')); await scan('29-reto-db'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>openSmartSettings()); await scan('30-smart-settings'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>openHRSettings()); await scan('31-hr'); await p.evaluate(()=>closeSheet());
await p.click('[data-tab=cal]'); await p.waitForTimeout(200); const ag = await p.$('#cal-day [data-open]'); if (ag) { await ag.click(); await scan('32-cal-item'); await p.evaluate(()=>closeSheet()); }
await p.evaluate(()=>{ startWorkout({kind:'coach',sk:{w:20,r:20,n:2,R:2,rr:30},level:2,parts:['all'],rounds:[['squats','push_ups'],['squats','push_ups']],warm:WARM.slice(0,2),cool:COOL.slice(0,2)}); });
await p.waitForTimeout(300); await p.evaluate(()=>step(2)); await scan('33-warm-rest'); await p.evaluate(()=>step(P.tl.findIndex(s=>s.k==='rest'&&s.label==='Descanso'))); await scan('34-rest');
await p.evaluate(()=>step(P.tl.findIndex(s=>s.k==='roundrest'))); await scan('35-roundrest');
await p.evaluate(()=>{ P.running=false; clearInterval(P.timer); document.querySelector('#player').classList.add('hidden'); PS.del('session'); });
// pantallas nuevas: subpestañas, meta, rutinas, cuerpo, amigos, descarga
await p.evaluate(()=>{ const now=Date.now(); PS.set('body',[{at:now,kg:74,waist:84},{at:now-14*864e5,kg:75,waist:85}]); PS.set('routines',[{id:'r1',n:'R1',w:30,r:15,R:2,rr:45,ex:['squats','push_ups'],warm:true,cool:true}]); });
await p.click('[data-tab=coach]'); for (const k of ['smart','db','custom','mine']) { await p.evaluate(k=>setSubtab('coach',k),k); await scan('40-coach-'+k); }
await p.click('[data-tab=hist]'); for (const k of ['sum','prog','list','aw','body','friends']) { await p.evaluate(k=>setSubtab('hist',k),k); await scan('41-hist-'+k); }
await p.click('#who'); for (const k of ['prof','set','data']) { await p.evaluate(k=>setSubtab('pf',k),k); await scan('42-pf-'+k); } await p.evaluate(()=>closeSheet());
for (const [n,f] of [['43-goal','openGoal()'],['44-rt-new','openRoutine(null)'],['45-rt-edit','openRoutine(0)'],['46-pick','pickExercise(()=>{})'],['47-body','openBodyForm()'],['48-body-list','openBodyList()'],['49-grp-new','openGroupNew()'],['50-grp-join','openGroupJoin()']]) { await p.evaluate(f); await scan(n); await p.evaluate(()=>closeSheet()); }
await p.evaluate(()=>{ const sm={I:6,tests:[],sessions:3,maxDur:1800,nextAt:Date.now(),log:[{at:Date.now()-864e5,I:6,why:'inicio'}],opts:smartOpts(null)}; setSmart(sm); applyFeedback({smart:true},'hard'); applyFeedback({smart:true},'hard'); setSubtab('coach','smart'); show('coach'); setSubtab('coach','smart'); });
await scan('51-deload');
// entrenador de abdominales: coach inteligente
await p.click('[data-tab=coach]'); await p.evaluate(()=>setSubtab('coach','abs')); await scan('60-abai-intro');
await p.evaluate(()=>{ const o=document.querySelector('#abs [data-fold]'); if(o) o.click(); }); await scan('60b-abs-opts');
await p.click('#abi-start'); await scan('61a-abai-setup'); await p.click('#abis-test'); await scan('61-abai-test'); await p.fill('#abt-cr','30'); await p.click('#abt-ok'); await p.waitForTimeout(200); await scan('62-abai-card');
await p.evaluate(()=>openAbAiStart()); await scan('63-abai-start'); await p.click('#abiw-go'); await p.waitForTimeout(300);
await p.evaluate(()=>step(P.tl.findIndex(s=>s.k==='work'&&s.cnt))); await p.waitForTimeout(1200); await scan('64-abs-work');
await p.evaluate(()=>{ P.activeMs=500e3; step(P.tl.length); }); await p.waitForTimeout(500); await scan('65-abai-done');
await p.evaluate(()=>{ const d=document.querySelector('#d-fb [data-fb=hard]'); if(d) d.click(); }); await scan('65b-abai-fb');
await p.evaluate(()=>{ document.querySelector('.done').classList.add('hidden'); openAbAiSettings(); }); await scan('66-abai-cfg'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>{ const s=getAbAi(); s.sessions=6; setAbAi(s); renderAbAi(); }); await scan('67-abai-deload');
await p.evaluate(()=>openAgendaItem({type:'absai',n:9,first:false})); await scan('68-abai-cal'); await p.evaluate(()=>closeSheet());
// plan cerrado de abdominales (en Planes)
await p.click('[data-tab=plans]'); await p.evaluate(()=>openAbSetup(false,1)); await scan('69-abs-setup'); await p.click('#abs-ok'); await p.waitForTimeout(200);
await p.evaluate(()=>openAbStart()); await scan('69b-abs-start'); await p.click('#abw-go'); await p.waitForTimeout(300);
await p.evaluate(()=>{ P.activeMs=500e3; step(P.tl.length); }); await p.waitForTimeout(500); await p.evaluate(()=>{ const d=document.querySelector('#d-fb [data-fb=hard]'); if(d) d.click(); }); await scan('69c-abs-fb');
await p.evaluate(()=>{ document.querySelector('.done').classList.add('hidden'); openAbSetup(true); }); await scan('69d-abs-cfg'); await p.evaluate(()=>closeSheet());
await p.evaluate(()=>{ const s=getAbs(); s.levelDone=true; setAbs(s); show('plans'); document.querySelector('#abs-plans').scrollIntoView(); }); await scan('69e-abs-leveldone');
await p.evaluate(()=>{ const s=getAbs(); s.levelDone=false; setAbs(s); openAgendaItem({type:'abs',i:s.day,first:true,t:Date.now()}); }); await scan('69f-abs-cal'); await p.evaluate(()=>closeSheet());
await p.click('[data-tab=plans]'); await p.evaluate(()=>document.querySelector('#abs-plans').scrollIntoView()); await scan('70-abs-plans'); await p.evaluate(()=>{ setAbs(null); renderPlans(); document.querySelector('#abs-plans').scrollIntoView(); }); await scan('71-abs-plans-cat');
await p.evaluate(()=>{ setSubtab('hist','list'); }); await p.click('[data-tab=hist]'); await p.evaluate(()=>setSubtab('hist','sum')); await scan('69-abs-hist');

await p.evaluate(()=>closeSheet()); await p.click('[data-tab=coach]'); await p.evaluate(()=>setSubtab('coach','timer')); await scan('80-timer');
await p.click('[data-tpe="0"] b'); await scan('81-timer-edit'); await p.click('#tm-rep [data-rep=n]'); await scan('81b-timer-edit'); await p.click('#tm-rep [data-rep=f]'); await scan('81c-timer-edit');
await p.evaluate(()=>{ const c=tmPreset(TM_PRESETS[0]); c.id='zz'; c.wd=[0,1,2,3,4,5,6]; PS.set('timers',[c]); }); await p.click('#tm-go'); await scan('82-timer-prep'); await p.evaluate(()=>{ TP.last-=15000; tmTick(); }); await scan('83-timer-run');
await p.evaluate(()=>{ TP.last-=700000; tmTick(); }); await scan('84-timer-run2'); await p.click('#tp-close'); await scan('85-timer-menu'); await p.click('#tp-menu [data-m=end]'); await scan('86-timer-done');
await p.evaluate(()=>closeSheet()); await p.evaluate(()=>{ TP.c=tmPreset(TM_PRESETS[0]); }); await p.evaluate(()=>{ PS.set('tsession',{c:tmPreset(TM_PRESETS[0]),pos:100,act:100,log:[],startedAt:Date.now(),savedAt:Date.now(),paused:true}); renderTimers(); }); await scan('87-timer-resume');
await p.evaluate(()=>PS.del('tsession')); await p.click('[data-tab=cal]'); await scan('87b-timer-cal'); await p.evaluate(()=>openAgendaItem({type:'timer',id:'zz'})); await scan('87c-timer-item'); await p.evaluate(()=>closeSheet()); await p.click('[data-tab=hist]'); await p.evaluate(()=>{ setSubtab('hist','list'); openHistDetail(0); }); await scan('88-timer-hist');
await p.evaluate(()=>closeSheet());
await p.evaluate(()=>{ document.querySelector('#goal-card').innerHTML = goalDoneHTML(); }); await scan('52-goal-hit');
const said = await p.evaluate(()=>__said);
console.log('voz:'); for (const x of said) console.log('  ', x, ' => ', await p.evaluate(t=>tr(t), x));
console.log('SIN TRADUCIR:'); for (const [k,v] of found) console.log(v+'\t'+k);
console.log(errs); await b.close();
