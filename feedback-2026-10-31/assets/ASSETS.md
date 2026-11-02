# Codeberg assets pulled 2026-10-31

Real GIF and PNG assets from Codeberg, verified by file type and frame count.
All live in this directory. Use only the assets marked USE.

## SideQuests hero: USE sidequests.gif (the actual one)

- File: sidequests.gif
- Source: opensourcery/sidequests, branch dev, app/assets/sidequests.gif
- Justin's direction 2026-10-31: the actual one lives in the OpenSourcery repo
  (upstream of bon3head/sidequests), not the alpha variant.
- Verified: GIF 89a, 1920x538, 4 frames, animated, 42591 bytes.
- SHA-256: 60421a79e67ab676182ef25f1cf4b2ed8749f67be6885847b1b1ec6bd50070c6
- The bon3head/sidequests copy is byte-identical (same SHA-256), so the
  upstream file and the fork file are the same bytes. Canonical source is
  the upstream opensourcery/sidequests copy.
- Frame 0 shows the clean green handwritten "Sidequests" logo with a star,
  no extra text.

## SideQuests: DO NOT USE sidequests-alpha.gif

- File: sidequests-alpha.gif
- Source: opensourcery/sidequests, branch dev, app/assets/sidequests-alpha.gif
- Verified: GIF 89a, 2111x830, 4 frames, animated, 71746 bytes.
- Justin's direction 2026-10-31: do NOT use the alpha one.
- Frame 0 shows the same logo plus the word "alpha" written below it.
- Kept on disk for reference only. The swarm must not use it for the hero.

## LeafLink: USE leaves.gif and logo.png

- leaves.gif: source bon3head/LeafLink, branch main, app/assets/leaves.gif.
  GIF 89a, 305x400, 50 frames, animated, 828040 bytes.
- logo.png: source bon3head/LeafLink, branch main, public/logo.png.
  PNG, 1024x1024, RGBA (true transparency), 174622 bytes.

## SideQuests repo assets: USE for creative liberty

- circuit.gif: source bon3head/sidequests, branch dev, app/assets/circuit.gif.
  GIF 89a, 255x210, 50 frames, animated, 11523 bytes. Purple circuit pattern.
- gears.gif: source bon3head/sidequests, branch dev, app/assets/gears.gif.
  GIF 89a, 98x88, 3 frames, animated, 17246 bytes. Gold gears.
- Both also exist in opensourcery/sidequests at the same paths and sizes.

## Upstream extras (not pulled, available if needed)

- opensourcery/sidequests, branch dev, also holds arrow.gif, arrow2.gif,
  awesomeload.gif, orbdivider.gif, starpin.gif, you_dark.gif, you_light.gif,
  docs/media/fairy.png, and docs/media/tome.png. Pull via the Codeberg
  connector helper if Claude's plan calls for them.
