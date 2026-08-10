# Comece hoje

Este é o caminho mais curto para colocar **A Mesa Sob a Sombra** no ar e jogar.

## 1. Publicar na Vercel

1. Entre na Vercel com a conta conectada ao GitHub.
2. Clique em **Add New → Project**.
3. Importe este repositório.
4. Framework: a Vercel deve reconhecer **Vite** automaticamente.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Não altere o diretório raiz se os arquivos `package.json`, `src/` e `api/` estiverem na raiz do repositório.

## 2. Configurar o mestre de IA

No projeto da Vercel, abra **Settings → Environment Variables** e crie:

```text
GEMINI_API_KEY=SUA_CHAVE_AQUI
```

Marque pelo menos **Production**. Para previews também funcionarem, marque **Preview**.

Depois faça um novo deploy para a variável entrar no ambiente da função serverless.

## 3. Teste rápido

Abra o endereço publicado e confirme esta sequência:

1. aparece a tela **A Mesa Sob a Sombra**;
2. Jogador 1 consegue escolher arquétipo, nick, cabelo e pele;
3. Jogador 2 consegue fazer o mesmo;
4. a mesa abre com os dois personagens no topo;
5. escreva `vamos começar`;
6. o mestre responde com a cena inicial;
7. a região **Portas de Vharnak** deve ser revelada no mapa quando o mestre enviar o marcador correspondente;
8. quando houver um teste, o dado deve aparecer para o personagem indicado.

## 4. Se o site abrir, mas o mestre não responder

A causa mais provável está na função `/api/mestre`.

Verifique primeiro:

- se `GEMINI_API_KEY` existe na Vercel;
- se você fez redeploy depois de cadastrar a variável;
- se a chave não tem espaços extras;
- se a chave está habilitada para a API do Gemini;
- os logs da função `/api/mestre` na Vercel.

O frontend mostra a mensagem de erro devolvida pelo servidor, então use esse texto como primeira pista.

## 5. O que não precisa configurar

Você não precisa colocar a chave no navegador, em `VITE_GEMINI_API_KEY`, em `src/` ou em qualquer arquivo público. O backend em `api/mestre.js` lê `process.env.GEMINI_API_KEY` diretamente no servidor.

## 6. Teste local completo

Instale a CLI da Vercel e rode:

```bash
npm install
vercel dev
```

Com um `.env` local contendo:

```text
GEMINI_API_KEY=SUA_CHAVE_AQUI
```

Isso reproduz a rota serverless `/api/mestre` localmente.
