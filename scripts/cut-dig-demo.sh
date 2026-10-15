#!/bin/bash
# Cuts the dig demo clips from the raw phone recording (Oct 14 2026).
# Usage: bash scripts/cut-dig-demo.sh <recording.mp4> <full|tight|short> [out.mp4] [crf]
#   full   30s, whole phone screen minus OS bars       -> public/DigDemo.mp4 (480x960)
#   tight  30s, cropped to dig header + play area      -> public/DigDemoTight.mp4 (540x740)
#   short  ~17s attention loop, tight crop             -> public/DigDemoShort.mp4 (540x740)
# Segment fields: start end speed [crop-y]  (source seconds). crop-y moves the tight
# window for screens laid out lower than the dig (KNOCKOUT, ESCAPED!, habit timer).
IN="$1"; MODE="${2:-short}"; CRF="${4:-28}"

case "$MODE" in
  full)
    OUT="${3:-public/DigDemo.mp4}"; CROP_W=1064; CROP_H=2128; CROP_X=8; SIZE=480:960
    SEGS=(
      "46.5 49.7 2.5 88"    # habit: tap LOG
      "49.7 51.8 1.4 88"    # HABIT COMBO burst
      "61.0 84.0 4 88"      # dig open: supports/ladders found
      "84.0 85.6 1 88"      # ZE BOSS SWARM SPOTTED prompt
      "120.0 128.0 4 88"    # battle replay (spinner + loadout cut)
      "128.0 129.6 1.4 88"  # KNOCKOUT
      "131.5 134.0 1.5 88"  # SWARM CLEARED
      "134.0 140.5 3 88"    # dig: ladder found, pay dirt
      "336.0 357.0 4 88"    # boulders smash ladders, pay dirt
      "448.0 465.4 3.5 88"  # climb to exit
      "465.5 467.5 1 88"    # ESCAPED!
    ) ;;
  tight)
    OUT="${3:-public/DigDemoTight.mp4}"; CROP_W=1064; CROP_H=1458; CROP_X=8; SIZE=540:740
    SEGS=(
      "46.5 49.7 2.5 600"   # habit: tap LOG
      "49.7 51.8 1.4 92"    # HABIT COMBO burst
      "61.0 84.0 4 92"      # dig open: supports/ladders found
      "84.0 85.6 1 92"      # ZE BOSS SWARM SPOTTED prompt
      "120.0 128.0 4 92"    # battle replay
      "128.0 129.6 1.4 230" # KNOCKOUT
      "131.5 134.0 1.5 92"  # SWARM CLEARED
      "134.0 140.5 3 92"    # dig: ladder found, pay dirt
      "336.0 357.0 4 92"    # boulders smash ladders, pay dirt
      "448.0 465.4 3.5 92"  # climb to exit
      "465.5 467.5 1 400"   # ESCAPED!
    ) ;;
  short)
    OUT="${3:-public/DigDemoShort.mp4}"; CROP_W=1064; CROP_H=1458; CROP_X=8; SIZE=540:740
    SEGS=(
      "49.7 51.6 1.5 92"    # open on the HABIT COMBO burst
      "61.0 72.0 4 92"      # dig: support found, ladder found
      "84.1 85.3 1 92"      # ZE BOSS SWARM SPOTTED prompt
      "128.0 129.3 1.3 230" # straight to KNOCKOUT
      "131.5 133.5 1.5 92"  # SWARM CLEARED
      "337.0 357.0 4.5 92"  # boulders smash ladders, pay dirt
      "456.0 465.4 4 92"    # climb to exit
      "465.5 466.9 1 400"   # ESCAPED!
    ) ;;
  *) echo "mode must be full, tight or short" >&2; exit 1 ;;
esac

HOLD=0.8; [ "$MODE" = short ] && HOLD=0.3
args=(); fc=""; cat_in=""
for i in "${!SEGS[@]}"; do
  read a b k y <<<"${SEGS[$i]}"
  args+=(-ss "$a" -to "$b" -i "$IN")
  last=""; [ $i -eq $((${#SEGS[@]}-1)) ] && last=",tpad=stop_mode=clone:stop_duration=$HOLD"
  fc+="[$i:v]crop=$CROP_W:$CROP_H:$CROP_X:$y,scale=$SIZE:flags=lanczos,setpts=(PTS-STARTPTS)/$k,fps=30$last,setsar=1[v$i];"
  cat_in+="[v$i]"
done
fc+="${cat_in}concat=n=${#SEGS[@]}:v=1:a=0,format=yuv420p[out]"
ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[out]" -an \
  -c:v libx264 -preset veryslow -crf "$CRF" -profile:v high -level 4.0 -g 60 -movflags +faststart "$OUT"
