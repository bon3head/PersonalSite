// POST /api/sign: file one guestbook mark (DESIGN 6.14 Shared marks).
// A Vercel Function, Web signature (guestbook/shared/DOCS-INGEST.md 1).
//
// Order: method, origin, content type, size, parse, bot friction
// (honeypot, fill time: silent success), filter, config, daily caps,
// file the issue. The issue starts the redeploy Action; the build pulls
// open labeled issues into public/guestbook.json.
//
// Never logs the token, the IP or the text: only a status and a reason.
import { createHash } from 'node:crypto';
import { G } from './_guestbook.generated.js';
import { checkMark } from './_filter.js';
import { encodeMeta, gh, listMarkIssues, repoConfig } from './_github.js';

/** @param {number} status @param {Record<string, unknown>} body */
function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function log(status, reason) {
  console.log(`guestbook sign ${status} ${reason}`);
}

/** @param {Request} request */
export function originAllowed(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let o;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  const host = request.headers.get('host') || new URL(request.url).host;
  if (o.host === host && (o.protocol === 'https:' || o.hostname === 'localhost')) return true;
  const extra = (process.env.GUESTBOOK_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return extra.includes(o.origin);
}

/** Vercel overwrites these headers (DOCS-INGEST 2). */
function clientIp(request) {
  const h = request.headers;
  const v = h.get('x-vercel-forwarded-for') || h.get('x-real-ip') || h.get('x-forwarded-for') || '';
  return v.split(',')[0].trim();
}

/** Salted, per UTC day, never reversible without the salt. */
export function visitorHash(salt, day, ip) {
  return createHash('sha256').update(`${salt}|${day}|${ip}`).digest('hex').slice(0, 16);
}

/** @param {string} name @param {string} line */
function issueBody(meta, name, line) {
  // The human part is an indented code block: nothing in it renders as
  // a mention, link or markup in the issue or the email.
  const human = [`    name: ${name}`, ...(line ? [`    line: ${line}`] : [])].join('\n');
  return `${encodeMeta(meta)}\n\n${human}\n\nClose this issue to take the mark off the site.\n`;
}

/** @param {Request} request */
export async function handle(request) {
  if (request.method !== 'POST') {
    log(405, 'method');
    return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  }
  if (!originAllowed(request)) {
    log(403, 'origin');
    return reply(403, { ok: false, reason: 'origin' });
  }
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    log(415, 'type');
    return reply(415, { ok: false, reason: 'type' });
  }
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > G.bodyMaxBytes) {
    log(413, 'size');
    return reply(413, { ok: false, reason: 'size' });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > G.bodyMaxBytes) {
    log(413, 'size');
    return reply(413, { ok: false, reason: 'size' });
  }
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    log(400, 'json');
    return reply(400, { ok: false, reason: 'json' });
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    log(400, 'json');
    return reply(400, { ok: false, reason: 'json' });
  }

  // Bot friction: answer as if filed, file nothing.
  const fillMs = Number(input.fillMs);
  if ((typeof input.hp === 'string' && input.hp !== '') || !Number.isFinite(fillMs) || fillMs < G.minFillMs) {
    log(202, 'trap');
    return reply(202, { ok: true, where: 'shared' });
  }

  const checked = checkMark(input);
  if (!checked.ok) {
    log(422, checked.reason);
    return reply(422, { ok: false, reason: checked.reason });
  }

  const cfg = repoConfig();
  const salt = process.env.GUESTBOOK_SALT || '';
  if (!cfg.token || !salt) {
    log(503, 'config');
    return reply(503, { ok: false, reason: 'offline' });
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const dayStart = `${day}T00:00:00Z`;
  const ip = clientIp(request);
  const vh = visitorHash(salt, day, ip || 'unknown');

  try {
    const today = (
      await listMarkIssues(cfg, { state: 'all', since: dayStart, max: G.globalPerDay * 4 })
    ).filter((it) => typeof it.created_at === 'string' && it.created_at >= dayStart);
    const mine = today.filter((it) => typeof it.body === 'string' && it.body.includes(`"v":"${vh}"`)).length;
    if (today.length >= G.globalPerDay || mine >= G.perVisitorPerDay) {
      log(429, today.length >= G.globalPerDay ? 'global' : 'visitor');
      return reply(429, { ok: false, reason: 'limit' });
    }

    const { mark } = checked;
    const meta = { name: mark.name, line: mark.line, seed: mark.seed, at: now.toISOString(), v: vh };
    const res = await gh(cfg.token, `/repos/${cfg.owner}/${cfg.name}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title: `mark: ${mark.name}`, body: issueBody(meta, mark.name, mark.line), labels: [G.label] }),
    });
    if (!res.ok) {
      log(502, `github ${res.status}`);
      return reply(502, { ok: false, reason: 'offline' });
    }
    log(201, 'filed');
    return reply(201, { ok: true, where: 'shared' });
  } catch (err) {
    log(502, err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'github');
    return reply(502, { ok: false, reason: 'offline' });
  }
}

export default {
  fetch: handle,
};
