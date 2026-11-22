import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { calculate } from '../src/tipping.js';
import { createTripStore, prepareCalculation, isCurrent } from '../src/trips.js';
import { destinations } from '../src/destinations.js';

// Minimal DOM harness executes the actual app handlers without a browser package.
function app({ accountFactory } = {}) {
  const nodes = new Map(); const events = []; let resetCount = 0;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; this.attrs = {}; this._value = ''; this._text = ''; this.hidden = false; }
    set id(id) { this._id = id; nodes.set(id, this); } get id() { return this._id; }
    set value(value) { this._value = value; } get value() { return this._value; }
    set textContent(text) { this._text = text; this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(' '); }
    append(...children) { for (const child of children) { child.parentNode = this; this.children.push(child); } }
    prepend(child) { child.parentNode = this; this.children.unshift(child); }
    replaceChildren(...children) { this.children = []; this._text = ''; if (this.tag === 'select') this._value = ''; this.append(...children); }
    setAttribute(key, value) { this.attrs[key] = value; }
    addEventListener(type, fn) { (this.handlers[type] ??= []).push(fn); }
    fire(type) {
      const event = { target: this, preventDefault() {} };
      for (let node = this; node; node = node.parentNode) for (const fn of node.handlers[type] ?? []) fn(event);
    }
    querySelectorAll(tag) { return this.children.flatMap(child => [...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag)]); }
    querySelector(tag) { return this.querySelectorAll(tag)[0]; }
    focus() { this.focused = true; }
  }
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const element = new Element(match[1]); element.id = match[2];
    element.hidden = /\bhidden\b/.test(match[0]);
    element._value = match[0].match(/\bvalue="([^"]*)"/)?.[1] ?? '';
  }
  const form = nodes.get('calculator');
  form.elements = new Proxy({}, { get: (_, key) => ['input', 'select'].includes(nodes.get(key)?.tag) ? nodes.get(key) : undefined });
  for (const key of ['destination', 'currency', 'subtotal', 'charges', 'tipPercent', 'diners', 'splitMode']) nodes.get(key).parentNode = form;
  nodes.get('person-fields').parentNode = nodes.get('person-subtotals'); nodes.get('person-subtotals').parentNode = form;
  for (const [key, value] of Object.entries({ destination:'US', currency:'USD', subtotal:'100', charges:'8', tipPercent:'20', diners:'2', splitMode:'equal', 'target-currency':'EUR' })) nodes.get(key).value = value;
  const document = { querySelector: selector => nodes.get(selector.slice(1)), createElement: tag => new Element(tag) };
  const storage = new Map(); let id = 0;
  const store = createTripStore(() => ({ getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }), () => `id-${++id}`);
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  runInNewContext(main, {
    document, window: { addEventListener() {} }, mountAccountUI: options => accountFactory ? accountFactory(options) : ({ isPrivate: () => false, label: () => 'This browser' }), calculate, prepareCalculation, isCurrent, destinations,
    startAnalytics: () => ({ track: event => events.push(event) }), createTripStore: () => store,
    createConversionLoader: () => ({ reset() { resetCount += 1; }, async load(request) { return { ...request, rate: 1, rateDate:'2026-11-15', convertedCents: request.totalCents }; } }),
  });
  return { nodes, events, store, resetCount: () => resetCount };
}

test('actual mode change clears results/conversion and disables saving until valid By person recalculation', () => {
  const { nodes, events, resetCount } = app();
  assert.equal(nodes.get('splitMode').value, 'equal');
  nodes.get('calculator').fire('submit');
  assert.match(nodes.get('result-content').textContent, /USD.*64\.00/);
  nodes.get('conversion-status').textContent = 'old estimate';
  nodes.get('splitMode').value = 'by_person'; nodes.get('splitMode').fire('change');
  assert.equal(nodes.get('person-fields').querySelectorAll('input').length, 2);
  assert.equal(nodes.get('person-subtotals').hidden, false);
  assert.match(nodes.get('result-content').textContent, /Inputs changed/);
  assert.equal(nodes.get('conversion-status').textContent, '');
  assert.equal(nodes.get('convert-total').disabled, true);
  assert.equal(nodes.get('save-result').disabled, true);
  nodes.get('person-0').value = '30'; nodes.get('person-1').value = '60';
  nodes.get('calculator').fire('submit');
  assert.match(nodes.get('personSubtotals-error').textContent, /add up exactly/);
  assert.equal(events.filter(event => event === 'calculation_succeeded').length, 1);
  nodes.get('person-1').value = '70'; nodes.get('person-1').fire('input');
  nodes.get('calculator').fire('submit');
  assert.match(nodes.get('result-content').textContent, /38\.40/);
  assert.match(nodes.get('result-content').textContent, /89\.60/);
  assert.equal(nodes.get('convert-total').disabled, false);
  const before = resetCount();
  nodes.get('person-0').value = '31'; nodes.get('person-0').fire('input');
  assert.ok(resetCount() > before);
  assert.equal(nodes.get('convert-total').disabled, true);
  nodes.get('splitMode').value = 'equal'; nodes.get('splitMode').fire('change');
  assert.equal(nodes.get('person-subtotals').hidden, true);
  nodes.get('calculator').fire('submit');
  assert.match(nodes.get('result-content').textContent, /64\.00/);
});

test('By person UI saves and opens the full breakdown and masks dynamic inputs', () => {
  const { nodes, store, events } = app();
  nodes.get('splitMode').value = 'by_person'; nodes.get('splitMode').fire('change');
  for (const [index, value] of ['30', '70'].entries()) {
    const input = nodes.get(`person-${index}`); input.value = value;
    assert.ok('data-analytics-private' in input.attrs);
  }
  nodes.get('calculator').fire('submit');
  nodes.get('trip-name').value = 'Test'; nodes.get('create-trip').fire('submit');
  assert.equal(nodes.get('save-result').disabled, false);
  nodes.get('save-result').fire('click');
  assert.equal(store.load().results[0].splitMode, 'by_person');
  nodes.get('person-0').value = '40'; nodes.get('person-0').fire('input');
  assert.equal(nodes.get('save-result').disabled, true);
  nodes.get('history-list').children[0].fire('click');
  assert.match(nodes.get('saved-content').textContent, /By person/);
  assert.match(nodes.get('saved-content').textContent, /38\.40/);
  assert.match(nodes.get('saved-content').textContent, /89\.60/);
  assert.ok(events.includes('saved_details_opened'));
  nodes.get('diners').value = '3'; nodes.get('diners').fire('input');
  assert.equal(nodes.get('person-fields').querySelectorAll('input').length, 3);
  assert.equal(nodes.get('person-2').value, '');
});


test('private save/reopen uses existing result renderer; sign-out clears private DOM and preserves guest snapshots', async () => {
  let isPrivate = false; let changed; const cloudData = { version: 1, trips: [{ id: 'private-trip', name: 'Private dinner' }], results: [] };
  const cloud = {
    async load() { return structuredClone(cloudData); },
    async save(tripId, calculation) {
      const saved = { id: 'private-bill', tripId, snapshotVersion: 2, splitMode: 'by_person', ...structuredClone(calculation), savedAt: '2026-11-22T12:00:00Z' };
      cloudData.results.push(saved); return structuredClone(saved);
    },
  };
  const { nodes, store, events } = app({ accountFactory: ({onChange}) => { changed = onChange; return {isPrivate: () => isPrivate, cloud, label: () => isPrivate ? 'Private account' : 'This browser'}; } });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  nodes.get('trip-name').value = 'Guest dinner'; nodes.get('create-trip').fire('submit');
  nodes.get('calculator').fire('submit'); nodes.get('save-result').fire('click');
  const guestBefore = store.load();
  isPrivate = true; changed(); await tick();
  assert.equal(nodes.get('save-destination').textContent, 'Save destination: Private account');
  nodes.get('splitMode').value = 'by_person'; nodes.get('splitMode').fire('change');
  nodes.get('person-0').value='30'; nodes.get('person-1').value='70';
  nodes.get('calculator').fire('submit'); nodes.get('save-trip').value='private-trip'; nodes.get('save-trip').fire('change');
  nodes.get('save-result').fire('click'); await tick();
  assert.equal(cloudData.results.length,1);
  nodes.get('history-trip').value='private-trip'; nodes.get('history-trip').fire('change'); await tick();
  const oldButton = nodes.get('history-list').children[0]; oldButton.fire('click');
  assert.match(nodes.get('saved-content').textContent,/38\.40/);assert.match(nodes.get('saved-content').textContent,/89\.60/);
  assert.match(nodes.get('saved-content').textContent,/By person/);
  isPrivate = false; changed();
  assert.equal(nodes.get('saved-content').textContent,'');assert.equal(nodes.get('saved-details').hidden,true);
  const previousEvents=events.length;oldButton.fire('click');assert.equal(events.length,previousEvents);
  assert.deepEqual(store.load(),guestBefore);
  assert.equal(nodes.get('save-destination').textContent,'Save destination: This browser');
});

test('late private history load cannot repopulate the screen after sign-out',async()=>{
  let isPrivate=false;let changed;let resolve;
  const {nodes}=app({accountFactory:({onChange})=>{changed=onChange;return{isPrivate:()=>isPrivate,label:()=>isPrivate?'Private account':'This browser',cloud:{load:()=>new Promise(done=>{resolve=done;})}};}});
  isPrivate=true;changed();isPrivate=false;changed();
  resolve({version:1,trips:[{id:'t',name:'Private dinner'}],results:[]});
  await new Promise(done=>setImmediate(done));
  assert.doesNotMatch(nodes.get('history-list').textContent,/Private dinner/);
  assert.doesNotMatch(nodes.get('save-trip').textContent,/Private dinner/);
  assert.equal(nodes.get('saved-content').textContent,'');
});
