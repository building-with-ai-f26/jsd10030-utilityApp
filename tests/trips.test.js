import test from 'node:test';
import assert from 'node:assert/strict';
import { createTripStore, prepareCalculation, isCurrent, STORAGE_KEY } from '../src/trips.js';
const inputs = () => ({ destination: 'US', currency: 'USD', subtotal: '100', charges: '8', tipPercent: '20', diners: '3' });
function setup() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  let id = 0;
  const factory = () => createTripStore(() => storage, () => `id-${++id}`, () => '2026-11-08T15:00:00.000Z');
  return { values, storage, factory, store: factory() };
}
test('empty history loads without writing anything', () => {
  const { store, values } = setup();
  assert.deepEqual(store.load(), { version: 1, trips: [], results: [] });
  assert.equal(values.size, 0);
});
test('create trip trims name and rejects empty, long or duplicate names', () => {
  const { store } = setup();
  assert.equal(store.createTrip(' Paris ').name, 'Paris');
  for (const name of ['', '   ', 'x'.repeat(81), 'PARIS']) assert.throws(() => store.createTrip(name));
  assert.equal(store.load().trips.length, 1);
});
test('calculation alone never saves; explicit save survives a fresh store instance', () => {
  const { store, factory } = setup();
  const trip = store.createTrip('Paris');
  const calculation = prepareCalculation(inputs());
  assert.equal(store.load().results.length, 0);
  const saved = store.save(trip.id, calculation, inputs());
  assert.equal(saved.tripId, trip.id);
  assert.deepEqual(saved.inputs, inputs());
  assert.equal(saved.savedAt, '2026-11-08T15:00:00.000Z');
  assert.equal(saved.result.tipCents, 2000);
  assert.equal(saved.result.totalCents, 12800);
  assert.deepEqual(saved.result.shares, [4267, 4267, 4266]);
  assert.deepEqual(factory().load().results, [saved]);
});
test('snapshots are independent of source inputs, calculation objects, and loaded objects', () => {
  const { store } = setup();
  const trip = store.createTrip('Weekend');
  const source = inputs(); const calculation = prepareCalculation(source);
  const saved = store.save(trip.id, calculation, source);
  source.subtotal = '1'; calculation.result.shares[0] = 0; saved.inputs.currency = 'GBP';
  const loaded = store.load(); loaded.results[0].result.totalCents = 1;
  const original = store.load().results[0];
  assert.equal(original.inputs.subtotal, '100');
  assert.equal(original.inputs.currency, 'USD');
  assert.deepEqual(original.result.shares, [4267, 4267, 4266]);
  assert.equal(original.result.totalCents, 12800);
});
test('reject missing, invalid, tampered and stale results for every input', () => {
  const { store } = setup(); const trip = store.createTrip('Trip');
  assert.throws(() => store.save(trip.id, null, inputs()), /out of date/);
  assert.throws(() => prepareCalculation({ ...inputs(), diners: '0' }), /valid/);
  assert.throws(() => store.save(trip.id, prepareCalculation(inputs()), { ...inputs(), diners: '0' }));
  for (const [key, value] of Object.entries({ destination:'FR', currency:'EUR', subtotal:'101', charges:'9', tipPercent:'21', diners:'4' })) {
    const changed = { ...inputs(), [key]: value };
    const calculation = prepareCalculation(inputs());
    assert.equal(isCurrent(calculation, changed), false);
    assert.throws(() => store.save(trip.id, calculation, changed), /out of date/);
  }
  const tampered = prepareCalculation(inputs()); tampered.result.totalCents = 1;
  assert.throws(() => store.save(trip.id, tampered, inputs()), /out of date/);
  assert.equal(store.load().results.length, 0);
});
test('results belong to their trip and unknown trips cannot receive saves', () => {
  const { store } = setup(); const first = store.createTrip('One'); const second = store.createTrip('Two');
  store.save(first.id, prepareCalculation(inputs()), inputs());
  const otherInputs = { ...inputs(), destination:'FR', currency:'EUR' };
  store.save(second.id, prepareCalculation(otherInputs), otherInputs);
  const data = store.load();
  assert.equal(data.results.filter(saved => saved.tripId === first.id).length, 1);
  assert.equal(data.results.filter(saved => saved.tripId === second.id)[0].inputs.currency, 'EUR');
  assert.throws(() => store.save('missing', prepareCalculation(inputs()), inputs()), /select a trip/);
});
for (const raw of ['{bad json', 'null', '{}', '{"version":2,"trips":[],"results":[]}', '{"version":1,"trips":{},"results":[]}']) {
  test(`damaged or unsupported storage is preserved: ${raw}`, () => {
    const { store, values } = setup(); values.set(STORAGE_KEY, raw);
    assert.throws(() => store.load(), /damaged/);
    assert.throws(() => store.createTrip('New'), /damaged/);
    assert.equal(values.get(STORAGE_KEY), raw);
  });
}
test('invalid stored records, dates, references and duplicate IDs are rejected without overwrite', () => {
  const { store, values } = setup(); const trip = store.createTrip('Trip');
  store.save(trip.id, prepareCalculation(inputs()), inputs());
  const original = values.get(STORAGE_KEY);
  for (const damage of [
    data => { data.results[0].result.shares[0] = 0; },
    data => { data.results[0].savedAt = 'nonsense'; },
    data => { data.results[0].tripId = 'unknown'; },
    data => { data.results[0].inputs.currency = 'XYZ'; },
    data => { data.trips.push(data.trips[0]); },
    data => { data.results.push(data.results[0]); },
  ]) {
    const data = JSON.parse(original); damage(data); const raw = JSON.stringify(data); values.set(STORAGE_KEY, raw);
    assert.throws(() => store.load(), /damaged/);
    assert.throws(() => store.createTrip('Another'), /damaged/);
    assert.equal(values.get(STORAGE_KEY), raw);
  }
});
test('storage access and read failures are handled', () => {
  for (const getStorage of [() => { throw new Error('blocked'); }, () => ({ getItem() { throw new Error('blocked'); } })]) {
    const store = createTripStore(getStorage);
    assert.throws(() => store.load(), /unavailable/);
    assert.throws(() => store.createTrip('Trip'), /unavailable/);
  }
});
test('failed writes never report success or change previously persisted history', () => {
  const { store, storage, values } = setup(); const trip = store.createTrip('Trip');
  const original = values.get(STORAGE_KEY);
  storage.setItem = () => { throw new Error('quota exceeded'); };
  assert.throws(() => store.save(trip.id, prepareCalculation(inputs()), inputs()), /Nothing new was saved/);
  assert.throws(() => store.createTrip('Other'), /Nothing new was saved/);
  assert.equal(values.get(STORAGE_KEY), original);
  assert.equal(store.load().results.length, 0);
});
