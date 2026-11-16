// Guestbook mark filter (DESIGN 6.14 Shared marks, Filter). Runs in the
// function before a mark is filed and again in the build before a mark
// is published, so a hand-edited issue gets the same test.
//
// cleanText normalizes; checkMark returns { ok: true, mark } or
// { ok: false, reason } with reason 'empty' or 'held'. Plain text only.
import { G } from './_guestbook.generated.js';
import { BLOCK, PROFANITY, STEMS } from './_words.js';

// Control characters (Cc: tabs, newlines) become spaces. Format (Cf:
// zero-width, bidi marks), lone surrogates (Cs), private use (Co) and
// unassigned (Cn) characters are removed, so "b<ZWSP>itcoin" reads whole.
const CONTROL = /\p{Cc}/gu;
const INVISIBLE = /[\p{Cf}\p{Cs}\p{Co}\p{Cn}]/gu;

/** @param {unknown} text @param {number} max */
export function cleanText(text, max) {
  if (typeof text !== 'string') return '';
  const s = text.normalize('NFC').replace(CONTROL, ' ').replace(INVISIBLE, '').replace(/\s+/gu, ' ').trim();
  return Array.from(s).slice(0, max).join('').trim();
}

const TLDS =
  'com|net|org|io|co|me|ly|gg|xyz|app|dev|ru|cn|info|biz|link|site|online|top|shop|store|live|pro|tk|ml|ga|cf|us|uk|de|fr|tv|cc|ai|so|to|sh|is|eu|in|club|vip|win|bid';
const LINKISH = [
  /[a-z][a-z0-9+.-]*:\/\//i, // any scheme
  /\b(?:https?|ftp|mailto|javascript|data|tel)\s*:/i,
  /\bwww\s*\./i,
  // A dotted domain ("site.com"; no space after the dot, so "Hi. Is" passes)
  new RegExp(`[a-z0-9-]\\.(?:${TLDS})\\b`, 'i'),
  // Spelled out ("site dot com", "site(dot)com")
  new RegExp(`[a-z0-9-]\\s*(?:\\(\\s*dot\\s*\\)|\\[\\s*dot\\s*\\]|\\s+dot\\s+)\\s*(?:${TLDS})\\b`, 'i'),
  /\b(?:bit\.ly|t\.me|wa\.me|discord\.gg)\b/i,
];
const BAD_CHARS = /[<>`\\@]/;
const DIGIT_RUN = /\d(?:[\s().-]*\d){6,}/;

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i' };
const WORDS = new Set([...BLOCK, ...PROFANITY]);

/** @param {string} s */
function fold(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[0134578@$!|]/g, (c) => LEET[c] ?? c);
}

/** @param {string} text */
function hasBlockedWord(text) {
  const f = fold(text);
  const words = f.split(/[^a-z]+/).filter(Boolean);
  for (const w of words) {
    if (WORDS.has(w) || WORDS.has(w.replace(/(.)\1+/g, '$1'))) return true;
  }
  // Spaced or dotted out ("f u c k"): letters only, stems inside.
  const squashed = f.replace(/[^a-z]+/g, '');
  const collapsed = squashed.replace(/(.)\1+/g, '$1');
  return STEMS.some((st) => squashed.includes(st) || collapsed.includes(st));
}

/** @param {string} text */
export function isRefused(text) {
  if (!text) return false;
  if (BAD_CHARS.test(text) || DIGIT_RUN.test(text)) return true;
  if (LINKISH.some((re) => re.test(text))) return true;
  return hasBlockedWord(text);
}

/**
 * @param {{ name?: unknown, line?: unknown, seed?: unknown, at?: unknown }} input
 * @returns {{ ok: true, mark: { name: string, line: string, seed: number, at: string } } | { ok: false, reason: 'empty' | 'held' }}
 */
export function checkMark(input) {
  const name = cleanText(input?.name, G.nameMaxChars);
  const line = cleanText(input?.line, G.lineMaxChars);
  if (!name) return { ok: false, reason: 'empty' };
  if (isRefused(name) || isRefused(line)) return { ok: false, reason: 'held' };
  const seedNum = Number(input?.seed);
  const seed = Number.isFinite(seedNum) ? seedNum >>> 0 : 0;
  const atMs = Date.parse(typeof input?.at === 'string' ? input.at : '');
  const at = new Date(Number.isFinite(atMs) ? atMs : Date.now()).toISOString();
  return { ok: true, mark: { name, line, seed, at } };
}
