import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/jsd10030-utilityApp/app/',
  publicDir: false,
  envDir: false,
  build: {
    // This directory contains generated files only. Never use docs/ as outDir.
    outDir: 'docs/app',
    emptyOutDir: true,
  },
});
