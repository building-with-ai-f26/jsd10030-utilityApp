import { createClient } from '@supabase/supabase-js';
import { createCloudTripStore } from './cloud-trips.js';

export function configuredSupabase(url, key) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && parsed.pathname === '/' && !/your-project|replace|example/i.test(url) &&
      typeof key === 'string' && /^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !/replace|placeholder/i.test(key);
  } catch { return false; }
}

// This module never calls analytics or renders email/account IDs.
export function mountAccountUI({ onChange, document: doc = document, client: suppliedClient, getSelectedBill = () => null } = {}) {
  const selector = doc.querySelector('#storage-mode');
  const status = doc.querySelector('#account-status');
  const login = doc.querySelector('#sign-in');
  const logout = doc.querySelector('#sign-out');
  const form = doc.querySelector('#account-form');
  const url = import.meta.env?.VITE_SUPABASE_URL;
  const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  let client = suppliedClient;
  if (!client && configuredSupabase(url, key)) {
    try { client = createClient(url, key, { auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true } }); }
    catch { /* Guest storage remains available if account setup fails. */ }
  }
  const cloud = client ? createCloudTripStore(client) : null;
  let owner = null;
  let signedOut = false;
  let authRevision = 0;
  let resetPrivacyCheck = () => {};
  selector.value = 'browser';
  function paint() {
    const option = doc.querySelector('#private-mode-option');
    option.disabled = !owner;
    logout.hidden = !owner;
    form.hidden = Boolean(owner);
  }
  function applySession(session) {
    const next = session?.user?.id ?? null;
    if (signedOut && next) return;
    const changed = next !== owner;
    owner = next;
    cloud?.setOwner(owner);
    if (changed) {
      resetPrivacyCheck();
      selector.value = owner ? 'private' : 'browser';
      onChange(); // Synchronous clearing before any asynchronous reads.
    }
    paint();
    status.textContent = owner ? 'Signed in. Choose browser or private account trips below.' : 'Guest mode. Trips stay in this browser.';
  }
  selector.addEventListener('change', () => {
    if (selector.value === 'private' && !owner) selector.value = 'browser';
    onChange();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return;
    const run = ++authRevision;
    signedOut = false;
    login.disabled = true;
    status.textContent = 'Signing in…';
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: doc.querySelector('#account-email').value.trim(), password: doc.querySelector('#account-password').value,
      });
      if (run !== authRevision) return;
      if (error || !data?.session) throw new Error('Sign-in failed. Check your credentials, email confirmation and connection.');
      applySession(data.session);
      doc.querySelector('#account-email').value = '';
    } catch {
      if (run === authRevision) status.textContent = 'Sign-in failed. Check your credentials, email confirmation and connection.';
    } finally {
      doc.querySelector('#account-password').value = '';
      login.disabled = !client;
    }
  });
  logout.addEventListener('click', async () => {
    signedOut = true; authRevision++; resetPrivacyCheck();
    owner = null; cloud?.setOwner(null);
    selector.value = 'browser';
    doc.querySelector('#account-email').value = '';
    doc.querySelector('#account-password').value = '';
    onChange(); // Remove all private DOM/state immediately, even if network sign-out fails.
    paint();
    status.textContent = 'Signing out…';
    login.disabled = true; logout.disabled = true;
    let failed = false;
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      failed = Boolean(error);
      status.textContent = error ? 'Private view cleared. Sign-out could not be confirmed; retry before leaving a shared device.' : 'Signed out on this browser. Private view cleared.';
    } catch { failed = true; status.textContent = 'Private view cleared. Sign-out could not be confirmed; retry before leaving a shared device.'; }
    // Retain a retry button on failure; never restore private results automatically here.
    logout.hidden = !failed; logout.disabled = false; login.disabled = !client;
  });
  if (client) {
    let sessionObserved = false;
    client.auth.onAuthStateChange((_event, session) => {
      sessionObserved = true;
      // Avoid calling other Supabase methods inside the auth callback/lock.
      queueMicrotask(() => applySession(session));
    });
    client.auth.getSession().then(({ data, error }) => {
      if (!sessionObserved && !signedOut && !error) applySession(data?.session);
      if (error) status.textContent = 'Account session unavailable. Guest trips remain available.';
    }).catch(() => { status.textContent = 'Account session unavailable. Guest trips remain available.'; });
    status.textContent = 'Checking account session. Guest trips remain available.';
  } else {
    login.disabled = true;
    status.textContent = 'Account storage is not configured yet. Guest trips remain available.';
  }
  paint();
  if (import.meta.env?.DEV && typeof window !== 'undefined' && ['localhost','127.0.0.1','[::1]'].includes(window.location.hostname) && client) {
    import('./local-privacy-ui.js').then(({ mountLocalPrivacyUI }) => {
      const privacy = mountLocalPrivacyUI({ client, projectOrigin: url, getExpectedOwner: () => owner, getSelectedBill, document: doc });
      resetPrivacyCheck = () => privacy?.reset();
    }).catch(() => { /* Optional development checker cannot break the calculator. */ });
  }
  return { isPrivate: () => selector.value === 'private' && Boolean(owner), cloud,
    label: () => selector.value === 'private' && owner ? 'Private account' : 'This browser' };
}
