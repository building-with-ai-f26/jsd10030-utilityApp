// Build-time guard: VITE_* values are public and must never contain private keys.
export function validateAccountConfig(env) {
  const url = env.VITE_SUPABASE_URL || '';
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  if (!url && !key) return;
  if (!url || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('Provide both Supabase URL and a browser publishable key. Private or legacy service keys must never use VITE_* settings.');
  }
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Supabase URL must be an HTTPS project origin.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
    throw new Error('Supabase URL must be an HTTPS project origin without credentials, query or path.');
  }
}
