# A Mesa Sob a Sombra

RPG dark fantasy com mestre de IA, para Biel e Julia jogarem juntos.

## Jogar hoje

A forma mais rápida é publicar este repositório na Vercel e configurar a variável `GEMINI_API_KEY`.

Guia completo: [`docs/COMECE-HOJE.md`](docs/COMECE-HOJE.md)

## Como funciona

O frontend (React) nunca vê a API key. Toda mensagem passa por uma função
serverless (`/api/mestre.js`) que roda no servidor da Vercel, usa a
`GEMINI_API_KEY` guardada como variável de ambiente, e só devolve o texto
da resposta pro navegador. A key nunca aparece no código do site.

O jogo inclui:

- criação de dois personagens;
- arquétipos e atributos próprios;
- testes com d20;
- mestre narrativo por IA;
- progressão por XP e níveis;
- desbloqueio/evolução de habilidades;
- mapa da campanha revelado conforme a história avança;
- lore privada usada somente pelo mestre no servidor.

## Documentação

- [`docs/COMECE-HOJE.md`](docs/COMECE-HOJE.md) — deploy e teste em produção
- [`docs/COMO-JOGAR.md`](docs/COMO-JOGAR.md) — regras e fluxo da mesa
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — estrutura técnica do projeto
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — correções rápidas
- [`docs/CHECKLIST-HOJE.md`](docs/CHECKLIST-HOJE.md) — checklist final antes da sessão

## Deploy na Vercel

1. Importe este repositório na Vercel em **New Project → Import Git Repository**.
2. Em **Settings → Environment Variables**, adicione:
   - Nome: `GEMINI_API_KEY`
   - Valor: sua key gerada no Google AI Studio.
3. Faça o deploy.
4. Abra o site, crie os dois personagens e escreva `vamos começar`.

## Rodar local

```bash
npm install
```

Crie um arquivo `.env` baseado no `.env.example` com sua `GEMINI_API_KEY`, depois rode:

```bash
vercel dev
```

Use `vercel dev` em vez de apenas `npm run dev` quando quiser testar também a função `/api/mestre` localmente.

## Segurança

Nunca coloque sua chave real em `.env.example`, `src/`, `README.md` ou qualquer arquivo commitado. A chave deve existir somente no ambiente da Vercel ou no `.env` local, que está ignorado pelo Git.
