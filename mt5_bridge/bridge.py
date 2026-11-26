"""
Tradee MT5 bridge
-----------------
Runs on a Windows machine (or VPS) with the MetaTrader 5 terminal installed.
Pulls OHLC candles + latest ticks from MT5 and pushes them to the Tradee API,
which stores them in PostgreSQL (tables: candles, ticks_latest).

  pip install -r requirements.txt
  copy .env.example .env   (then edit)
  python bridge.py
"""
import os
import sys
import time

import MetaTrader5 as mt5
import requests
from dotenv import load_dotenv

load_dotenv()

API = os.getenv("TRADEE_API", "http://localhost:3000").rstrip("/")
KEY = os.getenv("BRIDGE_API_KEY", "")
SYMBOLS = [s.strip() for s in os.getenv("SYMBOLS", "EURUSD").split(",") if s.strip()]
TFS = [t.strip() for t in os.getenv("TIMEFRAMES", "M1,H1,D1").split(",") if t.strip()]
HISTORY_BARS = int(os.getenv("HISTORY_BARS", "2000"))
POLL = float(os.getenv("POLL_SECONDS", "5"))

TF_MAP = {
    "M1": mt5.TIMEFRAME_M1, "M5": mt5.TIMEFRAME_M5, "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30, "H1": mt5.TIMEFRAME_H1, "H4": mt5.TIMEFRAME_H4,
    "D1": mt5.TIMEFRAME_D1, "W1": mt5.TIMEFRAME_W1, "MN1": mt5.TIMEFRAME_MN1,
}

session = requests.Session()
session.headers.update({"X-Bridge-Key": KEY, "Content-Type": "application/json"})


def connect():
    kwargs = {}
    if os.getenv("MT5_PATH"):
        kwargs["path"] = os.getenv("MT5_PATH")
    if os.getenv("MT5_LOGIN"):
        kwargs.update(login=int(os.getenv("MT5_LOGIN")),
                      password=os.getenv("MT5_PASSWORD", ""),
                      server=os.getenv("MT5_SERVER", ""))
    if not mt5.initialize(**kwargs):
        sys.exit(f"MT5 initialize failed: {mt5.last_error()}")
    info = mt5.account_info()
    print(f"Connected to MT5: {info.login if info else '?'} @ {info.server if info else '?'}")
    for s in SYMBOLS:
        mt5.symbol_select(s, True)


def push_candles(symbol, tf, count):
    rates = mt5.copy_rates_from_pos(symbol, TF_MAP[tf], 0, count)
    if rates is None or len(rates) == 0:
        print(f"  no data for {symbol} {tf}: {mt5.last_error()}")
        return
    payload = {
        "symbol": symbol,
        "timeframe": tf,
        "candles": [
            {
                "time": int(r["time"]), "open": float(r["open"]), "high": float(r["high"]),
                "low": float(r["low"]), "close": float(r["close"]),
                "tick_volume": int(r["tick_volume"]), "spread": int(r["spread"]),
                "real_volume": int(r["real_volume"]),
            }
            for r in rates
        ],
    }
    r = session.post(f"{API}/api/mt5/candles", json=payload, timeout=30)
    r.raise_for_status()


def push_ticks():
    ticks = []
    for s in SYMBOLS:
        t = mt5.symbol_info_tick(s)
        if t:
            ticks.append({"symbol": s, "bid": t.bid, "ask": t.ask, "last": t.last, "time": int(t.time)})
    if ticks:
        session.post(f"{API}/api/mt5/ticks", json={"ticks": ticks}, timeout=10).raise_for_status()


def main():
    connect()
    print("Backfilling history...")
    for s in SYMBOLS:
        for tf in TFS:
            push_candles(s, tf, HISTORY_BARS)
            print(f"  {s} {tf} ok")
    print(f"Streaming every {POLL}s (Ctrl+C to stop)")
    while True:
        try:
            push_ticks()
            for s in SYMBOLS:
                for tf in TFS:
                    push_candles(s, tf, 3)  # refresh the forming bar + last closed bars
        except requests.RequestException as e:
            print(f"API error: {e}")
        time.sleep(POLL)


if __name__ == "__main__":
    try:
        main()
    finally:
        mt5.shutdown()
