import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchConversion, convertCents, createConversionLoader, RATE_API } from '../src/conversion.js';

// Synthetic test fixtures only. Production rates always come from the API.
const request = { totalCents: 12800, base: 'USD', target: 'EUR' };
const sample = { date: '2026-11-13', base: 'USD', quote: 'EUR', rate: 0.9 };
const options = data => ({
  fetchImpl: async () => ({ ok: true, json: async () => data }),
  now: () => new Date('2026-11-15T12:00:00Z'),
});

test('requests only the backend currency pair without bill amounts or credentials', async () => {
  let observed;
  const result = await fetchConversion(request, {
    ...options(sample),
    fetchImpl: async (url, config) => {
      observed = { url, config };
      return { ok: true, json: async () => sample };
    },
  });
  assert.equal(observed.url, `${RATE_API}?base=USD&target=EUR`);
  assert.equal(observed.config.credentials, 'omit');
  assert.equal(result.totalCents, 12800);
  assert.equal(result.convertedCents, 11520);
  assert.equal(result.rate, 0.9);
  assert.equal(result.rateDate, '2026-11-13');
  assert.equal(result.base, 'USD');
  assert.equal(result.target, 'EUR');
});

test('HKD target is supported without adding it as a calculator base currency', async () => {
  const result = await fetchConversion({ ...request, target: 'HKD' }, options({ ...sample, quote: 'HKD', rate: 7.8 }));
  assert.equal(result.convertedCents, 99840);
  await assert.rejects(fetchConversion({ ...request, base: 'HKD' }, options(sample)), /supported/);
});

test('rounds decimal rates to cents once, half up, including scientific notation', () => {
  assert.equal(convertCents(1, 0.5), 1);
  assert.equal(convertCents(1, 0.49), 0);
  assert.equal(convertCents(100, 1.005), 101);
  assert.equal(convertCents(100000000, 1e-7), 10);
  assert.equal(convertCents(1, 1e5), 100000);
  assert.equal(convertCents(0, 0.9), 0);
  assert.throws(() => convertCents(Number.MAX_SAFE_INTEGER, 2), /too large/);
});

for (const rate of [0, -1, NaN, Infinity, '0.9', null, undefined]) {
  test(`reject malformed rate ${String(rate)}`, async () => {
    await assert.rejects(fetchConversion(request, options({ ...sample, rate })), /invalid exchange rate/);
  });
}
for (const [label, data] of [
  ['missing response', null], ['missing rate', { ...sample, rate: undefined }],
  ['wrong base', { ...sample, base: 'GBP' }], ['wrong target', { ...sample, quote: 'HKD' }],
  ['missing date', { ...sample, date: undefined }], ['bad date', { ...sample, date: 'not a date' }],
  ['impossible date', { ...sample, date: '2026-02-30' }], ['future date', { ...sample, date: '2026-11-16' }],
]) {
  test(`reject ${label} rather than inventing a rate or date`, async () => {
    await assert.rejects(fetchConversion(request, options(data)));
  });
}

test('reject invalid requests before accessing the network', async () => {
  let calls = 0;
  for (const bad of [
    { ...request, target: 'USD' }, { ...request, target: 'XYZ' },
    { ...request, totalCents: -1 }, { ...request, totalCents: 1.5 },
    { ...request, totalCents: NaN },
  ]) await assert.rejects(fetchConversion(bad, { fetchImpl: () => { calls += 1; } }));
  assert.equal(calls, 0);
});

for (const status of [404, 422, 429, 500]) {
  test(`HTTP ${status} fails without a fallback rate`, async () => {
    await assert.rejects(fetchConversion(request, { fetchImpl: async () => ({ ok: false, status }) }), /unavailable|busy|could not complete/);
  });
}
test('network failure and unreadable JSON produce honest errors', async () => {
  await assert.rejects(fetchConversion(request, { fetchImpl: async () => { throw new TypeError('network'); } }), /Could not reach/);
  await assert.rejects(fetchConversion(request, { fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } }) }), /unreadable/);
});
test('timeout covers hanging requests and hanging response bodies', async () => {
  for (const fetchImpl of [
    () => new Promise(() => {}),
    async () => ({ ok: true, json: () => new Promise(() => {}) }),
  ]) await assert.rejects(fetchConversion(request, { fetchImpl, timeoutMs: 10 }), /timed out/);
});
test('cancellation stops pending work and pre-cancelled requests do not fetch', async () => {
  const controller = new AbortController();
  const pending = fetchConversion(request, { signal: controller.signal, fetchImpl: () => new Promise(() => {}) });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  let calls = 0;
  await assert.rejects(fetchConversion(request, { signal: controller.signal, fetchImpl: () => { calls += 1; } }), { name: 'AbortError' });
  assert.equal(calls, 0);
});
test('input reset discards a late response even if cancellation is ignored', async () => {
  let resolve;
  const loader = createConversionLoader(() => new Promise(done => { resolve = done; }));
  const pending = loader.load(request);
  loader.reset();
  resolve({ convertedCents: 11520 });
  assert.equal(await pending, null);
});
test('only the latest target request can return a result', async () => {
  const pending = [];
  const loader = createConversionLoader(() => new Promise((resolve, reject) => pending.push({ resolve, reject })));
  const first = loader.load(request);
  const second = loader.load({ ...request, target: 'HKD' });
  pending[1].resolve({ convertedCents: 99840 });
  assert.deepEqual(await second, { convertedCents: 99840 });
  pending[0].reject(new Error('old error'));
  assert.equal(await first, null);
});
test('a current request failure is still reported', async () => {
  const loader = createConversionLoader(async () => { throw new Error('provider unavailable'); });
  await assert.rejects(loader.load(request), /provider unavailable/);
});
