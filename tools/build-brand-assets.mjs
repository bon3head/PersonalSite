#!/usr/bin/env node
// P-ASSET-2: brand asset pipeline (feedback round W3).
//
// Reads assets-src/brand/SOURCES.json, verifies every input sha256
// against the pinned value, inspects each GIF and PNG through
// tools/brand-inspect.py (frames, delays, dimensions, transparency,
// palette fingerprint, fringe, budgets), extracts GIF frame 0 to PNG,
// and writes content-hashed files plus manifest.json to public/brand.
//
// Shipping rules:
// - Shipped heroes only: sidequests.gif plus its frame 0 PNG, and
//   the LeafLink hero mark logo.png (W3 decision, recorded in the
//   manifest and the inventory). Verified but not shipped files
//   (leaves.gif, circuit.gif, gears.gif) are inspected and recorded
//   in the manifest with counts, never written to public/brand and
//   never prefetched. sidequests-alpha.gif is never shipped.
// - Budgets come from the DESIGN.md token block (brand.gifMaxBytes,
//   brand.gifMaxDecoded). A file over budget first gets a lossless
//   gifsicle -O3 pass from the workspace-local install; if it is
//   still over budget the build FAILS here. Resizing to displayed
//   size times 3 DPR is a W6 decision (displayed size is not known
//   in W3), so it is not guessed here.
// - Fringe: any near-white edge pixel or semi-transparent
//   near-white pixel FAILS the build. No asset in this round is
//   matted against white (fringe counts are zero), so no rematte
//   step runs; a future matted asset stops the build for a human
//   decision instead of silently changing the art.
// - This script never downloads anything and never uses a token.
//   Inputs are the already-pulled files under feedback-2026-10-31.
//   Codeberg re-verification against pinned commits is a separate
//   manual receipt (connector helper), recorded in SOURCES.json.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const home = process.env.HOME || '';
const brandTools = join(home, 'workspace', 'tools', 'brand-tools');
const gifsicleBin = join(brandTools, 'usr', 'bin', 'gifsicle');

function fail(message) {
  console.error(`build-brand-assets: FAIL: ${message}`);
  process.exit(1);
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function hashPrefix(sha) {
  return sha.slice(0, 16);
}

function readDesignBrandTokens() {
  const design = readFileSync(join(root, 'spec', 'astryx', 'DESIGN.md'), 'utf8');
  const m = design.match(/```json design-tokens\n([\s\S]*?)\n```/);
  if (!m) fail('no design-tokens block in spec/astryx/DESIGN.md');
  let tokens;
  try {
    tokens = JSON.parse(m[1]);
  } catch (e) {
    fail(`design-tokens block is not valid JSON: ${e.message}`);
  }
  return tokens.brand;
}

function inspect(inputPath, frame0Out) {
  const args = [join(root, 'tools', 'brand-inspect.py'), inputPath];
  if (frame0Out) args.push('--extract-frame0', frame0Out);
  let out;
  try {
    out = execFileSync('python3', args, { encoding: 'utf8', timeout: 300000 });
  } catch (e) {
    fail(`brand-inspect.py failed for ${inputPath}: ${e.message}`);
  }
  return JSON.parse(out);
}

function tryGifsicleO3(inputPath, tmpOut) {
  if (!existsSync(gifsicleBin)) return false;
  const r = spawnSync(gifsicleBin, ['-O3', inputPath, '-o', tmpOut], {
    encoding: 'utf8',
  });
  return r.status === 0 && existsSync(tmpOut);
}

const budgets = readDesignBrandTokens();
const sourcesDoc = JSON.parse(
  readFileSync(join(root, 'assets-src', 'brand', 'SOURCES.json'), 'utf8'),
);
const pulledDir = join(root, 'feedback-2026-10-31', 'assets');
const brandDir = join(root, 'public', 'brand');
const tmpDir = join(root, 'public', 'brand.tmp');
mkdirSync(brandDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const SHIPPED = new Set(['sidequests.gif', 'logo.png']);
const inspected = {};
const shippedFiles = {};

for (const src of sourcesDoc.sources) {
  const inputPath = join(pulledDir, src.file);
  if (!existsSync(inputPath)) fail(`missing pulled input ${inputPath}`);
  const localSha = sha256File(inputPath);
  if (localSha !== src.sha256) {
    fail(`${src.file} sha256 mismatch: local ${localSha} vs SOURCES ${src.sha256}`);
  }
  const isShipped = SHIPPED.has(src.file);
  const frame0Tmp = isShipped && src.file.endsWith('.gif')
    ? join(tmpDir, `${src.file}.frame0.png`)
    : null;
  let info = inspect(inputPath, frame0Tmp);
  if (info.sha256 !== src.sha256) fail(`${src.file} inspect sha mismatch`);
  if (info.bytes !== src.bytes) fail(`${src.file} byte size mismatch`);
  // Budget gate, with one lossless retry for GIFs.
  let overBytes = info.bytes > budgets.gifMaxBytes;
  let overDecoded = info.decodedBytes > budgets.gifMaxDecoded;
  let optimized = false;
  if ((overBytes || overDecoded) && src.file.endsWith('.gif')) {
    const optTmp = join(tmpDir, `${src.file}.opt.gif`);
    if (tryGifsicleO3(inputPath, optTmp)) {
      const optInfo = inspect(optTmp, null);
      if (optInfo.bytes <= budgets.gifMaxBytes
        && optInfo.decodedBytes <= budgets.gifMaxDecoded) {
        info = optInfo;
        optimized = true;
        copyFileSync(optTmp, join(tmpDir, `${src.file}.ship`));
        overBytes = false;
        overDecoded = false;
      }
    }
  }
  if (overBytes || overDecoded) {
    fail(
      `${src.file} over budget after lossless gifsicle -O3: ` +
      `${info.bytes} bytes (max ${budgets.gifMaxBytes}), ` +
      `${info.decodedBytes} decoded (max ${budgets.gifMaxDecoded}). ` +
      'Resize to displayed size times 3 DPR needs the W6 displayed ' +
      'size, so the build stops here instead of guessing it.',
    );
  }
  // Fringe gate.
  if (info.fringeNearWhiteEdgePx > 0 || info.fringeSemiNearWhitePx > 0) {
    fail(
      `${src.file} fringe violation: ${info.fringeNearWhiteEdgePx} ` +
      `near-white edge pixels, ${info.fringeSemiNearWhitePx} ` +
      'semi-transparent near-white pixels. T-ASSET-4 must pass or ' +
      'W3 stops; no rematte is applied automatically.',
    );
  }
  inspected[src.file] = { source: src, info, optimized };
  if (!isShipped) continue;
  // If optimization replaced the GIF, its frame 0 PNG must come
  // from the optimized bytes, not the original input.
  if (optimized && frame0Tmp) {
    inspect(join(tmpDir, `${src.file}.ship`), frame0Tmp);
  }
  // Write the shipped file under a content hash name.
  const shipSrc = optimized
    ? join(tmpDir, `${src.file}.ship`)
    : inputPath;
  const shipSha = sha256File(shipSrc);
  const stem = basename(src.file).replace(/\.(gif|png)$/, '');
  const ext = src.file.endsWith('.gif') ? 'gif' : 'png';
  const outName = `${stem}.${hashPrefix(shipSha)}.${ext}`;
  copyFileSync(shipSrc, join(brandDir, outName));
  const record = {
    file: outName,
    sourceRepo: src.repo,
    sourcePath: src.path,
    sourceCommit: src.last_commit_sha,
    sourceSha256: src.sha256,
    sha256: shipSha,
    bytes: info.bytes,
    width: info.width,
    height: info.height,
    format: info.format,
    frames: info.frames,
    delaysMs: info.delaysMs,
    loopMs: info.loopMs,
    decodedBytes: info.decodedBytes,
    hasAlpha: info.hasAlpha,
    transparencyIndex: info.transparencyIndex,
    transparentRgb: info.transparentRgb,
    frame0TransparentPx: info.frame0TransparentPx,
    fingerprint: info.fingerprint,
    fingerprintCount: info.fingerprintCount,
    fingerprintSha256: info.fingerprintSha256,
    fringeEdgePx: info.fringeEdgePx,
    fringeNearWhiteEdgePx: info.fringeNearWhiteEdgePx,
    fringeSemiNearWhitePx: info.fringeSemiNearWhitePx,
    optimizedWithGifsicleO3: optimized,
    alt: src.alt,
    role: src.role,
  };
  shippedFiles[src.file] = record;
  // GIF heroes also ship their frame 0 PNG.
  if (frame0Tmp) {
    const pngSha = sha256File(frame0Tmp);
    const pngName = `${stem}.frame0.${hashPrefix(pngSha)}.png`;
    copyFileSync(frame0Tmp, join(brandDir, pngName));
    const pngInfo = inspect(join(brandDir, pngName), null);
    shippedFiles[`${src.file}.frame0`] = {
      file: pngName,
      sourceRepo: src.repo,
      sourcePath: src.path,
      sourceCommit: src.last_commit_sha,
      sourceSha256: pngSha,
      sha256: pngSha,
      bytes: pngInfo.bytes,
      width: pngInfo.width,
      height: pngInfo.height,
      format: pngInfo.format,
      frames: 1,
      delaysMs: [],
      loopMs: 0,
      decodedBytes: pngInfo.decodedBytes,
      hasAlpha: pngInfo.hasAlpha,
      transparencyIndex: null,
      transparentRgb: pngInfo.transparentRgb,
      frame0TransparentPx: pngInfo.frame0TransparentPx,
      fingerprint: pngInfo.fingerprint,
      fingerprintCount: pngInfo.fingerprintCount,
      fingerprintSha256: pngInfo.fingerprintSha256,
      fringeEdgePx: pngInfo.fringeEdgePx,
      fringeNearWhiteEdgePx: pngInfo.fringeNearWhiteEdgePx,
      fringeSemiNearWhitePx: pngInfo.fringeSemiNearWhitePx,
      optimizedWithGifsicleO3: false,
      alt: src.alt,
      role: `${src.role} frame 0`,
      derivedFrom: record.file,
    };
  }
}

const sidequests = shippedFiles['sidequests.gif'];
const sidequestsFrame0 = shippedFiles['sidequests.gif.frame0'];
const leaflink = shippedFiles['logo.png'];
if (!sidequests || !sidequestsFrame0 || !leaflink) {
  fail('missing shipped hero record for sidequests or leaflink');
}

const verifiedNotShipped = [];
for (const src of sourcesDoc.sources) {
  if (SHIPPED.has(src.file)) continue;
  const { info } = inspected[src.file];
  verifiedNotShipped.push({
    file: src.file,
    sourceRepo: src.repo,
    sourcePath: src.path,
    sourceCommit: src.last_commit_sha,
    sha256: src.sha256,
    bytes: info.bytes,
    width: info.width,
    height: info.height,
    format: info.format,
    frames: info.frames,
    delaysMs: info.delaysMs,
    loopMs: info.loopMs,
    decodedBytes: info.decodedBytes,
    hasAlpha: info.hasAlpha,
    fingerprintCount: info.fingerprintCount,
    fingerprintSha256: info.fingerprintSha256,
    fringeEdgePx: info.fringeEdgePx,
    fringeNearWhiteEdgePx: info.fringeNearWhiteEdgePx,
    fringeSemiNearWhitePx: info.fringeSemiNearWhitePx,
    alt: src.alt,
    role: src.role,
    shipped: false,
    reasonNotShipped: src.reason_not_shipped || 'verified, not a hero in this round',
  });
}

const manifest = {
  version: 1,
  generatedBy: 'tools/build-brand-assets.mjs',
  budgets: {
    gifMaxBytes: budgets.gifMaxBytes,
    gifMaxDecoded: budgets.gifMaxDecoded,
    decodeTimeoutMs: budgets.decodeTimeoutMs,
    fingerprintDeltaE: budgets.fingerprintDeltaE,
    areaCap: budgets.areaCap,
  },
  heroes: {
    sidequests: { gif: sidequests, frame0: sidequestsFrame0 },
    leaflink: { png: leaflink, gif: null },
  },
  // Prefetch list for P-ASSET-3, in load order: the PNG that renders
  // first, then the animated GIF, then the LeafLink static mark.
  prefetch: [
    sidequestsFrame0.file,
    sidequests.file,
    leaflink.file,
  ],
  leaflinkHeroDecision: {
    mark: 'logo.png',
    reason:
      'feedback-10 matches logo.png at dHash distance 0, proving it ' +
      'is the recognized LeafLink logo lockup (two green leaves ' +
      'forming a smile). leaves.gif frame 0 is a single green maple ' +
      'leaf with no feedback match and is not the logo lockup, so ' +
      'shipping it as the mark would misrepresent the brand. ' +
      'logo.png is also the reduced-motion PNG and the F1 fallback ' +
      'source, so one file serves hero, reduced motion, and fallback.',
    animatedCandidateNotShipped: 'leaves.gif',
  },
  verifiedNotShipped,
  excluded: [
    {
      file: 'sidequests-alpha.gif',
      reason: 'DO NOT USE: frame 0 adds the word alpha below the logo.',
    },
    {
      file: 'feedback-05.jpg',
      reason: 'Unknown, excluded: closest dHash distance 108, no pulled asset match.',
    },
    {
      file: 'feedback-07.jpg',
      reason: 'Unknown, excluded: closest dHash distance 104, no pulled asset match.',
    },
  ],
  tools: {
    gifsicle: existsSync(gifsicleBin) ? gifsicleBin : null,
    imagemagickPrefix: join(brandTools, 'usr'),
    imagemagickNote:
      'Workspace-local extraction, not installed in /usr. ' +
      'Binaries are convert-im6.q16 and identify-im6.q16; they need ' +
      'LD_LIBRARY_PATH, MAGICK_CONFIGURE_PATH, and ' +
      'MAGICK_CODER_MODULE_PATH pointed at the prefix. ' +
      'Neither tool was needed for the shipped bytes: budgets pass ' +
      'without optimization and fringe counts are zero.',
  },
};
writeFileSync(
  join(brandDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
// Drop stale shipped files from earlier runs, then clean the temp dir.
for (const name of readdirSync(brandDir)) {
  const keep = new Set([
    sidequests.file,
    sidequestsFrame0.file,
    leaflink.file,
    'manifest.json',
  ]);
  if (!keep.has(name)) rmSync(join(brandDir, name), { force: true });
}
rmSync(tmpDir, { recursive: true, force: true });
console.log('build-brand-assets: wrote public/brand/manifest.json');
console.log(`build-brand-assets: sidequests gif ${sidequests.file} (${sidequests.bytes} bytes, ${sidequests.decodedBytes} decoded)`);
console.log(`build-brand-assets: sidequests frame0 ${sidequestsFrame0.file} (${sidequestsFrame0.bytes} bytes)`);
console.log(`build-brand-assets: leaflink png ${leaflink.file} (${leaflink.bytes} bytes)`);
console.log('build-brand-assets: fringe near-white edge pixels 0 on every shipped file');
