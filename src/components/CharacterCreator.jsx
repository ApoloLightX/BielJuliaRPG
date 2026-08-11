import { useState } from "react";
import { Swords, Sparkles, Check } from "lucide-react";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import CharacterAvatar from "./CharacterAvatar.jsx";

const ATTR_LABELS = { forca: "Força", astucia: "Astúcia", vigor: "Vigor", vontade: "Vontade" };

function AttrBar({ value }) {
  return (
    <div className="flex gap-1" aria-label={`Valor ${value} de 4`}>
      {[1, 2, 3, 4].map((number) => (
        <div key={number} className={`w-4 h-2 rounded-sm ${number <= value ? "bg-[#b8492f]" : "bg-[#2a1f1a]"}`} />
      ))}
    </div>
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
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs ember uppercase tracking-widest font-display">{playerLabel}</p>
          <h2 className="font-display text-xl">Escolha seu arquétipo</h2>
        </div>

        {groups.map(({ label, list }) => (
          <div key={label} className="space-y-2">
            <p className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">{label}</p>
            <div className="grid grid-cols-2 gap-2">
              {list.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectArchetype(item.id)}
                  className="bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Swords size={13} className="ember" />
                    <span className="text-xs text-[#8a7a6d]">{item.role}</span>
                  </div>
                  <p className="font-display text-sm text-[#e8ddd0] leading-tight">{item.name}</p>
                  <p className="text-xs text-[#8a7a6d] italic mt-1">{item.tagline}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs ember uppercase tracking-widest font-display">{playerLabel}</p>
        <h2 className="font-display text-xl">{archetype.name}</h2>
        <p className="text-xs text-[#8a7a6d] italic">{archetype.tagline}</p>
      </div>

      <CharacterAvatar skinHex={skin.hex} hairHex={hair.hex} gender={archetype.gender} size={140} />

      <div className="space-y-2">
        <label htmlFor={`${playerLabel}-nick`} className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Nick do personagem</label>
        <input
          id={`${playerLabel}-nick`}
          type="text"
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          placeholder="Como vão te chamar na história?"
          maxLength={20}
          autoComplete="off"
          className="w-full bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f]"
        />
      </div>

      <fieldset className="space-y-2">
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

      <fieldset className="space-y-2">
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

      <div className="space-y-2">
        <p className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1">Atributos</p>
        <div className="bg-[#1a1310] border border-[#2a1f1a] rounded p-3 space-y-2">
          {Object.entries(archetype.attrs).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[#d9cbb8]">{ATTR_LABELS[key]}</span>
              <AttrBar value={value} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-[#8a7a6d] uppercase tracking-wider px-1 flex items-center gap-1.5"><Sparkles size={12} /> Habilidades iniciais</p>
        <div className="space-y-2">
          {archetype.skills.map((skill) => (
            <div key={skill.name} className="bg-[#1a1310] border border-[#2a1f1a] rounded p-3">
              <p className="text-sm font-medium text-[#e8ddd0]">{skill.name}</p>
              <p className="text-xs text-[#8a7a6d] mt-0.5 leading-relaxed">{skill.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setStep("archetype")} className="flex-1 bg-[#1a1310] border border-[#2a1f1a] text-[#8a7a6d] py-2.5 rounded text-sm hover:text-[#e8ddd0] transition-colors">Voltar</button>
        <button type="button" onClick={confirm} disabled={!nick.trim()} className="flex-1 bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 text-[#f0e6da] py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Check size={16} /> Confirmar</button>
      </div>
    </div>
  );
}

export default CharacterCreator;
