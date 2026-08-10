# Arquitetura

## Visão geral

```text
Navegador
  ↓
React + Vite + Tailwind
  ↓ POST /api/mestre
Função serverless Vercel
  ↓
Gemini API
```

A chave da IA permanece no servidor.

## Estrutura

```text
.
├── api/
│   ├── lore.js
│   └── mestre.js
├── src/
│   ├── components/
│   │   ├── CampaignMap.jsx
│   │   ├── CharacterAvatar.jsx
│   │   ├── CharacterCreator.jsx
│   │   ├── DiceRoller.jsx
│   │   └── LevelUpModal.jsx
│   ├── data/
│   │   ├── archetypes.js
│   │   └── mapRegions.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## `src/App.jsx`

É o controlador principal da experiência. Ele mantém:

- fase de criação dos personagens;
- estado dos dois jogadores;
- mensagens da campanha;
- testes pendentes;
- XP e level-up;
- regiões reveladas;
- alternância entre chat e mapa.

Também interpreta três diretivas privadas geradas pelo mestre:

```text
[[TESTE: nick]]
[[XP: nick | quantidade]]
[[MAPA: id-da-regiao]]
```

Essas diretivas são removidas antes da narrativa ser exibida.

## `api/mestre.js`

Função serverless responsável por:

1. receber mensagens e fichas dos jogadores;
2. construir o prompt de sistema;
3. acrescentar a lore privada;
4. chamar a API do Gemini;
5. devolver somente a resposta narrativa ao navegador.

A variável necessária é:

```text
GEMINI_API_KEY
```

## `api/lore.js`

Contém a espinha dorsal secreta de **O Silêncio de Vharnak**. Esse arquivo não é importado pelo frontend, apenas pela função serverless.

## `src/data/archetypes.js`

Define arquétipos, atributos, habilidades, opções visuais e progressão base.

## `src/data/mapRegions.js`

Define as regiões que podem ser reveladas no mapa.

## Segurança da chave

Correto:

```js
process.env.GEMINI_API_KEY
```

Incorreto para este projeto:

```js
import.meta.env.VITE_GEMINI_API_KEY
```

Variáveis iniciadas por `VITE_` são incorporadas ao bundle do navegador e não devem conter segredos.
