-- Create portfolios table
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  currency text default 'BRL',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create data sources table
create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,  -- 'manual', 'investidor10', 'csv', etc
  name text not null,
  url text,
  active boolean default true,
  principal boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_sync timestamptz,
  last_status text,  -- 'success', 'error', 'pending'
  last_error text
);

-- Create portfolio assets table
create table if not exists public.portfolio_assets (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  quantity numeric(18, 8) not null default 0,
  average_price numeric(18, 8) not null default 0,
  current_price numeric(18, 8),
  category text,  -- 'acao', 'fii', 'etf', 'renda_fixa', 'cripto'
  sector text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(portfolio_id, ticker)
);

-- Indexes
create index idx_portfolios_user_id on public.portfolios(user_id);
create index idx_data_sources_portfolio_id on public.data_sources(portfolio_id);
create index idx_data_sources_user_id on public.data_sources(user_id);
create index idx_portfolio_assets_portfolio_id on public.portfolio_assets(portfolio_id);
create index idx_portfolio_assets_user_id on public.portfolio_assets(user_id);
create index idx_portfolio_assets_ticker on public.portfolio_assets(ticker);

-- Enable RLS
alter table public.portfolios enable row level security;
alter table public.data_sources enable row level security;
alter table public.portfolio_assets enable row level security;

-- RLS Policies for portfolios
create policy "Users can view own portfolios"
  on public.portfolios
  for select
  using (user_id = auth.uid());

create policy "Users can create portfolios"
  on public.portfolios
  for insert
  with check (user_id = auth.uid());

create policy "Users can update own portfolios"
  on public.portfolios
  for update
  using (user_id = auth.uid());

create policy "Users can delete own portfolios"
  on public.portfolios
  for delete
  using (user_id = auth.uid());

-- RLS Policies for data sources
create policy "Users can view own data sources"
  on public.data_sources
  for select
  using (user_id = auth.uid());

create policy "Users can create data sources"
  on public.data_sources
  for insert
  with check (user_id = auth.uid());

create policy "Users can update own data sources"
  on public.data_sources
  for update
  using (user_id = auth.uid());

create policy "Users can delete own data sources"
  on public.data_sources
  for delete
  using (user_id = auth.uid());

-- RLS Policies for portfolio assets
create policy "Users can view own portfolio assets"
  on public.portfolio_assets
  for select
  using (user_id = auth.uid());

create policy "Users can create portfolio assets"
  on public.portfolio_assets
  for insert
  with check (user_id = auth.uid());

create policy "Users can update own portfolio assets"
  on public.portfolio_assets
  for update
  using (user_id = auth.uid());

create policy "Users can delete own portfolio assets"
  on public.portfolio_assets
  for delete
  using (user_id = auth.uid());

-- RPC to create portfolio with default data source
create or replace function public.create_portfolio(
  p_name text,
  p_description text default null
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_portfolio_id uuid;
  v_data_source_id uuid;
begin
  -- Create portfolio
  insert into public.portfolios (user_id, name, description)
  values (auth.uid(), p_name, p_description)
  returning id into v_portfolio_id;

  -- Create default manual data source
  insert into public.data_sources (
    portfolio_id, user_id, provider, name, active, principal
  ) values (
    v_portfolio_id, auth.uid(), 'manual', 'Manual', true, true
  )
  returning id into v_data_source_id;

  return jsonb_build_object(
    'portfolio_id', v_portfolio_id,
    'data_source_id', v_data_source_id
  );
end;
$$;

-- RPC to add asset to portfolio
create or replace function public.add_portfolio_asset(
  p_portfolio_id uuid,
  p_ticker text,
  p_quantity numeric,
  p_average_price numeric,
  p_category text default null,
  p_sector text default null
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_asset_id uuid;
  v_data_source_id uuid;
begin
  -- Get default data source for this portfolio
  select id into v_data_source_id
  from public.data_sources
  where portfolio_id = p_portfolio_id and principal = true
  limit 1;

  if v_data_source_id is null then
    raise exception 'No default data source found for portfolio';
  end if;

  -- Insert or update asset
  insert into public.portfolio_assets (
    portfolio_id, data_source_id, user_id, ticker, quantity, average_price, category, sector
  ) values (
    p_portfolio_id, v_data_source_id, auth.uid(), p_ticker, p_quantity, p_average_price, p_category, p_sector
  )
  on conflict (portfolio_id, ticker)
  do update set
    quantity = excluded.quantity,
    average_price = excluded.average_price,
    category = excluded.category,
    sector = excluded.sector,
    updated_at = now()
  returning id into v_asset_id;

  return jsonb_build_object('asset_id', v_asset_id);
end;
$$;

grant execute on function public.create_portfolio to authenticated;
grant execute on function public.add_portfolio_asset to authenticated;
