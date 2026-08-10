-- Limita criação de campanhas e remove INSERT direto do cliente.

create or replace function public.create_campaign(p_name text)
returns public.campaigns
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_name text;
  v_count integer;
  v_campaign public.campaigns%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado' using errcode = '42501';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if char_length(v_name) not between 1 and 100 then
    raise exception 'Nome da campanha inválido' using errcode = '22023';
  end if;

  select count(*) into v_count
  from public.campaigns
  where owner_id = auth.uid();

  if v_count >= 20 then
    raise exception 'Limite de campanhas atingido' using errcode = '54000';
  end if;

  insert into public.campaigns (name, owner_id)
  values (v_name, auth.uid())
  returning * into v_campaign;

  return v_campaign;
end;
$$;

revoke all on function public.create_campaign(text) from public;
grant execute on function public.create_campaign(text) to authenticated;

revoke insert on public.campaigns from authenticated;
