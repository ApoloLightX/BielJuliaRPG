# Contas e saves compartilhados

Projeto Supabase do RPG:

- Project ref: `xjbkvifjslllqdkwkymv`
- URL: `https://xjbkvifjslllqdkwkymv.supabase.co`

## 1. Aplicar o banco

No clone local deste repositório:

```bash
supabase login
supabase init
supabase link --project-ref xjbkvifjslllqdkwkymv
supabase db push
```

A migration cria:

- `campaigns`: campanhas e código de convite
- `campaign_members`: Biel e Julia vinculados à mesma campanha
- `campaign_state`: snapshot JSON com todo o estado do jogo
- RLS: somente membros da campanha podem ler e alterar o save
- Realtime: alterações no save aparecem nos outros aparelhos

Cada campanha aceita no máximo dois usuários.

## 2. Variáveis na Vercel

No projeto `soberba-lol`, adicione para Production e Preview:

```text
VITE_SUPABASE_URL=https://xjbkvifjslllqdkwkymv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<chave pública do projeto>
```

Se o painel mostrar apenas a chave `anon` legada, também funciona usando:

```text
VITE_SUPABASE_ANON_KEY=<anon key>
```

Nunca use `service_role` no navegador.

Depois das variáveis, faça Redeploy.

## 3. Fluxo do jogo

1. Biel cria uma conta.
2. Biel cria uma campanha, por exemplo `Teste do sistema`.
3. O jogo mostra um código de 8 caracteres.
4. Julia cria a conta dela e entra usando esse código.
5. Os dois abrem a mesma campanha.
6. Personagens, chat, XP, mapa e progressão são salvos automaticamente.
7. Abrir a campanha em outro celular ou PC carrega o mesmo estado.

Existe também um botão de save manual no cabeçalho.

## 4. Observação de concorrência

Este MVP usa um snapshot compartilhado com estratégia `last write wins`. Para dois jogadores tomando decisões em sequência funciona bem. Evitem enviar duas ações exatamente no mesmo instante. Uma versão futura pode migrar mensagens e ações para um log transacional sem mudar a experiência dos jogadores.
