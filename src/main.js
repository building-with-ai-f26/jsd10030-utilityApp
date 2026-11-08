import './styles.css';
import { calculate } from './tipping.js';
import { destinations } from './destinations.js';
import { createTripStore, prepareCalculation, isCurrent, STORAGE_KEY } from './trips.js';

const form = document.querySelector('#calculator');
const destination = form.elements.destination;
const currency = form.elements.currency;
const content = document.querySelector('#result-content');
const status = document.querySelector('#form-status');
const fields = ['subtotal', 'charges', 'tipPercent', 'diners'];
const store = createTripStore(() => window.localStorage);
const saveButton = document.querySelector('#save-result');
const saveTrip = document.querySelector('#save-trip');
const historyTrip = document.querySelector('#history-trip');
const saveStatus = document.querySelector('#save-status');
let currentCalculation = null;
let storageAvailable = false;
function inputs() {
  return Object.fromEntries(['destination', 'currency', ...fields].map(key => [key, form.elements[key].value]));
}
function updateSaveButton() {
  saveButton.disabled = !storageAvailable || !saveTrip.value || !isCurrent(currentCalculation, inputs());
}

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
  saveStatus.textContent = '';
  updateSaveButton();
  content.replaceChildren();
  const message = document.createElement('p');
  message.textContent = 'Inputs changed. Select Calculate & split for an updated result.';
  content.append(message);
  status.textContent = '';
}
form.addEventListener('input', clearResult);
form.addEventListener('change', clearResult);
destination.addEventListener('change', updateGuidance);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  currentCalculation = null;
  saveStatus.textContent = '';
  updateSaveButton();
  const result = calculate(Object.fromEntries(fields.map(key => [key, form.elements[key].value])));
  for (const key of fields) {
    document.querySelector(`#${key}-error`).textContent = result.errors[key] ?? '';
    form.elements[key].setAttribute('aria-invalid', String(Boolean(result.errors[key])));
  }
  if (Object.keys(result.errors).length) {
    content.textContent = 'Correct the highlighted fields to calculate your bill.';
    status.textContent = 'Please correct the highlighted fields.';
    form.elements[Object.keys(result.errors)[0]].focus();
    return;
  }
  status.textContent = '';
  currentCalculation = prepareCalculation(inputs());
  renderResult(content, result, currency.value);
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
    item.textContent = `Diner ${index + 1}: ${money(cents)}`;
    list.append(item);
  });
  const note = document.createElement('p'); note.className = 'help';
  note.textContent = 'Tip rounded once to the nearest cent (half cents round up). The first diners receive any extra cents. Shares sum exactly to the total.';
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
    button.textContent = `${destinations[saved.inputs.destination].name} · ${saved.inputs.currency} ${(saved.result.totalCents / 100).toFixed(2)} · ${new Date(saved.savedAt).toLocaleString()} — Open details`;
    button.addEventListener('click', () => {
      const target = document.querySelector('#saved-content');
      const section = document.querySelector('#saved-details'); section.hidden = false;
      renderResult(target, saved.result, saved.inputs.currency);
      const description = document.createElement('p');
      description.textContent = `Trip: ${data.trips.find(trip => trip.id === saved.tripId).name}. Destination: ${destinations[saved.inputs.destination].name}. Currency: ${saved.inputs.currency}. Inputs: subtotal ${saved.inputs.subtotal}, charges ${saved.inputs.charges}, additional tip ${saved.inputs.tipPercent}%, diners ${saved.inputs.diners}. Saved ${new Date(saved.savedAt).toLocaleString()}. Read-only snapshot; current guidance may differ.`;
      target.prepend(description);
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
  } catch (error) { saveStatus.textContent = error.message; }
  updateSaveButton();
});
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) refreshTrips(); });
refreshTrips();

updateGuidance();
