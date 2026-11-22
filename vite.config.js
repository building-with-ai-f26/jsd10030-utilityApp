import { defineConfig, loadEnv } from 'vite';
import { validateAccountConfig } from './account-config.js';

export default defineConfig(({ mode }) => {
  validateAccountConfig(loadEnv(mode, process.cwd(), 'VITE_'));
  return { server: { proxy: { '/api': 'http://127.0.0.1:3001' } } };
});
