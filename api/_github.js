// GitHub REST helpers for the guestbook (DESIGN 6.14 Shared marks).
// Used by api/sign.js (file and count) and tools/pull-guestbook.mjs
// (read). The token comes from GUESTBOOK_TOKEN and is only ever sent
// to api.github.com in the Authorization header; it is never logged.
import { G } from './_guestbook.generated.js';

const API = 'https://api.github.com';
const MARKER = 'guestbook:v1';

export function repoConfig() {
  const repo = process.env.GUESTBOOK_REPO || 'bon3head/PersonalSite';
  const [owner, name] = repo.split('/');
  return { owner, name, author: process.env.GUESTBOOK_AUTHOR || owner, token: process.env.GUESTBOOK_TOKEN || '' };
}

/** @param {string} token @param {string} path @param {RequestInit} [init] */
export async function gh(token, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'guestbook',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: init.signal ?? AbortSignal.timeout(G.timeoutMs),
  });
  return res;
}

/** The machine line: JSON inside an HTML comment, with < and > escaped so "-->" can never appear. */
export function encodeMeta(meta) {
  const json = JSON.stringify(meta).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return `<!-- ${MARKER} ${json} -->`;
}

/** @param {string | null | undefined} body */
export function decodeMeta(body) {
  if (!body) return null;
  const m = body.match(/<!-- guestbook:v1 (\{.*?\}) -->/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Issues with the guestbook label filed by the owner's account. PRs skipped.
 * @param {{ state: 'open' | 'all', since?: string, max: number, signal?: AbortSignal }} opts
 */
export async function listMarkIssues(cfg, opts) {
  const out = [];
  for (let page = 1; out.length < opts.max; page++) {
    const q = new URLSearchParams({
      labels: G.label,
      creator: cfg.author,
      state: opts.state,
      sort: 'created',
      direction: 'desc',
      per_page: '100',
      page: String(page),
    });
    if (opts.since) q.set('since', opts.since);
    const res = await gh(cfg.token, `/repos/${cfg.owner}/${cfg.name}/issues?${q}`, { signal: opts.signal });
    if (!res.ok) throw new Error(`github list ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error('github list shape');
    for (const it of batch) {
      if (it.pull_request) continue;
      if (it.user?.login?.toLowerCase() !== cfg.author.toLowerCase()) continue;
      out.push(it);
    }
    if (batch.length < 100) break;
  }
  return out.slice(0, opts.max);
}
