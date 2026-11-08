import { calculate } from './tipping.js';

export const STORAGE_KEY = 'utility-suite.trips.v1';
const inputKeys = ['destination', 'currency', 'subtotal', 'charges', 'tipPercent', 'diners'];
const resultKeys = ['subtotalCents', 'chargesCents', 'tipCents', 'totalCents', 'shares'];
const clone = value => JSON.parse(JSON.stringify(value));
const invalid = () => { throw new Error('Saved data is damaged or uses an unsupported version. It has not been overwritten. The calculator still works.'); };
function normalizedInputs(inputs) {
  if (!inputs || !['US', 'UK', 'FR'].includes(inputs.destination) || !['USD', 'GBP', 'EUR'].includes(inputs.currency)) {
    throw new Error('Choose a supported destination and currency.');
  }
  if (!inputKeys.every(key => typeof inputs[key] === 'string')) throw new Error('Calculation inputs are invalid.');
  return Object.fromEntries(inputKeys.map(key => [key, inputs[key]]));
}
export function prepareCalculation(inputs) {
  const clean = normalizedInputs(inputs);
  const result = calculate(clean);
  if (Object.keys(result.errors).length) throw new Error('Calculate a valid result before saving.');
  return { inputs: clone(clean), result: Object.fromEntries(resultKeys.map(key => [key, clone(result[key])])) };
}
export function isCurrent(calculation, inputs) {
  if (!calculation) return false;
  try { return JSON.stringify(calculation) === JSON.stringify(prepareCalculation(inputs)); }
  catch { return false; }
}
function validate(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.trips) || !Array.isArray(data.results)) invalid();
  const ids = new Set(); const names = new Set();
  for (const trip of data.trips) {
    if (!trip || typeof trip.id !== 'string' || !trip.id || ids.has(trip.id) || typeof trip.name !== 'string' ||
        !trip.name.trim() || trip.name !== trip.name.trim() || trip.name.length > 80 || names.has(trip.name.toLowerCase())) invalid();
    ids.add(trip.id); names.add(trip.name.toLowerCase());
  }
  const resultIds = new Set();
  for (const saved of data.results) {
    if (!saved || typeof saved.id !== 'string' || !saved.id || resultIds.has(saved.id) || !ids.has(saved.tripId) ||
        typeof saved.savedAt !== 'string' || !Number.isFinite(Date.parse(saved.savedAt))) invalid();
    try {
      const expected = prepareCalculation(saved.inputs);
      if (!resultKeys.every(key => JSON.stringify(saved.result?.[key]) === JSON.stringify(expected.result[key]))) invalid();
    } catch { invalid(); }
    resultIds.add(saved.id);
  }
  return data;
}

// Storage is accessed lazily: even accessing window.localStorage can throw.
export function createTripStore(getStorage, makeId = () => crypto.randomUUID(), now = () => new Date().toISOString()) {
  function read() {
    let raw;
    try { raw = getStorage().getItem(STORAGE_KEY); }
    catch { throw new Error('Local storage is unavailable. Trips cannot be loaded or saved; the calculator still works.'); }
    if (raw === null) return { version: 1, trips: [], results: [] };
    let data;
    try { data = JSON.parse(raw); } catch { invalid(); }
    return validate(data);
  }
  function write(data) {
    validate(data);
    try { getStorage().setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { throw new Error('Could not save to this browser (storage may be full or blocked). Nothing new was saved.'); }
  }
  return {
    load: () => clone(read()),
    createTrip(name) {
      const clean = name.trim();
      if (!clean || clean.length > 80) throw new Error('Enter a trip name from 1 to 80 characters.');
      const data = read();
      if (data.trips.some(trip => trip.name.toLowerCase() === clean.toLowerCase())) throw new Error('That trip already exists. Select it from the trip list.');
      const trip = { id: makeId(), name: clean };
      data.trips.push(trip); write(data);
      return clone(trip);
    },
    save(tripId, calculation, inputs) {
      if (!isCurrent(calculation, inputs)) throw new Error('Result is invalid or out of date. Calculate again before saving.');
      const data = read();
      if (!data.trips.some(trip => trip.id === tripId)) throw new Error('Create or select a trip before saving.');
      const saved = { id: makeId(), tripId, ...clone(calculation), savedAt: now() };
      data.results.push(saved); write(data);
      return clone(saved);
    },
  };
}
