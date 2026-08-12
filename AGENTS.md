# AGENTS.md

## Project-local skill routing

For any task involving character creation, archetype-selection UI, avatars, hair, skin, faces, clothing, armor, palettes, weapons, accessories, character art, avatar animation, or appearance persistence, read and follow:

`.agents/skills/dark-fantasy-character-creator/SKILL.md`

Load the referenced files from that skill only as needed.

## Anti-stale-context rule

Before modifying this repository, re-check the current branch/HEAD and the current versions of the relevant files. Do not implement from remembered conversation state, old ZIP contents, cached snippets, or an earlier commit when the repository can be inspected.

For work that may affect production:
- distinguish verified current behavior from code that is merely implemented;
- run the repository's current gates;
- verify deployment/runtime when relevant.

Repository state is the source of truth.
