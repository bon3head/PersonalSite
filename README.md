# PersonalSite

Justin Poli's portfolio. One self-contained file: `index.html` (inline CSS/JS, embedded fonts). three.js r186 and GSAP 3.15.0 load from jsDelivr via a pinned importmap with SRI hashes.

- Spec: `spec/portfolio-spec.md`, style tokens: `spec/style-brief.md`, copy (source of truth): `spec/copy-deck-v2.md`.
- Run locally: `npx serve .` (or any static server) and open the printed URL. Opening the file directly also works.
- Routes are hash-based: `#/`, `#/about`, `#/work/leaflink`, `#/work/sidequests`, `#/contact`.
- Fill a `[TBD]`: search `index.html` for `class="tbd"` and replace the span with the real link or text.
