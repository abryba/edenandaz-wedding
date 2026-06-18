-- ============================================================================
-- Price Monitor — Supabase / Postgres schema
-- Run this in: Supabase Dashboard > SQL Editor > New query > Run
-- It is idempotent-ish: safe to re-run, but seed data inserts guard duplicates.
-- ============================================================================

-- ---------- Settings (single-row key/value style) --------------------------
create table if not exists settings (
  id                  int primary key default 1,
  currency            text not null default 'GBP',
  -- Global default deviation threshold (%). A listing/product can override.
  default_threshold_pct numeric not null default 5,
  -- 'alerts_only' = email only when there are deviations; 'always' = daily summary always.
  email_mode          text not null default 'alerts_only' check (email_mode in ('alerts_only','always')),
  email_subject_prefix text not null default '[Price Monitor]',
  updated_at          timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- ---------- Products (your catalogue + RRP) --------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique not null,
  name          text not null,
  rrp           numeric not null check (rrp >= 0),
  -- Per-product override of the global threshold. NULL = use global default.
  threshold_pct numeric,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- Dealers --------------------------------------------------------
create table if not exists dealers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  website     text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Listings (a product sold on a dealer's specific page) ----------
create table if not exists listings (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  dealer_id     uuid not null references dealers(id) on delete cascade,
  product_url   text not null,
  -- Optional CSS selector to pinpoint the price element when auto-detect fails.
  css_selector  text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (dealer_id, product_url)
);

-- ---------- Price snapshots (one row per listing per scrape run) ------------
create table if not exists price_snapshots (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  scraped_at    timestamptz not null default now(),
  price         numeric,                 -- NULL when scrape failed
  currency      text,
  status        text not null default 'ok' check (status in ('ok','error')),
  method        text,                    -- how the price was extracted
  raw_text      text,                    -- raw matched string, for debugging
  error_message text
);

create index if not exists idx_snapshots_listing_time
  on price_snapshots (listing_id, scraped_at desc);

-- ---------- Alert recipients ----------------------------------------------
create table if not exists recipients (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Seed data (example dealers / products so the tool works end-to-end).
-- Replace via the admin UI once your real data is in.
-- ============================================================================

insert into products (sku, name, rrp, threshold_pct) values
  ('WID-100', 'AcmeFlow Pro Widget 100', 199.00, 5),
  ('WID-200', 'AcmeFlow Max Widget 200', 349.00, null),
  ('GAD-050', 'AcmeGadget Mini 50',       89.99, 10)
on conflict (sku) do nothing;

insert into dealers (name, website) values
  ('Northgate Supplies',  'https://example-dealer-a.com'),
  ('BluePeak Trading',    'https://example-dealer-b.com'),
  ('Harbour & Co',        'https://example-dealer-c.com')
on conflict do nothing;

-- Example listings wire the seed products to seed dealers.
-- product_url points at scrapeable demo pages; swap for your dealers' real URLs.
insert into listings (product_id, dealer_id, product_url, css_selector)
select p.id, d.id, v.url, v.sel
from (values
  ('WID-100', 'Northgate Supplies', 'https://www.scrapingcourse.com/ecommerce/product/abominable-hoodie', null),
  ('WID-200', 'BluePeak Trading',   'https://www.scrapingcourse.com/ecommerce/product/adrienne-trek-jacket', null),
  ('GAD-050', 'Harbour & Co',       'https://www.scrapingcourse.com/ecommerce/product/aeon-capri', null)
) as v(sku, dealer, url, sel)
join products p on p.sku = v.sku
join dealers  d on d.name = v.dealer
on conflict (dealer_id, product_url) do nothing;

insert into recipients (email, name) values
  ('pricing@yourcompany.com', 'Pricing Team')
on conflict (email) do nothing;

-- ============================================================================
-- Row Level Security
-- The admin UI and scraper use the SERVICE ROLE key (bypasses RLS).
-- We enable RLS and add NO public policies, so the anon key cannot read/write.
-- ============================================================================
alter table settings        enable row level security;
alter table products        enable row level security;
alter table dealers         enable row level security;
alter table listings        enable row level security;
alter table price_snapshots enable row level security;
alter table recipients      enable row level security;
