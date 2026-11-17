import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const apiOrigin = process.env.VITE_API_ORIGIN;
if (!apiOrigin || new URL(apiOrigin).protocol !== 'https:' || new URL(apiOrigin).origin !== apiOrigin) {
  throw new Error('Set VITE_API_ORIGIN to the verified HTTPS backend origin (no path or trailing slash) before publishing.');
}

export default defineConfig({
  define: { 'import.meta.env.VITE_API_ORIGIN': JSON.stringify(apiOrigin) },
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
