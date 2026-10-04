# Copy Deck v2.1 (pending approval)

v2.1: repo receipts filled (LeafLink, SideQuests); terminal projects lines use "name: description"; full-deck dash scan clean. 2026-10-04.

Facts come from spec/portfolio-spec.md plus the project facts Justin's review supplied on 2026-10-04 (LeafLink, SideQuests). Anything not stated is [TBD]. "(→ TBD)" marks a claim whose receipt URL is not yet known. GPA is cut (spec §13).

## 0. Global

- Page title, home: `Justin Poli · Systems-minded SWE`. JUDGMENT CALL: spec §14's default puts an em dash between "Justin Poli" and "Systems-minded SWE", which spec §2 and §13 ban in people-facing copy. Same words, middle dot instead of the dash.
- View titles: `About · Justin Poli` · `LeafLink · Justin Poli` · `SideQuests · Justin Poli` · `Contact · Justin Poli` · `404 · Justin Poli`
- Meta, home: `Backend and systems SWE, SUNY New Paltz CS, graduating Dec 2027. Two hackathon builds, both placed 2nd, each with receipts.`
- Meta, about: `The engineer who verifies. Now, principles, and how this site was built.`
- Meta, LeafLink: `LeafLink: event discovery platform. Failure class, receipts, and how to prove it wrong.`
- Meta, SideQuests: `SideQuests: peer-to-peer quest matching. Failure class, receipts, and how to prove it wrong.`
- Meta, contact: `Email justinf0829@gmail.com, or use the form.`
- Wordmark: `justin poli`
- Nav: `Work` · `About` · `Contact`. Mobile: `Menu` / `Close`. Menu dialog label: `Site menu`
- Skip link: `Skip to content`
- No-JS banner: `JavaScript is off. Every page still reads. The 3D rig and the terminal need it.`

## 1. Hero (spec §5.1.1: left-aligned, never centered, text links not buttons)

- Eyebrow: `NEW-GRAD SWE / BACKEND AND SYSTEMS / DEC 2027`
- Name: `Justin Poli`
- Thesis: `I build systems and prove they work.`
- Facts line: `CS, SUNY New Paltz (→ TBD). Graduating Dec 2027. Smithtown, NY.`
- Evidence link 1: `LeafLink: event discovery, 2nd place. Read the dossier` (→ #/work/leaflink)
- Evidence link 2: `SideQuests: MVP in 24 hours, 2nd place. Read the dossier` (→ #/work/sidequests)
- Scroll cue: `Scroll to assemble the rig`
- Rig node labels: `DATA` · `VERIFY` · `DETERMINE`
- Canvas accessible label: `Diagram of the method. Data feeds verify, verify feeds determine.`

## 2. Proof strip (spec §5.1.2: 3-4 claims, receipt inline)

- Eyebrow: `01 / RECEIPTS`
- Heading: `Claims, With Links`
- Claim 1: `Two hackathon builds. Both placed 2nd.` Receipts: `LeafLink placement` (→ TBD) · `SideQuests placement` (→ TBD)
- Claim 2: `SideQuests: working MVP in 24 hours at Hack New Paltz.` Receipts: `repo` (→ https://codeberg.org/bon3head/sidequests) · `demo` (→ TBD)
- Claim 3: `LeafLink: event discovery platform, built by a team of four in a week-long hackathon.` Receipts: `repo` (→ https://codeberg.org/bon3head/LeafLink) · `demo` (→ TBD)
- Claim 4: `Code is public.` Receipt: `codeberg.org/bon3head` (→ https://codeberg.org/bon3head). Live line: `{N} public repos · via GitHub API` (hidden if the API fails, spec §10)

## 3. Terminal (spec §6, §10: exactly help, whoami, projects, verify, contact, clear)

- Eyebrow: `02 / TERMINAL`
- Heading: `Query The Record`
- Intro: `A working shell, not a typing animation. Type help.`
- Input label (visually hidden): `Terminal command`
- Prompt: `guest@jp:~$`
- Boot line: `jp shell. type help for commands.`
- No-JS fallback: `The terminal needs JavaScript. Same information lives on About and Contact.`

```
help
  help       list commands
  whoami     who this is
  projects   shipped work, with dossier links
  verify     how claims here are checked
  contact    ways to reach me
  clear      clear the screen
  up/down arrows recall history
```
```
whoami
  Justin Poli
  Backend and systems leaning SWE. The engineer who verifies.
  CS, SUNY New Paltz. Graduating Dec 2027.
  Smithtown, NY.
  Seeking full-time SWE roles starting 2027.
```
```
projects
  leaflink: event discovery platform
    week-long hackathon, 2nd place, team of four
    open #/work/leaflink
  sidequests: peer-to-peer quest matching
    Hack New Paltz, MVP in 24 hours, 2nd place
    open #/work/sidequests
  tip: projects leaflink opens the dossier
```
```
verify
  method: data, verify, determine
  1. every claim links to its receipt
  2. every dossier names the failure class it survived
  3. every dossier says what would prove it wrong
  if a link does not resolve to what it claims, the claim fails.
  report it: justinf0829@gmail.com
```
```
contact
  email      justinf0829@gmail.com
  code       codeberg.org/bon3head
  mirror     github.com/bon3head
  linkedin   [TBD]
  phone      (631) 835-5490
```
- `clear`: empties the screen, no output
- Empty input: new prompt, no output
- Unknown: `unknown command: {input}. Try: help`
- `projects {unknown}`: `no project named {input}. Try: projects`

## 4. Dossier index (spec §5.1.3: full-bleed rows, alternating alignment)

- Eyebrow: `03 / DOSSIERS`
- Heading: `Shipped Work`
- Row labels: `WHAT IT IS` · `FAILURE CLASS SURVIVED` · `RECEIPT`
- LeafLink: `LeafLink` / `Event discovery platform. Week-long hackathon, team of four, 2nd place.` / `[TBD: confirm]` / `repo` (→ https://codeberg.org/bon3head/LeafLink) / `Read the dossier`
- SideQuests: `SideQuests` / `Peer-to-peer quest matching. Hack New Paltz, working MVP in 24 hours, 2nd place.` / `Proposed: scope collapse under timebox [TBD: confirm]` / `repo` (→ https://codeberg.org/bon3head/sidequests) / `Read the dossier`

## 5. Timeline (spec §5.1.4: education, campus roles, hackathons, job-hunt filings, nothing else)

- Eyebrow: `04 / TIMELINE`
- Heading: `The Record`
- `[TBD] to Dec 2027` · `Computer Science, SUNY New Paltz.` (→ TBD)
- `[TBD]` · `Vice President, Math Club.` (→ TBD)
- `[TBD]` · `Council representative, Eleet Coders.` (→ TBD)
- `[TBD]` · `Treasurer, CS Teams.` (→ TBD)
- `[TBD]` · `LeafLink. Week-long hackathon, team of four. 2nd place.` (→ TBD)
- `[TBD]` · `SideQuests. Hack New Paltz, MVP in 24 hours. 2nd place.` (→ TBD)
- `Now` · `Applying to full-time SWE roles starting 2027.`

## 6. Contact band (home)

- Eyebrow: `05 / CONTACT`
- Heading: `Hiring For 2027`
- Body: `Full-time SWE roles starting 2027. Backend and systems. Email reaches me directly.`
- Primary link: `justinf0829@gmail.com` (→ mailto:justinf0829@gmail.com)
- Copy button: `Copy email` → `Copied` (reverts after 2s). Failure: `Copy failed. Select the address above.`
- Links: `Codeberg` (→ https://codeberg.org/bon3head) · `GitHub` (→ https://github.com/bon3head) · `LinkedIn` (→ TBD)

## 7. About (spec §1, §5.2)

- Heading: `About`
- Lead: `The engineer who verifies. Backend and systems leaning.`
- `NOW` · `CS senior at SUNY New Paltz, graduating Dec 2027 (→ TBD). Seeking full-time SWE roles starting 2027.`
- `BASE` · `Smithtown, NY.`
- `PRINCIPLES` (draft in his voice, edit freely)
  - `Data.` `Start from what was measured, not what was assumed.`
  - `Verification.` `A claim without a check is a guess. Ship the check with the claim.`
  - `Determinism.` `Same input, same output. A build that cannot be reproduced cannot be trusted.`
- `COLOPHON`
  - `Stack.` `One HTML file. Inline CSS and JS. three.js r186 and GSAP {version pinned at build}, loaded by importmap. WebGPU when the browser has it, WebGL2 otherwise. No framework, no build step.`
  - `Why 3D.` `The rig on the home page is a diagram of the method: data, verify, determine. It is progressive enhancement. Every word on the site reads without it.`
  - `Pipeline.` `Deterministic build, byte-verify, receipt chain. The deployed file is compared byte for byte with the committed file.` [TBD until first deploy]
  - `Method.` `Spec first. Copy locked before code. QA gates before ship.` Spec summary link: [TBD, needs Justin's approval to publish]
  - `Privacy.` `No cookies. No tracking. No analytics.`

## 8. Dossiers (spec §5.3, fixed structure)

Section labels: `01 HEADER` · `02 FAILURE CLASS` · `03 RECEIPT` · `04 FALSIFIABILITY TEST` · `05 BUILD NOTES` · `06 EVIDENCE`

### 8.1 LeafLink
- Name: `LeafLink`
- One-liner: `Event discovery platform.`
- Meta row: `SHIPPED [TBD date]` · `EVENT Week-long hackathon [TBD name]` · `RESULT 2nd place` · `TEAM Justin Poli, Julian Shuster, Devin Perez, [TBD fourth member]` · `ROLE [TBD]`
- Links: `Repo` (→ https://codeberg.org/bon3head/LeafLink) · `Live demo` (→ TBD)
- Failure class: `[TBD: confirm]`
- Receipt list: `Repo` (→ https://codeberg.org/bon3head/LeafLink) · `Commit at submission` (→ TBD) · `Demo recording` (→ TBD) · `2nd place proof` (→ TBD)
- Falsifiability lead: `This dossier is weaker than claimed if any of these hold:`
  - `The published results do not list LeafLink in 2nd place.`
  - `The repo history shows the core work predates the hackathon week.`
  - `The repo at the submission commit does not build.`
  - `The demo recording does not show events being discovered on the build at that commit.`
- Build notes: `Stack.` `[TBD]` / `Hardest decision.` `[TBD]` / `Cut, and why.` `[TBD]`
- Evidence captions: `[TBD per screenshot]`. Empty state: `Screenshots pending. The receipts above are the primary evidence.`
- Footer nav: `Next dossier: SideQuests` · `All work`

### 8.2 SideQuests
- Name: `SideQuests`
- One-liner: `Peer-to-peer quest matching.`
- Meta row: `SHIPPED [TBD date]` · `EVENT Hack New Paltz` · `RESULT 2nd place` · `TEAM Justin Poli, Julian Shuster` · `ROLE [TBD]`
- Links: `Repo` (→ https://codeberg.org/bon3head/sidequests) · `Live demo` (→ TBD)
- Failure class: `Proposed: scope collapse under timebox. A working MVP had to exist inside 24 hours.` [TBD: confirm; spec §5.3 lists this as an example class, not as SideQuests' class]
- Receipt list: `Repo` (→ https://codeberg.org/bon3head/sidequests) · `Commit at submission` (→ TBD) · `Demo recording` (→ TBD) · `2nd place proof` (→ TBD)
- Falsifiability lead: `This dossier is weaker than claimed if any of these hold:`
  - `The published Hack New Paltz results do not list SideQuests in 2nd place.`
  - `The repo history from first commit to the submission commit spans more than 24 hours.`
  - `The repo at the submission commit does not build.`
  - `The demo recording does not show two users matched on a quest.`
- Build notes: `Stack.` `[TBD]` / `Hardest decision.` `[TBD]` / `Cut, and why.` `[TBD]`
- Evidence captions: `[TBD per screenshot]`. Empty state: `Screenshots pending. The receipts above are the primary evidence.`
- Footer nav: `Next dossier: LeafLink` · `All work`

## 9. Contact view (spec §5.4, §10: CONTACT_ENDPOINT = null at launch)

- Heading: `Contact`
- Lead: `Email, form, or code hosts. Every path reaches the same inbox.`
- Email: `justinf0829@gmail.com` + copy button (as in 6)
- Form labels: `Name` · `Email` · `Message`. Submit: `Send`
- Form note: `No backend is wired yet. Send opens your mail client with this message filled in.`
- Errors: `Enter your name.` · `Enter a valid email address.` (verbatim, standard-implementations) · `Write a message.`
- After mailto (the only v1 path): `Your mail client should be open with the message ready. If it did not open, email justinf0829@gmail.com directly. Your text is still in the form.`
- Mailto subject: `Portfolio contact from {name}`. Body: `{message}` + blank line + `From: {name} <{email}>`
- Links: `Codeberg (primary)` (→ https://codeberg.org/bon3head) · `GitHub` (→ https://github.com/bon3head) · `LinkedIn` (→ TBD) · `Phone (631) 835-5490` (→ tel:+16318355490)

## 10. 404 (spec §5.5)

```
$ 404: route not found
$ requested: {hash}
$ valid routes:
  #/                  home
  #/about             about
  #/work/leaflink     dossier
  #/work/sidequests   dossier
  #/contact           contact
$ cd ~
```
`cd ~` links home. Meta: `Route not found.`

## 11. Footer

- Sitemap: `Home` · `LeafLink` · `SideQuests` · `About` · `Contact`
- Colophon: `One HTML file. three.js r186, GSAP, no framework.`
- Verified line: `Built to spec. Every claim links to its receipt.`
- Copyright: `© {current year} Justin Poli`

## 12. Lightbox and UI labels

- `Close` · `Previous image` · `Next image` · counter `{n} / {total}`
- Dialog label: `{project} evidence, image {n} of {total}`
