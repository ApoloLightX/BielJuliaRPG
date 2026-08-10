# Como jogar

## Preparação

A mesa foi criada para dois jogadores.

Cada jogador escolhe:

- um arquétipo;
- um nick para o personagem;
- aparência básica;
- habilidades iniciais ligadas ao arquétipo.

Depois que os dois confirmam os personagens, a campanha começa na tela da mesa.

## Atributos

O sistema usa quatro atributos:

- **Força**
- **Astúcia**
- **Vigor**
- **Vontade**

Os arquétipos distribuem valores de 1 a 4 nesses atributos.

## Testes

Quando o mestre pede um teste, ele informa qual personagem deve rolar, o atributo relevante e a dificuldade narrativa.

O jogo calcula:

```text
d20 + atributo = total
```

O resultado é enviado automaticamente de volta ao mestre para ele continuar a cena.

## Vida

O sistema é propositalmente leve. A referência da campanha é de três golpes antes de um personagem entrar em perigo real de morte. O mestre conduz as consequências narrativamente.

## XP e níveis

O mestre pode conceder XP ao concluir marcos importantes.

O frontend interpreta marcadores internos enviados pelo mestre e atualiza a ficha automaticamente. Ao alcançar um novo nível, o jogador recebe uma tela de evolução para:

- melhorar uma habilidade já conhecida; ou
- desbloquear uma habilidade nova disponível para seu arquétipo.

## Mapa

O mapa começa praticamente oculto. Regiões são reveladas conforme a aventura avança.

Regiões previstas na campanha:

1. Portas de Vharnak
2. Ruas Externas
3. Distrito do Mercado
4. Capela de Sella
5. Torre do Cardeal
6. Arquivo das Runas
7. Câmara Central

A Câmara Central é reservada para a parte final da aventura.

## Mestre de IA

O mestre recebe:

- os personagens atuais;
- seus atributos e habilidades;
- o histórico da conversa;
- a lore privada da campanha;
- regras para testes, XP e mapa.

A lore completa não é enviada ao frontend. Ela fica em `api/lore.js` e é usada somente no servidor.

## Como conversar com o mestre

Escrevam ações naturalmente, por exemplo:

```text
Biel tenta examinar as inscrições na porta enquanto Julia observa se alguém se aproxima.
```

Ou:

```text
Julia pergunta à sobrevivente por que ninguém fala dentro da cidade.
```

Não é necessário usar comandos especiais. Os marcadores técnicos são gerados pelo próprio mestre e removidos antes do texto aparecer na interface.
