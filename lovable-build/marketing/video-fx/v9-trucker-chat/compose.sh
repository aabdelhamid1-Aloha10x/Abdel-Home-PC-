#!/bin/bash
# Mix VO phrases + SFX + ducked music, mux with rendered frames.
set -e
cd "$(dirname "$0")"
# VO phrase segments: start-in-file end-in-file  -> place-at
SEG=( "0 2.80 0.30" "3.25 6.02 5.45" "6.33 8.40 10.40" "8.70 9.10 12.55" "9.43 10.42 13.95" "10.68 11.45 15.40" "11.74 12.67 17.45" )
inputs="-i audio/vo.mp3"; fc=""; mix=""
i=0
for s in "${SEG[@]}"; do set -- $s; ms=$(awk "BEGIN{print int($3*1000)}")
  fc+="[0:a]atrim=$1:$2,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=$(awk "BEGIN{print $2-$1-0.05}"):d=0.05,adelay=$ms|$ms[v$i];"; mix+="[v$i]"; i=$((i+1)); done
fc+="${mix}amix=inputs=$i:normalize=0,volume=1.5,aformat=channel_layouts=stereo,apad=whole_dur=21[vo];"
# SFX cues: file time gain
CUES="boom 0.10 0.9|sparkle 0.15 0.6|pop 1.20 0.6|riser 1.75 0.7|whoosh 2.15 0.8|pop 4.35 0.7|whoosh 4.75 0.7|click 6.10 0.9|pop 6.22 0.8|sparkle 6.25 0.4|riser 6.55 0.6|whoosh 6.95 0.8|whoosh 10.30 0.9|thud 10.95 0.8|sparkle 11.20 0.5|thud 12.02 1.0|chime 12.22 0.8|pop 12.65 0.5|whoosh 13.55 0.7|pop 13.95 0.5|pop 14.23 0.5|whoosh 15.20 0.6|pop 15.40 0.6|pop 15.65 0.6|sparkle 15.75 0.4|whoosh 16.85 0.7|boom 17.10 0.9|sparkle 17.15 0.6|pop 19.50 0.6|pop 20.05 0.7"
# typing ticks
for k in $(seq 0 17); do CUES+="|tick $(awk "BEGIN{print 2.97+$k*0.068}") 0.5"; done
n=1; smix=""
IFS='|' read -ra C <<< "$CUES"
for c in "${C[@]}"; do set -- $c; ms=$(awk "BEGIN{print int($2*1000)}")
  inputs+=" -i sfx/$1.wav"; fc+="[$n:a]aformat=channel_layouts=stereo,volume=$3,adelay=$ms|$ms[s$n];"; smix+="[s$n]"; n=$((n+1)); done
fc+="${smix}amix=inputs=$((n-1)):normalize=0,volume=0.55[sfx];"
inputs+=" -i audio/music.mp3"; m=$n
fc+="[$m:a]aformat=channel_layouts=stereo,volume=0.55,afade=t=out:st=19.8:d=1.2[mus];"
fc+="[vo]asplit=2[vo1][vo2];[mus][vo2]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=300[duck];"
fc+="[duck][vo1][sfx]amix=inputs=3:normalize=0,alimiter=limit=0.95,atrim=0:21[out]"
ffmpeg -y -loglevel error $inputs -filter_complex "$fc" -map "[out]" -ar 48000 audio/mix.wav
ffmpeg -y -loglevel error -framerate 30 -i frames/%04d.jpg -i audio/mix.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -c:a aac -b:a 192k -shortest -movflags +faststart ../masar-trucker-chat-promo.mp4
echo done
