-- Hardening aditivo e idempotente para campanhas compartilhadas.

alter table public.campaign_state
  add column if not exists revision bigint not null default 0;

alter table public.campaigns
  alter column join_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

alter table public.campaigns drop constraint if exists campaigns_name_length_check;
alter table public.campaigns
  add constraint campaigns_name_length_check check (char_length(name) between 1 and 100);

alter table public.campaign_state drop constraint if exists campaign_state_object_check;
alter table public.campaign_state
  add constraint campaign_state_object_check check (jsonb_typeof(state) = 'object');

create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = p_campaign_id
      and cm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_campaign_member(uuid) from public;
grant execute on function public.is_campaign_member(uuid) to authenticated;

create or replace function public.join_campaign(p_code text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_campaign_id uuid;
  v_member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if char_length(trim(coalesce(p_code, ''))) not between 8 and 12 then
    raise exception 'Código de campanha inválido';
  end if;

  select c.id into v_campaign_id
  from public.campaigns c
  where upper(c.join_code) = upper(trim(p_code))
  limit 1
  for update;

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

revoke all on function public.join_campaign(text) from public;
grant execute on function public.join_campaign(text) to authenticated;

create or replace function public.handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (campaign_id, user_id) do nothing;

  insert into public.campaign_state (campaign_id, state, updated_by, revision)
  values (new.id, '{}'::jsonb, new.owner_id, 0)
  on conflict (campaign_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_campaign() from public;

create or replace function public.touch_campaign_from_state()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.campaigns set updated_at = now() where id = new.campaign_id;
  return new;
end;
$$;

revoke all on function public.touch_campaign_from_state() from public;

create or replace function public.save_campaign_state(
  p_campaign_id uuid,
  p_expected_revision bigint,
  p_state jsonb
)
returns table (new_revision bigint, saved_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.is_campaign_member(p_campaign_id) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'Estado da campanha inválido' using errcode = '22023';
  end if;

  return query
  update public.campaign_state cs
  set state = p_state,
      updated_by = auth.uid(),
      updated_at = now(),
      revision = cs.revision + 1
  where cs.campaign_id = p_campaign_id
    and cs.revision = p_expected_revision
  returning cs.revision, cs.updated_at;

  if not found then
    raise exception 'SAVE_CONFLICT' using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.save_campaign_state(uuid, bigint, jsonb) from public;
grant execute on function public.save_campaign_state(uuid, bigint, jsonb) to authenticated;

drop policy if exists "members can update state" on public.campaign_state;
revoke update on public.campaign_state from authenticated;

grant select on public.campaign_state to authenticated;

alter table public.campaign_state replica identity full;
