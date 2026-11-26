"""Generate fake candles and push them to the API — for testing the chart without MT5."""
import math
import os
import random
import time

import requests

API = os.getenv("TRADEE_API", "http://localhost:3000").rstrip("/")
KEY = os.getenv("BRIDGE_API_KEY", "change-me-to-a-long-random-string")
STEP = {"M15": 900, "H1": 3600, "H4": 14400, "D1": 86400}
BASE = {"EURUSD": 1.08, "GBPUSD": 1.27, "USDJPY": 151.0, "XAUUSD": 2650.0}

for sym, base in BASE.items():
    for tf, step in STEP.items():
        now = int(time.time()) // step * step
        price, candles = base, []
        for i in range(500, 0, -1):
            o = price
            c = o * (1 + random.gauss(0, 0.0015 * math.sqrt(step / 3600)))
            h, l = max(o, c) * (1 + abs(random.gauss(0, 0.0007))), min(o, c) * (1 - abs(random.gauss(0, 0.0007)))
            candles.append({"time": now - i * step, "open": o, "high": h, "low": l, "close": c,
                            "tick_volume": random.randint(100, 5000)})
            price = c
        r = requests.post(f"{API}/api/mt5/candles", json={"symbol": sym, "timeframe": tf, "candles": candles},
                          headers={"X-Bridge-Key": KEY}, timeout=30)
        r.raise_for_status()
        print(sym, tf, r.json())
    requests.post(f"{API}/api/mt5/ticks", headers={"X-Bridge-Key": KEY}, timeout=10,
                  json={"ticks": [{"symbol": sym, "bid": price, "ask": price * 1.00005, "time": int(time.time())}]})
