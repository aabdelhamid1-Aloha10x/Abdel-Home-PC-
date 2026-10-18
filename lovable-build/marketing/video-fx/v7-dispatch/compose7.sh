set -e
cd /tmp/claude-0/-home-user-Abdel-Home-PC-/d301fd9f-e644-571f-880a-6ab5b6589b47/scratchpad/masar-fx
A=a7
G="eq=contrast=1.04:saturation=1.03"
ffmpeg -y -loglevel error -i $A/s1.mp4 -i $A/s2.mp4 -i $A/truck.mp4 -i $A/truck.mp4 -i $A/s3.mp4 -i $A/fleet.mp4 -filter_complex "
[0:v]trim=0:3.6,setpts=PTS-STARTPTS,fps=30,${G},settb=1/30,format=yuv420p[a];
[1:v]trim=0:5.9,setpts=PTS-STARTPTS,fps=30,${G},settb=1/30,format=yuv420p[b];
[2:v]setpts=1.15*PTS,trim=0:6.9,setpts=PTS-STARTPTS,fps=30,gblur=sigma=18,eq=brightness=-0.22:saturation=0.9,settb=1/30,format=yuv420p[c];
[3:v]trim=0.2:6.0,setpts=PTS-STARTPTS,reverse,fps=30,gblur=sigma=18,eq=brightness=-0.22:saturation=0.9,settb=1/30,format=yuv420p[d];
[4:v]trim=0:5.3,setpts=PTS-STARTPTS,fps=30,${G},settb=1/30,format=yuv420p[e];
[5:v]trim=0.5:5.5,setpts=PTS-STARTPTS,crop=1080:1580:0:170,scale=1312:1920:flags=lanczos,crop=1080:1920,fps=30,eq=brightness=-0.12,settb=1/30,format=yuv420p[f];
[a][b]xfade=transition=fade:duration=0.3:offset=3.3[ab];
[ab][c]xfade=transition=fade:duration=0.3:offset=8.9[abc];
[abc][d]xfade=transition=fade:duration=0.3:offset=15.5[abcd];
[abcd][e]xfade=transition=fade:duration=0.3:offset=21.0[abcde];
[abcde][f]xfade=transition=fade:duration=0.3:offset=26.0,trim=0:31,setpts=PTS-STARTPTS[v]" -map "[v]" -c:v libx264 -crf 14 -preset fast -t 31 base7.mp4
ffmpeg -y -loglevel error -i base7.mp4 -framerate 30 -i v7/f%04d.png -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 17 -preset medium -t 31 video7.mp4
ffmpeg -y -loglevel error -i $A/music.mp3 -i $A/v1.mp3 -i $A/v2.mp3 -i $A/v3.mp3 -i $A/v4.mp3 -i $A/v5.mp3 -i $A/v6.mp3 -filter_complex "
[1:a]adelay=300|300,volume=1.6[a1];[2:a]adelay=3300|3300,volume=1.6[a2];[3:a]adelay=8900|8900,volume=1.6[a3];[4:a]adelay=15500|15500,volume=1.6[a4];[5:a]adelay=21000|21000,volume=1.6[a5];[6:a]adelay=26000|26000,volume=1.6[a6];
[a1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0,apad=whole_dur=31[vo];[vo]asplit=2[vo1][vo2];
[0:a]volume=0.6,apad=whole_dur=31,afade=t=out:st=29.3:d=1.7[m];
[m][vo1]sidechaincompress=threshold=0.03:ratio=7:attack=12:release=350[md];
[md][vo2]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" -map "[a]" -t 31 mix7.wav
ffmpeg -y -loglevel error -i video7.mp4 -i mix7.wav -c:v copy -c:a aac -b:a 192k -t 31 -movflags +faststart masar-ad-v7-dispatch.mp4
ffprobe -v error -show_entries stream=codec_name,duration -of csv=p=0 masar-ad-v7-dispatch.mp4
