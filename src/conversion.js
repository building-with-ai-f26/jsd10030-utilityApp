export const conversionCurrencies = ['USD', 'GBP', 'EUR', 'HKD'];
export const RATE_API = `${import.meta.env?.VITE_API_ORIGIN || ''}/api/rates`;

function validateRequest({ totalCents, base, target }) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) throw new Error('Calculate a valid bill before converting.');
  if (!['USD', 'GBP', 'EUR'].includes(base) || !conversionCurrencies.includes(target)) {
    throw new Error('Choose a supported conversion currency.');
  }
  if (base === target) throw new Error('Choose a target currency different from the bill currency.');
}

// All offered currencies have two decimal places. Apply the provider's numeric
// rate as a decimal ratio, then round once to cents (half up).
export function convertCents(totalCents, rate) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('The provider returned an invalid exchange rate.');
  }
  const [decimal, exponent = '0'] = String(rate).toLowerCase().split('e');
  const [whole, fraction = ''] = decimal.split('.');
  const digits = BigInt(whole + fraction);
  const scale = fraction.length - Number(exponent);
  const numerator = digits * (scale < 0 ? 10n ** BigInt(-scale) : 1n);
  const denominator = scale > 0 ? 10n ** BigInt(scale) : 1n;
  const product = BigInt(totalCents) * numerator;
  const converted = (product * 2n + denominator) / (denominator * 2n);
  if (converted > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Converted estimate is too large to display safely.');
  return Number(converted);
}

export async function fetchConversion(request, {
  fetchImpl = globalThis.fetch, signal, timeoutMs = 10000, now = () => new Date(),
} = {}) {
  validateRequest(request);
  if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  const controller = new AbortController();
  const cancel = () => controller.abort(new DOMException('Conversion cancelled.', 'AbortError'));
  signal?.addEventListener('abort', cancel, { once: true });
  let rejectAbort;
  const interrupted = new Promise((_, reject) => { rejectAbort = reject; });
  controller.signal.addEventListener('abort', () => rejectAbort(controller.signal.reason), { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Rate request timed out. Try again.')), timeoutMs);
  try {
    const task = (async () => {
      let response;
      try {
        response = await fetchImpl(`${RATE_API}?base=${request.base}&target=${request.target}`, {
          signal: controller.signal, credentials: 'omit',
        });
      } catch (error) {
        if (controller.signal.aborted) throw controller.signal.reason;
        throw new Error('Could not reach the exchange-rate service. Check your connection and try again.');
      }
      if (!response.ok) {
        if ([404, 422].includes(response.status)) throw new Error('A reference rate is unavailable for this currency pair.');
        if (response.status === 429) throw new Error('The exchange-rate service is busy. Please try again later.');
        throw new Error('The exchange-rate service could not complete the request. Try again later.');
      }
      let data;
      try { data = await response.json(); }
      catch { throw new Error('The exchange-rate service returned unreadable data.'); }
      if (!data || data.base !== request.base || data.quote !== request.target ||
          typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        throw new Error('The exchange-rate service returned incomplete or mismatched data.');
      }
      const date = new Date(`${data.date}T00:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date || data.date > now().toISOString().slice(0, 10)) {
        throw new Error('The exchange-rate service returned an invalid rate date.');
      }
      return { ...request, rate: data.rate, rateDate: data.date, convertedCents: convertCents(request.totalCents, data.rate) };
    })();
    return await Promise.race([task, interrupted]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

// Resetting inputs invalidates even a request whose fetch ignores cancellation.
export function createConversionLoader(convert = fetchConversion) {
  let revision = 0;
  let controller;
  function reset() { revision += 1; controller?.abort(); }
  return {
    reset,
    async load(request) {
      reset();
      const current = revision;
      controller = new AbortController();
      try {
        const result = await convert(request, { signal: controller.signal });
        return current === revision ? result : null;
      } catch (error) {
        if (current !== revision) return null;
        throw error;
      }
    },
  };
}
