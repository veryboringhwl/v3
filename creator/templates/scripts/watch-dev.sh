#!/usr/bin/env bash
set -euo pipefail

DIRS=("${@}")
if [ ${#DIRS[@]} -eq 0 ]; then
   DIRS=(modules/*)
fi

for DIR in "${DIRS[@]}"; do
   echo "Watching $DIR"
   creator build -i "$DIR" -o "$DIR" -c classmap.json -w &
done

wait
echo "Done"
