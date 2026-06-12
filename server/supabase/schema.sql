create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  career_direction text not null,
  priority text not null,
  long_term_study text not null,
  city_preference text not null,
  risk_preference text not null,
  province text not null,
  subject_type text not null,
  score text,
  rank text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  free_report jsonb,
  full_report jsonb,
  status text not null default 'free_generated'
    check (status in ('free_generated', 'full_generated', 'failed')),
  model_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  amount integer not null default 1990 check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'manual',
  transaction_note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admission_data (
  id uuid primary key default gen_random_uuid(),
  province text,
  year integer,
  school_name text,
  major_name text,
  subject_type text,
  min_score integer,
  min_rank integer,
  batch text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text,
  target_type text,
  target_id text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  title text,
  status text not null default 'active'
    check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  chat_message_limit integer not null default 20 check (chat_message_limit >= 0),
  used_chat_messages integer not null default 0 check (used_chat_messages >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (used_chat_messages <= chat_message_limit)
);

create index if not exists reports_profile_id_idx on public.reports(profile_id);
create index if not exists orders_report_status_idx on public.orders(report_id, status);
create index if not exists orders_profile_id_idx on public.orders(profile_id);
create index if not exists admission_lookup_idx
  on public.admission_data(province, year, subject_type, min_rank);
create index if not exists chat_sessions_report_id_idx on public.chat_sessions(report_id);
create index if not exists chat_messages_session_created_idx
  on public.chat_messages(chat_session_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

drop trigger if exists usage_limits_set_updated_at on public.usage_limits;
create trigger usage_limits_set_updated_at
before update on public.usage_limits
for each row execute function public.set_updated_at();

create or replace function public.consume_chat_message(p_order_id uuid)
returns table (
  used_messages integer,
  message_limit integer,
  remaining_messages integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.usage_limits
  set used_chat_messages = used_chat_messages + 1
  where order_id = p_order_id
    and used_chat_messages < chat_message_limit;

  if not found then
    raise exception 'CHAT_LIMIT_EXCEEDED';
  end if;

  return query
  select
    ul.used_chat_messages,
    ul.chat_message_limit,
    ul.chat_message_limit - ul.used_chat_messages
  from public.usage_limits ul
  where ul.order_id = p_order_id;
end;
$$;

comment on function public.consume_chat_message(uuid)
is 'Atomically consumes one paid user chat question.';

-- The service role is used only by the backend and bypasses RLS.
-- Keep tables private by default for browser clients.
alter table public.user_profiles enable row level security;
alter table public.reports enable row level security;
alter table public.orders enable row level security;
alter table public.admission_data enable row level security;
alter table public.admin_logs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.usage_limits enable row level security;
