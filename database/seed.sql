-- Seed data. Rows with is_sample = true are placeholders: replace with real data before launch.
BEGIN;

INSERT INTO plans (slug, name, market, phases, profit_target_pct, max_daily_loss_pct, max_drawdown_pct, profit_split_pct, time_limit_days)
VALUES ('pay-after-pass', 'Pay After Pass', 'Forex', 1, 10, 4, 6, 80, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plan_sizes (plan_id, account_size, regular_price, entry_price, activation_fee, sort_order)
SELECT p.id, v.size, v.regular, v.entry, v.activation, v.ord
FROM plans p, (VALUES
  (25000::numeric,  29::numeric, 9::numeric,  79::numeric, 1),
  (50000,           39,          9,          129,          2),
  (100000,          49,          9,          229,          3),
  (200000,          69,          9,          429,          4)
) AS v(size, regular, entry, activation, ord)
WHERE p.slug = 'pay-after-pass'
ON CONFLICT (plan_id, account_size) DO NOTHING;

INSERT INTO site_stats (label, value, sort_order) VALUES
  ('Paid to traders', '$0', 1),
  ('Traders', '0', 2),
  ('Countries', '0', 3),
  ('Established', '2026', 4);

INSERT INTO faqs (question, answer, sort_order) VALUES
  ('How does Pay After Pass work?', 'You pay a small entry fee to start a 1-step evaluation. The activation fee is only charged after you pass and choose to activate your Master account.', 1),
  ('What''s the catch?', 'There is none. The rules are identical to a standard 1-step challenge — you simply defer most of the cost until you have proven yourself.', 2),
  ('What if I don''t pass?', 'Then you never pay the activation fee. The entry fee is your only cost.', 3),
  ('When exactly is the activation fee charged?', 'Right when you activate your Master account after passing the evaluation — not before.', 4),
  ('Is it the same Master account as a regular challenge?', 'Yes. Same account, same rules, same reward split.', 5),
  ('Is any of my own money at risk?', 'No. All accounts are simulated demo accounts. The only money you spend is the fees.', 6),
  ('Is there a time limit?', 'No. Take as long as you need to reach the profit target.', 7),
  ('When do KYC and the contract happen?', 'Once, right before your first reward is paid out.', 8);

INSERT INTO payouts (display_name, country_code, country_name, amount, is_sample) VALUES
  ('Trader A.', 'TH', 'Thailand',       12450, true),
  ('Trader B.', 'VN', 'Vietnam',         8320, true),
  ('Trader C.', 'MY', 'Malaysia',       15990, true),
  ('Trader D.', 'SG', 'Singapore',       6710, true),
  ('Trader E.', 'PH', 'Philippines',     9480, true),
  ('Trader F.', 'ID', 'Indonesia',      11205, true),
  ('Trader G.', 'JP', 'Japan',           7330, true),
  ('Trader H.', 'AU', 'Australia',      13870, true);

INSERT INTO testimonials (display_name, country_code, country_name, quote, is_sample, sort_order) VALUES
  ('Trader A.', 'TH', 'Thailand',  'Sample testimonial — replace with a real video.', true, 1),
  ('Trader B.', 'VN', 'Vietnam',   'Sample testimonial — replace with a real video.', true, 2),
  ('Trader C.', 'MY', 'Malaysia',  'Sample testimonial — replace with a real video.', true, 3),
  ('Trader D.', 'SG', 'Singapore', 'Sample testimonial — replace with a real video.', true, 4);

INSERT INTO symbols (symbol, description, digits) VALUES
  ('EURUSD', 'Euro vs US Dollar', 5),
  ('GBPUSD', 'Pound vs US Dollar', 5),
  ('USDJPY', 'US Dollar vs Yen', 3),
  ('XAUUSD', 'Gold vs US Dollar', 2)
ON CONFLICT DO NOTHING;

COMMIT;
