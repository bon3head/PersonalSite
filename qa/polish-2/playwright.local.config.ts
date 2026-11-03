import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';
// Local harness (not the gate): the repo config, unchanged, plus a
// locally installed Chromium, for machines without the pinned build
// (1248). Set PW_CHROMIUM to its path. SwiftShader flags for headless.
export default defineConfig({
  ...base,
  testDir: '../../tests',
  reporter: 'line',
  use: {
    ...(base.use ?? {}),
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
});
