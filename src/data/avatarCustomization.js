export const HAIR_STYLES = [
  { id: "short", label: "Curto" },
  { id: "long", label: "Longo" },
  { id: "ponytail", label: "Rabo alto" },
  { id: "braid", label: "Trançado" },
  { id: "shaved", label: "Raspado" },
];

export const OUTFIT_STYLES = [
  { id: "classic", label: "Clássica" },
  { id: "light", label: "Leve" },
  { id: "heavy", label: "Pesada" },
];

export const FACE_MARKS = [
  { id: "none", label: "Sem marca" },
  { id: "scar", label: "Cicatriz" },
  { id: "warpaint", label: "Pintura" },
  { id: "rune", label: "Runa" },
];

export const OUTFIT_PALETTES = [
  { id: "ember", label: "Brasa", primary: "#5f211a", secondary: "#b8492f", metal: "#5e5652" },
  { id: "night", label: "Noite", primary: "#181a24", secondary: "#626b91", metal: "#575d69" },
  { id: "forest", label: "Floresta", primary: "#24352a", secondary: "#637b50", metal: "#5a5b50" },
  { id: "royal", label: "Real", primary: "#332047", secondary: "#8062a1", metal: "#716777" },
  { id: "frost", label: "Geada", primary: "#233647", secondary: "#71a8c6", metal: "#7b8d98" },
  { id: "bone", label: "Marfim", primary: "#4a4035", secondary: "#c2a878", metal: "#817668" },
];

const CLASS_CONFIG = {
  "lamina-cinzas": {
    theme: "plate",
    defaultPalette: "ember",
    defaultWeapon: "dual-swords",
    weapons: [
      { id: "longsword", label: "Espada longa", type: "sword" },
      { id: "dual-swords", label: "Duas lâminas", type: "dual" },
      { id: "greatsword", label: "Montante", type: "greatsword" },
    ],
  },
  "filha-bruma": {
    theme: "arcane",
    defaultPalette: "night",
    defaultWeapon: "spectral-staff",
    weapons: [
      { id: "spectral-staff", label: "Cajado espectral", type: "staff" },
      { id: "focus-orb", label: "Orbe", type: "orb" },
      { id: "ritual-blade", label: "Lâmina ritual", type: "dagger" },
    ],
  },
  "cacadora-ossos": {
    theme: "hunter",
    defaultPalette: "forest",
    defaultWeapon: "bone-bow",
    weapons: [
      { id: "bone-bow", label: "Arco de osso", type: "bow" },
      { id: "crossbow", label: "Besta", type: "crossbow" },
      { id: "hunting-spear", label: "Lança de caça", type: "spear" },
    ],
  },
  "voz-vazio": {
    theme: "shadow",
    defaultPalette: "royal",
    defaultWeapon: "void-staff",
    weapons: [
      { id: "void-staff", label: "Cajado do vazio", type: "staff" },
      { id: "blood-orb", label: "Orbe de sangue", type: "orb" },
      { id: "sacrificial-dagger", label: "Adaga ritual", type: "dagger" },
    ],
  },
  "punho-ferro": {
    theme: "bruiser",
    defaultPalette: "ember",
    defaultWeapon: "iron-gauntlets",
    weapons: [
      { id: "iron-gauntlets", label: "Manoplas", type: "gauntlets" },
      { id: "warhammer", label: "Martelo", type: "hammer" },
      { id: "greatsword", label: "Espadão", type: "greatsword" },
    ],
  },
  "corvo-silencioso": {
    theme: "rogue",
    defaultPalette: "night",
    defaultWeapon: "twin-daggers",
    weapons: [
      { id: "twin-daggers", label: "Duas adagas", type: "dual-daggers" },
      { id: "shortsword", label: "Espada curta", type: "sword" },
      { id: "hand-crossbow", label: "Besta de mão", type: "crossbow" },
    ],
  },
  "xama-geada": {
    theme: "frost",
    defaultPalette: "frost",
    defaultWeapon: "frost-staff",
    weapons: [
      { id: "frost-staff", label: "Cajado de gelo", type: "staff" },
      { id: "ice-spear", label: "Lança glacial", type: "spear" },
      { id: "totem", label: "Totem", type: "totem" },
    ],
  },
  "guardiao-esquecido": {
    theme: "guardian",
    defaultPalette: "bone",
    defaultWeapon: "shield-mace",
    weapons: [
      { id: "shield-mace", label: "Escudo e maça", type: "shield" },
      { id: "tower-shield", label: "Escudo torre", type: "tower-shield" },
      { id: "guardian-spear", label: "Lança guardiã", type: "spear" },
    ],
  },
};

export function getClassAvatarConfig(archetypeId) {
  return CLASS_CONFIG[archetypeId] || CLASS_CONFIG["lamina-cinzas"];
}

export function getWeaponOptions(archetypeId) {
  return getClassAvatarConfig(archetypeId).weapons;
}

function validId(options, requested, fallback) {
  return options.some((item) => item.id === requested) ? requested : fallback;
}

export function defaultAppearance(archetypeId, gender = "female") {
  const config = getClassAvatarConfig(archetypeId);
  return {
    archetypeId,
    hairStyle: gender === "female" ? "ponytail" : "short",
    outfitStyle: "classic",
    paletteId: config.defaultPalette,
    weaponId: config.defaultWeapon,
    faceMark: "none",
  };
}

export function normalizeAppearance(archetypeId, gender, input) {
  const fallback = defaultAppearance(archetypeId, gender);
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const config = getClassAvatarConfig(archetypeId);
  return {
    archetypeId,
    hairStyle: validId(HAIR_STYLES, source.hairStyle, fallback.hairStyle),
    outfitStyle: validId(OUTFIT_STYLES, source.outfitStyle, fallback.outfitStyle),
    paletteId: validId(OUTFIT_PALETTES, source.paletteId, fallback.paletteId),
    weaponId: validId(config.weapons, source.weaponId, fallback.weaponId),
    faceMark: validId(FACE_MARKS, source.faceMark, fallback.faceMark),
  };
}

export function getPalette(paletteId) {
  return OUTFIT_PALETTES.find((item) => item.id === paletteId) || OUTFIT_PALETTES[0];
}

export function getWeapon(archetypeId, weaponId) {
  const options = getWeaponOptions(archetypeId);
  return options.find((item) => item.id === weaponId) || options[0];
}
