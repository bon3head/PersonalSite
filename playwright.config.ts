import { defineConfig } from '@playwright/test';

export default defineConfig({
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
