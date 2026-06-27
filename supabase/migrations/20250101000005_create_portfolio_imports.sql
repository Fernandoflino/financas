-- Portfolio imports tracking
create table if not exists public.portfolio_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  imported_at timestamp with time zone default now(),
  items_found integer not null default 0,
  items_added integer not null default 0,
  items_updated integer not null default 0,
  items_removed integer not null default 0,
  parsing_errors integer not null default 0,
  error_details jsonb,
  created_at timestamp with time zone default now()
);

-- RLS policies
alter table public.portfolio_imports enable row level security;

create policy "Users can view own portfolio imports"
  on public.portfolio_imports
  for select
  using (user_id = auth.uid());

create policy "Users can insert own portfolio imports"
  on public.portfolio_imports
  for insert
  with check (user_id = auth.uid());

-- Function to apply portfolio import (diff + upsert)
create or replace function public.apply_portfolio_import(
  p_portfolio_id uuid,
  p_data_source_id uuid,
  p_items jsonb
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_existing_tickers text[];
  v_new_tickers text[];
  v_item jsonb;
  v_ticker text;
  v_quantity numeric;
  v_average_price numeric;
  v_category text;
  v_sector text;
  v_items_added integer := 0;
  v_items_updated integer := 0;
  v_items_removed integer := 0;
  v_items_found integer := 0;
  v_existing_ticker text;
begin
  -- Verify user ownership
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify portfolio belongs to user
  if not exists (
    select 1 from public.portfolios
    where id = p_portfolio_id and user_id = v_user_id
  ) then
    raise exception 'Portfolio not found or not owned by user';
  end if;

  -- Count items found
  v_items_found := jsonb_array_length(p_items);

  -- Get existing tickers for this portfolio
  select array_agg(ticker) into v_existing_tickers
  from public.portfolio_assets
  where portfolio_id = p_portfolio_id;

  v_existing_tickers := coalesce(v_existing_tickers, array[]::text[]);

  -- Process each imported item
  for v_item in select jsonb_array_elements(p_items)
  loop
    v_ticker := (v_item->>'ticker')::text;
    v_quantity := (v_item->>'quantity')::numeric;
    v_average_price := (v_item->>'averagePrice')::numeric;
    v_category := v_item->>'category';
    v_sector := v_item->>'sector';

    if v_ticker is null or v_ticker = '' then
      continue;
    end if;

    v_new_tickers := array_append(v_new_tickers, v_ticker);

    -- Check if asset exists
    if v_ticker = any(v_existing_tickers) then
      -- Update existing asset
      update public.portfolio_assets
      set
        quantity = v_quantity,
        average_price = v_average_price,
        current_price = coalesce(current_price, 0),
        category = coalesce(v_category, category),
        sector = coalesce(v_sector, sector),
        updated_at = now()
      where portfolio_id = p_portfolio_id and ticker = v_ticker;

      v_items_updated := v_items_updated + 1;
    else
      -- Insert new asset
      insert into public.portfolio_assets (
        portfolio_id,
        data_source_id,
        user_id,
        ticker,
        quantity,
        average_price,
        current_price,
        category,
        sector
      ) values (
        p_portfolio_id,
        p_data_source_id,
        v_user_id,
        v_ticker,
        v_quantity,
        v_average_price,
        0,
        v_category,
        v_sector
      );

      v_items_added := v_items_added + 1;
    end if;
  end loop;

  -- Remove assets no longer in import
  for v_existing_ticker in select unnest(v_existing_tickers)
  loop
    if not (v_existing_ticker = any(v_new_tickers)) then
      delete from public.portfolio_assets
      where portfolio_id = p_portfolio_id and ticker = v_existing_ticker;

      v_items_removed := v_items_removed + 1;
    end if;
  end loop;

  -- Record import in history
  insert into public.portfolio_imports (
    user_id,
    portfolio_id,
    data_source_id,
    items_found,
    items_added,
    items_updated,
    items_removed
  ) values (
    v_user_id,
    p_portfolio_id,
    p_data_source_id,
    v_items_found,
    v_items_added,
    v_items_updated,
    v_items_removed
  );

  return jsonb_build_object(
    'success', true,
    'items_found', v_items_found,
    'items_added', v_items_added,
    'items_updated', v_items_updated,
    'items_removed', v_items_removed
  );
end;
$$ language plpgsql security definer set search_path = public;
