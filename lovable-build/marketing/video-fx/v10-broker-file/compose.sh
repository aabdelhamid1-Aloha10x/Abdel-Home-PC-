#!/bin/bash
# Masar Trucker Chat "Brokers have a file on you" reel: VO (offset 0.25 s) + timed SFX + music ducked under VO.
# VO: audio/voA.mp3 (ElevenLabs v4 via Higgsfield). Music: audio/music.mp3 (ElevenLabs Music v2.5, instrumental).
set -e
cd "$(dirname "$0")"
DUR=22
inputs="-i audio/voA.mp3"
fc="[0:a]aformat=channel_layouts=stereo,adelay=250|250,volume=1.6,apad=whole_dur=$DUR[vo];"
CUES="boom 0.22 0.9|thud 0.64 1.0|thud 1.09 1.0|boom 1.54 0.8|whoosh 2.10 0.7|pop 2.30 0.5|click 2.40 0.4|click 2.49 0.4|click 2.58 0.4|thud 3.55 0.9|pop 3.60 0.6|pop 3.85 0.6|pop 4.25 0.6|whoosh 4.78 0.8|pop 5.20 0.6|thud 5.62 0.9|riser 5.70 0.9|boom 6.45 1.0|whoosh 6.50 0.8|sparkle 6.55 0.6|pop 7.85 0.7|pop 8.85 0.7|pop 9.65 0.7|whoosh 10.90 0.5|whoosh 11.05 0.6|chime 12.75 0.8|whoosh 13.85 0.8|pop 14.04 0.7|thud 14.30 0.9|whoosh 14.60 0.5|click 15.27 1.0|sparkle 15.33 0.5|whoosh 15.62 0.8|sparkle 15.80 0.6|boom 16.55 0.7|thud 17.55 1.0|sparkle 17.60 0.5|whoosh 18.85 0.8|pop 19.08 0.7|thud 19.40 0.9|click 20.30 0.8|chime 20.60 0.8|pop 20.85 0.7"
for k in 0 1 2 3 4 5; do CUES+="|tick $(awk "BEGIN{print 11.25+$k*0.21}") 0.6"; done
for k in 0 1 2 3; do CUES+="|tick $(awk "BEGIN{print 19.62+$k*0.11}") 0.7"; done
n=1; smix=""
IFS='|' read -ra C <<< "$CUES"
for c in "${C[@]}"; do set -- $c; ms=$(awk "BEGIN{print int($2*1000)}")
  inputs+=" -i sfx/$1.wav"; fc+="[$n:a]aformat=channel_layouts=stereo,volume=$3,adelay=$ms|$ms[s$n];"; smix+="[s$n]"; n=$((n+1)); done
fc+="${smix}amix=inputs=$((n-1)):normalize=0,volume=0.5[sfx];"
inputs+=" -i audio/music.mp3"; m=$n
fc+="[$m:a]aformat=channel_layouts=stereo,volume=0.7,afade=t=out:st=21.2:d=0.8[mus];"
fc+="[vo]asplit=2[vo1][vo2];[mus][vo2]sidechaincompress=threshold=0.05:ratio=5:attack=15:release=250[duck];"
fc+="[duck][vo1][sfx]amix=inputs=3:normalize=0,alimiter=limit=0.95,atrim=0:$DUR[out]"
ffmpeg -y -loglevel error $inputs -filter_complex "$fc" -map "[out]" -ar 48000 audio/mix.wav
ffmpeg -y -loglevel error -i audio/mix.wav -af loudnorm=I=-14:TP=-1.0:LRA=9 -ar 48000 audio/mix14.wav
ffmpeg -y -loglevel error -framerate 30 -i frames/%04d.jpg -i audio/mix14.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -c:a aac -b:a 192k -shortest -movflags +faststart ../masar-broker-file-reel.mp4
echo done
