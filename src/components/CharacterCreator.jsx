import { useState } from "react";
import { Check, HeartPulse, ShieldHalf, Sparkles, Swords, Zap } from "lucide-react";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import CharacterAvatar from "./CharacterAvatar.jsx";

const ATTR_LABELS = { forca: "Força", astucia: "Astúcia", vigor: "Vigor", vontade: "Vontade" };

function calculatePreviewHp(attrs) {
  const vigor = Math.max(1, Math.min(4, Number(attrs?.vigor) || 1));
  return 10 + vigor * 3;
}

function previewAppearance(archetype) {
  const seed = [...archetype.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return {
    hair: HAIR_COLORS[seed % HAIR_COLORS.length],
    skin: SKIN_TONES[Math.floor(seed / 3) % SKIN_TONES.length],
  };
}

function AttrBar({ value, compact = false }) {
  return (
    <div className="flex gap-1" aria-label={`Valor ${value} de 4`}>
      {[1, 2, 3, 4].map((number) => (
        <div
          key={number}
          className={`${compact ? "w-3 h-1.5" : "w-4 h-2"} rounded-sm ${number <= value ? "bg-[#b8492f]" : "bg-[#2a1f1a]"}`}
        />
      ))}
    </div>
  );
}

function ArchetypeCard({ archetype, onSelect }) {
  const { hair, skin } = previewAppearance(archetype);
  const baseHp = calculatePreviewHp(archetype.attrs);

  return (
    <button
      type="button"
      onClick={() => onSelect(archetype.id)}
      className="group bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] hover:bg-[#1d1512] rounded-lg p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8492f]"
      aria-label={`Escolher ${archetype.name}, ${archetype.role}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <CharacterAvatar
            skinHex={skin.hex}
            hairHex={hair.hex}
            gender={archetype.gender}
            size={92}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Swords size={13} className="ember" />
              <span className="text-xs text-[#9b887b]">{archetype.role}</span>
            </div>
            <p className="font-display text-base text-[#eee1d4] leading-tight group-hover:text-white transition-colors">
              {archetype.name}
            </p>
            <p className="text-xs text-[#8a7a6d] italic mt-1">{archetype.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2 rounded-md border border-[#2a1f1a] bg-[#130f0d] p-2.5">
            {Object.entries(archetype.attrs).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#cdb9a7]">{ATTR_LABELS[key]}</span>
                <AttrBar value={value} compact />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a24] bg-[#130f0d] px-2.5 py-1 text-[#d9cbb8]">
              <HeartPulse size={12} className="text-[#b8492f]" /> Vida base {baseHp}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a24] bg-[#130f0d] px-2.5 py-1 text-[#d9cbb8]">
              <ShieldHalf size={12} className="text-[#b8492f]" /> {archetype.role}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-[#8a7a6d] flex items-center gap-1.5">
              <Zap size={11} /> Habilidades iniciais
            </p>
            <div className="space-y-1.5">
              {archetype.skills.map((skill) => (
                <div key={skill.name} className="rounded border border-[#2a1f1a] bg-[#130f0d] px-2.5 py-2">
                  <p className="text-xs font-medium text-[#e8ddd0]">{skill.name}</p>
                  <p className="text-[11px] text-[#8a7a6d] leading-relaxed mt-0.5">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
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

  const archetype = ARCHETYPES.find((item) => item.id === archetypeId);
  const hair = HAIR_COLORS.find((item) => item.id === hairId) || HAIR_COLORS[0];
  const skin = SKIN_TONES.find((item) => item.id === skinId) || SKIN_TONES[0];
  const nickInputId = `${String(playerLabel).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-nick`;

  function selectArchetype(id) {
    setArchetypeId(id);
    setStep("customize");
  }

  function confirm() {
    const cleanNick = nick.trim();
    if (!cleanNick || !archetype) return;
    onConfirm({ nick: cleanNick, archetype, hair, skin });
  }

  if (step === "archetype" || !archetype) {
    const groups = [
      { label: "Femininos", list: ARCHETYPES.filter((item) => item.gender === "female") },
      { label: "Masculinos", list: ARCHETYPES.filter((item) => item.gender === "male") },
    ];

    return (
      <div className="space-y-7">
        <div className="text-center space-y-1.5">
          <p className="text-xs ember uppercase tracking-widest font-display">{playerLabel}</p>
          <h2 className="font-display text-xl">Escolha seu arquétipo</h2>
          <p className="text-xs text-[#8a7a6d] max-w-xl mx-auto">
            Compare atributos, vida base e habilidades antes de escolher. Depois você personaliza aparência e nome.
          </p>
        </div>

        {groups.map(({ label, list }) => (
          <section key={label} className="space-y-3" aria-labelledby={`group-${label}`}>
            <p id={`group-${label}`} className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">{label}</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {list.map((item) => (
                <ArchetypeCard key={item.id} archetype={item} onSelect={selectArchetype} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-1">
        <p className="text-xs ember uppercase tracking-widest font-display">{playerLabel}</p>
        <h2 className="font-display text-xl">{archetype.name}</h2>
        <p className="text-xs text-[#8a7a6d] italic">{archetype.tagline}</p>
      </div>

      <div className="rounded-xl border border-[#2a1f1a] bg-[#15100e] py-5">
        <CharacterAvatar skinHex={skin.hex} hairHex={hair.hex} gender={archetype.gender} size={176} />
      </div>

      <div className="space-y-2">
        <label htmlFor={nickInputId} className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Nick do personagem</label>
        <input
          id={nickInputId}
          type="text"
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          placeholder="Como vão te chamar na história?"
          maxLength={20}
          autoComplete="off"
          className="w-full bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <fieldset className="space-y-2 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
          <legend className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Cor do cabelo</legend>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setHairId(item.id)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${hairId === item.id ? "border-[#b8492f] scale-110" : "border-[#3a2a24]"}`}
                style={{ backgroundColor: item.hex }}
                aria-label={item.label}
                aria-pressed={hairId === item.id}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2 rounded-lg border border-[#2a1f1a] bg-[#15100e] p-4">
          <legend className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Tom de pele</legend>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSkinId(item.id)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${skinId === item.id ? "border-[#b8492f] scale-110" : "border-[#3a2a24]"}`}
                style={{ backgroundColor: item.hex }}
                aria-label={item.label}
                aria-pressed={skinId === item.id}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-4">
        <div className="space-y-2">
          <p className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Atributos</p>
          <div className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2.5">
            {Object.entries(archetype.attrs).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-[#d9cbb8]">{ATTR_LABELS[key]}</span>
                <AttrBar value={value} />
              </div>
            ))}
            <div className="border-t border-[#2a1f1a] pt-3 mt-3 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-[#d9cbb8]"><HeartPulse size={14} className="text-[#b8492f]" /> Vida base</span>
              <span className="text-[#f0e6da] font-medium">{calculatePreviewHp(archetype.attrs)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1 flex items-center gap-1.5">
            <Sparkles size={12} /> Habilidades iniciais
          </p>
          <div className="space-y-2">
            {archetype.skills.map((skill) => (
              <div key={skill.name} className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-3.5">
                <p className="text-sm font-medium text-[#e8ddd0]">{skill.name}</p>
                <p className="text-xs text-[#8a7a6d] mt-0.5 leading-relaxed">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep("archetype")}
          className="flex-1 bg-[#1a1310] border border-[#2a1f1a] text-[#8a7a6d] py-2.5 rounded text-sm hover:text-[#e8ddd0] transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!nick.trim()}
          className="flex-1 bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 text-[#f0e6da] py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Check size={16} /> Confirmar
        </button>
      </div>
    </div>
  );
}

export default CharacterCreator;
