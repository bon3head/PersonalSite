import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/troika-three-text') ||
            id.includes('/src/world/')
          ) {
            return 'world';
          }
          return undefined;
        },
      },
    },
    target: 'es2022',
  },
  plugins: [react()],
});
