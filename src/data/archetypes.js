export const ARCHETYPES = [
  {
    id: "lamina-cinzas",
    name: "Lâmina de Cinzas",
    gender: "female",
    role: "Guerreira",
    tagline: "Corta primeiro, sente depois",
    attrs: { forca: 4, astucia: 2, vigor: 3, vontade: 1 },
    skills: [
      { name: "Golpe Cruel", desc: "Ataque direto com dano extra se o alvo já estiver ferido" },
      { name: "Fúria de Cinzas", desc: "Ganha vantagem no próximo teste após sofrer dano" },
      { name: "Corte Duplo", desc: "Ataca duas vezes em um turno, com penalidade leve" },
    ],
    lockedSkills: [
      { name: "Dança das Lâminas", desc: "Ataca todos os inimigos ao redor em um giro" },
      { name: "Sede de Batalha", desc: "Cura um pouco de vida ao derrotar um inimigo" },
    ],
  },
  {
    id: "filha-bruma",
    name: "Filha da Bruma",
    gender: "female",
    role: "Arcana",
    tagline: "Fala com o que não se vê",
    attrs: { forca: 1, astucia: 3, vigor: 2, vontade: 4 },
    skills: [
      { name: "Véu de Névoa", desc: "Torna-se difícil de acertar por um turno" },
      { name: "Toque Espectral", desc: "Causa dano que ignora armaduras físicas" },
      { name: "Sussurro", desc: "Extrai uma informação verdadeira de um NPC ou inimigo" },
    ],
    lockedSkills: [
      { name: "Forma de Névoa", desc: "Torna-se intangível por um turno, evitando qualquer dano" },
      { name: "Chamado do Além", desc: "Invoca um espírito para lutar ao seu lado por alguns turnos" },
    ],
  },
  {
    id: "cacadora-ossos",
    name: "Caçadora de Ossos",
    gender: "female",
    role: "Rastreadora",
    tagline: "Nenhuma trilha escapa dela",
    attrs: { forca: 2, astucia: 4, vigor: 2, vontade: 2 },
    skills: [
      { name: "Tiro Certeiro", desc: "Ataque à distância com chance maior de acerto crítico" },
      { name: "Rastro Frio", desc: "Encontra pistas ou caminhos ocultos automaticamente" },
      { name: "Armadilha", desc: "Prepara uma armadilha que imobiliza um inimigo" },
    ],
    lockedSkills: [
      { name: "Instinto Selvagem", desc: "Detecta perigos ocultos e emboscadas antes que aconteçam" },
      { name: "Chuva de Flechas", desc: "Ataque em área que atinge todos os inimigos numa linha" },
    ],
  },
  {
    id: "voz-vazio",
    name: "Voz do Vazio",
    gender: "female",
    role: "Curandeira Sombria",
    tagline: "Cura com o mesmo poder que fere",
    attrs: { forca: 1, astucia: 2, vigor: 3, vontade: 4 },
    skills: [
      { name: "Sangue por Vida", desc: "Cura um aliado, mas causa dano leve em si mesma" },
      { name: "Praga Silenciosa", desc: "Enfraquece um inimigo por vários turnos" },
      { name: "Pacto Sombrio", desc: "Grande cura de emergência, com custo narrativo definido pelo mestre" },
    ],
    lockedSkills: [
      { name: "Cura em Área", desc: "Restaura vida de todos os aliados próximos" },
      { name: "Mão que Aflige", desc: "Causa dano contínuo grave a um único alvo" },
    ],
  },
  {
    id: "punho-ferro",
    name: "Punho de Ferro",
    gender: "male",
    role: "Guerreiro",
    tagline: "Não recua, não quebra",
    attrs: { forca: 4, astucia: 1, vigor: 4, vontade: 1 },
    skills: [
      { name: "Investida", desc: "Avança contra o inimigo e derruba, causando dano e atordoamento breve" },
      { name: "Guarda de Ferro", desc: "Reduz drasticamente o dano recebido por um turno" },
      { name: "Golpe Sísmico", desc: "Ataque em área contra múltiplos inimigos próximos" },
    ],
    lockedSkills: [
      { name: "Inquebrável", desc: "Ignora o próximo golpe que o derrubaria" },
      { name: "Fúria Ancestral", desc: "Aumenta drasticamente o dano por vários turnos" },
    ],
  },
  {
    id: "corvo-silencioso",
    name: "Corvo Silencioso",
    gender: "male",
    role: "Ladino",
    tagline: "Já foi embora antes de você perceber",
    attrs: { forca: 2, astucia: 4, vigor: 2, vontade: 2 },
    skills: [
      { name: "Ataque Furtivo", desc: "Dano extra garantido se o alvo não perceber o ataque vindo" },
      { name: "Sombra Rápida", desc: "Move-se e some de vista sem gastar ação extra" },
      { name: "Mãos Leves", desc: "Rouba um item ou informação de um alvo sem ser notado" },
    ],
    lockedSkills: [
      { name: "Golpe Mortal", desc: "Ataque com chance alta de derrubar o inimigo instantaneamente" },
      { name: "Mestre das Sombras", desc: "Torna-se invisível por vários turnos" },
    ],
  },
  {
    id: "xama-geada",
    name: "Xamã da Geada",
    gender: "male",
    role: "Arcano",
    tagline: "Fala a língua do gelo que não perdoa",
    attrs: { forca: 1, astucia: 3, vigor: 2, vontade: 4 },
    skills: [
      { name: "Lança de Gelo", desc: "Ataque à distância que reduz a velocidade do alvo" },
      { name: "Barreira Gélida", desc: "Cria uma proteção temporária para si ou um aliado" },
      { name: "Fúria do Inverno", desc: "Dano em área que também atordoa por um turno" },
    ],
    lockedSkills: [
      { name: "Tempestade Glacial", desc: "Congela todos os inimigos próximos por um turno" },
      { name: "Corpo de Gelo", desc: "Torna-se resistente a quase todo dano físico por um tempo" },
    ],
  },
  {
    id: "guardiao-esquecido",
    name: "Guardião Esquecido",
    gender: "male",
    role: "Tanque",
    tagline: "Um juramento antigo ainda o prende aqui",
    attrs: { forca: 3, astucia: 1, vigor: 4, vontade: 2 },
    skills: [
      { name: "Escudo Vivo", desc: "Intercepta um ataque destinado a um aliado" },
      { name: "Provocar", desc: "Força inimigos próximos a atacá-lo primeiro" },
      { name: "Última Linha", desc: "Quando quase caído, ganha resistência extra por alguns turnos" },
    ],
    lockedSkills: [
      { name: "Muralha Viva", desc: "Protege todos os aliados próximos por um turno inteiro" },
      { name: "Juramento Renovado", desc: "Recupera vida ao proteger um aliado de dano fatal" },
    ],
  },
];

export const XP_PER_LEVEL = 100;

export const HAIR_COLORS = [
  { id: "preto", label: "Preto", hex: "#1a1512" },
  { id: "castanho", label: "Castanho", hex: "#4a2f1c" },
  { id: "ruivo", label: "Ruivo", hex: "#8a3a1f" },
  { id: "loiro", label: "Loiro", hex: "#c9a24a" },
  { id: "grisalho", label: "Grisalho", hex: "#8a8a85" },
  { id: "branco", label: "Branco", hex: "#e8e2d8" },
];

export const SKIN_TONES = [
  { id: "clara", label: "Clara", hex: "#f0d3b4" },
  { id: "media-clara", label: "Média clara", hex: "#d9ab7c" },
  { id: "media", label: "Média", hex: "#b9825a" },
  { id: "media-escura", label: "Média escura", hex: "#8a5a3a" },
  { id: "escura", label: "Escura", hex: "#5c3a24" },
];
