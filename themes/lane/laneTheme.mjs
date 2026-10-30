// themes/lane/laneTheme.mjs
// B1 Theme. Values read from tokens.generated.json. No literal colors.
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
    // keys validated against qa/astryx/targets-*.json in S01 step 4
    button: {
      base: {borderRadius: 'var(--radius-element)', fontWeight: '700', boxShadow: 'none'},
      'variant:primary': {backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)'},
    },
    kbd: {base: {backgroundColor: 'transparent', borderRadius: 'var(--radius-inner)', boxShadow: 'inset 0 0 0 1px var(--color-border)'}},
    'bottom-sheet': {base: {borderRadius: '0', boxShadow: 'none'}},
  },
});
export default laneTheme;
