import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateServer, listenOptions } from '../server/rates.js';
const sample = { base: 'USD', quote: 'EUR', date: '2026-11-15', rate: 0.90285 };
async function run(t, options = {}) {
  const server = createRateServer({ now: () => new Date('2026-11-16T12:00:00Z'), ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return (path = '/api/rates?base=USD&target=EUR', init) => fetch(`http://127.0.0.1:${server.address().port}${path}`, init);
}
test('backend returns only validated rate metadata from the fixed upstream', async t => {
  let call;
  const request = await run(t, { fetchImpl: async (...args) => { call = args; return { ok: true, json: async () => ({ ...sample, private: 'excluded' }) }; } });
  const response = await request();
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), sample);
  assert.equal(call[0], 'https://api.frankfurter.dev/v2/rate/usd/eur');
  assert.equal(call[1].redirect, 'error'); assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('rejects unsupported, duplicate, missing, equal and extra parameters without upstream access', async t => {
  let calls = 0; const request = await run(t, { fetchImpl: async () => { calls++; } });
  for (const query of ['base=HKD&target=EUR', 'base=USD&target=XYZ', 'base=USD&target=USD', 'base=USD', 'base=USD&target=EUR&amount=128', 'base=USD&base=GBP&target=EUR', 'base=https://evil.example&target=EUR']) {
    assert.equal((await request('/api/rates?'+query)).status,400);
  }
  assert.equal((await request('/api/rates?base=USD&target=EUR',{method:'POST',body:'private'})).status,405);
  assert.equal((await request('/other')).status,404); assert.equal(calls,0);
});
for (const [status, expected] of [[404,404],[422,404],[429,429],[500,502]]) {
  test(`maps upstream ${status} honestly`,async t=>{
    const request=await run(t,{fetchImpl:async()=>({ok:false,status})});
    const res=await request();assert.equal(res.status,expected);assert.equal(typeof (await res.json()).error,'string');
  });
}
for (const data of [null,{...sample,rate:0},{...sample,rate:'0.9'},{...sample,base:'GBP'},{...sample,date:'2026-02-30'},{...sample,date:'2099-01-01'}]) {
  test(`rejects invalid upstream ${JSON.stringify(data)}`,async t=>{
    const request=await run(t,{fetchImpl:async()=>({ok:true,json:async()=>data})});assert.equal((await request()).status,502);
  });
}
test('handles network failures and unreadable responses without leaking upstream errors',async t=>{
  for(const fetchImpl of [async()=>{throw new Error('private upstream error');},async()=>({ok:true,json:async()=>{throw new Error('bad json');}})]){
    const request=await run(t,{fetchImpl});const res=await request();assert.equal(res.status,502);assert.doesNotMatch(await res.text(),/private upstream/);
  }
});
test('deadline bounds hanging fetch and response bodies',async t=>{
  for(const fetchImpl of [()=>new Promise(()=>{}),async()=>({ok:true,json:()=>new Promise(()=>{})})]){
    const request=await run(t,{fetchImpl,timeoutMs:10});assert.equal((await request()).status,504);
  }
});
test('allows configured production origin and rejects other origins',async t=>{
  const request=await run(t,{allowedOrigin:'https://building-with-ai-f26.github.io',fetchImpl:async()=>({ok:true,json:async()=>sample})});
  const good=await request(undefined,{headers:{Origin:'https://building-with-ai-f26.github.io'}});
  assert.equal(good.status,200);assert.equal(good.headers.get('access-control-allow-origin'),'https://building-with-ai-f26.github.io');
  assert.equal((await request(undefined,{headers:{Origin:'https://other.example'}})).status,403);
});

test('health is independent of Frankfurter and available to platform probes', async t => {
  let calls = 0;
  const request = await run(t, { allowedOrigin: 'https://building-with-ai-f26.github.io', fetchImpl: async () => { calls++; throw new Error('offline'); } });
  const res = await request('/health');
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { status: 'ok' });
  assert.equal(calls, 0);
});
test('Render PORT and deployment binding preserve explicit local settings', () => {
  assert.deepEqual(listenOptions({}), { port: 3001, host: '127.0.0.1' });
  assert.deepEqual(listenOptions({ NODE_ENV: 'production', PORT: '10000' }), { port: 10000, host: '0.0.0.0' });
  assert.deepEqual(listenOptions({ RENDER: 'true', PORT: '12345' }), { port: 12345, host: '0.0.0.0' });
  assert.deepEqual(listenOptions({ NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3001' }), { port: 3001, host: '127.0.0.1' });
});
test('local same-origin proxy requests still work with production CORS configured', async t => {
  const request = await run(t, { allowedOrigin: 'https://building-with-ai-f26.github.io', fetchImpl: async () => ({ ok: true, json: async () => sample }) });
  const res = await request(); assert.equal(res.status, 200); assert.deepEqual(await res.json(), sample);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});
