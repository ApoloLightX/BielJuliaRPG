-- Corrige o fluxo de criação de campanhas observado em produção.
-- A quota e a normalização passam para um trigger BEFORE INSERT; a RLS
-- continua garantindo que a linha final pertença ao usuário autenticado.

create or replace function public.enforce_campaign_creation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owned_count integer;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  new.name := btrim(coalesce(new.name, ''));
  if char_length(new.name) not between 1 and 100 then
    raise exception 'O nome da campanha deve ter entre 1 e 100 caracteres';
  end if;

  select count(*) into v_owned_count
  from public.campaigns
  where owner_id = v_user_id;

  if v_owned_count >= 20 then
    raise exception 'Limite de campanhas atingido';
  end if;

  -- Nunca confia no owner_id enviado pelo navegador.
  new.owner_id := v_user_id;
  return new;
end;
$$;

revoke all on function public.enforce_campaign_creation() from public;

drop trigger if exists campaign_creation_guard on public.campaigns;
create trigger campaign_creation_guard
before insert on public.campaigns
for each row execute function public.enforce_campaign_creation();

drop policy if exists "users can create their campaigns" on public.campaigns;
create policy "users can create their campaigns"
on public.campaigns for insert
to authenticated
with check (
  owner_id = auth.uid()
  and char_length(name) between 1 and 100
);

grant insert on public.campaigns to authenticated;
