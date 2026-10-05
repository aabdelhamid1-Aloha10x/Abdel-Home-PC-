import sys,json,subprocess,numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=48000;K=sys.argv[1];E=json.load(open(f'{K}_events.json'));T=E['total'];N=int(T*SR)
SFX='/root/.claude/skills/media-use/audio/assets/sfx/'
rng=np.random.default_rng(3)
def load(p,args=[]):
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',p,*args,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).astype(np.float64)
def lp(x,f):return sosfilt(butter(2,f,'low',fs=SR,output='sos'),x)
def hp(x,f):return sosfilt(butter(2,f,'high',fs=SR,output='sos'),x)
def put(m,x,t,g=1):
    i=int(max(t,0)*SR);j=min(i+len(x),len(m))
    if j>i:m[i:j]+=x[:j-i]*g
# voice
v=load(f'{K}_base.mov',['-af','highpass=f=80,equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=7'])
voice=np.zeros(N);voice[:min(len(v),N)]=v[:N]
# music: warm modern groove 92bpm, Fmaj7-Am7-Dm9-Bbmaj7
bpm=92;b=60/bpm;mus=np.zeros(N);f=lambda k:440*2**((k-69)/12)
prog=[[53,57,60,64],[57,60,64,67],[50,53,57,60,64],[46,50,53,57]]
bar=4*b;nb=int(T/bar)+1
for bi in range(nb):
    t0=bi*bar;ch=prog[bi%4];L=int(bar*SR);tt=np.arange(L)/SR
    keys=sum(np.sin(2*np.pi*f(k+12)*tt)*(1+.25*np.sin(2*np.pi*f(k+12)*2*tt))*np.exp(-tt/1.6) for k in ch)*.022
    keys*= (1+.12*np.sin(2*np.pi*4.5*tt))
    pad=lp(sum(((2*((tt*f(k)*(1+d))%1))-1) for k in ch for d in(-.004,.004)),900)*.012*np.minimum(tt/.6,1)
    bass=np.zeros(L)
    for s,(beat,k) in enumerate([(0,ch[0]-12),(1.5,ch[0]-12),(2.5,ch[1]-12),(3.0,ch[0]-12)]):
        i=int(beat*b*SR);l=int(.45*SR);t2=np.arange(l)/SR
        seg=np.sin(2*np.pi*f(k)*t2)*np.exp(-t2/.25)*np.minimum(t2/.01,1)*.16
        bass[i:i+l]+=seg[:L-i]
    put(mus,keys+pad+bass,t0)
    if bi==0: continue
    for s in range(4):
        tk=t0+s*b
        if s in(0,2):
            l=int(.3*SR);t3=np.arange(l)/SR;put(mus,np.sin(2*np.pi*np.cumsum(110*np.exp(-t3*30)+48)/SR)*np.exp(-t3/.12)*.38,tk)
        else:
            l=int(.2*SR);put(mus,(hp(rng.standard_normal(l),1500)*np.exp(-np.arange(l)/SR/.06)*.10+np.sin(2*np.pi*190*np.arange(l)/SR)*np.exp(-np.arange(l)/SR/.05)*.08),tk)
        for hh in (0.5,):
            l=int(.05*SR);put(mus,hp(rng.standard_normal(l),8000)*np.exp(-np.arange(l)/SR/.015)*.06,tk+hh*b)
mus*=np.minimum(np.arange(N)/SR/1.5,1)*np.minimum((T-np.arange(N)/SR)/1.5,1)
mus=hp(mus,40)
# sfx
S={k:load(SFX+f+'.mp3') for k,f in [('whoosh','whoosh-short'),('pop','pop'),('swish','whoosh'),('tick','click-soft'),('ding','chime'),('riser','riser'),('impact','impact-bass-1'),('shimmer','sparkle')]}
G={'whoosh':.35,'pop':.35,'swish':.45,'tick':.6,'ding':.55,'riser':.5,'impact':.8,'shimmer':.5}
sfx=np.zeros(N);last={}
for k,t in E['events']:
    if k=='pop' and t-last.get(k,-9)<0.25: continue
    last[k]=t; put(sfx,S[k],t,G[k])
env=np.convolve(np.abs(voice),np.ones(int(.15*SR))/int(.15*SR),'same');duck=1-.6*np.clip(env*12,0,1)
mix=voice+mus*0.55*duck+sfx*0.8
mix/=max(1,np.abs(mix).max()/0.94)
wavfile.write(f'proj_{K}/assets/{K}_mix.wav',SR,np.stack([mix,mix],1).astype(np.float32))
print('mix',K,T)
