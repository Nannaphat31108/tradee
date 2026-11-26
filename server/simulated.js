// Simulated market data used until the MT5 bridge is connected.
// Prices are a deterministic function of time, so every poll returns the same history
// and the last bar keeps "moving" like a live market.

const TF_SECONDS = { M1: 60, M5: 300, M15: 900, M30: 1800, H1: 3600, H4: 14400, D1: 86400, W1: 604800, MN1: 2592000 };
const BASE = { EURUSD: 1.085, GBPUSD: 1.27, USDJPY: 151.2, XAUUSD: 2650, BTCUSD: 68000 };
const DIGITS = { USDJPY: 3, XAUUSD: 2, BTCUSD: 2 };

function hash(n) {
  // integer hash → [0,1)
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
function smoothNoise(t, period, seed) {
  const i = Math.floor(t / period), f = t / period - i;
  const a = hash(i * 31 + seed) - 0.5, b = hash((i + 1) * 31 + seed) - 0.5;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
}
function symSeed(sym) { let h = 7; for (const c of sym) h = h * 131 + c.charCodeAt(0); return h & 0xffff; }

export function priceAt(symbol, t) {
  const base = BASE[symbol] ?? 100;
  const s = symSeed(symbol);
  const v =
    0.060 * smoothNoise(t, 86400 * 30, s) +
    0.025 * smoothNoise(t, 86400 * 5, s + 1) +
    0.010 * smoothNoise(t, 86400, s + 2) +
    0.004 * smoothNoise(t, 3600 * 4, s + 3) +
    0.0015 * smoothNoise(t, 3600, s + 4) +
    0.0006 * smoothNoise(t, 300, s + 5) +
    0.0002 * smoothNoise(t, 30, s + 6);
  return base * (1 + v);
}

export function simulatedCandles(symbol, timeframe, limit, now = Math.floor(Date.now() / 1000)) {
  const step = TF_SECONDS[timeframe];
  const digits = DIGITS[symbol] ?? 5;
  const round = (x) => Number(x.toFixed(digits));
  const start = Math.floor(now / step) * step - (limit - 1) * step;
  const samples = 12;
  const out = [];
  for (let k = 0; k < limit; k++) {
    const t0 = start + k * step;
    const t1 = Math.min(t0 + step, now);
    const prices = [];
    for (let j = 0; j <= samples; j++) prices.push(priceAt(symbol, t0 + ((t1 - t0) * j) / samples));
    out.push({
      time: t0,
      open: round(prices[0]),
      high: round(Math.max(...prices)),
      low: round(Math.min(...prices)),
      close: round(prices[prices.length - 1]),
      volume: Math.round(200 + 4000 * hash(t0 + symSeed(symbol)) * Math.sqrt(step / 3600)),
    });
  }
  return out;
}

export function simulatedTick(symbol, now = Math.floor(Date.now() / 1000)) {
  const digits = DIGITS[symbol] ?? 5;
  const bid = priceAt(symbol, now);
  const spread = bid * 0.00006;
  return { bid: Number(bid.toFixed(digits)), ask: Number((bid + spread).toFixed(digits)), ts: new Date(now * 1000).toISOString() };
}
