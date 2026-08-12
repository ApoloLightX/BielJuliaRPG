# Avatar Architecture

## Goal

Move from a single monolithic avatar illustration toward a deterministic modular renderer without turning the project into a 3D character engine.

The player should be able to change hair, colors, clothing/armor, weapon, marks, and future accessories while the class remains immediately recognizable.

## Canonical model

Keep appearance data independent from React components and asset technology.

Current compatibility shape:

```js
{
  hair: { id, label, hex },
  skin: { id, label, hex },
  appearance: {
    archetypeId,
    hairStyle,
    outfitStyle,
    paletteId,
    weaponId,
    faceMark,
  }
}
```

Future fields are additive.

Do not rename/remove existing fields without an explicit save migration.

## Recommended slot model

As the art evolves, converge toward data-driven slots:

```text
auraBack
weaponBack
cloakBack
hairBack
body
skinOverlay
outfitBase
armor
face
eyes
eyebrows
beard
faceMark
hairFront
headAccessory
neckAccessory
weaponFront
classFx
auraFront
```

Not every class needs every slot.

## Layering rules

1. A slot has one stable semantic purpose.
2. Z-order is defined centrally.
3. Asset files do not decide their own stacking order.
4. A visual option can use multiple physical layers when required, for example `hairBack` + `hairFront`, but one option ID owns both.
5. Weapons that cross the body may have back and front layers controlled by one `weaponId`.
6. Class FX never intercept pointer input.
7. Missing optional assets fail gracefully instead of breaking the character.

## Asset coordinate contract

For new high-quality portrait assets, use one consistent master canvas across the whole set.

Recommended master:
- portrait ratio: 3:4;
- example source master: 768 x 1024 or larger;
- transparent background for modular layers;
- identical body anchor and camera across compatible variants.

The runtime renderer may crop the same composition differently for:
- class card;
- creator preview;
- HUD portrait;
- character sheet.

Do not author separate unrelated characters for each crop.

## Asset naming

Recommended structure:

```text
src/assets/avatar/
  shared/
    body/
    faces/
    eyes/
    hair/
    marks/
  classes/
    lamina-cinzas/
      outfits/
      armor/
      weapons/
      fx/
    filha-bruma/
      ...
```

Recommended filename pattern:

```text
<slot>.<id>.<variant>.<format>
hair.braid-long.front.webp
hair.braid-long.back.webp
weapon.dual-swords.front.webp
weapon.dual-swords.back.webp
armor.plate-02.webp
```

Keep IDs stable after release.

## Manifest model

Prefer a manifest that drives both editor choices and renderer.

Example:

```js
{
  id: "dual-swords",
  slot: "weapon",
  label: "Duas lâminas",
  compatibleArchetypes: ["lamina-cinzas"],
  layers: {
    back: "/assets/avatar/classes/lamina-cinzas/weapons/weapon.dual-swords.back.webp",
    front: "/assets/avatar/classes/lamina-cinzas/weapons/weapon.dual-swords.front.webp",
  },
  recolor: {
    metal: true,
    accent: true,
  },
}
```

The creator asks the manifest what can be selected.
The sanitizer asks the same compatibility data what may be loaded.
The renderer asks the same manifest what to draw.

Avoid three independent compatibility tables.

## Recoloring strategy

Use a small number of semantic color channels:
- primary cloth;
- secondary cloth;
- metal;
- leather;
- glow/accent.

For SVG/vector assets, prefer CSS variables/currentColor/masks when practical.

For raster art, prefer:
- neutral grayscale/tintable masks;
- separate overlay masks;
- a curated number of authored variants for materials that cannot be recolored convincingly.

Do not apply one CSS hue rotation to the entire character. Skin, metal, leather, cloth, and magic should not rotate together.

## Free color selection

If free color choice is added:
- validate color format;
- constrain alpha unless transparency is intentionally supported;
- consider a curated palette plus an advanced picker;
- keep contrast reasonable;
- store the normalized color value, not picker state.

Curated presets remain valuable because they preserve art direction.

## Class compatibility

Compatibility is allowlist-based.

A saved unknown weapon, outfit, or accessory must fall back to the class default.

Never render arbitrary asset paths coming from the save.

## Save migration

When adding a field:

```js
const safe = normalizeAppearance(
  archetype.id,
  archetype.gender,
  savedAppearance
);
```

Normalization must:
- ignore unknown properties;
- reject incompatible IDs;
- fill defaults;
- preserve valid previous choices;
- return a complete safe object.

Tests should cover:
- missing appearance;
- unknown IDs;
- weapon from another class;
- malformed object/array/string input;
- valid new fields;
- old snapshot to new schema.

## Performance

- Lazy-load large portrait assets where practical.
- Prefer WebP/AVIF for raster delivery if browser support and tooling are suitable.
- Avoid decoding every full-resolution variant on the class-selection screen.
- Preload only the selected class's near-term editor assets.
- Keep HUD portraits lightweight.
- Measure bundle and image transfer separately.
- Do not base64-embed a large wardrobe into JavaScript.

## Runtime image generation

Normal gameplay customization must not depend on an image API.

If AI-generated art is used:
1. generate source/master assets during development;
2. review consistency;
3. prepare/segment/optimize them;
4. ship deterministic assets;
5. save IDs only.

This keeps reloads, offline behavior, cost, privacy, and multiplayer synchronization predictable.
