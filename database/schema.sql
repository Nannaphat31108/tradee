-- Tradee database schema (PostgreSQL 14+ / Supabase compatible)
-- Run: psql "$DATABASE_URL" -f database/schema.sql

BEGIN;

-- ---------- Users & accounts ----------
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name     TEXT,
  country_code  CHAR(2),
  kyc_status    TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none','pending','approved','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Products / pricing ----------
CREATE TABLE IF NOT EXISTS plans (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,          -- e.g. pay-after-pass
  name                TEXT NOT NULL,
  market              TEXT NOT NULL DEFAULT 'Forex',
  phases              SMALLINT NOT NULL DEFAULT 1,
  profit_target_pct   NUMERIC(5,2),
  max_daily_loss_pct  NUMERIC(5,2),
  max_drawdown_pct    NUMERIC(5,2),
  profit_split_pct    NUMERIC(5,2),
  time_limit_days     INT,                            -- NULL = no time limit
  is_active           BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS plan_sizes (
  id                SERIAL PRIMARY KEY,
  plan_id           INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  account_size      NUMERIC(14,2) NOT NULL,
  regular_price     NUMERIC(10,2) NOT NULL,           -- shown struck through during promos
  entry_price       NUMERIC(10,2) NOT NULL,           -- charged up front
  activation_fee    NUMERIC(10,2) NOT NULL DEFAULT 0, -- charged only after passing
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  sort_order        INT NOT NULL DEFAULT 0,
  UNIQUE (plan_id, account_size)
);

-- ---------- Orders & challenge lifecycle ----------
CREATE TABLE IF NOT EXISTS orders (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id),
  plan_size_id   INT NOT NULL REFERENCES plan_sizes(id),
  kind           TEXT NOT NULL CHECK (kind IN ('entry','activation')),
  amount         NUMERIC(10,2) NOT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('card','crypto')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id),
  plan_size_id     INT NOT NULL REFERENCES plan_sizes(id),
  stage            TEXT NOT NULL DEFAULT 'challenge' CHECK (stage IN ('challenge','passed','master','breached')),
  mt5_login        BIGINT UNIQUE,
  mt5_server       TEXT,
  starting_balance NUMERIC(14,2) NOT NULL,
  balance          NUMERIC(14,2),
  equity           NUMERIC(14,2),
  passed_at        TIMESTAMPTZ,
  activated_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id),
  display_name  TEXT NOT NULL,          -- e.g. "Somchai K."
  country_code  CHAR(2),
  country_name  TEXT,
  amount        NUMERIC(14,2) NOT NULL,
  certificate_url TEXT,
  is_sample     BOOLEAN NOT NULL DEFAULT false,  -- true = placeholder data, replace before launch
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CMS-ish content ----------
CREATE TABLE IF NOT EXISTS site_stats (
  id        SERIAL PRIMARY KEY,
  label     TEXT NOT NULL,
  value     TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id         SERIAL PRIMARY KEY,
  page       TEXT NOT NULL DEFAULT 'pay-after-pass',
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id           SERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  country_code CHAR(2),
  country_name TEXT,
  video_url    TEXT,
  thumbnail_url TEXT,
  quote        TEXT,
  is_sample    BOOLEAN NOT NULL DEFAULT false,
  sort_order   INT NOT NULL DEFAULT 0
);

-- ---------- MT5 market data ----------
CREATE TABLE IF NOT EXISTS symbols (
  symbol      TEXT PRIMARY KEY,           -- e.g. EURUSD
  description TEXT,
  digits      SMALLINT NOT NULL DEFAULT 5,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- One row per bar. timeframe: M1,M5,M15,M30,H1,H4,D1,W1,MN1
CREATE TABLE IF NOT EXISTS candles (
  symbol     TEXT NOT NULL REFERENCES symbols(symbol) ON DELETE CASCADE,
  timeframe  TEXT NOT NULL CHECK (timeframe IN ('M1','M5','M15','M30','H1','H4','D1','W1','MN1')),
  ts         TIMESTAMPTZ NOT NULL,        -- bar open time (UTC)
  open       DOUBLE PRECISION NOT NULL,
  high       DOUBLE PRECISION NOT NULL,
  low        DOUBLE PRECISION NOT NULL,
  close      DOUBLE PRECISION NOT NULL,
  tick_volume BIGINT NOT NULL DEFAULT 0,
  spread     INT NOT NULL DEFAULT 0,
  real_volume BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (symbol, timeframe, ts)
);
CREATE INDEX IF NOT EXISTS candles_lookup_idx ON candles (symbol, timeframe, ts DESC);

-- Latest tick per symbol (upserted by bridge)
CREATE TABLE IF NOT EXISTS ticks_latest (
  symbol     TEXT PRIMARY KEY REFERENCES symbols(symbol) ON DELETE CASCADE,
  bid        DOUBLE PRECISION,
  ask        DOUBLE PRECISION,
  last       DOUBLE PRECISION,
  ts         TIMESTAMPTZ NOT NULL
);

-- Account snapshots pulled from MT5 (equity curve per trading account)
CREATE TABLE IF NOT EXISTS account_snapshots (
  account_id BIGINT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  ts         TIMESTAMPTZ NOT NULL,
  balance    NUMERIC(14,2) NOT NULL,
  equity     NUMERIC(14,2) NOT NULL,
  margin     NUMERIC(14,2),
  PRIMARY KEY (account_id, ts)
);

CREATE TABLE IF NOT EXISTS deals (
  id          BIGSERIAL PRIMARY KEY,
  account_id  BIGINT NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  mt5_ticket  BIGINT NOT NULL,
  symbol      TEXT NOT NULL,
  side        TEXT NOT NULL CHECK (side IN ('buy','sell')),
  volume      NUMERIC(12,2) NOT NULL,
  price       DOUBLE PRECISION NOT NULL,
  profit      NUMERIC(14,2) NOT NULL DEFAULT 0,
  ts          TIMESTAMPTZ NOT NULL,
  UNIQUE (account_id, mt5_ticket)
);

COMMIT;
