// Decimal text is parsed directly to integers; no floating-point money arithmetic.
function hundredths(value, label, maximum) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error(`${label}: enter a non-negative number with at most two decimal places (use a decimal point, no commas).`);
  }
  const [whole, fraction = ''] = text.split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (amount > BigInt(maximum)) throw new Error(`${label}: maximum is ${maximum / 100}.`);
  return Number(amount);
}

export function calculate({ subtotal, charges, tipPercent, diners }) {
  const errors = {};
  const parsed = {};
  for (const [key, label, maximum] of [
    ['subtotal', 'Subtotal', 100000000],
    ['charges', 'Tax / service charges', 100000000],
    ['tipPercent', 'Additional tip percentage', 10000],
  ]) {
    try { parsed[key] = hundredths({ subtotal, charges, tipPercent }[key], label, maximum); }
    catch (error) { errors[key] = error.message; }
  }
  const dinerText = String(diners).trim();
  if (!/^\d+$/.test(dinerText) || Number(dinerText) < 1 || Number(dinerText) > 1000) {
    errors.diners = 'Diners: enter a positive whole number from 1 to 1,000.';
  }
  if (Object.keys(errors).length) return { errors };
  const count = Number(dinerText);
  // Basis points: 20.00% = 2000 / 10000. Round a half cent up once.
  const tipCents = Number((BigInt(parsed.subtotal) * BigInt(parsed.tipPercent) + 5000n) / 10000n);
  const totalCents = parsed.subtotal + parsed.charges + tipCents;
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return {
    errors: {}, subtotalCents: parsed.subtotal, chargesCents: parsed.charges,
    tipCents, totalCents,
    shares: Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0)),
  };
}
