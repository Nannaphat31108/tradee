-- Supabase hardening: lock Tradee tables away from the public REST API (anon/authenticated keys)
-- and create a dedicated least-privilege login role for the Node server.
-- The server connects with DATABASE_URL using role "tradee_app", so RLS does not need policies.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','plans','plan_sizes','orders','trading_accounts','payouts','site_stats',
                           'faqs','testimonials','symbols','candles','ticks_latest','account_snapshots','deals']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- Create the app role (password is set separately, never committed):
--   CREATE ROLE tradee_app LOGIN PASSWORD '...' BYPASSRLS;
GRANT USAGE ON SCHEMA public TO tradee_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  users, plans, plan_sizes, orders, trading_accounts, payouts, site_stats,
  faqs, testimonials, symbols, candles, ticks_latest, account_snapshots, deals TO tradee_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tradee_app;
