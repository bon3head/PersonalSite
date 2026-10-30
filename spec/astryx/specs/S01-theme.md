# S01 Theme: the Astryx "lane" theme

Version 1.0.0, 2026-10-30. Depends on: S00, DESIGN.md sections 3 to 6 and 11. Blocks: S04, S05 to S08.

## 1. Purpose

Turn the Astryx substrate into this site's theme so every Astryx component the chrome uses (Button, Link, Kbd, Toast, BottomSheet) draws in the site's blue, type and motion, and none of it reads as Meta's stock UI. The theme is built with the CLI, committed, and drift-checked.

## 2. What was verified before this spec was written

On 2026-10-30, in a scratch project with `@astryxdesign/core@0.7.1` and `@astryxdesign/cli@0.7.1`, the mapping in DESIGN.md section 11 was written as `defineTheme` and built with `astryx theme build ... --json`. Result: `tokenCount 84`, `sizeKB 11.3`, `warnings []`, one notice that the font is named but not loaded (handled by S00 fonts.css). Resolved values were read back from the CSS: durations 100/150/225/200/300/450ms, `--ease-standard` as configured, font sizes 13/16/20/25/31/39/49/61px, radii 2/4/6/14px. So the API shape in section 4 is known to work; the builder is not guessing.

## 3. Steps

1. `npx astryx init --features theme` in the repo root. This writes `theme.template.ts` (reference only; do not import it) and agent docs. Commit the agent docs; read them.
2. Run and save to `qa/astryx/` (these are receipts and the source of legal override keys):
   - `npx astryx theme targets Button --json > qa/astryx/targets-button.json`
   - same for `Kbd`, `Toast`, `BottomSheet`, `Link`
   - `npx astryx component BottomSheet --dense > qa/astryx/BottomSheet.txt` (and for Button, Link, Kbd, Toast)
   - `npx astryx doctor --json > qa/astryx/doctor.json`
3. Write `themes/lane/laneTheme.mjs` exactly as section 4, reading values from `tokens.generated.json` (no literal colors in the theme file).
4. For each entry in section 5, confirm the key exists in the saved targets JSON. If a key is not listed, do not invent one: use the documented data-attribute escape hatch (`astryx docs styling/styling-advanced`) inside `@layer jp-chrome`, and record the substitution in this spec's changelog.
5. `npm run theme`, then `npm run theme:check`. Commit `themes/lane/dist/*`.
6. Write `src/styles/global.css` regime block (section 6).

## 4. Theme source

```js
// themes/lane/laneTheme.mjs
import {defineTheme} from '@astryxdesign/core/theme';
import T from './tokens.generated.json' with {type: 'json'};

const c = T.color;
const mono = {family: 'Commit Mono', fallbacks: '"Commit Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace'};

export const laneTheme = defineTheme({
  name: 'lane',
  typography: {scale: T.type.scale, body: mono, heading: mono, code: mono},
  radius: {base: T.radius.base, multiplier: T.radius.multiplier},
  motion: {...T.motion.astryxMotion, easing: T.motion.easePlain},
  tokens: {
    '--color-accent': [c.paper.accent, c.void.accent],
    '--color-on-accent': [c.paper.ground, c.void.ground],
    '--color-text-accent': [c.paper.accent, c.void.accent],
    '--color-icon-accent': [c.paper.accent, c.void.accent],
    '--color-accent-muted': [c.accentMutedLight, c.accentMutedDark],
    '--color-background-body': [c.paper.ground, c.void.ground],
    '--color-background-surface': [c.paper.raised, c.void.raised],
    '--color-background-card': [c.paper.raised, c.void.raised],
    '--color-background-popover': [c.paper.raised, c.void.raised],
    '--color-text-primary': [c.paper.text, c.void.text],
    '--color-text-secondary': [c.paper.text2, c.void.text2],
    '--color-icon-primary': [c.paper.text, c.void.text],
    '--color-icon-secondary': [c.paper.text2, c.void.text2],
    '--color-border': [c.paper.hairline, c.void.hairline],
    '--color-error': [c.errorLight, c.errorDark],
    '--focus-outline-color': [c.paper.accent, c.void.accent],
    '--shadow-low': 'none',
    '--shadow-med': 'none',
    '--shadow-high': 'none',
    '--size-element-sm': `${T.size.elementPx.sm}px`,
    '--size-element-md': `${T.size.elementPx.md}px`,
    '--size-element-lg': `${T.size.elementPx.lg}px`,
  },
  adaptations: {
    rules: [
      {when: {pointer: 'coarse'}, value: {tokens: {'--size-element-md': `${T.size.coarseMinTargetPx}px`, '--size-element-lg': `${T.size.coarseMinTargetPx}px`}}},
    ],
  },
  components: {
    // keys validated against qa/astryx/targets-*.json in step 4
    button: {
      base: {borderRadius: 'var(--radius-element)', fontWeight: '700', boxShadow: 'none'},
      'variant:primary': {backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)'},
    },
    kbd: {base: {backgroundColor: 'transparent', borderRadius: 'var(--radius-inner)', boxShadow: 'inset 0 0 0 1px var(--color-border)'}},
    'bottom-sheet': {base: {borderRadius: '0', boxShadow: 'none'}},
  },
});
export default laneTheme;
```

If `import ... with {type: 'json'}` is not accepted by the CLI's loader, read the file with `fs.readFileSync` and `JSON.parse` instead. Record which form worked.

## 5. Component override intent (validate every key)

| Component | Intent | Why |
|---|---|---|
| Button | 4px radius, weight 700, no shadow; primary fills with accent | Square-ish terminal controls; one radius system |
| Kbd | Transparent with a hairline ring, 2px radius | Key glyph reads as a TUI key, not a pill |
| BottomSheet | 0 radius, no shadow, raised ground | A TUI pane rising from the keymap, not a phone card |
| Toast | No override beyond tokens | Stock anatomy is fine once colors and type are ours |
| Link | No override beyond tokens; `isExternalLink` for off-site links | Built-in safe `rel` and new-tab announcement |

## 6. The third regime (field)

Astryx has light and dark. This site has void (dark), paper (light) and field (dark, blue ground). In `src/styles/global.css`:

```css
@layer jp-regime {
  :root[data-regime="void"]  { color-scheme: dark;  --jp-ground: var(--jp-void-ground);  --jp-raised: var(--jp-void-raised);  --jp-hairline: var(--jp-void-hairline); }
  :root[data-regime="paper"] { color-scheme: light; --jp-ground: var(--jp-paper-ground); --jp-raised: var(--jp-paper-raised); --jp-hairline: var(--jp-paper-hairline); }
  :root[data-regime="field"] { color-scheme: dark;  --jp-ground: var(--jp-field-ground); --jp-raised: var(--jp-field-raised); --jp-hairline: var(--jp-field-hairline); }
  :root[data-regime="field"] [data-astryx-theme="lane"] {
    --color-background-body: var(--jp-field-ground);
    --color-background-surface: var(--jp-field-raised);
    --color-background-card: var(--jp-field-raised);
    --color-background-popover: var(--jp-field-raised);
    --color-text-primary: var(--jp-field-text);
    --color-text-secondary: var(--jp-field-text2);
    --color-border: var(--jp-field-hairline);
  }
  body { background: var(--jp-ground); }
}
```

If Astryx's scoped theme block outranks this selector (check in DevTools: the field values must win on `/sidequests`), raise specificity by repeating the attribute (`[data-astryx-theme="lane"][data-astryx-theme="lane"]`) rather than using `!important`.

## 7. Kill criteria

- K-S01-1: the built CSS contains `#0064E0`, `#2694FE`, `#0082FB` or `#3E9EFB` anywhere (stock Meta blue leaked through an un-overridden token). `grep -i` on `themes/lane/dist/lane.css` must return nothing.
- K-S01-2: any component renders a shadow (`getComputedStyle(el).boxShadow` is neither `none` nor an inset ring).
- K-S01-3: the theme step is skipped: `data-astryx-theme` is not `lane` on body.
- K-S01-4: a screenshot of the ContactSheet next to Astryx's own neutral-theme BottomSheet example is judged "same look" by the reviewer (blind check in S11 G-ANTI).

## 8. Receipts

| Test | Claim | How |
|---|---|---|
| T-S01-1 | Theme builds clean | `npm run theme -- --json` shows `warnings: []` |
| T-S01-2 | No Meta blue | grep from K-S01-1 returns nothing |
| T-S01-3 | Regimes resolve | Playwright: on `/`, `/leaflink`, `/sidequests` read `getComputedStyle(document.body).backgroundColor`; equals void, paper, field ground in rgb |
| T-S01-4 | Accent per regime | primary Button background equals `signal` on void and field, `ink` on paper |
| T-S01-5 | Coarse targets | Playwright with `hasTouch: true, isMobile: true`: every `button, a` in the chrome has a bounding box at least 44 by 44 |

## 9. Unknowns

U-S01-1: whether `components` keys are `button`/`kbd`/`bottom-sheet` exactly; resolved by step 2. U-S01-2: whether the CLI loader accepts JSON import attributes; resolved by step 3.

## 10. Changelog

- 1.0.0, 2026-10-30: initial, from a verified probe build.
