// Approved V2 identity portraits for archetype selection cards.
// Runtime customization remains deterministic and is rendered by CharacterAvatar's modular SVG layers.
export const V2_CLASS_PORTRAIT_SPRITE = "/avatars/v2/class-portraits.webp";

export const V2_CLASS_PORTRAITS = {
  "lamina-cinzas": { position: "0% 0%" },
  "filha-bruma": { position: "33.333% 0%" },
  "cacadora-ossos": { position: "66.667% 0%" },
  "voz-vazio": { position: "100% 0%" },
  "punho-ferro": { position: "0% 100%" },
  "corvo-silencioso": { position: "33.333% 100%" },
  "xama-geada": { position: "66.667% 100%" },
  "guardiao-esquecido": { position: "100% 100%" },
};

export function getV2ClassPortrait(archetypeId) {
  const portrait = V2_CLASS_PORTRAITS[archetypeId];
  return portrait
    ? { ...portrait, src: V2_CLASS_PORTRAIT_SPRITE, backgroundSize: "400% 200%" }
    : null;
}
