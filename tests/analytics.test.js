import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { calculate } from '../src/tipping.js';
import { destinations } from '../src/destinations.js';
import { startAnalytics, configFor, environmentFor, cleanUrl, PROJECT_TOKEN, API_HOST } from '../docs/assets/analytics.js';

function browser(hostname = '127.0.0.1') {
  const listeners = {};
  const scripts = [];
  const doc = {
    referrer: 'https://example.org/?private=secret',
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: script => scripts.push(script) } }],
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  const win = { location: { hostname, href: `http://${hostname}/?trip=secret#bill=128` }, document: doc };
  return { win, listeners, scripts };
}
const queuedEvents = win => win.posthog.filter(entry => entry[0] === 'capture');

test('initializes once using the supplied token, host and defaults and queues one pageview', () => {
  const { win, scripts } = browser();
  const first = startAnalytics('calculator', win);
  assert.equal(startAnalytics('calculator', win), first);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://us-assets.i.posthog.com/static/array.js');
  const [token, config] = win.posthog._i[0];
  assert.equal(token, PROJECT_TOKEN);
  assert.equal(config.api_host, API_HOST);
  assert.equal(config.defaults, '2026-05-30');
  assert.equal(config.person_profiles, 'identified_only');
  assert.equal(config.capture_pageview, false);
  assert.equal(queuedEvents(win).length, 1);
  assert.deepEqual(queuedEvents(win)[0], ['capture', '$pageview', {
    $current_url: 'http://127.0.0.1/', $referrer: 'https://example.org/', environment: 'local', surface: 'calculator',
  }]);
  assert.equal(win.posthog.some(entry => entry[0] === 'identify'), false);
});

test('environments and surfaces are labeled without relying on build mode', () => {
  for (const host of ['localhost', '127.0.0.1', '::1', '[::1]']) assert.equal(environmentFor(host), 'local');
  const { win } = browser('building-with-ai-f26.github.io');
  startAnalytics('product_page', win).track('conversion_succeeded');
  assert.deepEqual(queuedEvents(win).at(-1)[2], { environment: 'production', surface: 'product_page' });
});

test('privacy configuration masks inputs/text, blocks sensitive DOM and disables broad collection', () => {
  const config = configFor({ environment: 'local', surface: 'calculator' });
  for (const key of ['autocapture', 'capture_pageleave', 'capture_dead_clicks', 'rageclick', 'capture_heatmaps', 'capture_performance', 'capture_exceptions', 'enable_recording_console_log']) assert.equal(config[key], false, key);
  assert.equal(config.disable_session_recording, false);
  assert.equal(config.session_recording.maskAllInputs, true);
  assert.equal(config.session_recording.maskTextSelector, '*');
  assert.match(config.session_recording.blockSelector, /data-analytics-private/);
  assert.match(config.session_recording.blockSelector, /select/);
  assert.match(config.session_recording.blockSelector, /\.evidence/);
  assert.equal(config.session_recording.recordHeaders, false);
  assert.equal(config.session_recording.recordBody, false);
});

test('custom properties are never taken from user data or error messages', () => {
  const { win } = browser(); const analytics = startAnalytics('calculator', win);
  const privateData = { trip: 'Private holiday', amount: 128, result: 115.56, error: 'raw error', email: 'test@example.org' };
  for (const event of ['calculation_succeeded', 'conversion_succeeded', 'conversion_failed', 'result_saved', 'saved_details_opened']) analytics.track(event, privateData);
  const events = queuedEvents(win).slice(1);
  assert.equal(events.length, 5);
  for (const event of events) assert.deepEqual(event[2], { environment: 'local', surface: 'calculator' });
  const length = queuedEvents(win).length;
  analytics.track('Private holiday');
  assert.equal(queuedEvents(win).length, length);
});

test('allowlisted clicks send only fixed action codes, never DOM text, values or hrefs', () => {
  const { win, listeners } = browser(); startAnalytics('calculator', win);
  const click = (action, disabled = false) => listeners.click({ target: { closest: () => ({
    disabled, getAttribute: () => action, textContent: 'Private holiday 128.00', value: '128', href: '?private=128',
  }) } });
  click('open_saved_details');
  assert.deepEqual(queuedEvents(win).at(-1), ['capture', 'ui_clicked', { action: 'open_saved_details', environment: 'local', surface: 'calculator' }]);
  const count = queuedEvents(win).length;
  click('Private holiday'); click('convert', true);
  assert.equal(queuedEvents(win).length, count);
});

test('URL redaction strips query strings and fragments without modifying replay chunks', () => {
  assert.equal(cleanUrl('https://example.org/app/?amount=128#trip-name'), 'https://example.org/app/');
  assert.equal(cleanUrl('invalid'), '');
  const config = configFor({ environment: 'local', surface: 'calculator' });
  const snapshot = [{ type: 3, data: { alreadyMasked: true } }];
  const event = config.before_send({ event: '$snapshot', properties: { $snapshot_data: snapshot, $current_url: 'https://example.org/?private=1', $referrer: 'https://ref.example/#email', surface: 'wrong' } });
  assert.equal(event.properties.$snapshot_data, snapshot);
  assert.equal(event.properties.$current_url, 'https://example.org/');
  assert.equal(event.properties.$referrer, 'https://ref.example/');
  assert.equal(event.properties.surface, 'calculator');
  const network = config.session_recording.maskCapturedNetworkRequestFn({ name: 'https://example.org/?token=secret#private', requestBody: 'secret', responseBody: 'secret' });
  assert.equal(network.name, 'https://example.org/');
  assert.equal(network.requestBody, undefined); assert.equal(network.responseBody, undefined);
});

test('blocked script, throwing SDK, DOM failure and missing browser never break actions', () => {
  assert.doesNotThrow(() => startAnalytics('calculator', undefined).track('result_saved'));
  const { win, scripts, listeners } = browser(); const analytics = startAnalytics('calculator', win);
  assert.doesNotThrow(() => scripts[0].onerror());
  assert.doesNotThrow(() => analytics.track('result_saved'));
  win.posthog.capture = () => { throw new Error('SDK failure'); };
  assert.doesNotThrow(() => analytics.track('conversion_failed'));
  assert.doesNotThrow(() => listeners.click({ target: { closest() { throw new Error('DOM failure'); } } }));
  const broken = browser(); broken.win.document.createElement = () => { throw new Error('script blocked'); };
  assert.doesNotThrow(() => startAnalytics('calculator', broken.win).track('result_saved'));
});

test('an existing initialized or queued SDK is not reinitialized or used with unknown privacy settings', () => {
  for (const posthog of [{ __loaded: true }, { _i: [['existing-project']] }]) {
    let calls = 0; posthog.capture = () => { calls += 1; };
    const { win, scripts } = browser(); win.posthog = posthog;
    startAnalytics('calculator', win).track('result_saved');
    startAnalytics('calculator', win).track('result_saved');
    assert.equal(scripts.length, 0); assert.equal(calls, 0);
  }
});

test('both entry pages include privacy markers and success hooks remain after completed actions', () => {
  const app = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
  for (const id of ['result-content', 'conversion-status', 'save-trip', 'save-status', 'trip-status', 'trip-name', 'history-trip', 'history-list', 'saved-details']) assert.ok(app.includes(`id="${id}" data-analytics-private`), id);
  assert.ok(page.includes('src="assets/analytics.js"'));
  assert.ok(page.includes('data-analytics-surface="product_page"'));
  assert.ok(app.includes('data-analytics-surface="calculator"'));
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.ok(main.indexOf("analytics.track('result_saved')") > main.indexOf('store.save('));
  assert.ok(main.indexOf("analytics.track('calculation_succeeded')") > main.indexOf('renderResult(content, result'));
  assert.ok(main.indexOf("analytics.track('conversion_succeeded')") > main.indexOf('conversionStatus.replaceChildren(summary, rate)'));
  assert.ok(main.indexOf("analytics.track('saved_details_opened')") > main.indexOf('target.prepend(description)'));
});

// Exercise the application's actual render functions and registered click handler,
// rather than only asserting that an event name appears in the source. This small
// DOM harness avoids installing a browser package; browser receipt is still separate.
function savedDetailsHarness({ failRendering = false } = {}) {
  class Element {
    constructor() { this.children = []; this.handlers = {}; this.attrs = {}; this.hidden = true; }
    append(...children) { this.children.push(...children); }
    prepend(child) {
      if (failRendering) throw new Error('Simulated render failure');
      this.children.unshift(child);
    }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attrs[name] = value; }
    addEventListener(type, handler) { this.handlers[type] = handler; }
  }
  const nodes = new Map(['#history-list', '#saved-details', '#saved-content'].map(id => [id, new Element()]));
  const document = { querySelector: selector => nodes.get(selector), createElement: () => new Element() };
  const { win } = browser();
  const analytics = startAnalytics('calculator', win);
  const successfulOpenStates = [];
  const data = {
    trips: [{ id: 'trip-1', name: 'Private trip name' }],
    results: [{
      id: 'result-1', tripId: 'trip-1', savedAt: '2026-11-08T15:00:00.000Z',
      inputs: { destination: 'US', currency: 'USD', subtotal: '100', charges: '8', tipPercent: '20', diners: '3' },
      result: calculate({ subtotal: '100', charges: '8', tipPercent: '20', diners: '3' }),
    }],
  };
  const original = structuredClone(data);
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const renderFunctions = main.slice(main.indexOf('function renderResult('), main.indexOf('function refreshTrips('));
  runInNewContext(renderFunctions + '\nrenderHistory(data);', {
    document, historyTrip: { value: 'trip-1' }, destinations, data,
    analytics: { track(event) {
      successfulOpenStates.push({
        visible: !nodes.get('#saved-details').hidden,
        description: nodes.get('#saved-content').children[0]?.textContent,
        children: nodes.get('#saved-content').children.length,
      });
      analytics.track(event);
    } },
  });
  return { button: nodes.get('#history-list').children[0], nodes, win, data, original, successfulOpenStates };
}

test('Open details sends saved_details_opened exactly once after rendering, with no private properties', () => {
  const { button, nodes, win, data, original, successfulOpenStates } = savedDetailsHarness();
  const openedEvents = () => queuedEvents(win).filter(event => event[1] === 'saved_details_opened');
  // Merely browsing history must not report an opened detail view.
  assert.equal(nodes.get('#saved-details').hidden, true);
  assert.equal(openedEvents().length, 0);
  assert.equal(button.attrs['data-analytics-action'], 'open_saved_details');
  button.handlers.click();
  assert.equal(openedEvents().length, 1);
  assert.equal(successfulOpenStates[0].visible, true);
  assert.match(successfulOpenStates[0].description, /Private trip name/);
  assert.equal(successfulOpenStates[0].children, 5); // description + result breakdown
  assert.deepEqual(openedEvents()[0][2], { environment: 'local', surface: 'calculator' });
  assert.equal(JSON.stringify(openedEvents()).includes('Private trip name'), false);
  assert.equal(JSON.stringify(openedEvents()).includes('128'), false);
  button.handlers.click();
  assert.equal(openedEvents().length, 2); // one per explicit click, not duplicated listeners
  assert.deepEqual(data, original); // reopening never mutates saved history
});

test('Open details does not report success if rendering fails before completion', () => {
  const { button, win, successfulOpenStates } = savedDetailsHarness({ failRendering: true });
  assert.throws(() => button.handlers.click(), /Simulated render failure/);
  assert.equal(successfulOpenStates.length, 0);
  assert.equal(queuedEvents(win).filter(event => event[1] === 'saved_details_opened').length, 0);
});
