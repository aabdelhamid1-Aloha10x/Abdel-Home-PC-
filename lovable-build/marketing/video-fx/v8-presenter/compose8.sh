set -e
cd /tmp/claude-0/-home-user-Abdel-Home-PC-/d301fd9f-e644-571f-880a-6ab5b6589b47/scratchpad/masar-fx
A=a8
ffmpeg -y -loglevel error -i $A/th.mp4 -filter_complex "
[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.05:saturation=1.04,tpad=stop_mode=clone:stop_duration=4,trim=0:30,setpts=PTS-STARTPTS,split[w][p0];
[p0]crop=iw/1.2:ih/1.2:(iw-iw/1.2)/2:ih*0.06,scale=1080:1920:flags=lanczos[p];
[w][p]overlay=0:0:enable='between(t,2.72,4.2)+between(t,21.5,23.18)',format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 14 -preset fast -t 30 base8.mp4
ffmpeg -y -loglevel error -i base8.mp4 -framerate 30 -i v8/f%04d.png -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 16 -preset medium -t 30 video8.mp4
ffmpeg -y -loglevel error -i $A/th.mp4 -vn -ac 2 -ar 44100 $A/vo_th.wav
ffmpeg -y -loglevel error -i $A/music.mp3 -i $A/vo_th.wav -i $A/whoosh.mp3 -i $A/pop.mp3 -i $A/boom.mp3 -filter_complex "
[1:a]volume=1.5,apad=whole_dur=30[vo];[vo]asplit=2[vo1][vo2];
[2:a]asplit=5[w1][w2][w3][w4][w5];
[w1]adelay=8700|8700[x1];[w2]adelay=12200|12200[x2];[w3]adelay=15300|15300[x3];[w4]adelay=21350|21350[x4];[w5]adelay=25850|25850[x5];
[3:a]asplit=6[p1][p2][p3][p4][p5][p6];
[p1]adelay=9850|9850[y1];[p2]adelay=10510|10510[y2];[p3]adelay=11170|11170[y3];[p4]adelay=15600|15600[y4];[p5]adelay=14800|14800[y5];[p6]adelay=20350|20350[y6];
[4:a]asplit=2[b1][b2];[b1]adelay=19100|19100,volume=0.8[z1];[b2]adelay=26050|26050[z2];
[x1][x2][x3][x4][x5][y1][y2][y3][y4][y5][y6][z1][z2]amix=inputs=13:normalize=0,volume=0.55,apad=whole_dur=30[fx];
[0:a]volume=0.55,apad=whole_dur=30,afade=t=out:st=28.3:d=1.7[m];
[m][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=12:release=300[md];
[md][fx][vo2]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]" -map "[a]" -t 30 mix8.wav
ffmpeg -y -loglevel error -i video8.mp4 -i mix8.wav -c:v copy -c:a aac -b:a 192k -t 30 -movflags +faststart masar-ad-v8-dispatch.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,duration -of csv=p=0 masar-ad-v8-dispatch.mp4
