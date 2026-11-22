import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudTripStore } from '../src/cloud-trips.js';
import { createTripStore, prepareCalculation } from '../src/trips.js';

const inputs = { destination: 'US', currency: 'USD', subtotal: '100', charges: '8', tipPercent: '20', diners: '2', splitMode: 'by_person', personSubtotals: ['30', '70'] };
function fakeClient() {
  const rows = { utility_trips: [], utility_bills: [] }; const requests = []; let error = false; let hold;
  return { rows, requests, fail: () => { error = true; }, hold: promise => { hold = promise; },
    from(table) {
      const request = { table, filters: [], operation: 'select' }; requests.push(request);
      const query = {
        select() { return this; }, eq(key, value) { request.filters.push([key, value]); return this; }, order() { return this; },
        insert(value) { request.operation = 'insert'; request.value = structuredClone(value); return this; },
        single() { request.single = true; return this; },
        async then(resolve, reject) {
          try {
            if (hold) await hold;
            if (error) return resolve({ data: null, error: { message: 'PRIVATE DATABASE ERROR' } });
            let data;
            if (request.operation === 'insert') {
              data = { ...structuredClone(request.value), id: `id-${rows[table].length}`, created_at: '2026-11-22T12:00:00Z' };
              rows[table].push(data);
            } else data = structuredClone(rows[table].filter(row => request.filters.every(([key, value]) => row[key] === value)));
            resolve({ data, error: null });
          } catch (error) { reject(error); }
        },
      };
      return query;
    },
  };
}
test('owner A can save an exact private 30/70 snapshot and reopen from a fresh store; guest records unchanged', async () => {
  const client = fakeClient(); const store = createCloudTripStore(client); store.setOwner('A');
  const guest = new Map(); const guestStore = createTripStore(() => ({getItem:k=>guest.get(k)??null,setItem:(k,v)=>guest.set(k,v)}),()=> 'guest-trip');
  guestStore.createTrip('Existing guest'); const originalGuest = [...guest];
  const trip = await store.createTrip('Dinner'); const calculation = prepareCalculation(inputs);
  const saved = await store.save(trip.id, calculation, inputs);
  calculation.result.shares[0] = 1; inputs.personSubtotals[0] = '31';
  try {
    const reopened = createCloudTripStore(client); reopened.setOwner('A');
    const data = await reopened.load();
    assert.deepEqual(data.results[0].result.shares, [3840, 8960]);
    assert.deepEqual(data.results[0].result.breakdown, saved.result.breakdown);
    assert.equal(data.results[0].result.totalCents, 12800);assert.equal(data.results[0].splitMode,'by_person');
    assert.deepEqual(data.results[0].inputs.personSubtotals,['30','70']);
    assert.deepEqual([...guest], originalGuest);
    const payload = client.requests.find(r=>r.table==='utility_bills'&&r.operation==='insert').value;
    assert.equal(payload.owner_id,'A');assert.equal(payload.trip_id,trip.id);
    assert.deepEqual(Object.keys(payload.snapshot).sort(),['inputs','result','snapshotVersion','splitMode']);
  } finally { inputs.personSubtotals[0]='30'; }
});
test('client scopes all reads by current owner and guest has no private access (not a live RLS proof)',async()=>{
  const client=fakeClient();const store=createCloudTripStore(client);
  await assert.rejects(store.load(),/Sign in/);store.setOwner('A');await store.createTrip('A private');
  store.setOwner('B');assert.deepEqual(await store.load(),{version:1,trips:[],results:[]});
  for(const req of client.requests.filter(r=>r.operation==='select'))assert.ok(req.filters.some(([k,v])=>k==='owner_id'&&v==='B'));
});
test('invalid/stale save is rejected before network; failures never return success or raw database text',async()=>{
  const client=fakeClient();const store=createCloudTripStore(client);store.setOwner('A');
  await assert.rejects(store.save('t',prepareCalculation(inputs),{...inputs,tipPercent:'25'}),/out of date/);
  assert.equal(client.requests.length,0);client.fail();
  await assert.rejects(store.save('t',prepareCalculation(inputs),inputs),e=>!/PRIVATE/.test(e.message)&&/failed/.test(e.message));
});
test('sign-out/account switch invalidates pending private reads and writes',async()=>{
  for(const action of ['load','save']){
    const client=fakeClient();let release;client.hold(new Promise(r=>{release=r;}));
    const store=createCloudTripStore(client);store.setOwner('A');
    const promise=action==='load'?store.load():store.save('t',prepareCalculation(inputs),inputs);
    store.setOwner(null);store.setOwner('B');release();
    await assert.rejects(promise,/Account changed/);
  }
});
test('rejects corrupted saved snapshots rather than rendering invented shares',async()=>{
  const client=fakeClient();client.rows.utility_trips.push({owner_id:'A',id:'t',name:'Dinner'});
  client.rows.utility_bills.push({owner_id:'A',id:'b',trip_id:'t',created_at:'2026-11-22T12:00:00Z',snapshot:{snapshotVersion:2,splitMode:'by_person',...prepareCalculation(inputs)}});
  client.rows.utility_bills[0].snapshot.result.shares[0]=1;
  const store=createCloudTripStore(client);store.setOwner('A');await assert.rejects(store.load(),/damaged/);
});


test('Postgres jsonb object-key order does not change or invalidate exact saved shares',async()=>{
  const client=fakeClient();const store=createCloudTripStore(client);store.setOwner('A');
  const trip=await store.createTrip('Dinner');await store.save(trip.id,prepareCalculation(inputs),inputs);
  function reorder(value) {
    if(Array.isArray(value))return value.map(reorder);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reorder(item)]));
    return value;
  }
  client.rows.utility_bills[0].snapshot=reorder(client.rows.utility_bills[0].snapshot);
  const loaded=await store.load();assert.deepEqual(loaded.results[0].result.shares,[3840,8960]);
  assert.deepEqual(loaded.results[0].result.breakdown,prepareCalculation(inputs).result.breakdown);
});
