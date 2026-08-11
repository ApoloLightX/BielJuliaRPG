-- Limita criação de campanhas mantendo o fluxo simples do frontend.

create or replace function public.can_create_campaign()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null
    and (
      select count(*)
      from public.campaigns
      where owner_id = auth.uid()
    ) < 20;
$$;

revoke all on function public.can_create_campaign() from public;
grant execute on function public.can_create_campaign() to authenticated;

drop policy if exists "users can create their campaigns" on public.campaigns;
create policy "users can create their campaigns"
on public.campaigns for insert
to authenticated
with check (
  owner_id = auth.uid()
  and char_length(name) between 1 and 100
  and public.can_create_campaign()
);

grant insert on public.campaigns to authenticated;
