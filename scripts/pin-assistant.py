"""Create exact model sizes/checksums from immutable source revisions."""
import json, pathlib, urllib.request, hashlib, base64
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/licences';OUT.mkdir(exist_ok=True)
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Leesmaat/1.0'}),timeout=60).read()
def sri(checksum):return 'sha256-'+base64.b64encode(bytes.fromhex(checksum)).decode()
commit=json.loads(get('https://api.github.com/repos/mlc-ai/binary-mlc-llm-libs/commits/main'))['sha']
models=[]
for selected in json.loads(pathlib.Path('/tmp/leesmaat-assistant-models.json').read_text()):
 id=selected['model_id'];repo='mlc-ai/'+id
 revision=json.loads(get('https://huggingface.co/api/models/'+repo))['sha']
 base=f'https://huggingface.co/{repo}/resolve/{revision}/'
 tree=json.loads(get(f'https://huggingface.co/api/models/{repo}/tree/{revision}?expand=true'))
 config=json.loads(get(base+'mlc-chat-config.json'));tensor=json.loads(get(base+'tensor-cache.json'))
 names=['mlc-chat-config.json','tensor-cache.json',*config['tokenizer_files'],*[r['dataPath'] for r in tensor['records']]]
 files=[]
 for name in dict.fromkeys(names):
  record=next(r for r in tree if r['path']==name)
  checksum=record.get('lfs',{}).get('oid') or hashlib.sha256(get(base+name)).hexdigest()
  files.append({'name':name,'url':base+name,'bytes':record['size'],'sha256':checksum,'cache':'webllm/config' if name=='mlc-chat-config.json' else 'webllm/model'})
 lib=selected['model_lib'].replace('/main/',f'/{commit}/');data=get(lib);checksum=hashlib.sha256(data).hexdigest()
 files.append({'name':'model.wasm','url':lib,'bytes':len(data),'sha256':checksum,'cache':'webllm/wasm'})
 card=get(base+'README.md');(OUT/(id+'-MODEL_CARD.md')).write_bytes(card)
 record={'model_id':id,'model':base,'model_lib':lib,'overrides':{'context_window_size':2048},'integrity':{'config':sri(next(f['sha256'] for f in files if f['name']=='mlc-chat-config.json')),'model_lib':sri(checksum),'tokenizer':{f['name']:sri(f['sha256']) for f in files if f['name'] in config['tokenizer_files']},'onFailure':'error'}}
 models.append({'id':id,'name':selected['name'],'licence':selected['licence'],'source':selected['source'],'memoryMB':selected['vram_required_MB'],'minBufferBytes':134217728,'revision':revision,'files':files,'record':record})
 print(id, sum(f['bytes'] for f in files), 'bytes',len(files),'artifacts')
(ROOT/'src/lib/assistant-models.json').write_text(json.dumps(models,indent=2)+'\n')
(OUT/'WebLLM-Apache-2.0.txt').write_bytes((ROOT/'node_modules/@mlc-ai/web-llm/LICENSE').read_bytes())

# Retain the upstream Llama licence and acceptable-use notice alongside the converted model card.
licence_commit=json.loads(get('https://api.github.com/repos/meta-llama/llama-models/commits/main'))['sha']
for name in ['LICENSE','USE_POLICY.md']:
 (OUT/('Llama-3.2-'+name+'.txt')).write_bytes(get(f'https://raw.githubusercontent.com/meta-llama/llama-models/{licence_commit}/models/llama3_2/{name}'))
