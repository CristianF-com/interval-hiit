import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import json, glob, re
keys=json.load(open('i18n_keys.json'))
tr={}
for f in sorted(glob.glob('tr/0*.txt')):
    for line in open(f,encoding='utf-8'):
        line=line.rstrip('\n')
        if not line: continue
        i,v=line.split('\t',1); tr[int(i)]=v
missing=[i for i in range(len(keys)) if i not in tr]
print('faltan', missing[:20], len(missing))
D={}
for i,k in enumerate(keys):
    v=tr.get(i)
    if v is None or v=='=' : continue
    if v!=k: D[k]=v
for line in open('tr/extra.txt',encoding='utf-8'):
    line=line.rstrip('\n')
    if line and '\t' in line: k,v=line.split('\t',1); D[k]=v
pats=[]
for line in open('tr/patterns.txt',encoding='utf-8'):
    line=line.rstrip('\n')
    if not line or line.startswith('#'): continue
    es,en=line.split('\t'); pats.append([es,en])
# nombres y descripciones de ejercicios y planes para el catálogo (búsqueda, voz)
src=open('../../data.js',encoding='utf-8').read()
C=json.loads(re.search(r'const CATALOG=(\{.*?\});\n',src).group(1))
PF=json.loads(re.search(r'const PLAN_FAMILIES=(\[.*?\]);\n',src).group(1))
cat={k:[D.get(v['n'],v['n']), D.get(v.get('d',''),v.get('d',''))] for k,v in C.items()}
nm=sum(1 for k,v in C.items() if v['n'] not in D); nd=sum(1 for k,v in C.items() if v.get('d') and v['d'] not in D)
print('catálogo sin traducir: nombres',nm,'descripciones',nd)
js = "'use strict';\n/* Traducción al inglés. Clave: el texto en español tal como aparece en la app. Generado desde tr/*.txt */\nif (LANG === 'en') {\n"
js += "I18N = " + json.dumps(D, ensure_ascii=False, indent=0) + ";\n"
js += "I18N_PAT = " + json.dumps(pats, ensure_ascii=False, indent=0) + ";\n"
js += "// catálogo de ejercicios y planes en inglés (búsqueda, voz y textos armados en el código)\n"
js += "const I18N_EX = " + json.dumps(cat, ensure_ascii=False, separators=(',',':')) + ";\n"
js += "Object.entries(I18N_EX).forEach(([id, [n, d]]) => { if (CATALOG[id]) { CATALOG[id].n = n; if (d) CATALOG[id].d = d; } });\n"
js += "PLAN_FAMILIES.forEach(f => { if (I18N[f.n]) f.n = I18N[f.n]; if (I18N[f.d]) f.d = I18N[f.d]; });\n}\n"
import os; os.makedirs('interval-hiit/i18n',exist_ok=True)
open('../../i18n/en.js','w',encoding='utf-8').write(js)
print('entradas', len(D), 'patrones', len(pats), 'bytes', len(js))
