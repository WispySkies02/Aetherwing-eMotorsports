#!/usr/bin/env bash
set -euo pipefail
OUTDIR="/mnt/data/aetherwing-v041-work/public/images/social"
BG="$OUTDIR/default-social-base.png"
SRC_BG="/mnt/data/aetherwing-v040-work/public/images/social/default-social.png"
cp "$SRC_BG" "$BG"
make_one(){
  local title="$1" out="$2" point="${3:-78}"
  /opt/imagemagick/bin/magick "$BG" \
    \( -size 760x150 xc:'rgba(235,231,220,0.98)' -fill '#EBE7DC' -draw "polygon 8,12 752,0 760,138 0,150 0,20" -background none -rotate -1.8 \) -geometry +226+372 -composite \
    \( -size 110x30 xc:'rgba(248,241,219,0.96)' -fill 'rgba(248,241,219,0.96)' -stroke 'rgba(128,111,74,0.45)' -strokewidth 1 -draw "rectangle 0,0 109,29" -background none -rotate -17 \) -geometry +170+354 -composite \
    \( -size 110x30 xc:'rgba(248,241,219,0.96)' -fill 'rgba(248,241,219,0.96)' -stroke 'rgba(128,111,74,0.45)' -strokewidth 1 -draw "rectangle 0,0 109,29" -background none -rotate 16 \) -geometry +915+356 -composite \
    -font 'PT-Sans-Narrow-Bold' -fill '#0d0d0d' -pointsize "$point" -gravity center -annotate +0+120 "$title" \
    -font 'PT-Sans-Narrow-Bold' -fill '#3b3328' -pointsize 24 -gravity center -annotate +0+183 'AETHERWING eMOTORSPORTS' \
    "$OUTDIR/$out"
}
make_one 'AETHERWING' 'default-social.png' 74
make_one 'HOME' 'home-social.png' 92
make_one 'DRIVERS' 'drivers-social.png' 92
make_one 'SCHEDULE' 'schedule-social.png' 86
make_one 'PAINT BOOTH' 'paint-booth-social.png' 72
make_one 'PARTNERS' 'partners-social.png' 86
make_one 'NEWS' 'news-social.png' 100
make_one 'WINS & HISTORY' 'wins-history-social.png' 60
make_one 'MISSION & VALUES' 'mission-values-social.png' 58
make_one 'TEAM HANDBOOK' 'team-handbook-social.png' 62
make_one 'CONTACT HQ' 'contact-social.png' 76
rm -f "$BG"
