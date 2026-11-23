import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { validateAccountConfig } from './account-config.js';
validateAccountConfig(process.env);

const apiOrigin = process.env.VITE_API_ORIGIN;
if (!apiOrigin || new URL(apiOrigin).protocol !== 'https:' || new URL(apiOrigin).origin !== apiOrigin) {
  throw new Error('Set VITE_API_ORIGIN to the verified HTTPS backend origin (no path or trailing slash) before publishing.');
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(apiOrigin),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
  },
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/jsd10030-utilityApp/app/',
  publicDir: false,
  envDir: false,
  build: {
    // Keep SDK whitespace literals escaped so generated files pass Git whitespace checks.
    rolldownOptions: { output: { minify: { codegen: { removeWhitespace: false } } } },
    // This directory contains generated files only. Never use docs/ as outDir.
    outDir: 'docs/app',
    emptyOutDir: true,
  },
});
