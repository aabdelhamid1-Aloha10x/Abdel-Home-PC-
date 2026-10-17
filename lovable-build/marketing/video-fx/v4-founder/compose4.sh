set -e
A3=audio3; A4=audio4
ffmpeg -y -loglevel error -i $A3/shotA.mp4 -i $A3/shotB.mp4 -filter_complex "
[0:v]trim=0:3.5,setpts=PTS-STARTPTS,crop=405:720:400:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p[va];
[1:v]trim=0:3.0,setpts=PTS-STARTPTS,crop=405:720:440:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p[vb];
[va][vb]xfade=transition=fade:duration=0.4:offset=3.1,tpad=start_mode=add:start_duration=2.9:color=black,tpad=stop_mode=add:stop_duration=20:color=black,trim=0:24,setpts=PTS-STARTPTS[b]" -map "[b]" -c:v libx264 -crf 14 -preset fast -t 24 base4.mp4
ffmpeg -y -loglevel error -i base4.mp4 -framerate 30 -i v4/f%04d.png -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 18 -preset medium -t 24 video4.mp4
ffmpeg -y -loglevel error -i $A4/music24.mp3 -i $A4/v1.mp3 -i $A4/v2.mp3 -i $A4/v3.mp3 -i $A4/v4.mp3 -filter_complex "
[1:a]adelay=400|400,volume=1.8[a1];[2:a]adelay=3100|3100,volume=1.8[a2];[3:a]adelay=9200|9200,volume=1.8[a3];[4:a]adelay=18200|18200,volume=1.8[a4];
[a1][a2][a3][a4]amix=inputs=4:normalize=0,apad=whole_dur=24[vo];[vo]asplit=2[vo1][vo2];
[0:a]volume=0.75,apad=whole_dur=24,afade=t=out:st=22.6:d=1.4[m];
[m][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[md];
[md][vo2]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" -map "[a]" -t 24 mix4.wav
ffmpeg -y -loglevel error -i video4.mp4 -i mix4.wav -c:v copy -c:a aac -b:a 192k -t 24 -movflags +faststart masar-ad-v4.mp4
ffprobe -v error -show_entries stream=codec_name,duration -of csv=p=0 masar-ad-v4.mp4
