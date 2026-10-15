#!/bin/bash
# Full matrix. Needs: (cd /workspace/witness-game && python3 -m http.server 8765 --bind 127.0.0.1) running; node tools/build.mjs done.
set -e
cd "$(dirname "$0")/.." || exit 1
U=http://127.0.0.1:8765
for sz in "960 540" "662 418"; do for sc in light dark; do
  node test/run.mjs $U/index.html $sz $sc shots/final/${sz// /x}-$sc test/steps-final.json; done; done
node test/run.mjs $U/index.html 960 540 dark shots/clickflow test/steps-clickflow.json
node test/run.mjs $U/index.html 662 418 light shots/clickflow-662 test/steps-clickflow.json
node test/run.mjs $U/dist/witness-game.html 960 540 light shots/bundle/gz-960x540-light test/steps-final.json
node test/run.mjs $U/dist/witness-game.html 662 418 light shots/bundle/gz-662x418-light test/steps-final.json
node test/run.mjs $U/dist/witness-game-inline.html 662 418 dark shots/bundle/inline-662x418-dark test/steps-final.json
node test/run.mjs $U/test/csp-gz.html 960 540 dark shots/bundle/csp test/steps-final.json
