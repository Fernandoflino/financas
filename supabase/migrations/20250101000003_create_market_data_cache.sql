-- Create market_data schema
create schema if not exists market_data;

-- Market data providers
create table if not exists market_data.providers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Market data cache
create table if not exists market_data.cache (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null,
  data_type text not null,  -- 'quote' | 'company_info' | 'dividends' | 'historical'
  ticker text not null,
  payload jsonb not null,
  fetched_at timestamptz default now(),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(provider_code, data_type, ticker)
);

-- Indexes
create index idx_market_data_cache_expires_at on market_data.cache(expires_at);
create index idx_market_data_cache_ticker on market_data.cache(ticker);
create index idx_market_data_cache_lookup on market_data.cache(provider_code, data_type, ticker);

-- Seed providers
insert into market_data.providers (code, name, description, active) values
  ('brapi', 'BRAPI', 'Brasil API - Dados de mercado brasileiro', true),
  ('alpha_vantage', 'Alpha Vantage', 'Cotações globais e dados históricos', false),
  ('finnhub', 'Finnhub', 'Dados de mercado global', false)
on conflict (code) do nothing;

-- RPC to get or fetch market data
create or replace function market_data.get_or_fetch(
  p_provider_code text,
  p_data_type text,
  p_ticker text,
  p_ttl_seconds int default 3600
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_cached_data jsonb;
  v_expires_at timestamptz;
begin
  -- Try to get from cache (if not expired)
  select payload into v_cached_data
  from market_data.cache
  where provider_code = p_provider_code
    and data_type = p_data_type
    and ticker = p_ticker
    and expires_at > now()
  limit 1;

  if v_cached_data is not null then
    return v_cached_data;
  end if;

  -- Return null if expired or not found (caller should fetch from API)
  return null;
end;
$$;

-- RPC to cache market data
create or replace function market_data.set_cache(
  p_provider_code text,
  p_data_type text,
  p_ticker text,
  p_payload jsonb,
  p_ttl_seconds int default 3600
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into market_data.cache (
    provider_code, data_type, ticker, payload, fetched_at, expires_at
  ) values (
    p_provider_code,
    p_data_type,
    p_ticker,
    p_payload,
    now(),
    now() + (p_ttl_seconds || ' seconds')::interval
  )
  on conflict (provider_code, data_type, ticker)
  do update set
    payload = excluded.payload,
    fetched_at = excluded.fetched_at,
    expires_at = excluded.expires_at,
    updated_at = now();
end;
$$;

-- RPC to clean expired cache (run periodically via pg_cron or Edge Function)
create or replace function market_data.cleanup_expired()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_deleted_count int;
begin
  delete from market_data.cache where expires_at < now();
  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

-- Grant permissions
grant usage on schema market_data to authenticated;
grant select on market_data.providers to authenticated;
grant select on market_data.cache to authenticated;
grant execute on function market_data.get_or_fetch to authenticated;
grant execute on function market_data.set_cache to authenticated;
grant execute on function market_data.cleanup_expired to authenticated;
