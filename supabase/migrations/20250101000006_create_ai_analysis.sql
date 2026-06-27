-- AI analysis requests and results
create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  prompt_type text not null default 'portfolio_analysis', -- portfolio_analysis, asset_recommendation, risk_assessment
  request_prompt text not null,
  response_text text,
  model text not null default 'openrouter/auto',
  tokens_used integer,
  cost_usd numeric(10, 6),
  status text not null default 'pending', -- pending, completed, failed
  error_message text,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- RLS policies
alter table public.ai_analyses enable row level security;

create policy "Users can view own ai_analyses"
  on public.ai_analyses
  for select
  using (user_id = auth.uid());

create policy "Users can insert own ai_analyses"
  on public.ai_analyses
  for insert
  with check (user_id = auth.uid());

-- Index for common queries
create index if not exists idx_ai_analyses_user_portfolio
  on public.ai_analyses(user_id, portfolio_id, created_at desc);

create index if not exists idx_ai_analyses_status
  on public.ai_analyses(status, created_at desc);
