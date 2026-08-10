# Contas e saves compartilhados

Projeto Supabase esperado:

- Project ref: `xjbkvifjslllqdkwkymv`
- Região esperada: `sa-east-1`

## Migrations

As migrations são a fonte de verdade do schema e devem ser aplicadas em ordem:

1. `20260810210600_campaign_saves.sql`
2. `20260810223500_harden_campaign_saves.sql`
3. `20260810224500_protect_campaign_creation.sql`

A primeira cria o MVP. As seguintes são aditivas e endurecem segurança/concorrência.

## Schema

### `campaigns`

- uma linha por campanha;
- `owner_id` referencia `auth.users`;
- `join_code` único;
- nome limitado a 1-100 caracteres;
- owner pode atualizar/apagar;
- INSERT exige `owner_id = auth.uid()` e quota de até 20 campanhas por owner.

### `campaign_members`

- chave composta `(campaign_id, user_id)`;
- papéis `owner` e `player`;
- leitura somente para membros;
- entrada do segundo jogador via RPC `join_campaign`;
- o RPC bloqueia a campanha durante contagem para impedir corrida que criaria um terceiro membro.

### `campaign_state`

- uma linha por campanha;
- `state jsonb` precisa ser objeto;
- `revision bigint` controla concorrência;
- leitura somente por membros;
- cliente não recebe UPDATE direto;
- escrita ocorre via RPC `save_campaign_state`.

## Concorrência

O cliente envia:

```text
campaign_id
expected_revision
state
```

O RPC atualiza apenas se a revisão no banco ainda for a esperada. Em sucesso, incrementa `revision`. Se outro aparelho salvou primeiro, o RPC retorna `SAVE_CONFLICT` e o cliente mostra conflito em vez de sobrescrever silenciosamente.

As gravações do mesmo aparelho também são serializadas no frontend para evitar conflitos falsos entre dois autosaves locais em voo.

Realtime continua propagando updates de `campaign_state`. Uma atualização remota recebida enquanto existem alterações locais pendentes é tratada como conflito e não como overwrite automático.

## RLS

Matriz esperada:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `campaigns` | membros | owner + quota | owner | owner |
| `campaign_members` | membros | somente via fluxo privilegiado/RPC | sem escrita direta | sem escrita direta |
| `campaign_state` | membros | bootstrap interno | somente RPC CAS | sem escrita direta |

As migrations não devem usar `USING (true)` nem `WITH CHECK (true)`. `supabase/migrations.test.js` trava esses invariantes no CI.

## Auth e endpoint do Mestre

No modo cloud, `/api/mestre` exige:

1. sessão Supabase válida;
2. `campaignId` UUID válido;
3. membership confirmado por `is_campaign_member` sob o token do usuário.

Uma conta autenticada que não pertence à campanha deve receber 403 antes de qualquer chamada ao provider de IA.

## Realtime

`campaign_state` usa `REPLICA IDENTITY FULL` e entra na publication `supabase_realtime` na migration base.

## Modo local

O modo local é independente do Supabase e existe como contingência/desenvolvimento. Em produção cloud ele só aparece se `VITE_ENABLE_LOCAL_GUEST=true`. O backend também só aceita chamadas sem Bearer se `MESTRE_ALLOW_GUEST=true`.

Essas duas flags devem permanecer ausentes/false na produção cloud.

## Validação obrigatória antes do merge

Após aplicar migrations no Supabase real:

- listar tabelas e policies;
- executar Security Advisor;
- executar Performance Advisor;
- criar duas contas de teste;
- confirmar que uma terceira não entra numa campanha cheia;
- confirmar isolamento entre campanhas;
- testar CAS de save em dois aparelhos;
- testar Realtime;
- testar recuperação de senha e redirects.

Veja [`PRODUCTION-RUNBOOK.md`](PRODUCTION-RUNBOOK.md).
