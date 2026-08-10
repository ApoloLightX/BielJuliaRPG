# Runbook de promoção para produção

Não faça merge da branch `audit/production-hardening` antes de concluir este checklist.

## 1. Supabase

Projeto esperado: `xjbkvifjslllqdkwkymv`.

Aplique, nesta ordem, as migrations versionadas:

1. `20260810210600_campaign_saves.sql`
2. `20260810223500_harden_campaign_saves.sql`
3. `20260810224500_protect_campaign_creation.sql`

Preferencialmente use `supabase db push` em um clone do repositório. Alternativamente, execute o conteúdo das migrations em ordem no SQL Editor.

Depois valide no dashboard:

- tabelas `campaigns`, `campaign_members`, `campaign_state` existem;
- RLS está ativo nas três;
- `campaign_state` possui coluna `revision`;
- Realtime inclui `campaign_state`;
- RPCs `is_campaign_member`, `join_campaign` e `save_campaign_state` existem;
- `campaign_state` não concede UPDATE direto ao papel `authenticated`;
- `campaigns` possui policy de INSERT com ownership e quota;
- não existem policies `USING (true)`/`WITH CHECK (true)` nas tabelas do jogo.

Execute os Security e Performance Advisors do Supabase. Qualquer alerta de RLS/auth deve ser resolvido antes do merge.

## 2. Supabase Auth

Configure Site URL e Redirect URLs para os domínios realmente usados.

No mínimo, produção deve aceitar o domínio oficial do jogo. Se Preview for usado para QA de auth, adicione apenas o padrão de preview necessário e revise-o depois.

Teste:

1. criar conta;
2. confirmar e-mail quando habilitado;
3. login;
4. logout;
5. esqueci minha senha;
6. abrir o link recebido;
7. definir nova senha;
8. entrar novamente.

## 3. Vercel env vars

Confirme em Preview e Production, conforme necessário:

### Server-only

- `GROQ_API_KEY`
- `GROQ_MODEL` apenas se quiser sobrescrever o default
- `GEMINI_API_KEY` para fallback
- `MESTRE_ALLOW_GUEST` ausente ou `false` para produção cloud

### Públicas/opcionais

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`VITE_ENABLE_LOCAL_GUEST` deve ficar ausente/false em produção cloud.

Nunca configure `service_role` como variável `VITE_*`.

## 4. QA no Preview

Com duas contas de teste:

1. Conta A cria uma campanha.
2. A recebe um código de convite.
3. Conta B entra pelo código.
4. Uma terceira conta não consegue entrar quando já existem dois membros.
5. Conta que não pertence à campanha não consegue usar o endpoint do Mestre para aquele `campaignId`.
6. A cria o primeiro personagem.
7. B abre a mesma campanha e recebe o estado sincronizado.
8. Criar o segundo personagem.
9. Enviar `vamos começar` e confirmar resposta do Mestre.
10. Confirmar que o mapa/XP/testes continuam funcionando.
11. Atualizar a página e verificar persistência.
12. Abrir em outro dispositivo e verificar o mesmo save.
13. Fazer duas edições concorrentes para confirmar que conflito é reportado em vez de sobrescrever silenciosamente.
14. Testar logout/login e continuidade da campanha.
15. Confirmar que modo local não aparece em produção quando a flag estiver desligada.

## 5. Checks GitHub

Exija o workflow `CI` antes do merge. O resultado esperado é:

```text
Secret regression scan PASS
Lint PASS
Typecheck PASS
Unit tests PASS
Production build PASS
Dependency audit PASS
```

Não restaure o workflow antigo que alterava o lockfile automaticamente.

## 6. Vercel

No preview final:

- deploy `Ready`;
- sem erros de build;
- `/` responde normalmente;
- `/api/mestre` sem token retorna 401;
- `/api/mestre` com token válido e campanha alheia retorna 403;
- headers de segurança estão presentes;
- runtime logs não contêm tokens, JWTs ou chaves de provider.

## 7. Promoção

Somente depois dos itens anteriores:

1. marcar o PR como pronto;
2. aguardar CI e Vercel verdes no HEAD do PR;
3. merge na `main`;
4. aguardar deploy de Production;
5. repetir smoke test de login, campanha, save e uma resposta do Mestre;
6. conferir runtime errors após o primeiro tráfego real.

## Rollback

Se a aplicação falhar após o merge, reverta o commit/PR no GitHub e deixe as migrations aditivas no banco. Não execute `db reset`, `DROP TABLE`, `TRUNCATE` ou outras operações destrutivas para rollback do frontend.
