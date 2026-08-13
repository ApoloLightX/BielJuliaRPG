import { useMemo, useState } from "react";
import { Check, ChevronRight, HeartPulse, Palette, Sparkles, Swords } from "lucide-react";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import {
  defaultAppearance,
  FACE_MARKS,
  getPalette,
  getWeaponOptions,
  HAIR_STYLES,
  OUTFIT_PALETTES,
  OUTFIT_STYLES,
} from "../data/avatarCustomization.js";
import CharacterAvatar from "./CharacterAvatar.jsx";

const ATTR_LABELS = {
  forca: "Força",
  astucia: "Astúcia",
  vigor: "Vigor",
  vontade: "Vontade",
};

function calculatePreviewHp(attrs) {
  const vigor = Math.max(1, Math.min(4, Number(attrs?.vigor) || 1));
  return 10 + vigor * 3;
}

function previewAppearance(archetype) {
  const seed = [...archetype.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return {
    hair: HAIR_COLORS[seed % HAIR_COLORS.length],
    skin: SKIN_TONES[Math.floor(seed / 3) % SKIN_TONES.length],
    appearance: defaultAppearance(archetype.id, archetype.gender),
  };
}

function AttrBar({ value, accent = "#b8492f", compact = false }) {
  return (
    <div className="flex gap-1" aria-label={`Valor ${value} de 4`}>
      {[1, 2, 3, 4].map((number) => (
        <span
          key={number}
          className={`${compact ? "h-1.5 w-3" : "h-2 w-4"} rounded-sm`}
          style={{ backgroundColor: number <= value ? accent : "#2a1f1a" }}
        />
      ))}
    </div>
  );
}

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 rounded-md border px-3 py-2 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f] ${
        selected
          ? "border-[#b8492f] bg-[#2a1713] text-[#f2e6db]"
          : "border-[#342721] bg-[#130f0d] text-[#9f8b7d] hover:border-[#6f4034] hover:text-[#e8ddd0]"
      }`}
    >
      {children}
    </button>
  );
}

function ArchetypeCard({ archetype, onSelect }) {
  const { hair, skin, appearance } = previewAppearance(archetype);
  const palette = getPalette(appearance.paletteId);
  const baseHp = calculatePreviewHp(archetype.attrs);
  const visibleSkills = archetype.skills.slice(0, 2);
  const remainingSkills = Math.max(0, archetype.skills.length - visibleSkills.length);

  return (
    <button
      type="button"
      onClick={() => onSelect(archetype.id)}
      className="group relative overflow-hidden rounded-xl border border-[#352721] bg-[#15100e] text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#8f4b39] hover:bg-[#1a1310] hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f] motion-reduce:transform-none motion-reduce:transition-none"
      aria-label={`Escolher ${archetype.name}, ${archetype.role}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-[#33251f] bg-[#0d0908]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(circle at 50% 36%, ${palette.secondary}40 0%, ${palette.primary}24 37%, transparent 72%)`,
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 top-2 px-3 pt-1 transition-transform duration-200 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none">
          <CharacterAvatar
            skinHex={skin.hex}
            hairHex={hair.hex}
            gender={archetype.gender}
            archetypeId={archetype.id}
            appearance={appearance}
            fluid
            frame={false}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#15100e] via-[#15100edd] to-transparent" aria-hidden="true" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#e5d8cb] backdrop-blur-sm">
          <Swords size={11} style={{ color: palette.secondary }} />
          {archetype.role}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="min-h-[58px]">
          <h3 className="font-display text-lg leading-tight text-[#f1e4d7] transition-colors group-hover:text-white">
            {archetype.name}
          </h3>
          <p className="mt-1 text-xs italic leading-relaxed text-[#927f72]">{archetype.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[#2d211c] py-3">
          {Object.entries(archetype.attrs).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px] text-[#b9a69a]">
                <span>{ATTR_LABELS[key]}</span>
                <span className="tabular-nums text-[#e0d2c5]">{value}</span>
              </div>
              <AttrBar value={value} accent={palette.secondary} compact />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-[#d9cbb8]">
            <HeartPulse size={13} style={{ color: palette.secondary }} />
            Vida {baseHp}
          </span>
          <span className="text-[#837267]">{archetype.skills.length} habilidades</span>
        </div>

        <div className="flex min-h-[50px] flex-wrap content-start gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill.name}
              className="rounded-full border border-[#342721] bg-[#100c0a] px-2.5 py-1 text-[10px] text-[#c7b6a9]"
            >
              {skill.name}
            </span>
          ))}
          {remainingSkills > 0 && (
            <span className="rounded-full border border-[#342721] px-2.5 py-1 text-[10px] text-[#75665d]">
              +{remainingSkills}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2d211c] pt-3 text-xs font-medium text-[#c9b4a4]">
          <span>Escolher classe</span>
          <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
        </div>
      </div>
    </button>
  );
}

function CharacterCreator({ onConfirm, playerLabel }) {
  const [step, setStep] = useState("archetype");
  const [archetypeId, setArchetypeId] = useState(null);
  const [hairId, setHairId] = useState(HAIR_COLORS[0].id);
  const [skinId, setSkinId] = useState(SKIN_TONES[0].id);
  const [nick, setNick] = useState("");
  const [appearance, setAppearance] = useState(null);

  const archetype = ARCHETYPES.find((item) => item.id === archetypeId);
  const hair = HAIR_COLORS.find((item) => item.id === hairId) || HAIR_COLORS[0];
  const skin = SKIN_TONES.find((item) => item.id === skinId) || SKIN_TONES[0];
  const safeAppearance = useMemo(
    () =>
      archetype
        ? { ...defaultAppearance(archetype.id, archetype.gender), ...(appearance || {}) }
        : null,
    [appearance, archetype]
  );
  const weaponOptions = archetype ? getWeaponOptions(archetype.id) : [];
  const nickInputId = `${String(playerLabel).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-nick`;

  function selectArchetype(id) {
    const selected = ARCHETYPES.find((item) => item.id === id);
    setArchetypeId(id);
    setAppearance(defaultAppearance(id, selected?.gender));
    setStep("customize");
  }

  function patchAppearance(patch) {
    if (!archetype) return;
    setAppearance((current) => ({
      ...(current || defaultAppearance(archetype.id, archetype.gender)),
      ...patch,
    }));
  }

  function confirm() {
    const cleanNick = nick.trim();
    if (!cleanNick || !archetype || !safeAppearance) return;
    onConfirm({ nick: cleanNick, archetype, hair, skin, appearance: safeAppearance });
  }

  if (step === "archetype" || !archetype) {
    const groups = [
      { label: "Femininos", list: ARCHETYPES.filter((item) => item.gender === "female") },
      { label: "Masculinos", list: ARCHETYPES.filter((item) => item.gender === "male") },
    ];

    return (
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="space-y-2 text-center">
          <p className="font-display text-xs uppercase tracking-[0.22em] ember">{playerLabel}</p>
          <h2 className="font-display text-2xl text-[#f0e4d7] sm:text-3xl">Escolha seu arquétipo</h2>
          <p className="mx-auto max-w-xl text-xs leading-relaxed text-[#8a7a6d] sm:text-sm">
            Primeiro escolha quem você é na batalha. Depois monte cabelo, roupa, cores, marcas e arma.
          </p>
        </div>

        {groups.map(({ label, list }) => (
          <section key={label} className="space-y-3" aria-labelledby={`group-${label}`}>
            <div className="flex items-center gap-3 px-1">
              <p id={`group-${label}`} className="text-[11px] uppercase tracking-[0.18em] text-[#8a7a6d]">
                {label}
              </p>
              <span className="h-px flex-1 bg-[#2a1f1a]" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((item) => (
                <ArchetypeCard key={item.id} archetype={item} onSelect={selectArchetype} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const palette = getPalette(safeAppearance.paletteId);
  const selectedWeapon = weaponOptions.find((item) => item.id === safeAppearance.weaponId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1 text-center">
        <p className="font-display text-xs uppercase tracking-[0.2em] ember">{playerLabel}</p>
        <h2 className="font-display text-2xl text-[#f0e4d7]">{archetype.name}</h2>
        <p className="text-xs italic text-[#8a7a6d]">{archetype.tagline}</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.85fr)_1.15fr]">
        <aside className="overflow-hidden rounded-xl border border-[#352721] bg-[#15100e] lg:sticky lg:top-4">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#0d0908] p-3 sm:p-5">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${palette.secondary}38 0%, ${palette.primary}20 42%, transparent 73%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative h-full w-full">
              <CharacterAvatar
                skinHex={skin.hex}
                hairHex={hair.hex}
                gender={archetype.gender}
                archetypeId={archetype.id}
                appearance={safeAppearance}
                fluid
                frame={false}
              />
            </div>
          </div>
          <div className="border-t border-[#30231e] p-4 text-center">
            <p className="font-display text-base text-[#eee1d4]">{nick.trim() || "Seu personagem"}</p>
            <p className="mt-1 text-[11px] text-[#8a7a6d]">
              {archetype.role} · {selectedWeapon?.label || "Arma da classe"}
            </p>
            <div className="mt-3 flex justify-center gap-1.5" aria-label={`Paleta ${palette.label}`}>
              {[palette.primary, palette.secondary, palette.metal].map((color) => (
                <span
                  key={color}
                  className="h-3.5 w-3.5 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
            <label htmlFor={nickInputId} className="text-xs uppercase tracking-wider text-[#8a7a6d]">
              Nome
            </label>
            <input
              id={nickInputId}
              value={nick}
              onChange={(event) => setNick(event.target.value)}
              maxLength={20}
              autoComplete="off"
              placeholder="Como vão te chamar na história?"
              className="min-h-11 w-full rounded border border-[#3a2a24] bg-[#0e0b0a] px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#5a4d43] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="space-y-3 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
              <legend className="px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">Cabelo</legend>
              <div className="flex flex-wrap gap-2">
                {HAIR_STYLES.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    selected={safeAppearance.hairStyle === item.id}
                    onClick={() => patchAppearance({ hairStyle: item.id })}
                  >
                    {item.label}
                  </ChoiceButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {HAIR_COLORS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setHairId(item.id)}
                    className={`h-11 w-11 rounded-full border-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f] ${
                      hairId === item.id ? "scale-110 border-[#b8492f]" : "border-[#3a2a24]"
                    }`}
                    style={{ backgroundColor: item.hex }}
                    aria-label={`Cabelo ${item.label}`}
                    aria-pressed={hairId === item.id}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
              <legend className="px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">Pele e marca</legend>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSkinId(item.id)}
                    className={`h-11 w-11 rounded-full border-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f] ${
                      skinId === item.id ? "scale-110 border-[#b8492f]" : "border-[#3a2a24]"
                    }`}
                    style={{ backgroundColor: item.hex }}
                    aria-label={`Pele ${item.label}`}
                    aria-pressed={skinId === item.id}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {FACE_MARKS.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    selected={safeAppearance.faceMark === item.id}
                    onClick={() => patchAppearance({ faceMark: item.id })}
                  >
                    {item.label}
                  </ChoiceButton>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="space-y-3 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
            <legend className="px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">Roupa e armadura</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {OUTFIT_STYLES.map((item) => (
                <ChoiceButton
                  key={item.id}
                  selected={safeAppearance.outfitStyle === item.id}
                  onClick={() => patchAppearance({ outfitStyle: item.id })}
                >
                  {item.label}
                </ChoiceButton>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">
              <Palette size={12} /> Cores da roupa
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OUTFIT_PALETTES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => patchAppearance({ paletteId: item.id })}
                  aria-pressed={safeAppearance.paletteId === item.id}
                  className={`flex min-h-12 items-center gap-2 rounded-md border p-2.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f] ${
                    safeAppearance.paletteId === item.id
                      ? "border-[#b8492f] bg-[#2a1713] text-[#f1e4d7]"
                      : "border-[#342721] bg-[#130f0d] text-[#a49286]"
                  }`}
                >
                  <span className="flex -space-x-1" aria-hidden="true">
                    <span className="h-5 w-5 rounded-full border border-black/30" style={{ backgroundColor: item.primary }} />
                    <span className="h-5 w-5 rounded-full border border-black/30" style={{ backgroundColor: item.secondary }} />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
            <legend className="px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">Arma da classe</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {weaponOptions.map((item) => (
                <ChoiceButton
                  key={item.id}
                  selected={safeAppearance.weaponId === item.id}
                  onClick={() => patchAppearance({ weaponId: item.id })}
                >
                  {item.label}
                </ChoiceButton>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-2">
              <p className="px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">Atributos</p>
              <div className="space-y-2.5 rounded-lg border border-[#2a1f1a] bg-[#1a1310] p-4">
                {Object.entries(archetype.attrs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-[#d9cbb8]">{ATTR_LABELS[key]}</span>
                    <AttrBar value={value} accent={palette.secondary} />
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between border-t border-[#2a1f1a] pt-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-[#d9cbb8]">
                    <HeartPulse size={14} style={{ color: palette.secondary }} /> Vida base
                  </span>
                  <span className="font-medium tabular-nums text-[#f0e6da]">
                    {calculatePreviewHp(archetype.attrs)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 px-1 text-xs uppercase tracking-wider text-[#8a7a6d]">
                <Sparkles size={12} /> Habilidades iniciais
              </p>
              <div className="space-y-2">
                {archetype.skills.map((skill) => (
                  <div key={skill.name} className="rounded-lg border border-[#2a1f1a] bg-[#1a1310] p-3.5">
                    <p className="text-sm font-medium text-[#e8ddd0]">{skill.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8a7a6d]">{skill.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setStep("archetype")}
          className="min-h-12 flex-1 rounded border border-[#2a1f1a] bg-[#1a1310] text-sm text-[#8a7a6d] transition-colors hover:text-[#e8ddd0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f]"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!nick.trim()}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded bg-[#7a2419] text-sm font-medium text-[#f0e6da] transition-colors hover:bg-[#8e2c1f] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d76a50]"
        >
          <Check size={16} /> Confirmar personagem
        </button>
      </div>
    </div>
  );
}

export default CharacterCreator;
