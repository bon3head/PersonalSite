import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// P-DEV-1: the dev HUD loads only from the dev server. This plugin
// applies to serve only, never to build, so no HUD code, loader, or
// ?hud=1 branch can reach the production bundle. The loader checks
// the query at runtime and imports src/dev/hud.ts only then.
function devHudServeOnly() {
  return {
    name: 'jp-dev-hud-serve-only',
    apply: 'serve' as const,
    transformIndexHtml(html: string) {
      const loader = `<script type="module">
if (new URLSearchParams(window.location.search).get('hud') === '1') {
  import('/src/dev/hud.ts').then((m) => m.mountDevHud()).catch(() => {});
}
</script>`;
      return html.replace('</body>', `${loader}</body>`);
    },
  };
}

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
  plugins: [react(), devHudServeOnly()],
});
