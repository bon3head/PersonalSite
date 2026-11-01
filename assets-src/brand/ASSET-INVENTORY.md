# Brand asset inventory (W0 draft, 2026-10-31)

Source of files: `feedback-2026-10-31/assets/` (already pulled, verified
by file type, frame count, dimensions, sha256, and upstream size match).
No token was used in W0 and no file was re-pulled. Upstream facts below
come from the public Codeberg API (no credential): per-file size match
against the pulled bytes plus the last commit that touched each file.
W3 re-verifies every sha256 against the pinned commit through the
Codeberg connector helper and finalizes the LICENSE column.

Hash method for feedback identification: 16x16 gradient dHash on
grayscale, Hamming distance over 256 bits. Transparent GIF frames were
composited on white before hashing. Distance 0 to 10 counts as a match;
distance above 100 counts as unrelated.

## Hero assets (USE)

### sidequests.gif: SideQuests hero, USE

- Pulled file: `feedback-2026-10-31/assets/sidequests.gif`
- Canonical source: opensourcery/sidequests, branch dev,
  `app/assets/sidequests.gif`
- Verified: GIF 89a, 1920x538, 4 frames, 200 ms per frame, loop,
  42591 bytes, transparency index 0, 837641 transparent pixels in
  frame 0 (true transparency, not a white matte).
- SHA-256:
  `60421a79e67ab676182ef25f1cf4b2ed8749f67be6885847b1b1ec6bd50070c6`
- Upstream size match: 42591 bytes. Last commit touching the file:
  `7c7fb451de32485df637c87493b3a4e0e48d90b5` (2025-11-08).
  Branch dev HEAD at check time:
  `0b6b28b75a3740ad8f07b459280149c34e041c9f`.
- Frame 0: green handwritten "Sidequests" wordmark with a star. This
  is the squiggle logo. feedback-09 matches frame 0 at dHash distance
  2, and matches nothing else below 52.
- Budget check (plan section 3.7): 42591 bytes transferred, under
  900 KB. Decoded memory 1920 x 538 x 4 bytes x 4 frames = 16527360
  bytes (15.8 MB), under 48 MB.
- Alt text draft (rule: project name plus what the mark depicts, 12
  words or fewer, no "image of"; W1 confirms wording):
  "SideQuests logo, green handwritten wordmark with a star"
- Role: SideQuests hero GIF. The bon3head/sidequests copy is
  byte-identical per ASSETS.md; canonical source stays upstream.

### leaves.gif: LeafLink animated mark, USE

- Pulled file: `feedback-2026-10-31/assets/leaves.gif`
- Canonical source: bon3head/LeafLink, branch main,
  `app/assets/leaves.gif`
- Verified: GIF 89a, 305x400, 50 frames, 100 ms per frame, loop,
  828040 bytes, transparency index 239, 84844 transparent pixels in
  frame 0.
- SHA-256:
  `636a315755a4212aa4a0f1d3b2717d6f5b303124784f30751ba05e5e10d382da`
- Upstream size match: 828040 bytes. Last commit touching the file:
  `0d76e4d9aad05083c6a45719b4a854f4cf67e8b1` (2026-03-16).
  Branch main HEAD at check time:
  `dbe40300c3eff93cc25dfe7a8908fb46add6c5e5`.
- Frame 0: green maple leaf on transparency. No feedback image
  matches it (closest feedback dHash distance above 100), which is
  expected: feedback-10 is the static logo.png mark, not this leaf.
- Budget check: 828040 bytes transferred, under 900 KB. Decoded
  memory 305 x 400 x 4 bytes x 50 frames = 24400000 bytes (23.3 MB),
  under 48 MB.
- Alt text draft: "LeafLink logo, animated green maple leaf"
- Role: LeafLink animated hero candidate. W3 confirms against the
  manifest whether this or logo.png is the shipped hero mark; both
  are inventoried so the choice stays inside already-pulled files.

### logo.png: LeafLink static mark, USE

- Pulled file: `feedback-2026-10-31/assets/logo.png`
- Canonical source: bon3head/LeafLink, branch main, `public/logo.png`
- Verified: PNG, 1024x1024, RGBA, true transparency (corner pixel
  alpha 0), 174622 bytes.
- SHA-256:
  `538a891a8f0d1fbde043b5f468d1d04833d79e92d733156b94c807cc686cf4e7`
- Upstream size match: 174622 bytes. Last commit touching the file:
  `a7dc51c811022aadec8375b78e3bac4d8a21955b` (2026-03-21).
- feedback-10 matches this file at dHash distance 0 (exact
  perceptual match): two green leaves forming a smile.
- Alt text draft: "LeafLink logo, green leaves forming a smile"
- Role: LeafLink static mark; also the reduced-motion PNG and the
  F1 fallback frame source for the LeafLink hero.

## Creative liberty assets (USE only outside heroes)

### circuit.gif: USE for creative liberty, not a hero

- Pulled file: `feedback-2026-10-31/assets/circuit.gif`
- Canonical source: bon3head/sidequests, branch dev,
  `app/assets/circuit.gif`
- Verified: GIF 89a, 255x210, 50 frames, 11523 bytes, frame 0 opaque
  (near-black ground).
- SHA-256:
  `8ad335849c2ea02a692b0d511ec64cc89b6f5b303124784f30751ba05e5e10d382da`
- Upstream size match: 11523 bytes. Last commit touching the file:
  `f38345fe5cff096c26b4017a8e4aa3fdbda2b4cd` (2026-03-02).
- feedback-08 matches circuit.gif frames 0 and 30 at dHash distance
  9 to 10: purple circuit pattern.
- Role: creative liberty only. Per plan section 3.9 it is NOT a
  hero: it is neither the squiggle nor a LeafLink mark, and the hero
  holds exactly one mark (R2). The section 3.9 exception does not
  trigger for feedback-08.

### gears.gif: USE for creative liberty, not a hero

- Pulled file: `feedback-2026-10-31/assets/gears.gif`
- Canonical source: bon3head/sidequests, branch dev,
  `app/assets/gears.gif`
- Verified: GIF 89a, 98x88, 3 frames, 17246 bytes, transparency
  index 1, 3823 transparent pixels in frame 0.
- SHA-256:
  `c353060a9cd0710f711bbd8f239278c3e644939b2dd4bc53b26c001cd9279275`
- Upstream size match: 17246 bytes. Last commit touching the file:
  `f38345fe5cff096c26b4017a8e4aa3fdbda2b4cd` (2026-03-02).
- feedback-06 matches gears.gif frame 0 at dHash distance 3: gold
  gears. Size 98x88 matches the GIF exactly.
- Role: creative liberty only, same reason as circuit.gif.

## Excluded (DO NOT USE)

### sidequests-alpha.gif: DO NOT USE

- Pulled file: `feedback-2026-10-31/assets/sidequests-alpha.gif`
- Canonical source: opensourcery/sidequests, branch dev,
  `app/assets/sidequests-alpha.gif`
- Verified: GIF 89a, 2111x830, 4 frames, 71746 bytes, transparency
  index 0.
- SHA-256:
  `4c70fedfbc64802763ec2af2b54b41a41278f36ae416da8e3b8f319531c77185`
- Upstream size match: 71746 bytes. Last commit touching the file:
  `47218ddbd15857f0ea63856b8698fe78d63acad9` (2026-01-08).
- Frame 0: same logo plus the word "alpha" below it. Justin's
  direction 2026-10-31: do not use the alpha one. Kept on disk for
  reference only.

### feedback-05: unknown, excluded

- File: `feedback-2026-10-31/feedback-05.jpg`, 128x128, dark
  blue/purple pattern tile.
- dHash against every pulled file and every GIF frame: closest
  distance 108 of 256 (sidequests.gif frame 1, white composite).
  No match. Identity unconfirmed; it matches no pulled asset.
- Role: excluded from heroes per plan section 3.9. The section 3.9
  exception does not trigger: feedback-05 is neither the squiggle
  nor a LeafLink mark.

### feedback-07: unknown, excluded

- File: `feedback-2026-10-31/feedback-07.jpg`, 50x50, small yellow
  shape.
- dHash against every pulled file and every GIF frame: closest
  distance 104 of 256 (leaves.gif frame 12, white composite).
  No match. Identity unconfirmed; it matches no pulled asset.
- Role: excluded from heroes per plan section 3.9, same reason as
  feedback-05.

## Feedback image identification summary

| Feedback | Identification | dHash distance | Verdict |
| --- | --- | --- | --- |
| feedback-05 | no pulled asset | 108 (closest) | excluded, unknown |
| feedback-06 | gears.gif frame 0 | 3 | creative liberty |
| feedback-07 | no pulled asset | 104 (closest) | excluded, unknown |
| feedback-08 | circuit.gif frames 0/30 | 9 to 10 | creative liberty |
| feedback-09 | sidequests.gif frame 0 | 2 | SideQuests hero |
| feedback-10 | logo.png | 0 | LeafLink static mark |

## License column (W3 finalizes)

- opensourcery/sidequests: LICENSE file exists at repo root
  (confirmed via public API root listing). License text to be
  recorded verbatim by W3.
- bon3head/LeafLink: no LICENSE file at repo root (confirmed via
  public API root listing). W3 records this as unknown and does not
  invent a license.
- bon3head/sidequests: root listing not re-checked in W0; W3
  confirms before finalizing SOURCES.json.
