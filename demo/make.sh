#!/bin/sh
# Rebuilds demo/deja.gif from a synthetic home, so no real session shows up in it.
# Needs agg (asciinema gif generator) and python3.
set -e

root=$(cd "$(dirname "$0")/.." && pwd)
home="$root/.demo-home"

node "$root/scripts/seed-demo.mjs" > /dev/null
HOME="$home" PATH="$home/bin:$PATH" "$home/bin/deja" --reindex > /dev/null

python3 "$root/demo/record.py" "$home" "$root/demo/deja.cast"

agg \
  --font-size 20 \
  --theme 1e1e2e,cdd6f4,45475a,f38ba8,a6e3a1,f9e2af,89b4fa,f5c2e7,94e2d5,bac2de,585b70,f38ba8,a6e3a1,f9e2af,89b4fa,f5c2e7,94e2d5,a6adc8 \
  --idle-time-limit 2 \
  "$root/demo/deja.cast" "$root/demo/deja.gif"

rm -f "$root/demo/deja.cast"
rm -rf "$home"

echo "demo/deja.gif"
