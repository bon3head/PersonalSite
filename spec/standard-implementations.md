# Standard implementations

Canonical implementations for things engineers hand-roll badly. Reach for these before writing your own. Each entry: the standard, the hand-rolled failure it replaces, and the smallest correct code. Links are the HD source.

## Email validation
- Standard: pragmatic client-side sanity check; the confirmation email is the real validation.
```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!EMAIL_RE.test(value)) return 'Enter a valid email address.';
```
- Bad: the multi-kilobyte RFC 5322 monster regex. It rejects valid addresses, accepts invalid ones, and nobody can audit it.
- Server-side thoroughness: [isEmail.js](https://github.com/validatorjs/validator.js/blob/master/src/lib/isEmail.js) (validatorjs/validator.js)

## URL validation
- Standard: the platform parser. Never a regex.
```js
function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}
```
- Bad: hand-rolled URL regexes. They miss IDNs, ports, auth segments, and unicode, and they rot.

## UUIDs
- Standard: `crypto.randomUUID()`, RFC 4122 v4, CSPRNG-backed, available in browsers and Node 19+.
```js
const id = crypto.randomUUID(); // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
```
- Bad: `Math.random().toString(36).slice(2)` is not collision-safe, not crypto-safe, and has the wrong length distribution.

## Debounce (trailing edge)
- Standard:
```js
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
const onType = debounce(runSearch, 250);
```
- Bad: firing the handler on every keystroke, or setTimeout soup with no cancel (stale requests race and overwrite fresh results).

## HTML escaping (XSS)
- Standard: escape the five characters, or skip strings entirely.
```js
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ESC[c]);
// preferred: el.textContent = userInput (never innerHTML with user data)
```
- Bad: `s.replace(/<script.*?>.*?<\/script>/gi, '')` is bypassable six ways (event handlers, svg, unicode, nesting). Blocklist-stripping HTML with regex is never correct.

## Luhn check (card numbers)
- Standard: ISO/IEC 7812 checksum. Catches typos and transpositions, not fraud.
```js
function luhn(num) {
  const ds = num.replace(/\D/g, '').split('').reverse().map(Number);
  if (!ds.length) return false;
  const sum = ds.reduce((a, d, i) => a + (i % 2 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d), 0);
  return sum % 10 === 0;
}
```
- Bad: length-only or prefix-only checks that accept `4111 1111 1111 1112`.

## Password strength
- Standard: [zxcvbn](https://github.com/dropbox/zxcvbn), which scores 0-4 from real crack-time estimates (dictionary, patterns, l33t, repeats).
```js
const { score } = zxcvbn(password); // accept score >= 3
```
- Bad: composition rules ("one uppercase, one number, one symbol"). NIST 800-63B retired them: they produce `P@ssw0rd1`, compliant and crackable in seconds.

## Slugify
- Standard:
```js
const slugify = (s) => s.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')   // strip diacritics: 'café' -> 'cafe'
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
```
- Bad: `s.replace(/ /g, '-')` leaves uppercase, accents, and punctuation in URLs.

## Throttle (leading + trailing)
- Standard: for scroll/resize/pointer handlers. Debounce waits for quiet; throttle caps the rate.
```js
function throttle(fn, ms) {
  let last = 0, timer = null;
  return (...args) => {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn(...args); }, remaining);
    }
  };
}
```
- Bad: using debounce on scroll (fires only after scrolling stops, so scrub-linked UI lags) or no rate cap at all (layout thrash on every scroll event).

## Copy to clipboard (with fallback)
- Standard: Clipboard API first, execCommand fallback, boolean result. The caller owns the confirmation UI.
```js
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // non-secure contexts, older browsers, denied permission
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
}
// usage: const ok = await copyText(email);
// show 'copied' on true, 'copy failed, email shown' on false. Never silent.
```
- Bad: `navigator.clipboard.writeText` with no catch (throws on http, in iframes, on denial — unhandled rejection, no feedback) or execCommand-only (dead on modern mobile Safari).

## Reduced-motion listener
- Standard: matchMedia once, listen for changes, toggle a class the CSS and JS both read.
```js
const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPref() {
  document.documentElement.classList.toggle('reduced-motion', motionMQ.matches);
  // JS animation code reads the same class / motionMQ.matches before starting
}
motionMQ.addEventListener('change', applyMotionPref);
applyMotionPref();
```
- Bad: checking `matchMedia(...).matches` once at load and never listening (misses the user toggling the OS setting mid-session), or sniffing UA strings.

## Safe storage
- Standard: localStorage throws in private mode and under storage pressure. Never let it take the page down.
```js
const safeStorage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
```
- Bad: bare `localStorage.setItem` in a terminal-history or theme init path — one SecurityError in Safari private mode and the whole script dies.

## Timestamps
- Standard: always UTC ISO 8601, always sortable.
```js
new Date().toISOString(); // '2026-10-04T22:15:30.000Z'
```
- Bad: hand-rolled date math across DST boundaries, locale-formatted strings stored as data. For arithmetic use [Temporal](https://github.com/tc39/proposal-temporal) or date-fns. Never manual day/month rollover.
