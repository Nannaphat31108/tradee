import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { q, pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'];
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: 'internal_error' });
});

// ---------- Public content ----------
app.get('/api/plans/:slug', wrap(async (req, res) => {
  const [plan] = await q('SELECT * FROM plans WHERE slug = $1 AND is_active', [req.params.slug]);
  if (!plan) return res.status(404).json({ error: 'not_found' });
  plan.sizes = await q(
    `SELECT id, account_size, regular_price, entry_price, activation_fee, currency
       FROM plan_sizes WHERE plan_id = $1 ORDER BY sort_order`, [plan.id]);
  res.json(plan);
}));

app.get('/api/stats', wrap(async (_req, res) => {
  res.json(await q('SELECT label, value FROM site_stats ORDER BY sort_order'));
}));

app.get('/api/payouts', wrap(async (_req, res) => {
  res.json(await q(
    `SELECT display_name, country_code, country_name, amount, certificate_url, is_sample
       FROM payouts ORDER BY paid_at DESC LIMIT 24`));
}));

app.get('/api/testimonials', wrap(async (_req, res) => {
  res.json(await q('SELECT * FROM testimonials ORDER BY sort_order'));
}));

app.get('/api/faqs', wrap(async (req, res) => {
  res.json(await q('SELECT question, answer FROM faqs WHERE page = $1 ORDER BY sort_order',
    [req.query.page || 'pay-after-pass']));
}));

// ---------- Market data (read) ----------
app.get('/api/symbols', wrap(async (_req, res) => {
  res.json(await q(
    `SELECT s.symbol, s.description, s.digits, t.bid, t.ask, t.ts
       FROM symbols s LEFT JOIN ticks_latest t USING (symbol)
      WHERE s.is_active ORDER BY s.symbol`));
}));

// GET /api/candles?symbol=EURUSD&timeframe=H1&limit=500
app.get('/api/candles', wrap(async (req, res) => {
  const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
  const timeframe = String(req.query.timeframe || 'H1').toUpperCase();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 5000);
  if (!TIMEFRAMES.includes(timeframe)) return res.status(400).json({ error: 'bad_timeframe' });
  const rows = await q(
    `SELECT extract(epoch FROM ts)::bigint AS time, open, high, low, close, tick_volume AS volume
       FROM (SELECT * FROM candles WHERE symbol = $1 AND timeframe = $2 ORDER BY ts DESC LIMIT $3) c
      ORDER BY ts ASC`, [symbol, timeframe, limit]);
  res.json(rows.map((r) => ({ ...r, time: Number(r.time), volume: Number(r.volume) })));
}));

// ---------- MT5 bridge (write) ----------
function requireBridgeKey(req, res, next) {
  const key = process.env.BRIDGE_API_KEY;
  if (!key || req.get('X-Bridge-Key') !== key) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// POST /api/mt5/candles  { symbol, timeframe, candles: [{time, open, high, low, close, tick_volume, spread, real_volume}] }
app.post('/api/mt5/candles', requireBridgeKey, wrap(async (req, res) => {
  const { symbol, timeframe, candles } = req.body || {};
  if (!symbol || !TIMEFRAMES.includes(timeframe) || !Array.isArray(candles)) {
    return res.status(400).json({ error: 'bad_request' });
  }
  const sym = symbol.toUpperCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO symbols (symbol) VALUES ($1) ON CONFLICT DO NOTHING', [sym]);
    // Batch upsert via unnest for speed
    const cols = { ts: [], o: [], h: [], l: [], c: [], tv: [], sp: [], rv: [] };
    for (const k of candles) {
      cols.ts.push(new Date(k.time * 1000).toISOString());
      cols.o.push(k.open); cols.h.push(k.high); cols.l.push(k.low); cols.c.push(k.close);
      cols.tv.push(k.tick_volume ?? 0); cols.sp.push(k.spread ?? 0); cols.rv.push(k.real_volume ?? 0);
    }
    await client.query(
      `INSERT INTO candles (symbol, timeframe, ts, open, high, low, close, tick_volume, spread, real_volume)
       SELECT $1, $2, * FROM unnest($3::timestamptz[], $4::float8[], $5::float8[], $6::float8[], $7::float8[],
                                    $8::bigint[], $9::int[], $10::bigint[])
       ON CONFLICT (symbol, timeframe, ts) DO UPDATE SET
         open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close,
         tick_volume = EXCLUDED.tick_volume, spread = EXCLUDED.spread, real_volume = EXCLUDED.real_volume`,
      [sym, timeframe, cols.ts, cols.o, cols.h, cols.l, cols.c, cols.tv, cols.sp, cols.rv]);
    await client.query('COMMIT');
    res.json({ ok: true, upserted: candles.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// POST /api/mt5/ticks  { ticks: [{symbol, bid, ask, last, time}] }
app.post('/api/mt5/ticks', requireBridgeKey, wrap(async (req, res) => {
  const ticks = req.body?.ticks;
  if (!Array.isArray(ticks)) return res.status(400).json({ error: 'bad_request' });
  for (const t of ticks) {
    const sym = String(t.symbol).toUpperCase();
    await q('INSERT INTO symbols (symbol) VALUES ($1) ON CONFLICT DO NOTHING', [sym]);
    await q(
      `INSERT INTO ticks_latest (symbol, bid, ask, last, ts) VALUES ($1,$2,$3,$4,to_timestamp($5))
       ON CONFLICT (symbol) DO UPDATE SET bid=EXCLUDED.bid, ask=EXCLUDED.ask, last=EXCLUDED.last, ts=EXCLUDED.ts`,
      [sym, t.bid, t.ask, t.last ?? null, t.time]);
  }
  res.json({ ok: true, count: ticks.length });
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Tradee running on http://localhost:${port}`));
