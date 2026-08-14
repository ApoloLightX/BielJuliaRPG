// Approved V2 identity portraits for archetype selection cards.
// Runtime customization remains deterministic and is rendered by CharacterAvatar's modular SVG layers.
export const V2_CLASS_PORTRAITS = {
  "lamina-cinzas": "/avatars/v2/lamina-cinzas.webp",
  "filha-bruma": "/avatars/v2/filha-bruma.webp",
  "cacadora-ossos": "/avatars/v2/cacadora-ossos.webp",
  "voz-vazio": "/avatars/v2/voz-vazio.webp",
  "punho-ferro": "/avatars/v2/punho-ferro.webp",
  "corvo-silencioso": "/avatars/v2/corvo-silencioso.webp",
  "xama-geada": "/avatars/v2/xama-geada.webp",
  "guardiao-esquecido": "/avatars/v2/guardiao-esquecido.webp",
};

export function getV2ClassPortrait(archetypeId) {
  return V2_CLASS_PORTRAITS[archetypeId] || null;
}
