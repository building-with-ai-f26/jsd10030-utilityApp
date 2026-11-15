import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/tipping.js';
import { createTripStore, prepareCalculation, isCurrent, STORAGE_KEY } from '../src/trips.js';
const input = overrides => ({ destination: 'US', currency: 'USD', subtotal: '100', charges: '8', tipPercent: '20', diners: '2', splitMode: 'by_person', personSubtotals: ['30', '70'], ...overrides });

test('30/70 example allocates 8 charges and 20 tip into 38.40 and 89.60', () => {
  const result = calculate(input());
  assert.deepEqual(result.errors, {});
  assert.equal(result.totalCents, 12800);
  assert.deepEqual(result.shares, [3840, 8960]);
  assert.deepEqual(result.breakdown, [
    { subtotalCents: 3000, chargesCents: 240, tipCents: 600, totalCents: 3840 },
    { subtotalCents: 7000, chargesCents: 560, tipCents: 1400, totalCents: 8960 },
  ]);
});
test('largest remainders win; ties use diner order, independently for charges and tip', () => {
  const result = calculate(input({ subtotal: '0.04', charges: '0.02', tipPercent: '50', diners: '3', personSubtotals: ['0.01', '0.01', '0.02'] }));
  assert.deepEqual(result.breakdown.map(row => row.chargesCents), [1, 0, 1]);
  assert.deepEqual(result.breakdown.map(row => row.tipCents), [1, 0, 1]);
  assert.deepEqual(result.shares, [3, 1, 4]);
});
test('a larger fractional remainder takes priority over diner order', () => {
  const result = calculate(input({ charges: '0.01', tipPercent: '0' }));
  assert.deepEqual(result.breakdown.map(row => row.chargesCents), [0, 1]);
});
test('allocates the whole-bill rounded tip, not separately rounded diner tips', () => {
  const result = calculate(input({ subtotal: '0.05', charges: '0', tipPercent: '10', personSubtotals: ['0.02', '0.03'] }));
  assert.equal(result.tipCents, 1);
  assert.deepEqual(result.breakdown.map(row => row.tipCents), [0, 1]);
});
test('zero subtotal diners get zero charges, zero tip and a zero share', () => {
  const result = calculate(input({ diners: '3', personSubtotals: ['0', '30', '70'] }));
  assert.deepEqual(result.breakdown[0], { subtotalCents: 0, chargesCents: 0, tipCents: 0, totalCents: 0 });
  assert.deepEqual(result.shares, [0, 3840, 8960]);
});
for (const [name, overrides, field] of [
  ['sum mismatch', { personSubtotals: ['30', '60'] }, 'personSubtotals'],
  ['zero combined', { subtotal: '0', personSubtotals: ['0', '0'] }, 'personSubtotals'],
  ['missing row', { personSubtotals: ['100'] }, 'personSubtotals'],
  ['missing rows', { personSubtotals: undefined }, 'personSubtotals'],
  ['negative', { personSubtotals: ['-1', '101'] }, 'person-0'],
  ['blank', { personSubtotals: ['', '100'] }, 'person-0'],
  ['fractional cent', { personSubtotals: ['30.001', '69.999'] }, 'person-0'],
  ['non-finite', { personSubtotals: ['Infinity', '0'] }, 'person-0'],
  ['too large', { personSubtotals: ['1000001', '0'] }, 'person-0'],
  ['zero diners', { diners: '0' }, 'diners'],
  ['fractional diners', { diners: '2.5' }, 'diners'],
  ['unknown mode', { splitMode: 'unknown' }, 'splitMode'],
]) test(`reject ${name} with no shares`, () => {
  const result = calculate(input(overrides));
  assert.ok(result.errors[field]);
  assert.equal(result.shares, undefined);
});
test('all subtotal, charge, tip and share sums are exact over many uneven cases', () => {
  for (let count = 1; count <= 12; count += 1) {
    const cents = Array.from({ length: count }, (_, i) => i * 7 + 1);
    const subtotal = cents.reduce((a, b) => a + b, 0);
    for (const charges of ['0', '0.01', '1.17', '8.13']) {
      const result = calculate(input({ subtotal: (subtotal / 100).toFixed(2), charges, tipPercent: '17.25', diners: String(count), personSubtotals: cents.map(n => (n / 100).toFixed(2)) }));
      assert.deepEqual(result.errors, {});
      for (const key of ['subtotalCents', 'chargesCents', 'tipCents', 'totalCents']) assert.equal(result.breakdown.reduce((sum, row) => sum + row[key], 0), result[key]);
      assert.equal(result.shares.reduce((a, b) => a + b, 0), result.totalCents);
      assert.ok(result.breakdown.every(row => Object.values(row).every(Number.isSafeInteger)));
    }
  }
});
test('equal mode ignores hidden person inputs and preserves zero-bill behavior', () => {
  assert.deepEqual(calculate(input({ splitMode: 'equal', personSubtotals: ['bad'] })).shares, [6400, 6400]);
  assert.deepEqual(calculate(input({ splitMode: 'equal', subtotal: '0', charges: '0' })).shares, [0, 0]);
});
function fixture() {
  const values = new Map(); let id = 0;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const factory = () => createTripStore(() => storage, () => String(++id), () => '2026-11-15T15:00:00Z');
  return { values, factory, store: factory() };
}
test('By person snapshot saves/reopens its mode, inputs and independent breakdown', () => {
  const { store, factory } = fixture(); const trip = store.createTrip('Test');
  const source = input(); const calculation = prepareCalculation(source);
  const saved = store.save(trip.id, calculation, source);
  assert.equal(saved.snapshotVersion, 2); assert.equal(saved.splitMode, 'by_person');
  assert.deepEqual(saved.result.shares, [3840, 8960]);
  source.personSubtotals[0] = '0'; calculation.result.breakdown[0].tipCents = 0;
  assert.deepEqual(factory().load().results[0], saved);
});
test('changing modes or diner allocations invalidates a previous calculation', () => {
  const source = input(); const calculation = prepareCalculation(source);
  assert.equal(isCurrent(calculation, input({ splitMode: 'equal' })), false);
  assert.equal(isCurrent(calculation, input({ personSubtotals: ['40', '60'] })), false);
  const { store } = fixture(); const trip = store.createTrip('Test');
  assert.throws(() => store.save(trip.id, calculation, input({ personSubtotals: ['40', '60'] })), /out of date/);
});
test('legacy version-1 snapshots reopen unchanged alongside new custom results', () => {
  const { store, factory, values } = fixture();
  const legacyInputs = { destination: 'US', currency: 'USD', subtotal: '100', charges: '8', tipPercent: '20', diners: '3' };
  const legacyResult = { subtotalCents: 10000, chargesCents: 800, tipCents: 2000, totalCents: 12800, shares: [4267, 4267, 4266] };
  const legacy = { id: 'old-result', tripId: 'old-trip', savedAt: '2026-11-08T15:00:00Z', inputs: legacyInputs, result: legacyResult };
  const raw = JSON.stringify({ version: 1, trips: [{ id: 'old-trip', name: 'Old trip' }], results: [legacy] });
  values.set(STORAGE_KEY, raw);
  assert.deepEqual(store.load().results[0], legacy);
  assert.equal(values.get(STORAGE_KEY), raw); // reading never migrates/recalculates records
  store.save('old-trip', prepareCalculation(input()), input());
  const reopened = factory().load().results;
  assert.deepEqual(reopened[0], legacy);
  assert.equal(reopened[1].splitMode, 'by_person');
});
test('tampered custom breakdown or mode is rejected without overwriting stored history', () => {
  const { store, values } = fixture(); const trip = store.createTrip('Test');
  store.save(trip.id, prepareCalculation(input()), input()); const original = values.get(STORAGE_KEY);
  for (const damage of [
    data => { data.results[0].result.breakdown[0].tipCents += 1; },
    data => { data.results[0].splitMode = 'equal'; },
    data => { data.results[0].snapshotVersion = 99; },
  ]) {
    const data = JSON.parse(original); damage(data); const raw = JSON.stringify(data); values.set(STORAGE_KEY, raw);
    assert.throws(() => store.load(), /damaged/);
    assert.throws(() => store.createTrip('Other'), /damaged/);
    assert.equal(values.get(STORAGE_KEY), raw);
  }
});
