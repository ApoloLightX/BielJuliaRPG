# A Mesa Sob a Sombra

RPG dark fantasy cooperativo com Mestre de IA, contas Supabase, campanhas compartilhadas, autosave e modo local opcional.

## Stack

- React 18
- Vite 8
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS + Realtime
- Vercel Functions
- Groq como provider principal do Mestre
- Gemini como fallback
- GitHub Actions para lint, typecheck, testes, build, audit e secret scan

## Arquitetura

O navegador nunca recebe as chaves dos providers de IA. No modo cloud, o fluxo do Mestre é:

```text
Browser autenticado
  -> /api/mestre + Bearer + campaignId
  -> valida sessão Supabase
  -> valida membership da campanha
  -> sanitiza e limita payload
  -> Groq
  -> Gemini fallback
```

O estado da partida usa uma engine compartilhada em `src/game/engine.js`. O modo cloud persiste um snapshot validado no Supabase e usa revisão otimista para impedir sobrescrita silenciosa entre aparelhos. O modo local, quando explicitamente habilitado, usa `localStorage` e exportação/importação de save.

## Pré-requisito de produção

As migrations de `supabase/migrations/` precisam estar aplicadas no projeto Supabase antes de promover a branch de hardening. Veja:

- [`docs/PRODUCTION-AUDIT.md`](docs/PRODUCTION-AUDIT.md)
- [`docs/PRODUCTION-RUNBOOK.md`](docs/PRODUCTION-RUNBOOK.md)
- [`docs/SUPABASE-SAVES.md`](docs/SUPABASE-SAVES.md)

## Variáveis

Copie `.env.example` e mantenha secrets somente no runtime da Vercel ou em `.env` local ignorado pelo Git.

Providers server-side:

```text
GROQ_API_KEY
GROQ_MODEL            # opcional
GEMINI_API_KEY        # fallback
```

Configuração Supabase pública pode ser sobrescrita por envs, mas publishable/anon keys não concedem privilégios além do que RLS permite.

Não use `service_role` no browser e nunca crie `VITE_GROQ_API_KEY` ou `VITE_GEMINI_API_KEY`.

## Desenvolvimento

Instalação reproduzível:

```bash
npm ci
```

Frontend:

```bash
npm run dev
```

Para testar também `/api/mestre` localmente, use o runtime da Vercel:

```bash
vercel dev
```

## Checks obrigatórios

```bash
npm run security:secrets
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

O workflow `.github/workflows/ci.yml` executa esses gates em Node 24 com permissões `contents: read`.

## Funcionalidades

- conta e sessão persistente;
- recuperação de senha;
- campanhas compartilhadas por código;
- limite de dois membros por campanha;
- criação de dois personagens;
- arquétipos e atributos;
- testes d20;
- Mestre narrativo por IA;
- progressão por XP e níveis;
- desbloqueio/evolução de habilidades;
- mapa revelado pela história;
- autosave cloud com detecção de conflito;
- Realtime;
- save local opcional e validado.

## Documentação

- [`docs/PRODUCTION-AUDIT.md`](docs/PRODUCTION-AUDIT.md) — ledger e evidências da auditoria
- [`docs/PRODUCTION-RUNBOOK.md`](docs/PRODUCTION-RUNBOOK.md) — promoção segura para produção
- [`docs/SUPABASE-SAVES.md`](docs/SUPABASE-SAVES.md) — schema e concorrência dos saves
- [`docs/COMO-JOGAR.md`](docs/COMO-JOGAR.md) — regras e fluxo da mesa
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — visão técnica histórica
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — diagnóstico rápido

## Segurança

- IA requer autenticação no modo cloud.
- O endpoint valida que o usuário pertence ao `campaignId` enviado.
- RLS protege dados de campanhas.
- Escritas do save cloud passam por RPC com compare-and-swap de revisão.
- O CI rejeita padrões comuns de secrets versionados.
- Headers de segurança são definidos em `vercel.json`.

Não faça merge de mudanças de schema sem validar as migrations no Supabase real e repetir o smoke test do runbook.
