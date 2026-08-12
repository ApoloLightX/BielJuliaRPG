# QA Checklist

Use this before calling a character-creator or avatar change complete.

## Re-review

- [ ] Re-fetched current branch/HEAD before editing.
- [ ] Re-read the current creator, renderer, customization data, and save normalizer.
- [ ] Checked whether `main` and active feature/hardening branches diverge.
- [ ] Did not overwrite newer code with a stale local ZIP or cached file.

## Visual

- [ ] Character is the dominant visual element in class selection.
- [ ] Each archetype remains recognizable after customization.
- [ ] Selected state is obvious without relying on color alone.
- [ ] Text does not overflow at common desktop widths.
- [ ] Mobile layout does not horizontally scroll.
- [ ] Preview does not jump in size when switching parts.
- [ ] No asset has baked-in text, watermark, or incompatible UI frame.
- [ ] New assets match the established camera, scale, and lighting.

## Editor behavior

- [ ] Every visible choice updates the preview immediately.
- [ ] Back/forward within the creator preserves expected choices.
- [ ] Switching class resets or normalizes incompatible options safely.
- [ ] Weapon list is class-specific.
- [ ] Outfit/accessory compatibility is enforced.
- [ ] Free color input, if present, is validated.
- [ ] Confirm is disabled until required identity fields are valid.

## Persistence

- [ ] Appearance saves identifiers, not rendered images.
- [ ] `normalizeAppearance` (or current equivalent) allowlists every persisted option.
- [ ] Missing appearance gets safe defaults.
- [ ] Malformed appearance cannot crash the renderer.
- [ ] A weapon from another class falls back safely.
- [ ] Previous save schema still loads.
- [ ] New save reloads with exactly the same visual choices.
- [ ] Local mode persists correctly.
- [ ] Cloud mode persists correctly.
- [ ] Realtime updates do not erase appearance.

## Integration surfaces

- [ ] Archetype card preview.
- [ ] Creator large preview.
- [ ] In-game HUD.
- [ ] Character sheet.
- [ ] Combat/turn UI if applicable.
- [ ] Any party/presence UI that renders portraits.

## Accessibility

- [ ] Interactive controls have visible focus.
- [ ] Icon-only controls have accessible names.
- [ ] Color choices have text/accessible labels.
- [ ] Selected state is announced semantically.
- [ ] Touch targets are usable on mobile.
- [ ] Reduced-motion preference is respected.

## Performance

- [ ] Large asset set is not imported into the initial JS bundle unnecessarily.
- [ ] Class selection does not decode all high-resolution wardrobe assets.
- [ ] Runtime portrait assets are optimized.
- [ ] No large base64 asset blobs live in source code.
- [ ] New animation does not cause layout thrashing.

## Project gates

Run the gates defined by the current branch/repository. Typically include:
- [ ] secret scan when configured;
- [ ] lint;
- [ ] typecheck;
- [ ] automated tests;
- [ ] production build;
- [ ] dependency audit according to project policy.

## Runtime proof

- [ ] Inspect at least one real desktop render.
- [ ] Inspect at least one real mobile render.
- [ ] Create a deliberately distinctive character.
- [ ] Save it.
- [ ] Reload/F5.
- [ ] Confirm the exact appearance returns.
- [ ] If cloud/realtime is involved, verify from a second session/device.

A green CI run without visual/runtime inspection is not sufficient for a major creator redesign.
