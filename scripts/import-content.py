"""Import public-domain reading texts, keeping original spelling and source attribution.
Run with Python 3 and beautifulsoup4. Downloads are cached outside the source tree.
"""
import json, re, math, hashlib, urllib.request
from builtins import id as node_id
from pathlib import Path
from bs4 import BeautifulSoup, Tag
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path('/tmp/leesmaat-source-cache'); CACHE.mkdir(exist_ok=True)
OUT=ROOT/'public/content'; OUT.mkdir(parents=True,exist_ok=True)
COVERS=ROOT/'public/content/covers'; COVERS.mkdir(exist_ok=True)
BOOKS=[
 (11,'pg-11',"Alice’s Adventures in Wonderland",'Lewis Carroll',1865,'en','Fantasy',1),
 (1342,'pg-1342','Pride and Prejudice','Jane Austen',1813,'en','Novel',2),
 (174,'nsc-en-HL-book-1','The Picture of Dorian Gray','Oscar Wilde',1891,'en','Novel',2),
 (43,'nsc-en-FAL-book-1','Strange Case of Dr Jekyll and Mr Hyde','Robert Louis Stevenson',1886,'en','Novella',2),
 (120,'pg-120','Treasure Island','Robert Louis Stevenson',1883,'en','Adventure',1),
 (55,'pg-55','The Wonderful Wizard of Oz','L. Frank Baum',1900,'en','Fantasy',1),
 (17396,'pg-17396','The Secret Garden','Frances Hodgson Burnett',1911,'en','Novel',1),
 (84,'pg-84','Frankenstein','Mary Shelley',1818,'en','Gothic fiction',2),
 (64317,'pg-64317','The Great Gatsby','F. Scott Fitzgerald',1925,'en','Novel',2),
 (1441,'pg-1441','The Story of an African Farm','Olive Schreiner',1883,'en','South African novel',2),
 (1524,'nsc-en-HL-book-4','Hamlet','William Shakespeare',1603,'en','Drama',2),
 (1531,'nsc-en-HL-book-2','Othello','William Shakespeare',1622,'en','Drama',2),
 (1533,'nsc-en-FAL-book-3','Macbeth','William Shakespeare',1623,'en','Drama',2),
 (77225,'pg-77225','Kampstories','C. Louis Leipoldt',1924,'af','Story collection',1),
 (42302,'pg-42302','Digters uit Suid-Afrika','E. C. Pienaar (compiler)',1922,'af','Poetry collection',2),
]

def download(url, target):
 if target.exists():return target.read_bytes()
 request=urllib.request.Request(url,headers={'User-Agent':'Leesmaat/1.0 (https://github.com/thembaxx/leesmaat)'})
 data=urllib.request.urlopen(request,timeout=30).read();target.write_bytes(data);return data

def soup(i):
 p=CACHE/f'{i}.html'
 if not p.exists():
  for url in [f'https://www.gutenberg.org/files/{i}/{i}-h/{i}-h.htm',f'https://www.gutenberg.org/cache/epub/{i}/pg{i}-images.html']:
   try:
    data=download(url,p)
    if b'<html' in data.lower() and len(data)>10000:break
    p.unlink()
   except Exception:pass
 return BeautifulSoup(p.read_text(encoding='utf-8-sig'),'html.parser')

def clean(s):return re.sub(r'[ \t]+',' ',s).strip()
def words(s):return len(re.findall(r'\b\w+\b',s))

def text_blocks(node, verse=False):
 node=BeautifulSoup(str(node),'html.parser')
 for el in node.select('script,style,.pagenum,.pagenumber,.footnote,.footnotes,.figcenter,.caption,.illustra,.pg-boilerplate,#pg-header,#pg-footer'):el.decompose()
 for br in node.select('br'):br.replace_with('\n')
 blocks=[]
 for p in node.select('p,pre,h3,.poem,.poetry'):
  if p.find_parent(['pre']) or p.find_parent(class_=re.compile(r'^(poem|poetry)$')):continue
  value=p.get_text('' if p.name=='pre' else ' ',strip=False)
  if verse or p.name=='pre' or 'poem' in (p.get('class') or []):value='\n'.join(clean(line) for line in value.splitlines())
  else:value=clean(re.sub(r'\s+',' ',value))
  if value.strip():blocks.append(value.strip())
 return '\n\n'.join(blocks)

def heading_sections(s, headings, verse=False):
 # Traverse the document once. Selected headings delimit sections across wrappers.
 selected={node_id(h) for h in headings}; result=[]; current=None; block_ids=set()
 for node in s.find_all(['h2','h3','p','pre','div']):
  if node_id(node) in selected:
   current={'title':clean(node.get_text(' ',strip=True)),'x':''};result.append(current);continue
  if not current or node.find_parent(id=re.compile(r'^pg-(header|footer)$')):continue
  if node.name not in ['p','pre','h3'] and not ({'poem','poetry'} & set(node.get('class') or [])):continue
  if any(node_id(parent) in block_ids for parent in node.parents):continue
  if node.find_parent(class_=re.compile('footnote|pagenum|figcenter')):continue
  value=text_blocks(node,verse)
  if node.name=='pre':value=node.get_text().strip()
  if node.name=='h3':value=clean(node.get_text(' ',strip=True))
  if value:current['x']+='\n\n'+value;block_ids.add(node_id(node))
 for part in result:part['x']=part['x'].strip()
 return [part for part in result if words(part['x'])>=30 and not part['title'].upper().startswith(('CONTENTS','INHOUD','FOOTNOTES'))]

def sections(i,genre):
 s=soup(i)
 if i==42302:
  parts=[]
  for h in s.select('h3'):
   pre=h.find_next_sibling('pre')
   if h.parent.name!='td' or not pre:continue
   author=clean(h.find_previous('h2').get_text(' ',strip=True)).removeprefix('Dr. ').rstrip('.')
   parts.append({'title':clean(h.get_text(' ',strip=True)).rstrip('.'),'x':pre.get_text().strip(),'author':author})
  return parts
 if genre=='Drama':
  heads=[]
  for h in s.select('h3'):
   if re.match(r'^SCENE\s+[IVX]+[.]',h.get_text(' ',strip=True)):
    act=h.find_previous('h2').get_text(' ',strip=True)
    h.string=act+' · '+h.get_text(' ',strip=True);heads.append(h)
  return heading_sections(s,heads,True)
 divs=[d for d in s.select('div.chapter') if d.find(['h2','h3']) and words(text_blocks(d))>=40]
 if divs:
  result=[]
  for d in divs:
   heads=d.find_all('h2')
   title=clean(' '.join(h.get_text(' ',strip=True) for h in heads)) or clean(d.find(['h2','h3']).get_text(' ',strip=True))
   result.append({'title':title,'x':text_blocks(d)})
  return result
 heads=s.select('h2')
 if i in [1342,17396,1441]:heads=[h for h in heads if re.search(r'CHAPTER',h.get_text(' ',strip=True),re.I)]
 elif i==64317:heads=[h for h in heads if re.fullmatch(r'[IVX]+',h.get_text(strip=True))]
 return heading_sections(s,heads)

items=[];cover_cache={}
def cover(i):
 if i in cover_cache:return cover_cache[i]
 p=COVERS/f'pg-{i}.jpg'
 try:
  data=download(f'https://www.gutenberg.org/cache/epub/{i}/pg{i}.cover.medium.jpg',p)
  if not data.startswith(b'\xff\xd8'):raise ValueError('Not an image')
  cover_cache[i]=f'/content/covers/pg-{i}.jpg'
 except Exception:cover_cache[i]=None
 return cover_cache[i]

def entry(i,id,title,author,year,lang,kind,genre,level,text):
 return {'id':id,'t':title,'a':author,'year':year,'g':lang,'k':kind,'genre':genre,'v':level,'m':max(1,math.ceil(words(text)/180)),'x':text,'source':f'https://www.gutenberg.org/ebooks/{i}','textSource':f'https://www.gutenberg.org/ebooks/{i}','rights':'Public-domain text','cover':cover(i),'coverSource':f'https://www.gutenberg.org/ebooks/{i}','wordCount':words(text),'tags':[genre,'Published reading'],'published':True}

for i,id,t,a,year,g,genre,level in BOOKS:
 parts=sections(i,genre)
 assert len(parts)>=2,(id,'missing chapters')
 full='\n\n'.join(p['x'] for p in parts)
 assert words(full)>5000,(id,'incomplete book',words(full))
 payload={'title':t,'author':a,'source':f'https://www.gutenberg.org/ebooks/{i}','sections':parts,'licence':'Underlying reading text is public domain in the USA and South Africa. Project Gutenberg licence: https://www.gutenberg.org/policy/license.html'}
 file=OUT/f'{id}.json';file.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')))
 preview='\n\n'.join(parts[0]['x'].split('\n\n')[:7])
 obj=entry(i,id,t,a,year,g,'Book',genre,level,preview)
 obj.update({'m':max(1,math.ceil(words(full)/180)),'wordCount':words(full),'contentUrl':f'/content/{id}.json','contentBytes':file.stat().st_size,'contentHash':hashlib.sha256(file.read_bytes()).hexdigest(),'sections':[{'title':p['title'],'words':words(p['x'])} for p in parts]})
 if i==42302:obj['editionNote']='Poem texts from the 1922 anthology edition; historical spelling is retained.'
 else:obj['editionNote']='Reading text divided into chapters or scenes; publisher front matter and images are omitted.'
 items.append(obj);print(id,len(parts),words(full),flush=True)

# Complete poems from an actual published anthology, with author attribution.
af=soup(42302)
chosen={'DIE VLAKTE.','DIE OSSEWA.','DIS AL.','VERGEWE EN VERGEET.','DIE STERRETJIE.','OKTOBERMAAND.','OP MY OU RAMKIETJIE.','DIE VERKLEURMANNETJIE.','SLAAP.','WINTERNAG.','KLAAS VAKIE.','DIE WINDJIE.'}
for index,h in enumerate(af.select('h3')):
 if h.get_text(' ',strip=True) not in chosen or h.parent.name!='td':continue
 pre=h.find_next_sibling('pre'); assert pre
 a=clean(h.find_previous('h2').get_text(' ',strip=True)).removeprefix('Dr. ').rstrip('.')
 t=clean(h.get_text(' ',strip=True)).rstrip('.').capitalize()
 obj=entry(42302,f'af-poem-{index}',t,a,1922,'af','Poem','Poetry',1,pre.get_text().strip())
 obj['collection']='Digters uit Suid-Afrika';items.append(obj)

frost=soup(29345)
frost_titles={'THE ROAD NOT TAKEN','THE OVEN BIRD','BIRCHES','A TIME TO TALK','A PATCH OF OLD SNOW','THE SOUND OF TREES'}
for index,h in enumerate(frost.select('h2')):
 title=h.get_text(' ',strip=True)
 if title not in frost_titles:continue
 nodes=[]
 for node in h.parent.next_siblings:
  if isinstance(node,Tag) and (node.find('h2') or node.name=='h2'):break
  if isinstance(node,Tag):nodes.append(node)
 text='\n\n'.join(clean(n.get_text('\n',strip=True)) for n in nodes if n.get_text(strip=True))
 assert words(text)>30,(title,'no poem')
 obj=entry(29345,f'en-poem-{index}',title.title(),'Robert Frost',1916,'en','Poem','Poetry',1,text)
 obj['collection']='Mountain Interval';items.append(obj)

# Complete short stories and essays; no generated narrative replaces the source.
shorts=[(2776,'O. Henry',1906,'en','Story',1,['THE GIFT OF THE MAGI','THE COP AND THE ANTHEM']),
 (2148,'Edgar Allan Poe',1843,'en','Story',2,['THE BLACK CAT','THE CASK OF AMONTILLADO','THE MASQUE OF THE RED DEATH']),
 (575,'Francis Bacon',1625,'en','Article',2,['Of Studies','Of Friendship','Of Truth']),
 (77225,'C. Louis Leipoldt',1924,'af','Story',1,['Die Slim Kraai','Die Klappertjie','Gogga en Gorra','Waarom die See Huil'])]
for i,a,year,g,kind,level,titles in shorts:
 parts=sections(i,'prose')
 for index,part in enumerate(parts):
  match=next((t for t in titles if t.lower() in part['title'].lower()),None)
  if not match:continue
  obj=entry(i,f'published-{i}-{index}',match.title() if g=='en' else match,a,year,g,kind,'Essay' if kind=='Article' else 'Short story',level,part['x'])
  if i==2148:obj['year']={'THE BLACK CAT':1843,'THE CASK OF AMONTILLADO':1846,'THE MASQUE OF THE RED DEATH':1842}[match]
  items.append(obj)

# Check every standalone text has a real source and no Gutenberg boilerplate.
for item in items:
 assert item['x'].strip() and 'Project Gutenberg eBook' not in item['x'] and 'END OF THE PROJECT GUTENBERG' not in item['x'],item['id']
(ROOT/'src/lib/published.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print('Published works:',len(items), 'Kinds:',{k:sum(i['k']==k for i in items) for k in ['Book','Poem','Story','Article']})
