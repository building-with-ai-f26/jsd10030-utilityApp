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

// Allocate a rounded component in exact cents, independently of other components.
function allocateProportionally(cents, weights) {
  const total = BigInt(weights.reduce((sum, value) => sum + value, 0));
  const allocations = weights.map((weight, index) => {
    const product = BigInt(cents) * BigInt(weight);
    return { index, cents: Number(product / total), remainder: product % total };
  });
  const remaining = cents - allocations.reduce((sum, item) => sum + item.cents, 0);
  const ranked = [...allocations].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  for (let i = 0; i < remaining; i += 1) ranked[i].cents += 1;
  return allocations.map(item => item.cents);
}

export function calculate({ subtotal, charges, tipPercent, diners, splitMode = 'equal', personSubtotals }) {
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
  if (!['equal', 'by_person'].includes(splitMode)) errors.splitMode = 'Choose Equal split or By person.';
  let weights;
  if (splitMode === 'by_person' && !errors.diners) {
    if (!Array.isArray(personSubtotals) || personSubtotals.length !== Number(dinerText)) {
      errors.personSubtotals = 'Enter one subtotal for each diner.';
    } else {
      weights = personSubtotals.map((amount, index) => {
        try { return hundredths(amount, `Diner ${index + 1} subtotal`, 100000000); }
        catch (error) { errors[`person-${index}`] = error.message; return 0; }
      });
      if (!Object.keys(errors).some(key => key.startsWith('person-'))) {
        const sum = weights.reduce((total, amount) => total + amount, 0);
        if (sum === 0) errors.personSubtotals = 'By person requires a positive combined subtotal. Individual diners may have zero.';
        else if (!errors.subtotal && sum !== parsed.subtotal) errors.personSubtotals = 'Diner subtotals must add up exactly to the bill subtotal.';
      }
    }
  }
  if (Object.keys(errors).length) return { errors };
  const count = Number(dinerText);
  // Basis points: 20.00% = 2000 / 10000. Round a half cent up once.
  const tipCents = Number((BigInt(parsed.subtotal) * BigInt(parsed.tipPercent) + 5000n) / 10000n);
  const totalCents = parsed.subtotal + parsed.charges + tipCents;
  if (splitMode === 'by_person') {
    const charges = allocateProportionally(parsed.charges, weights);
    const tips = allocateProportionally(tipCents, weights);
    const breakdown = weights.map((subtotalCents, index) => ({
      subtotalCents, chargesCents: charges[index], tipCents: tips[index],
      totalCents: subtotalCents + charges[index] + tips[index],
    }));
    return {
      errors: {}, subtotalCents: parsed.subtotal, chargesCents: parsed.charges,
      tipCents, totalCents, shares: breakdown.map(item => item.totalCents), breakdown,
    };
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return {
    errors: {}, subtotalCents: parsed.subtotal, chargesCents: parsed.charges,
    tipCents, totalCents,
    shares: Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0)),
  };
}
