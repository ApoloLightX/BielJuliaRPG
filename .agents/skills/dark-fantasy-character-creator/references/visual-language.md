# Visual Language

## Core direction

The creator belongs to **O Silêncio de Vharnak**: dark fantasy, ash, silence, old vows, mist, bone, frost, void, tarnished metal, candlelight, and restrained ember accents.

The target is not generic "medieval fantasy UI" and not a SaaS dashboard wearing a dark theme.

The interface should feel like a character-selection chamber inside the world, while remaining readable and fast.

## Hierarchy

### Archetype selection

The character image is the first read.

Recommended desktop hierarchy:

1. character silhouette/art;
2. archetype name and role;
3. short tagline;
4. four attributes;
5. HP/identity badges;
6. condensed skill summary.

Avoid making three full skill-description boxes the visually largest part of every card. Full descriptions can remain available, but scanning should be faster than the current dense technical-card treatment.

A wide screen should not stretch two cards into giant horizontal documents. Prefer controlled card widths and a denser grid when there is enough space.

### Customization screen

The live character preview is the anchor.

Desktop:
- preview occupies roughly 35-45% of the useful width;
- controls occupy the remainder;
- keep the primary confirm action stable and easy to find.

Mobile:
- preview appears first;
- editor groups follow as compact sections;
- controls must not require horizontal scrolling;
- keep touch targets at least approximately 44-48px.

## Card language

Use fewer nested boxes.

A class card may use:
- one outer frame;
- one subtle stat surface;
- compact skill rows or chips;
- one selected-state treatment.

Do not place every label inside another bordered card.

Selected state should combine at least two signals:
- border/light treatment;
- position/elevation or background change;
- a clear selected mark or label.

Never use color alone.

## Materials and color

Base materials:
- near-black charcoal;
- smoked brown-black;
- aged parchment text;
- oxidized/tarnished metal;
- muted ember;
- class-specific secondary accents.

The global accent should remain controlled. Class accents may appear in the portrait frame, equipment FX, selection glow, or a small rule.

Avoid neon saturation unless it is the deliberate language of a supernatural class effect.

## Typography

Keep the existing project typography unless a redesign explicitly changes it.

Roles:
- display face for archetype names, section titles, and world-facing labels;
- readable serif/body face for descriptions and narrative;
- compact utility styling for stats, values, and small UI labels.

Do not shrink important content merely to fit a wide card.

## Class-specific visual cues

Use the class matrix for exact motifs.

Examples:
- Lâmina de Cinzas: ember edge, ash, steel;
- Filha da Bruma: fog, silver, spectral violet/blue;
- Caçadora de Ossos: bone, leather, forest ash;
- Voz do Vazio: void violet, dark ritual red;
- Punho de Ferro: iron mass, impact, heat;
- Corvo Silencioso: black feathers, shadow, muted blue;
- Xamã da Geada: frost, carved totems, cold light;
- Guardião Esquecido: old oath metal, stone, shield geometry.

## Motion

One memorable movement is better than ten ambient effects.

Preferred:
- subtle class aura on selection;
- 120-220ms control state transitions;
- a soft preview transition when swapping a major part;
- brief weapon/armor emphasis on change.

Avoid:
- continuous bobbing on every character;
- large parallax on operational controls;
- particles obscuring stats;
- animation-induced layout shift.

Always provide a reduced-motion path.

## Generated art direction

When generating class anchor art or modular pieces, aim for:
- polished semi-realistic dark-fantasy RPG illustration;
- readable silhouette at small size;
- consistent camera and proportions across the set;
- neutral enough pose for equipment swaps;
- lighting that supports recoloring and overlays;
- no text;
- no UI frame baked into the art;
- no watermark.

Treat generated concept art as art direction until it has been adapted into a compatible modular asset set.
