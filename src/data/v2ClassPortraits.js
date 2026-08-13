// Approved V2 class identity portraits shown only in archetype selection cards.
// The customizable in-game avatar remains the semantic modular renderer.
const SPRITE_URL = "/avatars/v2/class-portraits-v2.webp";

export const V2_CLASS_PORTRAITS = {
  "lamina-cinzas": { column: 0, row: 0 },
  "filha-bruma": { column: 1, row: 0 },
  "cacadora-ossos": { column: 2, row: 0 },
  "voz-vazio": { column: 3, row: 0 },
  "punho-ferro": { column: 0, row: 1 },
  "corvo-silencioso": { column: 1, row: 1 },
  "xama-geada": { column: 2, row: 1 },
  "guardiao-esquecido": { column: 3, row: 1 },
};

export function getV2ClassPortrait(archetypeId) {
  const portrait = V2_CLASS_PORTRAITS[archetypeId];
  if (!portrait) return null;

  return {
    spriteUrl: SPRITE_URL,
    backgroundPosition: `${portrait.column * (100 / 3)}% ${portrait.row * 100}%`,
  };
}
