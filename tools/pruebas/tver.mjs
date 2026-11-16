// La versión de la app (APP_V en app.js) coincide con la del service worker (sw.js)
import fs from 'fs'; import path from 'path';
const R = process.env.APP || process.cwd();
const a = (fs.readFileSync(path.join(R, 'app.js'), 'utf8').match(/const APP_V = (\d+);/) || [])[1];
const s = (fs.readFileSync(path.join(R, 'sw.js'), 'utf8').match(/intervalo-v(\d+)/) || [])[1];
console.log((a && a === s ? 'OK  ' : 'FALLA ') + `APP_V ${a} = sw.js v${s} (al subir la versión cambiar las dos)`);
