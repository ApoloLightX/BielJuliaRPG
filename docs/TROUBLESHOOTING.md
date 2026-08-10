# Troubleshooting

## `GEMINI_API_KEY não configurada no servidor`

Cadastre `GEMINI_API_KEY` em **Vercel → Project → Settings → Environment Variables** e faça um novo deploy.

## A tela abre, mas ao enviar mensagem aparece erro 4xx/5xx

Abra os logs da função `/api/mestre` na Vercel. O backend repassa a mensagem da API do Gemini quando possível.

Cheque:

- chave inválida ou revogada;
- variável configurada no ambiente errado;
- limite/quota da API;
- indisponibilidade ou mudança do modelo configurado;
- payload rejeitado pela API.

## `npm install` falha localmente

Apague `node_modules` e tente novamente com uma versão moderna do Node.js.

```bash
rm -rf node_modules
npm install
```

No Windows PowerShell:

```powershell
Remove-Item node_modules -Recurse -Force
npm install
```

## `npm run build` falha

Confirme primeiro:

```bash
node --version
npm --version
npm install
npm run build
```

Depois procure a primeira mensagem de erro real do Vite, normalmente acompanhada do arquivo e linha.

## O mapa não revela regiões

O mestre precisa emitir uma diretiva válida como:

```text
[[MAPA: portas]]
```

IDs aceitos:

- `portas`
- `ruas-externas`
- `distrito-mercado`
- `capela-sella`
- `torre-cardeal`
- `arquivo-runas`
- `camara-central`

## O dado não aparece

O mestre precisa enviar:

```text
[[TESTE: nick exato do personagem]]
```

O nick deve coincidir com o personagem criado.

## XP não é aplicado

Formato esperado:

```text
[[XP: nick exato | 50]]
```

A quantidade deve ser numérica.

## A resposta do mestre perdeu contexto

O frontend envia o histórico acumulado da campanha a cada mensagem. Sessões muito longas podem crescer bastante; para uma versão futura, vale implementar persistência e resumo de contexto, mas isso não é necessário para a primeira sessão.
