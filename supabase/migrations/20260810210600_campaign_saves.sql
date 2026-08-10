-- BielJuliaRPG: contas, campanhas compartilhadas, autosave e realtime.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'O Silêncio de Vharnak',
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner', 'player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table if not exists public.campaign_state (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists campaign_members_user_id_idx on public.campaign_members(user_id);
create index if not exists campaigns_updated_at_idx on public.campaigns(updated_at desc);

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_state enable row level security;

create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = p_campaign_id
      and cm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_campaign_member(uuid) to authenticated;

create policy "members can read campaigns"
on public.campaigns for select
to authenticated
using (public.is_campaign_member(id));

create policy "users can create their campaigns"
on public.campaigns for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owners can update campaigns"
on public.campaigns for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owners can delete campaigns"
on public.campaigns for delete
to authenticated
using (owner_id = auth.uid());

create policy "members can read campaign members"
on public.campaign_members for select
to authenticated
using (public.is_campaign_member(campaign_id));

create policy "members can read state"
on public.campaign_state for select
to authenticated
using (public.is_campaign_member(campaign_id));

create policy "members can update state"
on public.campaign_state for update
to authenticated
using (public.is_campaign_member(campaign_id))
with check (public.is_campaign_member(campaign_id));

grant select, insert, update, delete on public.campaigns to authenticated;
grant select on public.campaign_members to authenticated;
grant select, update on public.campaign_state to authenticated;

create or replace function public.handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (campaign_id, user_id) do nothing;

  insert into public.campaign_state (campaign_id, state, updated_by)
  values (new.id, '{}'::jsonb, new.owner_id)
  on conflict (campaign_id) do nothing;

  return new;
end;
$$;

drop trigger if exists campaign_created_bootstrap on public.campaigns;
create trigger campaign_created_bootstrap
after insert on public.campaigns
for each row execute function public.handle_new_campaign();

create or replace function public.join_campaign(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  select c.id into v_campaign_id
  from public.campaigns c
  where upper(c.join_code) = upper(trim(p_code))
  limit 1;

  if v_campaign_id is null then
    raise exception 'Código de campanha inválido';
  end if;

  if exists (
    select 1 from public.campaign_members
    where campaign_id = v_campaign_id and user_id = auth.uid()
  ) then
    return v_campaign_id;
  end if;

  select count(*) into v_member_count
  from public.campaign_members
  where campaign_id = v_campaign_id;

  if v_member_count >= 2 then
    raise exception 'Esta campanha já possui dois jogadores';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign_id, auth.uid(), 'player');

  return v_campaign_id;
end;
$$;

grant execute on function public.join_campaign(text) to authenticated;

create or replace function public.touch_campaign_from_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns set updated_at = now() where id = new.campaign_id;
  return new;
end;
$$;

drop trigger if exists campaign_state_touches_campaign on public.campaign_state;
create trigger campaign_state_touches_campaign
after update on public.campaign_state
for each row execute function public.touch_campaign_from_state();

alter table public.campaign_state replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_state'
  ) then
    execute 'alter publication supabase_realtime add table public.campaign_state';
  end if;
end
$$;
