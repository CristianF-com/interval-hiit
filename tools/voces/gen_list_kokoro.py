# Audios del timer de intervalos para las voces de Kokoro (Dora y Alex)
import os, sys, re, json, unicodedata, subprocess, tempfile
app = sys.argv[1]; which = sys.argv[3:]
def norm(t):
    t = unicodedata.normalize('NFD', t); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())
phrases = json.load(open(sys.argv[2], encoding='utf-8'))
def spoken(t): return re.sub(r'\b1 minuto\b', 'un minuto', t)
ipath = os.path.join(app, 'voz', 'index.json'); index = json.load(open(ipath, encoding='utf-8'))
nxt = max(int(v[1:]) for v in index.values()) + 1; items = []
for p in phrases:
    k = norm(p)
    if k not in index: index[k] = 'c%04d' % nxt; nxt += 1
    items.append((k, p))
json.dump(index, open(ipath, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('frases', len(items), flush=True)
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
md = os.environ.get('KOKORO_DIR', 'tts')   # carpeta con kokoro-v1.0.onnx y voices-v1.0.bin
kk = Kokoro(md + '/kokoro-v1.0.onnx', md + '/voices-v1.0.bin'); tok = Tokenizer()
for v in which:
    od = os.path.join(app, 'voz', v); vid = {'dora': 'ef_dora', 'alex': 'em_alex'}[v]
    todo = [(k, p) for k, p in items if not os.path.exists(os.path.join(od, index[k] + '.mp3'))]
    print(v, 'pendientes', len(todo), flush=True)
    for k, p in todo:
        s, sr = kk.create(tok.phonemize(spoken(p), 'es-419'), voice=vid, speed=1.05, is_phonemes=True)
        w = tempfile.mktemp(suffix='.wav'); sf.write(w, s, sr)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ac', '1', '-ar', '24000', '-b:a', '48k', os.path.join(od, index[k] + '.mp3')], check=True)
        os.remove(w)
    print(v, 'ok', flush=True)
print('TERMINADO')
