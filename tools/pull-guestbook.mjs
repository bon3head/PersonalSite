#!/usr/bin/env node
// Build step (DESIGN 6.14 Shared marks): open guestbook issues filed by
// the owner's account -> public/guestbook.json. Every mark goes through
// the same filter as the function (api/_filter.js) before it ships.
//
// Runs only when GUESTBOOK_TOKEN is set (Vercel production). Anywhere
// else, and on any GitHub failure, it leaves public/guestbook.json as it
// is (the committed file is empty), so a build never fails on GitHub.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { G } from '../api/_guestbook.generated.js';
import { checkMark } from '../api/_filter.js';
import { decodeMeta, listMarkIssues, repoConfig } from '../api/_github.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', G.file.replace(/^\//, ''));

/** Pure: issues -> the published file. Exported for tests. */
export function marksFromIssues(issues) {
  const marks = [];
  const seen = new Set();
  for (const it of issues) {
    const meta = decodeMeta(it.body);
    if (!meta) continue;
    const c = checkMark({ ...meta, at: it.created_at });
    if (!c.ok || seen.has(c.mark.seed)) continue;
    seen.add(c.mark.seed);
    marks.push(c.mark);
  }
  marks.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const kept = marks.slice(0, G.listMax);
  return { v: 1, count: kept.length, marks: kept };
}

async function main() {
  const cfg = repoConfig();
  if (!cfg.token) {
    console.log('pull-guestbook: no GUESTBOOK_TOKEN, keeping public/guestbook.json');
    return;
  }
  try {
    const issues = await listMarkIssues(cfg, { state: 'open', max: G.listMax });
    const file = marksFromIssues(issues);
    writeFileSync(out, `${JSON.stringify(file)}\n`);
    console.log(`pull-guestbook: wrote ${file.count} marks`);
  } catch (err) {
    console.warn(`pull-guestbook: WARNING ${err instanceof Error ? err.message : 'failed'}, keeping public/guestbook.json`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
