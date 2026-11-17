import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const UPSTREAM = 'https://api.frankfurter.dev/v2/rate';
const bases = ['USD', 'GBP', 'EUR'];
const targets = [...bases, 'HKD'];

export function createRateServer({ fetchImpl = globalThis.fetch, timeoutMs = 8000,
  now = () => new Date(), allowedOrigin = process.env.ALLOWED_ORIGIN } = {}) {
  return createServer(async (req, res) => {
    const reply = (status, data) => {
      if (!res.destroyed) res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
    };
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health' && req.method === 'GET') return reply(200, { status: 'ok' });
    const origin = req.headers.origin;
    if (origin && allowedOrigin) {
      if (origin !== allowedOrigin) return reply(403, { error: 'Origin is not allowed.' });
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (url.pathname !== '/api/rates') return reply(404, { error: 'Endpoint not found.' });
    if (req.method !== 'GET') return reply(405, { error: 'Use GET with a currency pair only.' });
    const base = url.searchParams.get('base');
    const target = url.searchParams.get('target');
    if (url.searchParams.size !== 2 || !bases.includes(base) || !targets.includes(target) || base === target ||
        req.headers['transfer-encoding'] || Number(req.headers['content-length'] || 0) !== 0) {
      return reply(400, { error: 'Provide only a supported base and a different target currency.' });
    }
    const controller = new AbortController();
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', cancel);
    let timer;
    try {
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(Object.assign(new Error('Rate service timed out.'), { status: 504 })); }, timeoutMs);
      });
      const work = async () => {
        let upstream;
        try {
          upstream = await fetchImpl(`${UPSTREAM}/${base.toLowerCase()}/${target.toLowerCase()}`, {
            signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' },
          });
        } catch { throw Object.assign(new Error('Rate service is unavailable. Try again later.'), { status: 502 }); }
        if (!upstream.ok) {
          const status = [404, 422].includes(upstream.status) ? 404 : upstream.status === 429 ? 429 : 502;
          throw Object.assign(new Error(status === 404 ? 'Reference rate unavailable.' : status === 429 ? 'Rate service is busy.' : 'Rate service failed.'), { status });
        }
        let data;
        try { data = await upstream.json(); } catch { throw new Error('Invalid rate service response.'); }
        const date = typeof data?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? new Date(`${data.date}T00:00:00Z`) : new Date(NaN);
        if (data?.base !== base || data?.quote !== target || typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 ||
            !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date || data.date > now().toISOString().slice(0, 10)) {
          throw new Error('Invalid rate service response.');
        }
        return { base, quote: target, rate: data.rate, date: data.date };
      };
      reply(200, await Promise.race([work(), deadline]));
    } catch (error) {
      reply(error.status || 502, { error: error.status ? error.message : 'Invalid rate service response.' });
    } finally {
      clearTimeout(timer);
      res.off('close', cancel);
    }
  });
}

export function listenOptions(env = process.env) {
  return { port: Number(env.PORT || 3001), host: env.HOST || (env.NODE_ENV === 'production' || env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createRateServer();
  const { port, host } = listenOptions();
  server.listen(port, host, () => {
    console.log(`Rate backend listening on ${JSON.stringify(server.address())}`);
  });
}
