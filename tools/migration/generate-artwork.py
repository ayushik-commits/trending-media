"""Convert the captured home-page vector artwork into React JSX + Tailwind utilities.
The chapter and product pages are exported by capture-framer-pages.mjs instead.
Run from the project root. Interactive behaviour is maintained separately.
"""
import json, hashlib, math, re
from pathlib import Path
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[2]
data=json.loads((Path(__file__).parent/'home-artwork.json').read_text())
art=ROOT/'public/assets/artwork';art.mkdir(parents=True,exist_ok=True)

def save_svg(svg,name):
    slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-') or 'shape'
    filename=f'{slug}-{hashlib.sha256(svg.encode()).hexdigest()[:8]}.svg'
    (art/filename).write_text(svg)
    return '/assets/artwork/'+filename

def classes(css):
    defaults={'min-width':'0px','min-height':'0px','max-width':'none','max-height':'none',
      'top':'auto','right':'auto','bottom':'auto','left':'auto','box-sizing':'border-box',
      'background-color':'rgba(0, 0, 0, 0)','background-image':'none','opacity':'1',
      'transform':'none','z-index':'auto','box-shadow':'none','filter':'none',
      'margin-top':'0px','margin-right':'0px','margin-bottom':'0px','margin-left':'0px',
      'padding-top':'0px','padding-right':'0px','padding-bottom':'0px','padding-left':'0px'}
    aliases={('position','absolute'):'absolute',('position','relative'):'relative',('position','static'):'static',
      ('display','block'):'block',('display','flex'):'flex',('display','inline'):'inline',
      ('flex-direction','column'):'flex-col',('align-items','center'):'items-center',
      ('justify-content','center'):'justify-center'}
    result=[]
    for prop,value in css.items():
        if prop in ['font-family','font-size','font-weight','font-style','line-height','text-align','letter-spacing','white-space','color']:continue
        if prop.startswith('border-') and prop!='border-radius':continue
        if value==defaults.get(prop) or value in ['normal','none'] or prop=='transform-origin' and css.get('transform')=='none':continue
        if prop=='background-image' and 'data:image/svg+xml,' in value:
            svg=unquote(value.split('data:image/svg+xml,',1)[1].rsplit('"',1)[0]);value=f"url('{save_svg(svg,'shape')}')"
        if prop=='background-image':value=value.replace('http://127.0.0.1:8765','')
        result.append(aliases.get((prop,value),f'[{prop}:{value.replace(" ","_")}]'))
    return ' '.join(result)

# ---- Motion read from the Framer project (trending media, home page) -------
def spring(omega,zeta):
    """A spring as a CSS 'duration linear(...)' timing: omega = natural frequency, zeta = damping ratio."""
    total=6.9/(zeta*omega) if zeta<1 else 9.2/omega  # settled to about 0.1%
    points=[]
    for i in range(25):
        t=total*i/24
        if zeta<1:
            damped=omega*math.sqrt(1-zeta*zeta)
            value=1-math.exp(-zeta*omega*t)*(math.cos(damped*t)+zeta*omega/damped*math.sin(damped*t))
        else:value=1-math.exp(-omega*t)*(1+omega*t)
        points.append('1' if i==24 else str(round(value,3)))
    return f"{round(total,3)}s_linear({','.join(points)})"
timed=lambda duration,bounce:spring(2*math.pi/duration,1-bounce)                      # Framer "duration / bounce" spring
physical=lambda stiffness,damping,mass:spring(math.sqrt(stiffness/mass),damping/(2*math.sqrt(stiffness*mass)))
# Hover reactions: scale, rotation in degrees, x and y offset in px, spring.
STICKER_HOVER={
    'chic':(1.4,28,1,-26,physical(362,13,0.3)),'kyliee gener':(1.3,-11,0,0,physical(267,9,0.3)),'bitcoin':(1.4,11,0,0,timed(0.3,0.5)),
    'heart':(1.7,-6,0,0,timed(0.8,0.4)),'matcha':(1.3,-11,0,0,timed(0.3,0.2)),'nedoh':(1.3,-11,0,0,timed(0.3,0.2)),
    'among us':(1.3,-11,0,0,physical(240,9,0.3)),'glasses':(1.3,5,0,0,physical(246,9,0.4)),
}
# These frames are unnamed in Framer; they are recognised by the named layer directly inside them.
FRAME_HOVER={
    'eyes':(1.4,10,32,0,physical(400,29,1)),'yourself':(0.9,3,0,0,timed(0.4,0.2)),'version':(0.9,-3,0,0,timed(0.4,0.2)),
    'are':(0.9,3,0,0,timed(0.4,0.2)),'the':(0.9,4,0,0,timed(0.4,0.2)),'you':(1.4,0,0,0,timed(0.4,0.2)),
}
# Ribbons that scroll forever: distance of one loop in px, seconds per loop.
RIBBONS={'Version \u2014 Continuous Ribbon':(999.89,11.5),'Best \u2014 Continuous Ribbon':(533.6,4)}
pieces=[]

cookie=None
def render(node,depth=2,mode='normal'):
    global cookie
    if isinstance(node,str):return ' '*depth+'{'+json.dumps(node)+'}'
    name=node['name'];tag=node['tag'];css=dict(node['css']);attrs=dict(node['attrs'])
    if name=='term and conditions' and mode!='cookie':
        cookie=node;return ' '*depth+'{cookiePanel}'
    if name=='term and conditions':css.update(opacity='1',transform='none')
    if name=='New Content — Add Elements Here':css.update(position='relative',transform='none',top='auto',left='auto')
    # The eyes sticker's draggable frame is unnamed in Framer; recognise it by its named child.
    inside=[child.get('name') for child in node.get('children',[]) if isinstance(child,dict)] if not name else []
    if name in STICKER_HOVER or 'eyes' in inside:
        tag='DraggableSticker'
    extra=''
    hover=STICKER_HOVER.get(name) or next((FRAME_HOVER[child] for child in inside if child in FRAME_HOVER),None)
    if hover and mode=='normal':
        scale,rotate,x,y,timing=hover
        extra=f' collage-piece [--hs:{scale}] [--hr:{rotate}deg] [--hx:{x}px] [--hy:{y}px] [--ht:{timing}]'
        pieces.append(name or next(child for child in inside if child in FRAME_HOVER))
    if name in RIBBONS:
        distance,seconds=RIBBONS[name]
        css['transform']='none'  # the capture froze the ribbon part-way through its loop
        extra=f' ribbon [--rx:{distance}px] [--rt:{seconds}s]'
    if 'svg' in node:
        tag='img';attrs={'src':save_svg(node['svg'],name),'alt':''}
    if tag=='img':
        attrs.pop('sizes',None);attrs.pop('srcset',None)
        attrs['alt']=''
    attributes=[f'className={{{json.dumps(classes(css)+extra)}}}']
    if name:attributes.append('data-artwork='+json.dumps(name))
    for key,value in attrs.items():attributes.append(('srcSet' if key=='srcset' else key)+'={'+json.dumps(value)+'}')
    if tag=='button':
        attributes+=['type="button"','onClick={onAccept}' if attrs.get('aria-label')=='Accept cookies' else 'onClick={onReject}']
        attributes[0]=attributes[0][:-2]+' focus-visible:outline-8 focus-visible:outline-offset-4 focus-visible:outline-trend-blue active:scale-95"}'
        attributes=[a for a in attributes if not a.startswith('type={')]
    start=' '*depth+'<'+tag+' '+' '.join(attributes)
    if tag in ['img','input','br']:return start+' />'
    children=node.get('children',[]) if 'svg' not in node else []
    return start+'>\n'+'\n'.join(render(c,depth+2,mode) for c in children)+'\n'+' '*depth+'</'+tag+'>'

hero=render(data['hero']);content=render(data['content']);cookies=render(cookie,mode='cookie')
assert sorted(pieces)==sorted([*STICKER_HOVER,*FRAME_HOVER]),f'hover reactions not placed exactly once: {sorted(pieces)}'
assert all(f' ribbon [--rx:{distance}px]' in content for distance,_ in RIBBONS.values()),'a ribbon was not found'
header='// Original vector artwork, migrated to native React and Tailwind.\n// Generated by tools/migration/generate-artwork.py; behaviour lives in HomeExperience.\nimport type { ReactNode } from "react";\n\n'
out=header+'import { DraggableSticker } from "../DraggableSticker";\n\n'+'export function HeroArtwork() {\n  return (\n'+hero+'\n  );\n}\n\n'
out+='export function DiscoveryArtwork({ cookiePanel }: { cookiePanel: ReactNode }) {\n  return (\n'+content+'\n  );\n}\n\n'
out+='export function CookieArtwork({ onAccept, onReject }: { onAccept: () => void; onReject: () => void }) {\n  return (\n'+cookies+'\n  );\n}\n'
(ROOT/'src/components/artwork/HomeArtwork.tsx').write_text(out)
print('Generated React artwork with Tailwind classes;',len(list(art.glob('*.svg'))),'SVG assets')
