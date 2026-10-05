import json,subprocess,sys
W=[(w['text'],w['start'],w['end']) for w in json.load(open('../words.json'))['words'] if w['type']=='word']
def seg(a,b,pa=.06,pb=.10): return dict(a=round(a-pa,3),b=round(b+pb,3))
CUTS={
'A':[seg(0.16,2.94),seg(15.18,17.12),seg(6.48,14.62),seg(22.78,32.12),seg(32.72,34.86),seg(44.0,54.9),seg(55.5,60.48),
     seg(61.06,66.26),seg(70.5,72.7),seg(75.72,78.02),seg(78.62,79.8),seg(81.24,87.44),seg(94.74,99.08,pb=.2)],
'B':[seg(0.16,5.88),seg(6.48,14.62),seg(17.68,21.58),seg(22.78,32.12),seg(32.72,34.86),seg(44.0,54.9),seg(55.5,60.48),
     seg(61.06,66.26),seg(66.86,69.8),seg(75.72,78.02),seg(81.24,87.44),seg(94.74,99.08,pb=.2)],
}
def build(k):
    segs=CUTS[k];o=0
    for s in segs: s['o']=round(o,3); s['dur']=round(s['b']-s['a'],3); o+=s['dur']
    words=[]
    for t,a,b in W:
        for s in segs:
            if s['a']<=a and b<=s['b']+.02:
                words.append(dict(w=t,s=round(s['o']+a-s['a'],3),e=round(s['o']+min(b,s['b'])-s['a'],3)));break
    # ffmpeg trim+concat
    fc='';n=len(segs)
    for i,s in enumerate(segs):
        fc+=f"[0:v]trim={s['a']}:{s['b']},setpts=PTS-STARTPTS,fps=30[v{i}];[0:a]atrim={s['a']}:{s['b']},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={s['dur']-0.015}:d=0.015[a{i}];"
    fc+=''.join(f'[v{i}][a{i}]' for i in range(n))+f'concat=n={n}:v=1:a=1[v][a]'
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i','../nocap.mp4','-filter_complex',fc,'-map','[v]','-map','[a]',
        '-c:v','libx264','-crf','14','-preset','fast','-pix_fmt','yuv420p','-c:a','pcm_s16le',f'{k}_base.mov'],check=True)
    json.dump(dict(segs=segs,words=words,dur=round(o,3)),open(f'{k}.json','w'),indent=1)
    print(k,round(o,2),'s',len(words),'words')
for k in sys.argv[1:]: build(k)
