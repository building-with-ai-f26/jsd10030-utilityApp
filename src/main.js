import './styles.css';
import { calculate } from './tipping.js';
import { destinations } from './destinations.js';

const form = document.querySelector('#calculator');
const destination = form.elements.destination;
const currency = form.elements.currency;
const content = document.querySelector('#result-content');
const status = document.querySelector('#form-status');
const fields = ['subtotal', 'charges', 'tipPercent', 'diners'];

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
  const money = cents => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.value, currencyDisplay: 'code',
  }).format(cents / 100);
  content.replaceChildren();
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
  content.append(summary, heading, list, note);
});
updateGuidance();
