# Auditoria de produção

Branch auditada: `audit/production-hardening`

Esta auditoria compara a branch de hardening com a `main` e registra apenas estados verificados. As três migrations foram aplicadas manualmente no projeto Supabase real em 2026-08-10 e a validação estrutural confirmou tabelas, coluna `revision`, RPCs principais, RLS, bloqueio de UPDATE direto no state e Realtime.

## Baseline

- Frontend: React 18 + Vite.
- Hosting/API: Vercel, com funções em `api/`.
- Banco/Auth/Realtime: Supabase.
- IA: Groq primário, Gemini fallback.
- Estado local: `localStorage` com exportação/importação.
- Estado cloud: snapshot JSON compartilhado por campanha.
- Baseline não possuía lint, typecheck ou testes automatizados.
- Baseline usava Vite 5.4.21 e apresentava 1 vulnerabilidade alta e 1 moderada na árvore npm.
- O workflow antigo possuía `contents: write` e alterava o lockfile automaticamente.

## Ledger central

| ID | Severidade | Área | Problema | Solução / evidência | Status |
|---|---|---|---|---|---|
| SEC-001 | P1 | API/IA | `/api/mestre` aceitava chamadas sem autenticação e podia consumir créditos | Bearer Supabase por padrão, limites, timeout e rate limit defensivo | testado |
| AUTHZ-002 | P1 | API/IA | usuário autenticado não precisava pertencer à campanha | `campaignId` validado e membership conferido via `is_campaign_member` antes da IA | testado |
| API-003 | P1 | Gemini | payload usava campo incorreto para system prompt | `systemInstruction` + teste de regressão | testado |
| AI-004 | P1 | Groq | modelo padrão legado estava próximo de desligamento | default `openai/gpt-oss-120b` + teste | testado |
| API-005 | P1 | API | payload sem limites, erros de provider e ausência de timeout | limites de tamanho, sanitização, timeout e erros públicos genéricos | testado |
| STATE-006 | P1 | React | side effect de level-up dentro de updater podia duplicar em StrictMode | engine pura compartilhada | testado |
| SAVE-007 | P1 | Dados | save cloud podia sobrescrever silenciosamente outro aparelho | revisão CAS + fila local + conflito explícito; schema real confirmou `revision` e RPC de save | corrigido estruturalmente; QA multi-dispositivo pendente |
| DB-008 | P1 | Supabase | duas entradas simultâneas podiam exceder limite de 2 membros | `FOR UPDATE` no RPC de entrada; migration aplicada | corrigido; teste concorrente real pendente |
| DEP-009 | P1 | Dependências | Vite/esbuild com vulnerabilidades conhecidas | Vite 8.2.1; `npm audit` retorna 0 | testado |
| INFRA-010 | P1 | Supabase | schema real do projeto inicialmente não estava aplicado | três migrations aplicadas manualmente e validação estrutural retornou `true` para os invariantes principais | corrigido estruturalmente |
| SAVE-011 | P2 | Local | import de save aceitava estrutura arbitrária | sanitização canônica, limite de tamanho, schema versionado | testado |
| AUTH-012 | P2 | Auth | recuperação de senha e redirects não estavam implementados explicitamente | fluxo de recovery no frontend | código testado; allowlist externa pendente |
| UI-013 | P2 | React | interval do dado não era limpo ao desmontar | cleanup via ref/effect | testado |
| CI-014 | P2 | GitHub | sem lint/typecheck/test; workflow mutava repositório | CI read-only com gates completos | testado |
| RLS-015 | P2 | Supabase | escrita direta do estado e funções com grants mais amplos | escrita por RPC CAS, revokes explícitos e search_path endurecido; RLS e bloqueio de UPDATE direto validados no banco real | corrigido estruturalmente |
| SAVE-016 | P2 | Concorrência | saves rápidos do mesmo aparelho podiam gerar falso conflito | serialização por fila de Promises | testado |
| CONF-017 | P2 | Segurança | modo guest local aparecia por padrão em produção | exige `VITE_ENABLE_LOCAL_GUEST=true` ou DEV | testado |
| RUNTIME-018 | P2 | Rate limit | limiter em memória não é global entre instâncias serverless | mantido como defesa local | pendente por arquitetura externa |
| RESOURCE-019 | P2 | Supabase | conta autenticada podia criar campanhas sem quota | policy RLS limita a 20 campanhas por owner; migration aplicada | corrigido; QA comportamental pendente |
| ARCH-020 | P3 | Arquitetura | App local e cloud duplicavam regras de negócio | regras movidas para `src/game/engine.js`; UI ainda possui duas cascas | corrigido parcialmente |
| A11Y-021 | P3 | UX | modal de level-up sem semântica/foco de diálogo | `role=dialog`, `aria-modal`, foco inicial | testado |
| GIT-022 | P3 | Git | histórico antigo anterior à substituição do projeto permanece | preservar histórico; não reescrever destrutivamente | descartado com justificativa |
| BRANCH-023 | P3 | GitHub | branch protection não pôde ser inspecionada pelo token da integração | endpoint respondeu 403 | pendente por dependência externa |
| VERCEL-024 | P2 | Infra | logs/runtime/env não puderam ser inspecionados diretamente | preview validado por check Vercel do GitHub; conector direto indisponível | pendente por dependência externa |
| SUPABASE-025 | P1 | Infra | schema/RLS real precisava ser revalidado após migrations | validação manual confirmou tabelas, RPCs, RLS, UPDATE bloqueado e Realtime | corrigido estruturalmente; Advisors pendentes |
| VERCEL-026 | P2 | Vercel/Segurança | `api/lore.js` estava sob `/api` e podia ser tratado como Function pela Vercel | lore movida para `server/lore.js`; `/api` mantém apenas endpoint/teste | corrigido e buildado |
| LORE-027 | P2 | Produto/Privacidade | o repositório é público e a lore/spoilers continuam legíveis no GitHub e no histórico | não reescrever histórico nem alterar visibilidade sem autorização humana | pendente por decisão humana |
| CI-028 | P3 | CI | scanner de secrets confundia documentação sobre nomes inseguros com uso real em código | nomes proibidos só bloqueiam source/config; padrões de valores reais continuam verificados em docs | testado |

## Arquitetura alvo

```text
Browser
  Root.jsx
    Auth + Campaign Hub
    ├─ LocalGame (opt-in/DEV)
    │    └─ shared game engine -> localStorage
    └─ CloudGame
         ├─ shared game engine
         ├─ Supabase Auth/RLS/Realtime
         └─ POST /api/mestre + Bearer + campaignId

/api/mestre
  ├─ valida sessão Supabase
  ├─ valida membership da campanha
  ├─ sanitiza/limita entrada
  ├─ Groq
  └─ Gemini fallback

server/lore.js
  └─ módulo server-side; fora do diretório de Functions

Supabase
  campaigns
  campaign_members
  campaign_state (revision + JSON snapshot)
```

## Matriz RLS alvo

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE | Observações |
|---|---|---|---|---|---|---|
| `campaigns` | sim | membros | owner + quota + nome válido | owner | owner | quota via `can_create_campaign()` |
| `campaign_members` | sim | membros | sem escrita direta do cliente | sem escrita direta | sem escrita direta | entrada via `join_campaign()` |
| `campaign_state` | sim | membros | bootstrap por trigger | sem UPDATE direto | sem DELETE direto | save via `save_campaign_state()` com CAS |

A validação manual no banco real confirmou RLS ativo nas três tabelas, `save_campaign_state` presente, UPDATE direto de `campaign_state` bloqueado ao papel `authenticated` e `campaign_state` inscrita no Realtime. Nenhuma migration alvo contém `USING (true)` ou `WITH CHECK (true)` e há testes estáticos para esses invariantes.

## Variáveis de ambiente

| Variável | Runtime | Pública | Necessária |
|---|---|---|---|
| `GROQ_API_KEY` | server | não | necessária para Groq |
| `GROQ_MODEL` | server | não | opcional |
| `GEMINI_API_KEY` | server | não | necessária apenas para fallback Gemini |
| `SUPABASE_URL` | server | sim | opcional, existe default público |
| `SUPABASE_PUBLISHABLE_KEY` | server | sim | opcional, existe default público |
| `MESTRE_ALLOW_GUEST` | server | não | opcional; deve ficar ausente/false em produção cloud |
| `VITE_SUPABASE_URL` | client | sim | opcional override |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | sim | opcional override |
| `VITE_SUPABASE_ANON_KEY` | client | sim | compatibilidade legada |
| `VITE_ENABLE_LOCAL_GUEST` | client/build | sim | opcional; deve ficar ausente/false em produção cloud |

Nenhuma `service_role` é necessária no browser ou no backend atual.

## Checks executados

Pipeline em Node 24, reproduzido após as correções de código:

```text
npm ci                         PASS
npm run security:secrets      PASS
npm run lint                   PASS
npm run typecheck              PASS
npm test                       PASS (3 arquivos, 16 testes)
npm run build                  PASS
npm audit --audit-level=high   PASS (0 vulnerabilidades)
```

Build Vite 8 auditado:

- chunk principal: ~359 kB, ~103 kB gzip;
- App local e GameSession são lazy-loaded;
- `App`, `GameSession` e engine são chunks separados.

## Segunda auditoria

A segunda leitura encontrou e tratou problemas que não estavam no primeiro passe:

- autorização do Mestre vinculada ao `campaignId`, não apenas ao login;
- serialização de saves do mesmo aparelho;
- quota de criação de campanhas por RLS;
- recuperação de senha e redirects explícitos;
- atualização das GitHub Actions para geração Node 24;
- scanner de secrets com distinção entre documentação e uso inseguro;
- utilitário de lore removido de `/api` para não virar rota/função acidental;
- lacuna de confidencialidade narrativa causada pelo repositório público registrada como decisão humana.

## Validação manual do Supabase real

Em 2026-08-10, após aplicar as três migrations em ordem, as queries de validação retornaram `true` para:

- `campaigns`, `campaign_members` e `campaign_state` existentes;
- coluna `campaign_state.revision` existente;
- funções `is_campaign_member`, `join_campaign` e `save_campaign_state` existentes;
- RLS ativo nas três tabelas;
- UPDATE direto de `campaign_state` bloqueado para `authenticated`;
- `campaign_state` presente na publicação `supabase_realtime`.

## O que NÃO está confirmado

1. Os Security e Performance Advisors do Supabase ainda não foram executados após as migrations.
2. Site URL e Redirect URLs do Supabase Auth ainda não foram conferidos.
3. O comportamento real de duas contas, limite de dois membros, RLS entre usuários e conflito CAS ainda precisa de QA pelo app.
4. Valores reais de env vars Production/Preview da Vercel não puderam ser lidos.
5. Runtime logs e error clusters Vercel não puderam ser lidos.
6. O check Vercel do commit auditado valida build/deploy, não o fluxo autenticado contra o banco real.
7. Branch protection não pôde ser lida pelo token da integração.
8. A lore ainda é pública por causa da visibilidade e histórico do repositório.

A branch deve permanecer em draft até concluir Auth/QA real e a validação de runtime Vercel conforme o runbook de produção.
