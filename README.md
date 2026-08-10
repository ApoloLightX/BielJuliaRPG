# A Mesa Sob a Sombra

RPG dark fantasy com mestre de IA, para Biel e Julia jogarem juntos.

## Como funciona

O frontend (React) nunca vê a API key. Toda mensagem passa por uma função
serverless (`/api/mestre.js`) que roda no servidor da Vercel, usa a
`GEMINI_API_KEY` guardada como variável de ambiente, e só devolve o texto
da resposta pro navegador. A key nunca aparece no código do site.

## Deploy na Vercel

1. Suba este projeto num repositório GitHub (ex: `rpg-biel-julia`)
2. Importe o repositório na Vercel (New Project → Import Git Repository)
3. Em **Settings → Environment Variables**, adicione:
   - Nome: `GEMINI_API_KEY`
   - Valor: sua key gerada em https://aistudio.google.com/apikey
4. Deploy. Pronto, o link fica em algo como `rpg-biel-julia.vercel.app`

## Rodar local

```
npm install
```

Crie um arquivo `.env` (baseado no `.env.example`) com sua `GEMINI_API_KEY`,
depois:

```
vercel dev
```

(Use `vercel dev` em vez de `npm run dev` puro, porque a função em `/api`
precisa do runtime da Vercel para funcionar localmente.)
