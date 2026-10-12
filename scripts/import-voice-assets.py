"""Pin voice model metadata and small previews. Neural models stay on demand."""
import json, urllib.request, hashlib, pathlib, shutil
from concurrent.futures import ThreadPoolExecutor
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'public/voice-runtime';OUT.mkdir(exist_ok=True)
PREVIEW=ROOT/'public/voice-previews';PREVIEW.mkdir(exist_ok=True)
NOTICE=ROOT/'public/licences';NOTICE.mkdir(exist_ok=True)

def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Leesmaat/1.0 (https://github.com/thembaxx/leesmaat)'}),timeout=60).read()
repo=json.loads(get('https://huggingface.co/api/models/rhasspy/piper-voices'));sha=repo['sha']
v=json.loads(get(f'https://huggingface.co/rhasspy/piper-voices/raw/{sha}/voices.json'))
selected=[('en_US-ljspeech-medium','Linda','US','female','Public-domain dataset'),('en_US-john-medium','John','US','male','Public-domain dataset'),('en_GB-cori-medium','Cori','GB','female','Public-domain dataset'),('en_GB-northern_english_male-medium','Northern English','GB','male','CC BY-SA 4.0 dataset')]
profiles=[]
for id,name,country,gender,licence in selected:
 path=next(p for p in v[id]['files'] if p.endswith('.onnx'))
 base=path.rsplit('/',1)[0]
 card=get(f'https://huggingface.co/rhasspy/piper-voices/raw/{sha}/{base}/MODEL_CARD')
 (NOTICE/f'{id}-MODEL_CARD.txt').write_bytes(card)
 tree=json.loads(get(f'https://huggingface.co/api/models/rhasspy/piper-voices/tree/{sha}/{base}?expand=true'))
 files=[]
 for suffix,key in [('.onnx','model'),('.onnx.json','config')]:
  record=next(x for x in tree if x['path']==path.removesuffix('.onnx')+suffix)
  remote=f'https://huggingface.co/rhasspy/piper-voices/resolve/{sha}/{record["path"]}'
  if record.get('lfs'):checksum=record['lfs']['oid']
  else:checksum=hashlib.sha256(get(remote)).hexdigest()
  files.append({'url':f'/voice-files/{id}/{key}?v={checksum}','remote':remote,'bytes':record['size'],'sha256':checksum})
 try:
  samples=json.loads(get(f'https://huggingface.co/api/models/rhasspy/piper-voices/tree/{sha}/{base}/samples'))
  sample=next(x for x in samples if x['path'].endswith(('.mp3','.wav')))
  extension=pathlib.Path(sample['path']).suffix
  (PREVIEW/f'{id}{extension}').write_bytes(get(f'https://huggingface.co/rhasspy/piper-voices/resolve/{sha}/{sample["path"]}'))
 except Exception as error:print('Preview needs synthesis',id,error)
 profiles.append({'id':id,'name':name,'language':'en','country':country,'gender':gender,'engine':'piper','style':'Natural','files':files,'preview':f'/voice-previews/{id}{extension}','licence':licence,'source':f'https://huggingface.co/rhasspy/piper-voices/blob/{sha}/{base}/MODEL_CARD'})

# The same compact language pack supports both documented eSpeak voice variants.
for gender,variant in [('male','m3'),('female','f3')]:
 profiles.append({'id':f'af-{gender}','name':f'Afrikaans {gender}','language':'af','country':'ZA','gender':gender,'engine':'espeak','style':'Compact · synthetic tone','variant':f'af+{variant}','files':[],'preview':f'/voice-previews/af-{gender}.wav','licence':'GPL-3.0-or-later','source':'https://github.com/espeak-ng/espeak-ng'})
commit=json.loads(get('https://api.github.com/repos/steveseguin/espeakng.js/commits/master'))['sha']
for name,source in [('espeak.worker.js','js/espeakng.worker.js'),('espeak.worker.data','js/espeakng.worker.data')]:
 (OUT/name).write_bytes(get(f'https://raw.githubusercontent.com/steveseguin/espeakng.js/{commit}/{source}'))
(NOTICE/'eSpeak-NG-GPL-3.0.txt').write_bytes(get(f'https://raw.githubusercontent.com/steveseguin/espeakng.js/{commit}/LICENSE'))
(NOTICE/'voice-sources.json').write_text(json.dumps({'piperModels':sha,'espeakCompiledSource':f'https://github.com/steveseguin/espeakng.js/tree/{commit}','espeakPreferredSource':'https://github.com/espeak-ng/espeak-ng/tree/1.49.1','piperPhonemizerSource':'https://github.com/diffusion-studio/piper-wasm','onnxSource':'https://github.com/microsoft/onnxruntime/tree/v1.18.0'},indent=2)+'\n')
(ROOT/'src/lib/voice-catalogue.json').write_text(json.dumps(profiles,indent=2)+'\n')
print('Pinned voice profiles:',len(profiles),'revision',sha)
