// B1 S01 receipts: T-S01-3 (regimes resolve), T-S01-4 (accent per regime),
// T-S01-5 (coarse targets 44x44). Run against vite dev serving this repo.
// Usage: node qa/astryx/run-s01-tests.mjs (starts its own vite server)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 5199;
const BASE = `http://localhost:${PORT}/qa/astryx/test-page.html`;

const EXPECT = {
  void: { body: 'rgb(10, 12, 15)', btn: 'rgb(123, 181, 248)' },
  paper: { body: 'rgb(243, 240, 234)', btn: 'rgb(14, 53, 101)' },
  field: { body: 'rgb(16, 41, 78)', btn: 'rgb(123, 181, 248)' },
};

function startVite() {
  return new Promise((resolve, reject) => {
    const p = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    let out = '';
    p.stdout.on('data', (d) => {
      out += d;
      if (out.includes('Local:')) resolve(p);
    });
    p.stderr.on('data', () => {});
    setTimeout(() => reject(new Error('vite did not start in 30s')), 30000);
  });
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
}

const vite = await startVite();
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="primary-btn"]');

  for (const regime of ['void', 'paper', 'field']) {
    await page.evaluate((r) => document.documentElement.setAttribute('data-regime', r), regime);
    await page.waitForTimeout(800);
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(`T-S01-3 body bg on ${regime}`, bodyBg === EXPECT[regime].body, `got ${bodyBg}, want ${EXPECT[regime].body}`);
    const btnBg = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="primary-btn"]');
      return el ? getComputedStyle(el).backgroundColor : 'missing';
    });
    check(`T-S01-4 primary btn bg on ${regime}`, btnBg === EXPECT[regime].btn, `got ${btnBg}, want ${EXPECT[regime].btn}`);
    const shadow = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="primary-btn"]');
      return el ? getComputedStyle(el).boxShadow : 'missing';
    });
    check(`K-S01-2 no shadow on ${regime}`, shadow === 'none', `boxShadow=${shadow}`);
  }

  // T-S01-5: coarse pointer, mobile emulation
  const mpage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await mpage.goto(BASE, { waitUntil: 'networkidle' });
  await mpage.waitForSelector('[data-testid="primary-btn"]');
  const boxes = await mpage.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button, a')) {
      const r = el.getBoundingClientRect();
      out.push({ tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out;
  });
  for (const b of boxes) {
    check(`T-S01-5 coarse target ${b.tag} ${b.w}x${b.h}`, b.w >= 44 && b.h >= 44, `${b.w}x${b.h}`);
  }
  await browser.close();
} finally {
  vite.kill();
}

const failed = results.filter((r) => !r.pass);
const lines = ['# B1 S01 receipts', '', ...results.map((r) => `- ${r.pass ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`), '', `Total: ${results.length}, passed: ${results.length - failed.length}, failed: ${failed.length}`];
writeFileSync('qa/astryx/S01-RECEIPTS.md', lines.join('\n') + '\n');
console.log(lines[lines.length - 1]);
process.exit(failed.length ? 1 : 0);
