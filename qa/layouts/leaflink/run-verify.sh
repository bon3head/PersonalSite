#!/bin/bash
# Compile the LeafLink generator with the repo tsc and run verify.cjs.
# Usage: run from the repo root: bash qa/layouts/leaflink/run-verify.sh
set -e
cd "$(dirname "$0")/../../.."
OUTDIR="$(mktemp -d /tmp/ll-verify.XXXXXX)"
npx tsc src/world/layouts/leaflink.ts \
  --outDir "$OUTDIR" \
  --module commonjs \
  --target es2022 \
  --moduleResolution node \
  --skipLibCheck \
  --rootDir src
node qa/layouts/leaflink/verify.cjs "$OUTDIR/world/layouts/leaflink.js" 2>&1 | tee qa/layouts/leaflink/verify-output.txt
rm -rf "$OUTDIR"
