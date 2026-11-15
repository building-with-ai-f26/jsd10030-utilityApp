import './styles.css';
import { startAnalytics } from '../docs/assets/analytics.js';
const analytics = startAnalytics('calculator');
import { calculate } from './tipping.js';
import { destinations } from './destinations.js';
import { createConversionLoader } from './conversion.js';
import { createTripStore, prepareCalculation, isCurrent, STORAGE_KEY } from './trips.js';

const form = document.querySelector('#calculator');
const destination = form.elements.destination;
const currency = form.elements.currency;
const content = document.querySelector('#result-content');
const status = document.querySelector('#form-status');
const fields = ['subtotal', 'charges', 'tipPercent', 'diners'];
const splitMode = form.elements.splitMode;
const personFields = document.querySelector('#person-fields');
const personSection = document.querySelector('#person-subtotals');
const store = createTripStore(() => window.localStorage);
const saveButton = document.querySelector('#save-result');
const saveTrip = document.querySelector('#save-trip');
const historyTrip = document.querySelector('#history-trip');
const saveStatus = document.querySelector('#save-status');
const targetCurrency = document.querySelector('#target-currency');
const convertButton = document.querySelector('#convert-total');
const conversionStatus = document.querySelector('#conversion-status');
const conversionLoader = createConversionLoader();
let conversionLoading = false;
let conversionRevision = 0;
let currentCalculation = null;
let storageAvailable = false;
function inputs() {
  const values = Object.fromEntries(['destination', 'currency', ...fields, 'splitMode'].map(key => [key, form.elements[key].value]));
  if (values.splitMode === 'by_person') values.personSubtotals = [...personFields.querySelectorAll('input')].map(field => field.value);
  return values;
}
function updateSaveButton() {
  saveButton.disabled = !storageAvailable || !saveTrip.value || !isCurrent(currentCalculation, inputs());
}

function updateConversionButton() {
  convertButton.disabled = conversionLoading || !isCurrent(currentCalculation, inputs()) || currency.value === targetCurrency.value;
}
function resetConversion() {
  conversionRevision += 1;
  conversionLoader.reset();
  conversionLoading = false;
  conversionStatus.replaceChildren();
  conversionStatus.setAttribute('aria-busy', 'false');
  updateConversionButton();
  if (isCurrent(currentCalculation, inputs()) && currency.value === targetCurrency.value) {
    conversionStatus.textContent = 'Choose a target currency different from the bill currency.';
  }
}
targetCurrency.addEventListener('change', resetConversion);
convertButton.addEventListener('click', async () => {
  if (!isCurrent(currentCalculation, inputs())) { resetConversion(); return; }
  const snapshot = currentCalculation;
  const target = targetCurrency.value;
  const run = ++conversionRevision;
  conversionLoading = true;
  conversionStatus.textContent = 'Loading latest published reference rate…';
  conversionStatus.setAttribute('aria-busy', 'true');
  updateConversionButton();
  try {
    const converted = await conversionLoader.load({ totalCents: snapshot.result.totalCents, base: snapshot.inputs.currency, target });
    if (run !== conversionRevision || !converted || snapshot !== currentCalculation || !isCurrent(snapshot, inputs()) || target !== targetCurrency.value) return;
    const money = (cents, code) => new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'code' }).format(cents / 100);
    const summary = document.createElement('p');
    summary.textContent = `Original total: ${money(converted.totalCents, converted.base)}. Reference-rate estimate: ${money(converted.convertedCents, converted.target)}.`;
    const rate = document.createElement('p');
    rate.textContent = `1 ${converted.base} = ${converted.rate} ${converted.target}. Rate date: ${converted.rateDate} (latest published; may precede today).`;
    conversionStatus.replaceChildren(summary, rate);
    analytics.track('conversion_succeeded');
  } catch (error) {
    if (run === conversionRevision && snapshot === currentCalculation && isCurrent(snapshot, inputs()) && target === targetCurrency.value) {
      conversionStatus.textContent = `${error.message} No conversion estimate is available.`;
      analytics.track('conversion_failed');
    }
  } finally {
    if (run === conversionRevision && snapshot === currentCalculation && target === targetCurrency.value) {
      conversionLoading = false;
      conversionStatus.setAttribute('aria-busy', 'false');
      updateConversionButton();
    }
  }
});

function updateGuidance() {
  const data = destinations[destination.value];
  document.querySelector('#guidance-text').textContent = data.guidance;
  const link = document.querySelector('#guidance-source');
  link.textContent = data.source;
  link.href = data.url;
  const reviewed = document.querySelector('#reviewed');
  reviewed.textContent = data.reviewed;
  reviewed.dateTime = data.reviewed;
}
function clearResult() {
  currentCalculation = null;
  resetConversion();
  saveStatus.textContent = '';
  updateSaveButton();
  content.replaceChildren();
  const message = document.createElement('p');
  message.textContent = 'Inputs changed. Select Calculate & split for an updated result.';
  content.append(message);
  status.textContent = '';
}
function syncPersonFields() {
  personSection.hidden = splitMode.value !== 'by_person';
  if (personSection.hidden) return;
  const countText = form.elements.diners.value.trim();
  const count = /^\d+$/.test(countText) && Number(countText) >= 1 && Number(countText) <= 1000 ? Number(countText) : 0;
  const existing = [...personFields.querySelectorAll('input')].map(input => input.value);
  personFields.replaceChildren();
  for (let index = 0; index < count; index += 1) {
    const label = document.createElement('label');
    label.htmlFor = `person-${index}`; label.textContent = `Diner ${index + 1} subtotal`;
    const input = document.createElement('input');
    input.id = `person-${index}`; input.name = `person-${index}`; input.inputMode = 'decimal'; input.value = existing[index] ?? '';
    input.setAttribute('data-analytics-private', '');
    input.setAttribute('aria-describedby', `person-help person-${index}-error`);
    const error = document.createElement('p'); error.id = `person-${index}-error`; error.className = 'error';
    personFields.append(label, input, error);
  }
  document.querySelector('#personSubtotals-error').textContent = '';
}
splitMode.addEventListener('change', syncPersonFields);
form.elements.diners.addEventListener('input', syncPersonFields);
form.elements.diners.addEventListener('change', syncPersonFields);
form.addEventListener('input', clearResult);
form.addEventListener('change', clearResult);
destination.addEventListener('change', updateGuidance);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  currentCalculation = null;
  resetConversion();
  saveStatus.textContent = '';
  updateSaveButton();
  const result = calculate(inputs());
  const validationFields = [...fields, 'splitMode', 'personSubtotals', ...[...personFields.querySelectorAll('input')].map(input => input.id)];
  for (const key of validationFields) {
    document.querySelector(`#${key}-error`).textContent = result.errors[key] ?? '';
    form.elements[key]?.setAttribute('aria-invalid', String(Boolean(result.errors[key])));
  }
  if (Object.keys(result.errors).length) {
    content.textContent = 'Correct the highlighted fields to calculate your bill.';
    status.textContent = 'Please correct the highlighted fields.';
    (form.elements[Object.keys(result.errors)[0]] ?? personFields.querySelector('input') ?? splitMode).focus();
    return;
  }
  status.textContent = '';
  currentCalculation = prepareCalculation(inputs());
  resetConversion();
  renderResult(content, result, currency.value);
  analytics.track('calculation_succeeded');
  updateSaveButton();
});

function renderResult(target, result, currencyCode) {
  const money = cents => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currencyCode, currencyDisplay: 'code',
  }).format(cents / 100);
  target.replaceChildren();
  const summary = document.createElement('dl');
  for (const [label, cents] of [
    ['Subtotal', result.subtotalCents], ['Tax / service charges added', result.chargesCents],
    ['Additional tip', result.tipCents], ['Total bill', result.totalCents],
  ]) {
    const term = document.createElement('dt'); term.textContent = label;
    const value = document.createElement('dd'); value.textContent = money(cents);
    summary.append(term, value);
  }
  const heading = document.createElement('h3'); heading.textContent = 'Each person pays';
  const list = document.createElement('ol');
  result.shares.forEach((cents, index) => {
    const item = document.createElement('li');
    const detail = result.breakdown?.[index];
    item.textContent = detail
      ? `Diner ${index + 1}: subtotal ${money(detail.subtotalCents)} + charges ${money(detail.chargesCents)} + tip ${money(detail.tipCents)} = ${money(detail.totalCents)}`
      : `Diner ${index + 1}: ${money(cents)}`;
    list.append(item);
  });
  const note = document.createElement('p'); note.className = 'help';
  note.textContent = result.breakdown
    ? 'Tip rounded once to the nearest cent (half cents round up). Charges and tip are allocated separately by subtotal using largest fractional remainder; ties follow diner order. Every component and all shares sum exactly.'
    : 'Tip rounded once to the nearest cent (half cents round up). The first diners receive any extra cents. Shares sum exactly to the total.';
  target.append(summary, heading, list, note);
}

function renderHistory(data) {
  const list = document.querySelector('#history-list');
  list.replaceChildren();
  document.querySelector('#saved-details').hidden = true;
  const results = data.results.filter(saved => saved.tripId === historyTrip.value)
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  if (!results.length) {
    const empty = document.createElement('p');
    empty.textContent = !data.trips.length ? 'No trips yet. Create one to save your next calculation.' : !historyTrip.value ? 'Select a trip to browse its saved results.' : 'No saved results in this trip yet.';
    list.append(empty); return;
  }
  for (const saved of results) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'history-item';
    button.setAttribute('data-analytics-action', 'open_saved_details');
    button.textContent = `${destinations[saved.inputs.destination].name} · ${saved.inputs.currency} ${(saved.result.totalCents / 100).toFixed(2)} · ${new Date(saved.savedAt).toLocaleString()} — Open details`;
    button.addEventListener('click', () => {
      const target = document.querySelector('#saved-content');
      const section = document.querySelector('#saved-details'); section.hidden = false;
      renderResult(target, saved.result, saved.inputs.currency);
      const description = document.createElement('p');
      description.textContent = `Trip: ${data.trips.find(trip => trip.id === saved.tripId).name}. Destination: ${destinations[saved.inputs.destination].name}. Currency: ${saved.inputs.currency}. Inputs: subtotal ${saved.inputs.subtotal}, charges ${saved.inputs.charges}, additional tip ${saved.inputs.tipPercent}%, diners ${saved.inputs.diners}. Saved ${new Date(saved.savedAt).toLocaleString()}. Split: ${(saved.splitMode ?? saved.inputs.splitMode ?? 'equal') === 'by_person' ? 'By person' : 'Equal split'}. Read-only snapshot; current guidance may differ.`;
      target.prepend(description);
      analytics.track('saved_details_opened');
    });
    list.append(button);
  }
}
function refreshTrips(selectedId) {
  try {
    const data = store.load();
    for (const select of [saveTrip, historyTrip]) {
      const previous = selectedId ?? select.value;
      select.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = ''; placeholder.textContent = 'Select a trip'; select.append(placeholder);
      for (const trip of data.trips) {
        const option = document.createElement('option'); option.value = trip.id; option.textContent = trip.name; select.append(option);
      }
      if (data.trips.some(trip => trip.id === previous)) select.value = previous;
    }
    storageAvailable = true;
    document.querySelector('#storage-status').textContent = '';
    renderHistory(data);
  } catch (error) {
    storageAvailable = false;
    document.querySelector('#storage-status').textContent = error.message;
    document.querySelector('#history-list').textContent = 'Saved history cannot be loaded.';
    document.querySelector('#saved-details').hidden = true;
  }
  updateSaveButton();
}
document.querySelector('#create-trip').addEventListener('submit', event => {
  event.preventDefault();
  const status = document.querySelector('#trip-status');
  status.textContent = '';
  try {
    const trip = store.createTrip(document.querySelector('#trip-name').value);
    document.querySelector('#trip-name').value = '';
    refreshTrips(trip.id);
    status.textContent = `Trip “${trip.name}” created in this browser.`;
  } catch (error) { status.textContent = error.message; }
});
saveTrip.addEventListener('change', updateSaveButton);
historyTrip.addEventListener('change', () => refreshTrips());
saveButton.addEventListener('click', () => {
  saveStatus.textContent = '';
  try {
    const saved = store.save(saveTrip.value, currentCalculation, inputs());
    refreshTrips(saved.tripId);
    saveStatus.textContent = 'Result saved in this browser.';
    analytics.track('result_saved');
  } catch (error) { saveStatus.textContent = error.message; }
  updateSaveButton();
});
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) refreshTrips(); });
refreshTrips();
syncPersonFields();

updateGuidance();
