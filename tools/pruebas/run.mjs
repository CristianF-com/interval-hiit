// Corre las pruebas de la app contra una copia local servida desde la raíz del repositorio.
//   node tools/pruebas/run.mjs            → todas
//   node tools/pruebas/run.mjs ttimer ten → solo esas
// Variables: PW_CHROME (ruta de Chromium; si falta se usa el de Playwright), OUT (carpeta de capturas).
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os';
import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const OUT = process.env.OUT || path.join(os.tmpdir(), 'inhiit');
['', 'shots', 'en'].forEach(d => fs.mkdirSync(path.join(OUT, d), { recursive: true }));
if (!process.env.PW_CHROME && fs.existsSync('/opt/pw-browsers/chromium')) process.env.PW_CHROME = '/opt/pw-browsers/chromium';
const SUITE = ['t2b', 'ttabs', 'tfeat', 'trt', 'tdb', 'tsm', 'tabai', 'tabs', 'tabsplan', 'tstart', 'tcal', 'tov', 'tlink', 'treopen', 'tcloud', 'tkb2', 'tgaps', 'trm', 'tsmart',
  'tgap', 'tpaus', 'taud', 'ttimer', 'ttimer2', 'ten', 'tvoz'];
const MIME = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', mp3: 'audio/mpeg', mp4: 'video/mp4', webmanifest: 'application/manifest+json', woff2: 'font/woff2' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
const own = await new Promise(res => { srv.once('error', () => res(false)); srv.listen(8776, () => res(true)); });   // si ya hay uno escuchando, se usa ese
const run = name => new Promise(res => {
  const c = spawn(process.execPath, [path.join(HERE, name + '.mjs'), OUT], { cwd: ROOT, env: { ...process.env, OUT, APP: ROOT } });
  let out = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d);
  const kill = setTimeout(() => c.kill('SIGKILL'), 8 * 60 * 1000);
  c.on('close', code => { clearTimeout(kill); res({ code, out }); });
});
const want = process.argv.slice(2), list = want.length ? want : SUITE; let bad = 0;
for (const name of list) {
  const t0 = Date.now(), { code, out } = await run(name);
  const fails = out.split('\n').filter(l => /^FALLA/.test(l));
  let extra = '';
  if (name === 'ten' && !/SIN TRADUCIR:\s*\[\]/.test(out)) extra = 'hay textos sin traducir';
  if (name === 'tvoz' && (!/SIN GRABAR \(todas las voces\): 0/.test(out) || /FALTAN EN \w+: [1-9]/.test(out))) extra = 'hay frases sin grabar';
  const okk = code === 0 && !fails.length && !extra;
  console.log(`${okk ? 'OK   ' : 'FALLA'} ${name.padEnd(10)} ${((Date.now() - t0) / 1000).toFixed(0)} s${fails.length ? ' · ' + fails.length + ' fallas' : ''}${code ? ' · terminó con error' : ''}${extra ? ' · ' + extra : ''}`);
  if (!okk) { bad++; console.log(fails.join('\n') || out.split('\n').filter(l => !/agent-proxy|Allowed domains|For details|accounts\.google/.test(l)).slice(-25).join('\n')); }
}
if (own) srv.close();
console.log(bad ? `\n${bad} de ${list.length} pruebas con problemas` : `\nLas ${list.length} pruebas pasan`);
process.exit(bad ? 1 : 0);
