import fs from 'fs';
// fuentes locales (opcional): FONTS=carpeta de @fontsource; sin ellas se usan las de Google Fonts
const D=(process.env.FONTS || '/home/claude/node_modules/@fontsource') + '/';
const F={ 'bc600':D+'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2','bc700':D+'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2','bc800':D+'barlow-condensed/files/barlow-condensed-latin-800-normal.woff2',
 'ar400':D+'archivo/files/archivo-latin-400-normal.woff2','ar500':D+'archivo/files/archivo-latin-500-normal.woff2','ar600':D+'archivo/files/archivo-latin-600-normal.woff2','ar700':D+'archivo/files/archivo-latin-700-normal.woff2'};
const css = Object.keys(F).map(k=>`@font-face{font-family:'${k.startsWith('bc')?'Barlow Condensed':'Archivo'}';font-weight:${k.slice(2)};font-style:normal;font-display:swap;src:url(https://fonts.local/${k}.woff2) format('woff2')}`).join('\n');
export async function fonts(ctx){
  if (!Object.values(F).every(p => fs.existsSync(p))) return;
  await ctx.route('**/fonts.googleapis.com/**', r=>r.fulfill({contentType:'text/css',body:css,headers:{'access-control-allow-origin':'*'}}));
  await ctx.route('https://fonts.local/**', r=>{ const k=r.request().url().split('/').pop().replace('.woff2',''); r.fulfill({contentType:'font/woff2',body:fs.readFileSync(F[k]),headers:{'access-control-allow-origin':'*'}}); });
}
