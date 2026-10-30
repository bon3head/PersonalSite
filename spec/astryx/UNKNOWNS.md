# UNKNOWNS.md: register of what is not known and what Justin decides

Version 1.1.0, 2026-10-30. Every UNKNOWN in the package is listed here once. Ship rule (S11 section 9): each is resolved or explicitly accepted by Justin in writing.

## 1. Decisions (Justin ruled on 2026-10-30 unless noted)

| ID | Question | Decision | Where |
|---|---|---|---|
| D-LEAFLINK-KIND | LeafLink is "mutual aid" in the 2026-10-30 brief; earlier project notes said "event discovery platform". Which is right? | Mutual aid (Justin, 2026-10-30) | S09 C-LL-P1, S06 |
| D-SQ-VENUE | Show "Built at Hack New Paltz. Working MVP in 24 hours." on SideQuests? Confirmed by Justin on 2026-10-04 but missing from the brief. | Shown (Justin, 2026-10-30) | S09 C-SQ-VENUE |
| D-PHONE | Show the phone number? | Hidden (Justin, 2026-10-30) | S09 rule 4 |
| D-GPA | GPA | Cut (Justin, 2026-10-04). Not a question; listed so nobody re-adds it from the brief. | S09 rule 4 |
| D-CODE-HOST | Repo links point at Codeberg (canonical code host per earlier decision); GitHub `bon3head` is linked from whoami only. Keep? | Yes (earlier decision; not re-asked) | S09 C-LL-CODE, C-SQ-CODE, C-WHO-LINK-* |

## 2. Facts to verify before ship

| ID | What | How to resolve |
|---|---|---|
| R-GPU | RTX 3070 Ti structure: 48 SMs, 128 CUDA cores each, 6,144 total (GA104). The site's whole geometry rests on it and C-SRV-ALT states it. | Open NVIDIA's RTX 3070 Ti spec page or a launch review (PC Perspective Founders Edition review, June 2021, https://pcper.com/2021/06/nvidia-geforce-rtx-3070-ti-founders-edition-review/) and record the URL and the numbers here. **Accepted by Justin on 2026-10-30 without a check**, so it no longer blocks ship. The numbers are NVIDIA's published GA104 figures; anyone who opens a source should still record the URL here. |
| R-LINKS | Codeberg repos and LinkedIn return 200 (blocked from cloud runners) | T-COPY-4: one manual click each on the deployed preview |

## 3. Content unknowns (never filled, never depicted)

| ID | Unknown | Treatment |
|---|---|---|
| U-SRV-1 | Which models Ollama serves; token rates; uptime | Never shown |
| U-LL-1 | LeafLink's real categories, UI, screenshots | Pins unlabeled; no UI depicted |
| U-LL-3 | Whether LeafLink runs today | "Simulated feed"; never claims it is live |
| U-SQ-1 | SideQuests' real quests, campus, UI, stack | Markers unlabeled; generic plan, not SUNY New Paltz |
| U-ROLE | Justin's role inside each team | Not stated |
| U-PROOF | Placement proofs, demo recordings | Not linked; facts render plain |

## 4. Build-time unknowns (resolved by the card that hits them)

| ID | Unknown | Resolved by |
|---|---|---|
| U-S00-1 | Final `Commit Mono Fallback` metric overrides | B7/B8, CLS under 0.01, write back to DESIGN 4 |
| U-S01-1 | Exact `components` keys for button, kbd, bottom-sheet | B1 step 2 (`astryx theme targets`) |
| U-S01-2 | JSON import attributes in the theme loader | B1 step 3 |
| U-S02-1 | Real-device frame times | B9 G-PERF-DEVICE (start early, see BUILD-ORDER 5) |
| U-S02-2 | troika `BatchedText` in 0.52.5 | B6a |
| U-S04-1 | BottomSheet built-in animation length | B4 T-S04-7 |
| U-S10-1 | VoiceOver with BottomSheet on iOS | B9 manual |

## 5. Changelog

- 1.0.0, 2026-10-30: initial.
- 1.1.0, 2026-10-30: Justin's decisions applied: LeafLink is mutual aid, the Hack New Paltz line shows, the phone stays hidden, R-GPU accepted without a source check.
