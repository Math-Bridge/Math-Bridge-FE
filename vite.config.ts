import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: { port: 5173, host: true, strictPort: true },
  preview: { port: 5173, host: true, strictPort: true },

  build: {
    sourcemap: false,
    target: 'es2022',
  },

  // Use top-level `esbuild` options (typed by Vite) and avoid `import.meta.env` in config
 esbuild: {
  drop: (process.env?.NODE_ENV === 'production' ? ['console', 'debugger'] : []) as any,
},

define: process.env?.NODE_ENV
    ? { 'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()) }
    : {},
});
