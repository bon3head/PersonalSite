const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const p = await b.newPage();
  await p.goto('http://localhost:5173/?world=0');
  const out = await p.evaluate(async () => {
    const mod = await import('/src/world/server.ts');
    const cbs = []; let clock = 0;
    const field = { scene: { add() {}, remove() {} }, camera: { quaternion: { x: 0, y: 0, z: 0, w: 1 } }, now: () => clock,
      onFrame: (cb) => { cbs.push(cb); return () => {}; } };
    const ctl = mod.createServerController(field);
    const step = (n) => { for (let i = 0; i < n; i++) { clock += 0.02; for (const cb of cbs) cb(clock, 0.02); } };
    const op = () => Math.max(0, ...ctl.wordLanes().map((r) => r.opacity));
    for (let i = 0; i < 100 && ctl.wordLanes().length === 0; i++) { await new Promise((r) => setTimeout(r, 50)); step(1); }
    step(10);
    const seq = [op()];
    ctl.setHidden(true); step(2); seq.push(op());
    ctl.setHidden(false); step(1); seq.push(op());
    ctl.setHidden(true); step(1); seq.push(op());
    ctl.pause(); step(1); seq.push(op());
    ctl.resume(); ctl.pause(); step(1); seq.push(op());
    step(10); seq.push(op(), ctl.wordLanes().length);
    ctl.resume(); ctl.setHidden(false); step(3); seq.push(ctl.wordLanes().length);
    return seq;
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
