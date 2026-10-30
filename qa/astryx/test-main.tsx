// B1 theme test app. Renders real Astryx components under the lane theme
// so T-S01-3/4/5 measure true StyleX output, not static classes.
//
// Integration contract this harness mirrors (app must do the same):
// Theme `mode` is derived from data-regime (void/field -> dark,
// paper -> light). Theme's default system mode sets its own color-scheme
// on the wrapper, which would override the regime block inside the app.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@astryxdesign/core/theme';
import { Button } from '@astryxdesign/core/Button';
import { laneTheme } from '../../themes/lane/laneTheme.mjs';
import '../../themes/lane/dist/lane.css';
import '../../src/styles/tokens.generated.css';
import '../../src/styles/fonts.css';
import '../../src/styles/global.css';

type Regime = 'void' | 'paper' | 'field';

function regimeMode(r: Regime): 'dark' | 'light' {
  return r === 'paper' ? 'light' : 'dark';
}

function TestApp(): React.JSX.Element {
  const [regime, setRegime] = useState<Regime>(
    (document.documentElement.getAttribute('data-regime') as Regime) || 'void',
  );
  useEffect(() => {
    const ob = new MutationObserver(() => {
      const r = document.documentElement.getAttribute('data-regime') as Regime;
      if (r) setRegime(r);
    });
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-regime'] });
    return () => ob.disconnect();
  }, []);
  return (
    <Theme theme={laneTheme} mode={regimeMode(regime)}>
      <main>
        <Button variant="primary" data-testid="primary-btn">
          Test action
        </Button>
      </main>
    </Theme>
  );
}

const el = document.getElementById('test-root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <TestApp />
    </StrictMode>,
  );
}
