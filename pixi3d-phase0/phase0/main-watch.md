# Main watch

- 2026-11-12 16:47 EST: user note: main for portfolio site is changing as the guestbook PR pushes.
- 2026-11-12 16:47 EST fetch: origin/main still c43c594 Fill LinkedIn URL + fourth LeafLink member (Colton A.) per Justin.
- 2026-11-12 16:51 EST: user report: polish branch is now the main page. Production redeploy dpl_A9Hi8a8TywyP4WPJLxp2pM9YH3KC, READY, target production, alias includes justinpoli.is-a.dev. Rollback target: previous production deployment dpl_G3nFNBAQtfLwGuxZApdQk1LwXZjq (46d6a34).
- 2026-11-12 16:51 EST verification by Cipher: 2d75332 exists, Merge PR #9: server words formed from lanes, HEAD of origin/astryx-polish-r2 and origin/astryx-integration, 30 commits ahead of 46d6a34, 107 files changed, 15077 insertions, 116 deletions. Git origin/main remains c43c594, a spec-only chain, not the live site code.
- Correction: Phase 0 live base is 2d75332, not c43c594. Lane C was sent a correction to re-verify against 2d75332.
- Verified on production per user report: all routes 200: /, /leaflink, /sidequests, /llms.txt, /llms-full.txt. Landing copy present ("I like to build my own tools"). OG image hash unchanged (3dcd695e, vortex mark). Guestbook in production bundle (11 references in main JS). Lane-formed server words in production world JS: all nine stack names, lane-tip bending, nearest-lane pick, guestbook dim box. Production JS hash matches PR #9 preview exactly (index-DPfAd3WB.js).
- Open issues carried forward, unchanged: per-frame texture upload while a word is lit (K-SRV-6, real-device frame time check), and lane-carried letters reading subtly in stills.
- Action: rebase or re-branch Phase 0 pool to 2d75332 after Lane C completes. Re-fetch before masterspec synthesis.
