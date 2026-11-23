// LOCAL_PRIVACY_CHECKER_DEV_ONLY — never imported by a production build.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const referenceKeys = ['version', 'project', 'owner', 'trip', 'bill', 'verifiedAt'];
const result = (reason = 'Not run') => ({ outcome: 'INCONCLUSIVE', reason, accountVerified: false,
  tripStatus: 'not run', tripRows: null, billStatus: 'not run', billRows: null });

export function createLocalPrivacyChecker(client, { projectOrigin, getExpectedOwner,
  timeoutMs = 12000, now = () => Date.now() } = {}) {
  const project = new URL(projectOrigin).origin;
  let revision = 0;
  const invalidate = () => { revision++; };
  async function bounded(promise) {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('inconclusive')), timeoutMs);
      })]);
    } finally { clearTimeout(timer); }
  }
  function encodeReference(ref) { return JSON.stringify(ref); }
  function decodeReference(text) {
    if (typeof text !== 'string' || text.length > 2048) throw new Error('inconclusive');
    const ref = JSON.parse(text);
    if (!ref || Object.keys(ref).sort().join() !== [...referenceKeys].sort().join() ||
        ref.version !== 1 || ref.project !== project ||
        ![ref.owner, ref.trip, ref.bill].every(id => typeof id === 'string' && uuid.test(id)) ||
        !Number.isFinite(Date.parse(ref.verifiedAt)) || Date.parse(ref.verifiedAt) > now() + 60000 ||
        now() - Date.parse(ref.verifiedAt) > 86400000) throw new Error('inconclusive');
    return ref;
  }
  async function verifiedUser(email, scope) {
    if (!email || !email.includes('@')) throw new Error('inconclusive');
    const sessionResponse = await bounded(client.auth.getSession());
    const session = sessionResponse.data?.session;
    if (sessionResponse.error || !session?.user?.id || !session.expires_at || session.expires_at * 1000 <= now()) throw new Error('inconclusive');
    const response = await bounded(client.auth.getUser());
    const user = response.data?.user;
    if (response.error || !user?.id || !user.email || user.id !== session.user.id ||
        user.email.toLowerCase() !== email.trim().toLowerCase() ||
        user.id !== getExpectedOwner() || scope !== revision) throw new Error('inconclusive');
    return user;
  }
  async function reads(trip, bill, ownerMode) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Exact IDs only. Deliberately NO owner_id filter: Postgres RLS must do the isolation.
      return await bounded(Promise.all([
        client.from('utility_trips').select(ownerMode ? 'id,owner_id,name' : 'id').eq('id', trip).abortSignal(controller.signal),
        client.from('utility_bills').select(ownerMode ? 'id,trip_id,owner_id,snapshot' : 'id,trip_id').eq('id', bill).eq('trip_id', trip).abortSignal(controller.signal),
      ]));
    } finally { clearTimeout(timer); controller.abort(); }
  }
  function readStats(out, responses) {
    for (const [index, label] of ['trip','bill'].entries()) {
      const response = responses[index];
      out[`${label}Status`] = Number.isInteger(response?.status) && response.status > 0 ? response.status : 'network error';
      out[`${label}Rows`] = Array.isArray(response?.data) ? response.data.length : null;
    }
    return responses.every(r => !r.error && r.status === 200 && Array.isArray(r.data));
  }
  async function run(mode, { email, selection, reference }) {
    const scope = ++revision;
    const out = result('Wrong account, invalid reference, expired session or unavailable request.');
    try {
      const ref = mode === 'other' ? decodeReference(reference) : null;
      const user = await verifiedUser(email, scope);
      out.accountVerified = true;
      if (ref && user.id === ref.owner) return { ...out, accountVerified: false, reason: 'Wrong account: Account B must differ from Account A.' };
      if (!ref && (!selection || !uuid.test(selection.tripId) || !uuid.test(selection.billId))) {
        return { ...out, reason: 'Open the existing test bill in Private account first.' };
      }
      const trip = ref?.trip ?? selection.tripId;
      const bill = ref?.bill ?? selection.billId;
      const responses = await reads(trip, bill, mode === 'owner');
      const completed = readStats(out, responses);
      // Detect sign-out, account switches and revoked/expired sessions during the request.
      const after = await verifiedUser(email, scope);
      if (after.id !== user.id || scope !== revision) return { ...out, accountVerified: false };
      if (!completed) return { ...out, reason: 'A read failed; permissions are not verified by this result.' };
      if (mode === 'owner') {
        const t = responses[0].data[0]; const b = responses[1].data[0];
        if (out.tripRows !== 1 || out.billRows !== 1 || t.id !== trip || b.id !== bill || b.trip_id !== trip ||
            t.owner_id !== user.id || b.owner_id !== user.id || t.name !== 'build 3 private test' ||
            b.snapshot?.splitMode !== 'by_person' || b.snapshot?.result?.totalCents !== 12800 ||
            JSON.stringify([...(b.snapshot?.result?.shares ?? [])].sort((a,b)=>a-b)) !== '[3840,8960]') {
          return { ...out, reason: 'The selected records are not the expected existing private test bill.' };
        }
        return { ...out, outcome: 'A BASELINE VERIFIED', reason: 'Exact trip and existing bill are readable by A.',
          reference: encodeReference({ version: 1, project, owner: user.id, trip, bill, verifiedAt: new Date(now()).toISOString() }) };
      }
      return { ...out, outcome: out.tripRows === 0 && out.billRows === 0 ? 'B READ ISOLATION VERIFIED' : 'FAIL: PRIVATE ROWS VISIBLE',
        reason: out.tripRows === 0 && out.billRows === 0 ? 'Both exact-ID reads completed with zero rows.' : 'Stop release and review row-level security.' };
    } catch {
      return { ...out, accountVerified: false, outcome: 'INCONCLUSIVE', reason: 'Account, session, reference or network could not be verified. No privacy pass recorded.' };
    }
  }
  return { invalidate, checkOwner: options => run('owner', options), checkOther: options => run('other', options) };
}
