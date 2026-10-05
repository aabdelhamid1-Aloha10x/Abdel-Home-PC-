import json,sys,os,shutil,subprocess,html
K=sys.argv[1]; D=json.load(open(f'{K}.json')); W=D['words']; SPEECH=D['dur']; TAIL=3.0; TOTAL=round(SPEECH+TAIL,2)
def t(word,after=0.0,end=False):
    for w in W:
        if w['s']>=after-0.01 and w['w'].lower().strip('.,?!"“”').startswith(word.lower()):
            return w['e'] if end else w['s']
    raise SystemExit(f'word not found {word} after {after}')
I={ # lucide-style 24px stroke icons
'house':'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
'building':'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
'pin':'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
'puzzle':'<path d="M9 3h3a2 2 0 1 1 4 0h3v5a2 2 0 1 1 0 4v5h-5a2 2 0 1 0-4 0H5v-5a2 2 0 1 0 0-4V3z"/>',
'dollar':'<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
'users':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 21v-1a6.5 6.5 0 0 1 13 0v1"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5a5 5 0 0 1 5 5V21"/>',
'family':'<circle cx="7" cy="6" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="12" cy="12" r="2"/><path d="M3 21v-6a4 4 0 0 1 8 0M13 21v-6a4 4 0 0 1 8 0M10 21v-3a2 2 0 0 1 4 0v3"/>',
'bulb':'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
'search':'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5"/>',
'target':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
'clipboard':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="m9 13 2 2 4-4"/>',
'megaphone':'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13"/>',
'funnel':'<path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z"/>',
'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
'chart':'<path d="M3 21h18"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="8" width="3" height="10"/><rect x="16" y="4" width="3" height="14"/>',
'heart':'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
'baby':'<circle cx="12" cy="8" r="4"/><path d="M10.5 8h.01M13.5 8h.01M10.5 10c.8.7 2.2.7 3 0"/><path d="M6 21a6 6 0 0 1 12 0"/>',
'handshake':'<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2.8 2.8 0 0 0-4 0l-.9.9a1.4 1.4 0 0 1-2-2L10.5 7a5 5 0 0 1 6.3-.6l.5.3a2 2 0 0 0 1.4.3H21v8"/><path d="M3 6h2l5 5"/><path d="M3 6v9l5 5"/>',
'form':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
'rocket':'<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
'lock':'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
'check':'<path d="m5 12 5 5 9-10"/>',
}
CARDS=[];CHAP=[];EV=[]  # cards: (side,t0,t1,icon,title,sub,kind)
def card(side,t0,t1,icon,title,sub='',kind='card',**kw): CARDS.append(dict(side=side,t0=round(t0,2),t1=round(t1,2),icon=icon,title=title,sub=sub,kind=kind,**kw))
def chap(t0,label): CHAP.append((round(t0,2),label))
if K=='A':
    a=t('daycare'); card('L',a,t('trust')-0.1,'baby','100%','ENROLLED','meter')
    card('R',t('parents'),t('maybe')-.05,'heart','TRUSTED','by parents','stars')
    chap(0,'HOME DAYCARE OWNERS')
    m=t('outgrown'); card('L',m-.1,t('experienced')-.05,'house','OUTGROWN','your home daycare'); card('R',m+.35,t('experienced')-.05,'building','FIRST CENTER','the next step')
    e=t('experienced'); chap(e,'SOUTH JERSEY OPERATORS'); card('L',t('cumberland'),t('missing')-.05,'pin','SOUTH JERSEY','Cumberland County')
    card('R',t('missing'),t('finding')-.4,'puzzle','THE PLAN','the missing piece')
else:
    chap(0,'DAYCARE + PRESCHOOL OWNERS')
    a=t('daycare'); card('L',a,t('parents')-0.05,'baby','FULL','waitlist growing','meter')
    card('R',t('parents'),t('so')-.05,'heart','TRUSTED','by parents','stars')
    n=t('next'); card('L',t('opened')-.1,t('experienced')-.05,'pin','LOCATION #1','open & full'); card('R',n,t('experienced')-.05,'pin','LOCATION #2?','not yet open','pin2')
    e=t('experienced'); chap(e,'SOUTH JERSEY OPERATORS'); card('L',t('cumberland'),t('missing')-.05,'pin','SOUTH JERSEY','Cumberland County')
    card('R',t('missing'),t('maybe')-.05,'puzzle','THE PLAN','the missing piece')
    r=t('already'); card('L',r,t('finding')-.4,'building','1 CENTER','or several'); card('R',t('ready',r),t('finding')-.4,'rocket','+1 MORE','ready for another')
f=t('finding'); chap(f,'WHAT KEEPS YOU STUCK')
card('L',t('space',f)-.25,t('hiring',f)-.05,'building','SPACE','the right site'); card('R',t('startup',f)-.2,t('attracting',f)-.05,'dollar','STARTUP COSTS','budget & capital')
card('L',t('hiring',f)-.1,t('stuck',f)-.05,'users','STAFF','hiring a team'); card('R',t('attracting',f)-.1,t('stuck',f)-.05,'family','FAMILIES','enrollment')
s=t('stuck',f); card('L',s-.1,t('abdel')-.2,'bulb','STUCK','as an idea','lock')
ab=t('abdel'); chap(ab,'MEET YOUR GUIDE'); NAME=(ab-.1,t('assess')+1.6)
asx=t('assess'); chap(asx,'HOW WE HELP')
card('L',asx,t('identify')-.05,'search','ASSESS','your business'); card('R',t('identify'),t('location',asx)-.1,'target','BOTTLENECK',"what's holding you back")
card('L',t('location',asx)-.1,t('setup')-.05,'pin','LOCATION','site options'); card('R',t('setup'),t('marketing')-.05,'clipboard','LICENSING','setup coordination')
card('L',t('marketing')-.1,t('enrollment')-.05,'megaphone','MARKETING','to fill seats'); card('R',t('enrollment')-.1,t('also')-.15,'funnel','ENROLLMENT','systems that convert')
tw=t('twelve'); card('L',tw-.1,t('bring')-.2,'calendar','12 MONTHS','business coaching'); card('R',t('day',tw)-.1,t('bring')-.2,'chart','DayIQ','run your operation')
yb=t('bring'); chap(yb,'THE PARTNERSHIP'); card('L',yb-.2,t('bring',yb+.5)-.05,'heart','YOU','childcare experience'); card('R',t('bring',yb+.5)-.1,t('support')+.5,'handshake','US','business + implementation')
if K=='A':
    q=t('planning',t('support')); chap(q-.2,'IS THIS YOU?'); CHECK=[(q,'Planning your first center'),(t('ready',q),'Ready to lead a team'),(t('follow',q),'Will follow through')]
else:
    q=t('do',t('support')); chap(q-.2,'IS THIS YOU?'); CHECK=[(t('experience',q),'Childcare experience'),(t('lead',q),'Ready to lead a team'),(t('follow',q),'Will follow through')]
cl=t('click'); chap(cl-.2,'NEXT STEP'); CTA=(cl-.15,t('stop')-.1); FORM=t('qualification'); BOOK=t('book',cl)
END=t('stop'); ENDCARD=SPEECH+0.1
CHECK_END=cl-.2
# captions chunks
ch=[];cur=[]
for w in W:
    if cur and (w['s']-cur[-1]['e']>0.3 or len(cur)>=3 or cur[-1]['w'][-1] in '.,?!'): ch.append(cur);cur=[]
    cur.append(w)
ch.append(cur)
# cut points
cuts=[s['o'] for s in D['segs'][1:]]
# ---------- HTML ----------
P=f'proj_{K}'; os.makedirs(P+'/assets',exist_ok=True)
for f in ['montserrat-latin-600-normal.woff2','montserrat-latin-800-normal.woff2','montserrat-latin-900-normal.woff2']:
    shutil.copy('../../w/'+f,P+'/assets/'+f)
def svg(n,sz=46,stroke='#3ee6c3'): return f'<svg width="{sz}" height="{sz}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
H=[];TL=[]
def A(x): TL.append(x)
NI=',immediateRender:false'
def clip(id,t0,t1,inner,style='',track=3,cls=''):
    H.append(f'<div id="{id}" class="clip {cls}" style="{style}" data-start="{t0:.2f}" data-duration="{max(0.05,t1-t0):.2f}" data-track-index="{track}">{inner}</div>')
def exitfade(id,t1,d=0.22): A(f'tl.fromTo("#{id}",{{opacity:1}},{{opacity:0,duration:{d},ease:"power2.in"{NI}}},{t1-d:.2f});')
for i,c in enumerate(CARDS):
    x='left:28px' if c['side']=='L' else 'right:28px'
    extra=''
    if c['kind']=='meter': extra='<div class="meter"><div class="mfill" id="mf%d"></div></div>'%i
    if c['kind']=='stars': extra='<div class="stars">'+''.join(f'<span class="st" id="st{i}_{k}">★</span>' for k in range(5))+'</div>'
    if c['kind']=='lock': extra=f'<div class="lockb" id="lk{i}">{svg("lock",30,"#ff6b6b")}</div>'
    inner=f'<div class="card" id="ci_{i}"><div class="ic" id="ic{i}">{svg(c["icon"])}</div><div class="ct">{html.escape(c["title"])}</div><div class="cs">{html.escape(c["sub"])}</div>{extra}</div>'
    clip(f'c{i}',c['t0'],c['t1'],inner,f'position:absolute;{x};top:{430 if c["side"]=="L" else 520}px;width:244px',track=4 if c['side']=='L' else 5)
    dx=-70 if c['side']=='L' else 70
    A(f'tl.fromTo("#ci_{i}",{{opacity:0,x:{dx},scale:0.8,filter:"blur(8px)"}},{{opacity:1,x:0,scale:1,filter:"blur(0px)",duration:0.42,ease:"back.out(1.6)"}},{c["t0"]});')
    A(f'tl.fromTo("#ic{i}",{{rotate:-25,scale:0.4}},{{rotate:0,scale:1,duration:0.5,ease:"back.out(2.2)"}},{c["t0"]+0.08:.2f});')
    exitfade(f'c{i}',c['t1'])
    if c['kind']=='meter': A(f'tl.fromTo("#mf{i}",{{width:"0%"}},{{width:"100%",duration:0.9,ease:"power3.out"}},{c["t0"]+0.25:.2f});')
    if c['kind']=='stars':
        for k in range(5): A(f'tl.fromTo("#st{i}_{k}",{{scale:0,opacity:0}},{{scale:1,opacity:1,duration:0.3,ease:"back.out(3)"}},{c["t0"]+0.25+k*0.08:.2f});')
    if c['kind']=='lock': A(f'tl.fromTo("#lk{i}",{{scale:0,rotate:-30}},{{scale:1,rotate:0,duration:0.4,ease:"back.out(3)"}},{c["t0"]+0.5:.2f});')
    EV.append(('pop',c['t0']))
segs=D['segs']
for i,s in enumerate(segs):
    z0=1.0 if i%2==0 else 1.07
    A(f'tl.fromTo("#cam",{{scale:{z0}}},{{scale:{z0+0.025},duration:{s["dur"]-0.01:.3f},ease:"none"{"" if i==0 else NI}}},{s["o"]});')
for k,c in enumerate(cuts):
    A(f'tl.fromTo("#flash",{{opacity:0.5}},{{opacity:0,duration:0.22,ease:"power2.out"{NI}}},{c});')
    A(f'tl.fromTo("#sweep",{{x:0}},{{x:2900,duration:0.42,ease:"power2.inOut"{NI}}},{c-0.12:.2f});')
    if k%3==1: A(f'tl.fromTo("#camf",{{filter:"blur(10px)"}},{{filter:"blur(0px)",duration:0.28,ease:"power2.out"{NI}}},{c});')
    EV.append(('whoosh',c-0.2))
for k,(t0,lab) in enumerate(CHAP):
    nxt=CHAP[k+1][0] if k+1<len(CHAP) else ENDCARD
    clip(f'ch{k}',t0,nxt,f'<div class="chap" id="chi{k}"><span class="dot"></span>{html.escape(lab)}</div>','position:absolute;right:44px;top:58px',track=6)
    A(f'tl.fromTo("#chi{k}",{{opacity:0,y:-20}},{{opacity:1,y:0,duration:0.35,ease:"power3.out"}},{t0});')
clip('name',NAME[0],NAME[1],'<div id="namei"><div class="nbar" id="nbar"></div><div><div class="nn">ABDEL</div><div class="nt">Founder, Aloha Growth</div></div></div>','position:absolute;left:40px;top:1180px',track=7)
A(f'tl.fromTo("#namei",{{opacity:0,x:-80}},{{opacity:1,x:0,duration:0.5,ease:"power3.out"}},{NAME[0]:.2f});tl.fromTo("#nbar",{{scaleY:0}},{{scaleY:1,duration:0.4}},{NAME[0]+0.1:.2f});')
exitfade('name',NAME[1]); EV.append(('swish',NAME[0]))
inner=''.join(f'<div class="ci" id="ck{k}"><span class="cb" id="cb{k}">{svg("check",30,"#04201c")}</span>{html.escape(txt)}</div>' for k,(tt,txt) in enumerate(CHECK))
clip('chk',CHECK[0][0]-0.3,CHECK_END,inner,'position:absolute;left:60px;top:1060px;width:960px',track=7)
for k,(tt,txt) in enumerate(CHECK):
    A(f'tl.fromTo("#ck{k}",{{opacity:0,x:-40}},{{opacity:1,x:0,duration:0.35,ease:"back.out(2)"}},{tt-0.1:.2f});tl.fromTo("#cb{k}",{{scale:0}},{{scale:1,duration:0.3,ease:"back.out(3)"}},{tt+0.1:.2f});')
    EV.append(('tick',tt+0.1))
exitfade('chk',CHECK_END)
inner=f'<div id="ctai"><div class="ck">3 SIMPLE STEPS</div><div class="crow"><div class="cstep" id="cs0">{svg("form",40)}<span>Short form</span></div><div class="cstep" id="cs1">{svg("calendar",40)}<span>Book a call</span></div><div class="cstep" id="cs2">{svg("rocket",40)}<span>Build the plan</span></div></div><div class="cbtn" id="cbtn">BOOK YOUR EXPANSION CONSULT</div><div class="carrow" id="carrow">↓</div></div>'
clip('cta',CTA[0],ENDCARD,inner,'position:absolute;left:50px;top:960px;width:980px',track=7)
A(f'tl.fromTo("#ctai",{{opacity:0,y:80}},{{opacity:1,y:0,duration:0.5,ease:"power3.out"}},{CTA[0]:.2f});')
for k,tt in enumerate([CTA[0]+0.3,FORM-0.2,BOOK-0.1]):
    A(f'tl.fromTo("#cs{k}",{{opacity:0.25,scale:0.9}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2.5)"}},{tt:.2f});'); EV.append(('pop',tt))
A(f'tl.fromTo("#cbtn",{{scale:0.8,opacity:0.3}},{{scale:1,opacity:1,duration:0.45,ease:"back.out(2)"}},{BOOK+0.4:.2f});')
A(f'tl.fromTo("#cbtn",{{scale:1}},{{scale:1.05,duration:0.45,yoyo:true,repeat:{max(1,int((ENDCARD-BOOK-1)/0.45)//2*2+1)},ease:"sine.inOut"{NI}}},{BOOK+0.9:.2f});')
A(f'tl.fromTo("#carrow",{{y:-10}},{{y:12,duration:0.4,yoyo:true,repeat:{int((ENDCARD-CTA[0])/0.4)//2*2+1},ease:"sine.inOut"}},{CTA[0]+0.3:.2f});')
EV.append(('ding',BOOK+0.4))
for i,c in enumerate(ch):
    s0=c[0]['s']; e0=min((ch[i+1][0]['s'] if i+1<len(ch) else c[-1]['e']+0.3)-0.02, c[-1]['e']+0.4)
    if s0>=CTA[0]: top=1700
    elif CHECK[0][0]-0.3<=s0<CHECK_END: top=1520
    else: top=1395
    inner=f'<div class="capi" id="cpi{i}">'+''.join(f'<span class="w" id="w{i}_{j}">{html.escape(w["w"].upper())}</span>' for j,w in enumerate(c))+'</div>'
    clip(f'cp{i}',s0,e0,inner,f'position:absolute;left:40px;width:1000px;top:{top}px',track=8,cls='cap')
    A(f'tl.fromTo("#cpi{i}",{{opacity:0,y:16,scale:0.96}},{{opacity:1,y:0,scale:1,duration:0.14,ease:"power2.out"}},{s0:.2f});')
    for j,w in enumerate(c):
        A(f'tl.fromTo("#w{i}_{j}",{{color:"#3ee6c3",scale:1.08}},{{color:"#ffffff",scale:1,duration:0.12{NI}}},{w["e"]:.2f});')
        A(f'tl.fromTo("#w{i}_{j}",{{color:"#ffffff",scale:1}},{{color:"#3ee6c3",scale:1.08,duration:0.06{"" if j==0 else ""}}},{max(w["s"]-0.06,s0):.2f});')
inner=f'<div class="eg"></div><div class="el" id="el"></div><div class="eb" id="eb">ALOHA GROWTH</div><div class="eh" id="eh">LET’S BUILD</div><div class="eh2" id="eh2">YOUR PLAN.</div><div class="ebtn" id="ebtn">BOOK YOUR EXPANSION CONSULT ↓</div><div class="es" id="es">{"Home daycare → your first center." if K=="A" else "Your next location starts here."}</div><div class="ef" id="ef">Cumberland County &amp; South Jersey · For qualified childcare operators</div>'
clip('end',ENDCARD,TOTAL,inner,'position:absolute;inset:0',track=9)
A(f'tl.fromTo("#end",{{opacity:0}},{{opacity:1,duration:0.45,ease:"power2.inOut"}},{ENDCARD:.2f});tl.fromTo("#el",{{scaleX:0}},{{scaleX:1,duration:0.4}},{ENDCARD+0.2:.2f});tl.fromTo("#eb",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.4}},{ENDCARD+0.3:.2f});tl.fromTo("#eh",{{yPercent:110}},{{yPercent:0,duration:0.5,ease:"power3.out"}},{ENDCARD+0.4:.2f});tl.fromTo("#eh2",{{yPercent:110}},{{yPercent:0,duration:0.5,ease:"power3.out"}},{ENDCARD+0.55:.2f});tl.fromTo("#ebtn",{{scale:0.7,opacity:0}},{{scale:1,opacity:1,duration:0.5,ease:"back.out(2)"}},{ENDCARD+0.9:.2f});tl.fromTo("#es",{{opacity:0}},{{opacity:1,duration:0.5}},{ENDCARD+1.1:.2f});tl.fromTo("#ef",{{opacity:0}},{{opacity:0.6,duration:0.5}},{ENDCARD+1.1:.2f});')
EV+= [('riser',ENDCARD-1.2),('impact',ENDCARD),('shimmer',ENDCARD+0.9)]
A(f'tl.fromTo("#prog",{{scaleX:0}},{{scaleX:1,duration:{TOTAL},ease:"none"}},0);')
CSS=open('style.css').read()
doc=f'''<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="assets/gsap.min.js"></script>
<style>{CSS}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{TOTAL}">
<div id="camf"><div id="cam"><video id="aroll" src="assets/{K}_v.mp4" muted playsinline data-start="0" data-duration="{SPEECH}" data-track-index="0"></video></div></div>
<div id="vig"></div><div id="flash"></div><div id="sweep"></div>
<div id="brand"><span class="bl"></span>ALOHA GROWTH</div><div id="progw"><div id="prog"></div></div>
{chr(10).join(H)}
<audio id="mix" src="assets/{K}_mix.wav" data-start="0" data-duration="{TOTAL}" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const tl=gsap.timeline({{paused:true}});
{chr(10).join(TL)}
window.__timelines["main"]=tl;
</script></body></html>'''
open(P+'/index.html','w').write(doc)
shutil.copy('../proj_test/hyperframes.json',P+'/hyperframes.json'); shutil.copy('gsap.min.js',P+'/assets/gsap.min.js')
json.dump(dict(events=EV,total=TOTAL,speech=SPEECH),open(f'{K}_events.json','w'))
print(K,'cards',len(CARDS),'chunks',len(ch),'total',TOTAL)
