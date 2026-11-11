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
import time, requests
AAI = {'paula': '7d6a5c2b-d698-5124-97ab-5a9c90af9416', 'julio': '2036e4b8-341e-5d82-b319-ca8c8577a127', 'ona': '4097dffe-1d51-5f17-90cb-cf1f41c80ad3', 'kimetz': '6b2c2125-2b01-5439-af76-3cce74f61aea'}
FILT = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-62dB,areverse'
KEY = os.environ['AAI_KEY']
for v in which:
    od = os.path.join(app, 'voz', v); todo = [(k, p) for k, p in items if not os.path.exists(os.path.join(od, index[k] + '.mp3'))]
    print(v, 'pendientes', len(todo), flush=True)
    for k, p in todo:
        for att in range(8):
            try:
                r = requests.post("https://tts.us.assemblyai.com/v1/speech", headers={"Authorization": KEY}, json={"text": spoken(p), "voice_id": AAI[v], "language": "spanish"}, timeout=90)
                if r.status_code == 429 or r.status_code >= 500: time.sleep(5 + att * 5); continue
                r.raise_for_status()
                pcm = tempfile.mktemp(suffix='.pcm'); open(pcm, 'wb').write(r.content)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, '-af', FILT, '-ac', '1', '-ar', '24000', '-b:a', '48k', os.path.join(od, index[k] + '.mp3')], check=True)
                os.remove(pcm); break
            except Exception as e:
                print('reintento', k, str(e)[:120], flush=True); time.sleep(3 + att * 3)
        else: print('FALLA', k, flush=True)
    print(v, 'ok', flush=True)
print('TERMINADO')
