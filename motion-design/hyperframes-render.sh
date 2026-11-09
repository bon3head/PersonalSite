#!/usr/bin/env bash
# HyperFrames render wrapper — smooths the two quirks that bite agents.
#
# Quirk 1: /tmp is a 512MB tmpfs on this box. Renders fail with
#   "Low disk space" unless temp is redirected. This script sets TMPDIR
#   to a directory on the large disk automatically.
# Quirk 2: `hyperframes init` is interactive by default. This script only
#   renders (it does not init); init is a separate step with --non-interactive.
#
# Usage:
#   ./hyperframes-render.sh [project-dir]
#   - project-dir defaults to the current directory.
#   - The project must already exist (created with
#     `npx hyperframes init --non-interactive --example blank <name>`)
#     and pass `npm run check`.
#   - Writes the MP4 to <project-dir>/renders/<name>_<timestamp>.mp4
#     and prints the path.
#   - Exits non-zero if the check or the render fails.
#
# Cloud: in a cloud sandbox, set HF_TMPDIR to a writable directory
# (or pass it as the second argument). If the sandbox has no FFmpeg or
# no writable disk, the render fails here and the fallback is the local
# render path (hand the composition to a local agent).

set -euo pipefail

PROJECT_DIR="${1:-.}"
# TMPDIR override: second arg, or HF_TMPDIR env, or a tmp dir next to the project.
if [ -n "${2:-}" ]; then
  TMPDIR_OVERRIDE="$2"
elif [ -n "${HF_TMPDIR:-}" ]; then
  TMPDIR_OVERRIDE="$HF_TMPDIR"
else
  TMPDIR_OVERRIDE="$(cd "$PROJECT_DIR" && pwd)/.hf-tmp"
fi

mkdir -p "$TMPDIR_OVERRIDE"
export TMPDIR="$TMPDIR_OVERRIDE"

cd "$PROJECT_DIR"

# Lint first; a failed check is cheaper than a failed render.
npm run check

# Render. TMPDIR is already set above.
TMPDIR="$TMPDIR_OVERRIDE" npm run render

# Print the newest MP4 so the caller can find it.
ls -t renders/*.mp4 | head -1
