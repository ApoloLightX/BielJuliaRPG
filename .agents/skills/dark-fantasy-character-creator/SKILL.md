---
name: dark-fantasy-character-creator
description: Design, implement, review, and evolve the BielJuliaRPG character creator and modular avatars. Use for archetype selection, avatar art, hair, skin, face, clothing, armor, colors, weapons, accessories, character-card UX, avatar persistence, asset generation, or any change that affects how a player character looks.
---

# Dark Fantasy Character Creator

This skill is the project playbook for character creation and avatar work in BielJuliaRPG.

Its job is to keep three things true at the same time:

1. the creator looks and feels like a dark-fantasy videogame rather than a generic form;
2. appearance is genuinely modular and class-aware;
3. visual changes remain deterministic, accessible, performant, and safe across local and cloud saves.

## Always start by re-reading the live project

Never begin from memory.

Before changing code or generating assets:

1. identify the current branch and HEAD;
2. inspect the current versions of the files that will be touched;
3. inspect any open PR that contains related work;
4. inspect the current save schema and normalizer if appearance is persisted;
5. inspect the current deployment/CI state when the change will ship;
6. state internally what is verified now, what is only implemented, and what is still untested.

At minimum, re-check these files when they exist:

- `src/components/CharacterCreator.jsx`
- `src/components/CharacterAvatar.jsx`
- `src/components/CharacterSheet.jsx`
- `src/data/archetypes.js`
- `src/data/avatarCustomization.js`
- `src/game/engine.js`
- `src/App.jsx`
- `src/GameSession.jsx`

If the repository has changed, the repository wins over this skill.

## Read the supporting references selectively

- Read `references/visual-language.md` before redesigning cards, editor layout, typography, motion, or art direction.
- Read `references/avatar-architecture.md` before adding a new visual slot, asset type, color system, renderer, or persistence field.
- Read `references/class-matrix.md` before changing class-specific equipment, silhouettes, motifs, default palettes, or weapon compatibility.
- Read `references/qa-checklist.md` before calling any avatar or creator change complete.
- Read `references/provenance.md` before importing or adapting code/assets from external repositories.

## Product invariants

Do not break these rules:

- Appearance never changes gameplay attributes, HP, skills, XP, level, combat rules, or class mechanics.
- The archetype owns the gameplay identity. Customization changes presentation only.
- A player can recognize the archetype from silhouette, equipment language, and effects even after heavy customization.
- Existing saves must keep loading. New appearance fields are additive and normalized.
- Cloud and local mode must render the same character from the same saved appearance.
- The canonical saved state contains identifiers and color values, not generated screenshots of the avatar.
- Never trust arbitrary saved IDs. Every persisted option must be checked against an allowlist or compatible manifest.
- Do not require runtime image generation for normal customization.
- AI-generated art may be used to create source assets, but the in-game result must be deterministic once assets are shipped.
- Do not add a heavy dependency when the same result can be achieved cleanly with the current stack.
- Do not merge a visual feature only because the build passes. Inspect the real rendered result.

## Current appearance contract

At the time this skill was authored, the project stores:

```js
player.hair = { id, label, hex }
player.skin = { id, label, hex }

player.appearance = {
  archetypeId,
  hairStyle,
  outfitStyle,
  paletteId,
  weaponId,
  faceMark,
}
```

Treat this as a compatibility contract, not a forever limit.

Future fields may include, for example:

```js
{
  faceShape,
  eyeStyle,
  eyeColor,
  eyebrowStyle,
  beardStyle,
  accessoryId,
  cloakId,
  armorVariant,
  armorAccent,
  weaponFinish,
  auraStyle,
}
```

Every new persisted field requires all of the following in the same change:

1. a safe default;
2. compatibility rules;
3. normalization/sanitization;
4. rendering support;
5. migration behavior for older snapshots;
6. regression tests;
7. cloud and local verification.

## Workflow

### 1. Classify the task

Place the request in one or more categories:

- class selection UX;
- character editor UX;
- modular asset creation;
- renderer/composition;
- appearance data model;
- save migration;
- animation/feedback;
- responsive/mobile;
- accessibility;
- performance.

Do not solve an asset problem by changing gameplay data or solve a layout problem by rewriting the save model.

### 2. Set the visual intention

Before coding, define internally:

- the screen's single job;
- the dominant visual element;
- what must be scannable in under three seconds;
- which one visual flourish is allowed to carry the fantasy mood;
- what will remain quiet so the screen does not become ornamental noise.

For archetype selection, the character is the hero. Stats support the decision; they do not dominate the card.

For character customization, the live preview is the anchor. Controls orbit the preview and should update it immediately.

### 3. Preserve class identity

Use `references/class-matrix.md`.

A customization option is valid only if:

- it fits the archetype's equipment fantasy;
- it preserves a recognizable silhouette or signature motif;
- it does not visually promise a mechanic the class does not have;
- it does not make a different archetype's signature equipment commonplace.

Example: a Guardião Esquecido may have multiple shield silhouettes, but should not casually inherit the Corvo Silencioso's twin-dagger identity.

### 4. Build modularly

Prefer independent visual slots over one monolithic SVG or one static PNG.

Recommended conceptual composition order:

```text
background aura
weapon behind body
cloak/hair behind body
body/skin
base outfit
class armor
face
eyes/brows
marks
hair front
accessories
weapon foreground
class FX
foreground vignette
```

See `references/avatar-architecture.md` for the full contract.

### 5. Make options data-driven

Visual choices belong in manifests/configuration, not scattered conditionals across JSX.

A new option should normally be introduced by data such as:

```js
{
  id: "braid-long",
  slot: "hair",
  label: "Trança longa",
  genders: ["female", "male"],
  compatibleArchetypes: ["cacadora-ossos", "xama-geada"],
  asset: "...",
}
```

The renderer should consume normalized data. The creator should consume the same source of truth to decide what the player may select.

### 6. Persist identifiers, not DOM state

When the player confirms a character:

- save the selected option IDs;
- save validated custom colors only when the product supports free color choice;
- never serialize SVG nodes, canvas pixels, blobs, component state, or temporary editor UI state.

On load, reconstruct the avatar from the normalized appearance.

### 7. Generate or add art consistently

When creating new visual assets:

- keep the same camera, body proportions, anchor points, lighting direction, and crop across variants;
- prefer transparent assets or vector layers for modular pieces;
- do not bake hair, weapon, and armor into one image if they need to be independently customizable;
- keep source masters larger than runtime delivery assets;
- optimize delivery assets before shipping;
- keep generated art free of text, logos, watermarks, and UI framing;
- inspect each asset against neighboring variants before accepting it.

If using an image-generation tool, request individual compatible parts or class anchor art. Do not generate eight unrelated illustration styles and call them a modular set.

### 8. Add motion only when it communicates something

Good uses:

- selected card settles into focus;
- preview crossfades or morphs when a part changes;
- class aura subtly responds to selection;
- weapon swap has a short continuity transition.

Bad uses:

- perpetual particles over every card;
- layout movement that shifts controls under the pointer;
- animation required to understand state;
- large motion on every hover.

Respect `prefers-reduced-motion`.

### 9. Verify in the actual game

A complete avatar change is verified in all surfaces that render the player:

- archetype card preview;
- creator live preview;
- HUD;
- character sheet;
- combat/turn UI if an avatar is shown there;
- local save reload;
- cloud save reload;
- realtime sync when relevant.

If any surface still shows the old generic avatar, the integration is incomplete.

## Dependency policy

External libraries are optional tools, not architectural owners.

Before adding one:

1. confirm the current project cannot meet the requirement cleanly;
2. check license and maintenance state;
3. evaluate bundle cost;
4. confirm it works with React/Vite used by the project;
5. keep the project's data model independent of the library.

Useful reference patterns include:

- component/variant composition as used by DiceBear;
- disciplined fantasy control styling as seen in RPG-focused UI libraries;
- a lightweight accessible picker for free color selection;
- a small motion layer for intentional transitions.

Do not import third-party avatar art unless its asset license explicitly allows the intended use.

## Branch and rollout discipline

- Re-check `main` and any active hardening/feature branch before editing.
- Avoid overwriting newer work with an older ZIP or cached file.
- Prefer atomic commits by concern.
- Keep save-schema work separate from purely visual polish when practical.
- Run the project's existing CI gates.
- Confirm the deployment status if the change reaches production.
- For significant visual changes, inspect at least one desktop and one mobile render before calling it done.

## Definition of done

A character-creator task is complete only when:

- the requested visual option exists and is visible;
- class compatibility is enforced;
- the live preview updates correctly;
- the saved representation is normalized;
- old saves still load;
- local and cloud paths agree;
- all avatar surfaces use the saved appearance;
- keyboard/focus/touch behavior remains usable;
- reduced motion is respected when motion was added;
- build/tests/typecheck/lint required by the branch pass;
- the real rendered result has been inspected;
- no external asset or code was imported with an unresolved license.
