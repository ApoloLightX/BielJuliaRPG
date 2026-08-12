# Provenance and External References

This project skill is original project guidance. It was informed by public design and implementation patterns, but it should not be treated as a copy of any external skill or library.

## Anthropic frontend-design skill

Reference:
- repository: `anthropics/claude-plugins-official`
- path: `plugins/frontend-design/skills/frontend-design/SKILL.md`

Ideas used at a high level:
- inspect the subject before styling;
- make visual choices specific to the product;
- avoid generic template aesthetics;
- use motion deliberately;
- critique before and after implementation;
- verify responsive/accessibility behavior.

Do not copy the external skill verbatim into this project.

## Frontend Design Pro

Reference:
- repository: `PGraeff/frontend-design-pro-agent-skill`
- path: `skills/frontend-design-pro/SKILL.md`

Ideas used at a high level:
- inspect existing product code first;
- preserve behavior and data integrity;
- treat responsive/accessibility as quality gates;
- verify real screenshots;
- allow expressive visual design for games while keeping controls stable.

Its own provenance notes describe combined Apache-2.0/MIT sources. This project skill paraphrases workflow ideas rather than vendoring its text.

## DiceBear

Reference:
- repository: `dicebear/dicebear`
- branch family reviewed: `10.x`
- license reviewed: MIT
- useful guide: creating an avatar style from scratch

Ideas used:
- component/variant-based avatar construction;
- independent randomizable/customizable components;
- shared color palettes;
- transforms and variant metadata;
- deterministic reconstruction from configuration.

Do not copy DiceBear official avatar artwork into BielJuliaRPG unless the specific asset/style license is separately checked. The core software license does not automatically answer every artwork/style licensing question.

## RPGUI

Reference:
- repository: `RonenNess/RPGUI`

Ideas used:
- game-specific framing and controls;
- progress/stat UI designed to read as RPG interface rather than generic web controls;
- lightweight enhancement of standard HTML.

The license was not confirmed while authoring this skill. Therefore:
- do not vendor RPGUI code, CSS, textures, cursors, icons, or other assets based only on this reference;
- use it as visual/interaction inspiration unless its license is explicitly verified later.

## react-colorful

Reference:
- repository: `omgovich/react-colorful`

Useful properties observed in its project documentation:
- small React color picker;
- mobile-friendly;
- accessible;
- no runtime dependencies;
- supports HEX and other color models.

If adopted, re-check the current package version, license, and bundle impact at implementation time.

## Motion

Reference:
- repository: `motiondivision/motion`
- project documentation identifies Motion as MIT licensed

Useful patterns:
- short React transitions;
- springs/layout transitions;
- gesture support;
- GPU-friendly animation patterns.

Do not add Motion merely because this skill mentions it. Add it only if the existing project cannot deliver the intended transition cleanly and the bundle tradeoff is justified.

## Image-generation tools

Generated imagery may be used as:
- class concept art;
- source material for compatible modular layers;
- art-direction references.

Generated imagery must be reviewed for consistency and prepared as deterministic shipped assets before it becomes part of the normal creator flow.
