-- Corrige INSERT ... RETURNING de campanhas sob RLS.
-- O frontend cria a campanha e solicita a linha criada com .select().
-- PostgreSQL exige que a nova linha também satisfaça a policy de SELECT.
-- O owner deve poder ler sua própria campanha imediatamente, mesmo antes/de forma
-- independente do bootstrap de campaign_members.

drop policy if exists "members can read campaigns" on public.campaigns;

create policy "members can read campaigns"
on public.campaigns for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_campaign_member(id)
);
