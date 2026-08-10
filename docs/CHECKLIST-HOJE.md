# Checklist para jogar hoje

## Repositório

- [ ] `src/` presente
- [ ] `api/mestre.js` presente
- [ ] `api/lore.js` presente
- [ ] `package.json` presente
- [ ] `.env` real NÃO commitado

## Vercel

- [ ] projeto importado do GitHub
- [ ] framework reconhecido como Vite
- [ ] `GEMINI_API_KEY` cadastrada
- [ ] variável habilitada em Production
- [ ] redeploy feito depois de cadastrar a variável
- [ ] deployment com status Ready

## Teste da mesa

- [ ] criação do Jogador 1 funciona
- [ ] criação do Jogador 2 funciona
- [ ] chat abre
- [ ] mensagem `vamos começar` recebe resposta
- [ ] mapa pode ser aberto
- [ ] Portas de Vharnak aparece quando revelada
- [ ] teste de d20 aparece quando solicitado
- [ ] resultado do dado volta para o mestre

## Se algo quebrar

1. copie exatamente a mensagem visível no site;
2. abra os logs do deployment na Vercel;
3. procure a requisição para `/api/mestre`;
4. identifique o primeiro erro real;
5. consulte `docs/TROUBLESHOOTING.md`.
