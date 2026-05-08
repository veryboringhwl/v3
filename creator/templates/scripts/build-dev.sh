#!/usr/bin/env bash
set -euo pipefail

DIRS=("${@}")
if [ ${#DIRS[@]} -eq 0 ]; then
   DIRS=(modules/*)
fi

for DIR in "${DIRS[@]}"; do
   echo "Building $DIR"
   creator build -i "$DIR" -o "$DIR" -c classmap.json &
done

wait
echo "Done"
