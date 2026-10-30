import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Serial: SwiftShader WebGL pages contend for CPU, and parallel
  // workers cause timing flakes (T-LL-4 button wait, T-SRV-6 LCP,
  // T-SQ-3 camera settle) that pass in isolation. The gate must be
  // deterministic, not fast; it runs at wave boundaries.
  workers: 1,
  webServer: [
    {
      command: 'vite --port 5173 --strictPort --host 0.0.0.0',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'vite preview --port 4173 --strictPort --host 0.0.0.0',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
