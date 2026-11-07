import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/tipping.js';
const run = overrides => calculate({ subtotal:'100', charges:'0', tipPercent:'20', diners:'3', ...overrides });

test('100 subtotal, no charges, 20% tip, 3 diners: 40 each', () => {
  const result = run();
  assert.equal(result.tipCents, 2000);
  assert.equal(result.totalCents, 12000);
  assert.deepEqual(result.shares, [4000,4000,4000]);
});
test('100 subtotal, 8 charges, 20% tip: exact remainder allocation', () => {
  const result = run({ charges:'8' });
  assert.equal(result.tipCents, 2000);
  assert.equal(result.totalCents, 12800);
  assert.deepEqual(result.shares, [4267,4267,4266]);
});
for (const [field, values] of Object.entries({
  subtotal:['-1','', '1.001', 'NaN','1e2','1,000','1000001'],
  charges:['-0.01','Infinity',''],
  tipPercent:['-1','101','1.001',''],
  diners:['0','-1','1.5','','1001','Infinity'],
})) {
  for (const value of values) test(`reject ${field} = ${JSON.stringify(value)}`, () => {
    const result = run({ [field]:value });
    assert.ok(result.errors[field]);
    assert.equal(result.shares, undefined);
  });
}
test('zero tip with service charges adds charges exactly once', () => {
  const result = run({ charges:'12.50', tipPercent:'0' });
  assert.equal(result.tipCents, 0);
  assert.equal(result.totalCents, 11250);
});
test('half-cent tip rounds up once using integer arithmetic', () => {
  const result = run({ subtotal:'0.05', tipPercent:'10', diners:'1' });
  assert.equal(result.tipCents,1);
  assert.equal(result.totalCents,6);
});
test('fractional percentage uses exact basis points', () => {
  assert.equal(run({ subtotal:'100',tipPercent:'12.34' }).tipCents,1234);
});
test('zero bill is valid', () => {
  assert.deepEqual(run({ subtotal:'0',tipPercent:'0' }).shares,[0,0,0]);
});
test('all shares are integer cents, differ by at most one, and sum to total', () => {
  for (const subtotal of ['0.01','0.02','9.99','1000000']) {
    for (const diners of ['1','3','7','1000']) {
      const result = run({ subtotal, charges:'8.13', tipPercent:'17.25', diners });
      assert.equal(result.shares.length,Number(diners));
      assert.ok(result.shares.every(Number.isSafeInteger));
      assert.equal(result.shares.reduce((a,b) => a+b,0),result.totalCents);
      assert.ok(Math.max(...result.shares)-Math.min(...result.shares)<=1);
    }
  }
});
