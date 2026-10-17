set -e
A=audio3
ffmpeg -y -loglevel error -framerate 30 -i v3/f%04d.png -i $A/shotA.mp4 -i $A/shotB.mp4 \
 -i $A/music21.mp3 -i $A/l1.mp3 -i $A/l2.mp3 -i $A/l3.mp3 -i $A/l4.mp3 \
 -filter_complex "
[1:v]trim=0:3.6,setpts=PTS-STARTPTS,crop=405:720:400:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p[va];
[2:v]trim=0:3.4,setpts=PTS-STARTPTS,crop=405:720:440:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p[vb];
[va][vb]xfade=transition=fade:duration=0.4:offset=3.2[vab];
[vab]tpad=stop_mode=clone:stop_duration=16,trim=0:21,setpts=PTS-STARTPTS[base];
[0:v]format=rgba[ov];
[base][ov]overlay=format=auto:shortest=1,format=yuv420p[v];
[4:a]adelay=500|500,volume=1.7[a1];[5:a]adelay=3300|3300,volume=1.7[a2];[6:a]adelay=6300|6300,volume=1.7[a3];[7:a]adelay=16000|16000,volume=1.7[a4];
[a1][a2][a3][a4]amix=inputs=4:normalize=0,apad=whole_dur=21[vo];[vo]asplit=2[vo1][vo2];
[3:a]volume=0.6,apad=whole_dur=21,afade=t=out:st=19.8:d=1.2[m];
[m][vo1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];
[md][vo2]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
 -map "[v]" -map "[a]" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 192k -t 21 -movflags +faststart masar-ad-mara-v3.mp4
ffprobe -v error -show_entries stream=codec_name,duration -of csv=p=0 masar-ad-mara-v3.mp4
