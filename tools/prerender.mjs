#!/usr/bin/env node
// S03 section 7: prerender. After `vite build`, fill the per-route
// readout into dist/index.html's #root, set <title>, <meta
// name=description>, <html data-regime> and style="color-scheme", and
// write dist/index.html (server), dist/leaflink/index.html,
// dist/sidequests/index.html, dist/404.html.
//
// Wave 1 note: the React app is still the B0 minimal App (server H1
// only); B4 owns the full chrome and the route-aware readout. This tool
// therefore injects the S04-structured placeholder readout per route.
// When B4 lands, the injected readout must match the client render
// exactly so hydrateRoot (not createRoot) produces zero mismatches;
// the structure below already mirrors S04 section 3 so that swap is
// mechanical.
//
// Usage: node tools/prerender.mjs [distDir] (default: dist).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, process.argv[2] ?? 'dist');

// Route table: S03 section 2. Titles and H1s come from S09 via the
// generated copy module, read here as JSON-free constants because this
// tool runs on the built output, not the TS source. The strings below
// are verified against src/copy.ts by the prerender test; if copy
// changes, the test fails and this file is updated with it.
const ROUTES = [
  {
    out: 'index.html',
    regime: 'void',
    colorScheme: 'dark',
    title: 'Justin Poli',
    h1: 'Justin Poli',
    readoutClass: 'server',
    h1Id: 'h-server',
  },
  {
    out: join('leaflink', 'index.html'),
    regime: 'paper',
    colorScheme: 'light',
    title: 'LeafLink, Justin Poli',
    h1: 'LeafLink',
    readoutClass: 'leaflink',
    h1Id: 'h-leaflink',
  },
  {
    out: join('sidequests', 'index.html'),
    regime: 'field',
    colorScheme: 'dark',
    title: 'SideQuests, Justin Poli',
    h1: 'SideQuests',
    readoutClass: 'sidequests',
    h1Id: 'h-sidequests',
  },
  {
    out: '404.html',
    regime: 'void',
    colorScheme: 'dark',
    title: 'Not found, Justin Poli',
    h1: 'Nothing at this address.',
    readoutClass: 'notfound',
    h1Id: 'h-notfound',
  },
];

const META_DESC =
  'Justin Poli. Computer science senior at SUNY New Paltz, graduating December 2027. Runs his own LLM inference server at home.';

// Ground colors per regime, from T.color (DESIGN section 3.2). Kept in
// sync with src/tokens.generated.ts by the prerender test.
const REGIME_GROUND = {
  void: '#0A0C0F',
  paper: '#F3F0EA',
  field: '#10294E',
};

function readoutHtml(route) {
  return (
    `<main id="scene" aria-busy="false">` +
    `<section class="jp-readout jp-readout--${route.readoutClass}" aria-labelledby="${route.h1Id}">` +
    `<h1 id="${route.h1Id}" tabindex="-1">${route.h1}</h1>` +
    `</section></main>` +
    `<div class="jp-live" aria-live="polite" aria-atomic="true"></div>`
  );
}

function render(base, route) {
  let html = base;
  // <html data-regime> and style="color-scheme".
  html = html.replace(
    /<html([^>]*)>/,
    (_m, attrs) => {
      let next = attrs.replace(/data-regime="[^"]*"/, '');
      next = next.replace(/style="[^"]*"/, '');
      return `<html${next} data-regime="${route.regime}" style="color-scheme: ${route.colorScheme}">`;
    },
  );
  // <title>.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
  // <meta name=description> (same on all routes, S09 C-META-DESC).
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${META_DESC}" />`,
  );
  // <meta name=theme-color> (regime ground).
  html = html.replace(
    /<meta name="theme-color" content="[^"]*" \/>/,
    `<meta name="theme-color" content="${REGIME_GROUND[route.regime]}" />`,
  );
  // #root content.
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    `<div id="root">${readoutHtml(route)}</div>`,
  );
  return html;
}

const base = readFileSync(join(distDir, 'index.html'), 'utf8');
for (const route of ROUTES) {
  const outPath = join(distDir, route.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, render(base, route));
  console.log(`prerender: wrote ${route.out}`);
}
