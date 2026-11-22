import { prepareCalculation, isCurrent, validateTripData } from './trips.js';

const copy = value => JSON.parse(JSON.stringify(value));
export function createCloudTripStore(client) {
  let owner = null;
  let revision = 0;
  function context() {
    if (!owner) throw new Error('Sign in before using private trips.');
    return { owner, revision };
  }
  function check(captured) {
    if (owner !== captured.owner || revision !== captured.revision) throw new Error('Account changed. Private data was cleared; try again.');
  }
  async function query(builder, captured, message) {
    let response;
    try { response = await builder; } catch { check(captured); throw new Error(message); }
    check(captured);
    if (response.error) throw new Error(message);
    return response.data;
  }
  return {
    setOwner(id) { if (owner !== id) { owner = id; revision++; } },
    async load() {
      const c = context();
      const [trips, bills] = await Promise.all([
        query(client.from('utility_trips').select('id,name').eq('owner_id', c.owner).order('created_at'), c, 'Private trips could not be loaded. Check your connection and setup.'),
        query(client.from('utility_bills').select('id,trip_id,snapshot,created_at').eq('owner_id', c.owner).order('created_at'), c, 'Private bills could not be loaded. Check your connection and setup.'),
      ]);
      const data = { version: 1, trips, results: bills.map(row => ({ ...row.snapshot, id: row.id, tripId: row.trip_id, savedAt: row.created_at })) };
      return copy(validateTripData(data));
    },
    async createTrip(name) {
      const c = context(); const clean = name.trim();
      if (!clean || clean.length > 80) throw new Error('Enter a trip name from 1 to 80 characters.');
      const trip = await query(client.from('utility_trips').insert({ owner_id: c.owner, name: clean }).select('id,name').single(), c, 'Could not create private trip. Use a unique name and check your connection.');
      if (!trip?.id || trip.name !== clean) throw new Error('Private trip response was invalid.');
      return copy(trip);
    },
    async save(tripId, calculation, inputs) {
      const c = context();
      if (!tripId || !isCurrent(calculation, inputs)) throw new Error('Result is invalid or out of date. Calculate again before saving.');
      // Only validated original-currency calculation data is sent. No conversion or account email.
      const snapshot = { snapshotVersion: 2, splitMode: calculation.inputs.splitMode ?? 'equal', ...prepareCalculation(inputs) };
      const row = await query(client.from('utility_bills').insert({ owner_id: c.owner, trip_id: tripId, snapshot: copy(snapshot) }).select('id,trip_id,snapshot,created_at').single(), c, 'Private save failed. Nothing is confirmed saved; check your connection and retry.');
      if (!row?.id || row.trip_id !== tripId || !Number.isFinite(Date.parse(row.created_at))) throw new Error('Private save response was invalid.');
      const saved = { ...row.snapshot, id: row.id, tripId: tripId, savedAt: row.created_at };
      validateTripData({ version: 1, trips: [{ id: tripId, name: 'Validation' }], results: [saved] });
      if (JSON.stringify(prepareCalculation(saved.inputs)) !== JSON.stringify(prepareCalculation(inputs))) throw new Error('Private save response did not match the calculation.');
      return copy(saved);
    },
  };
}
