import { useState } from "react";
import { Backpack, Heart, Minus, Plus, Star, X } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar.jsx";

const attrLabels = {
  forca: "Força",
  astucia: "Astúcia",
  vigor: "Vigor",
  vontade: "Vontade",
};

function hpClass(pct) {
  if (pct > 50) return "bg-[#6a8a4a]";
  if (pct > 20) return "bg-[#c98a2a]";
  return "bg-[#b8492f]";
}

export default function CharacterSheet({ player, onChangeHp, onAddItem, onRemoveItem }) {
  const [newItem, setNewItem] = useState("");
  const hpPct = player.maxHp ? Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) : 0;

  function addItem() {
    const item = newItem.trim().slice(0, 80);
    if (!item) return;
    onAddItem(item);
    setNewItem("");
  }

  return (
    <section className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-3">
        <CharacterAvatar
          skinHex={player.skin.hex}
          hairHex={player.hair.hex}
          gender={player.archetype.gender}
          archetypeId={player.archetype.id}
          appearance={player.appearance}
          size={64}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium truncate">{player.nick}</p>
            <span className="text-xs ember flex items-center gap-1"><Star size={11} /> {player.level}</span>
          </div>
          <p className="text-xs text-[#8a7a6d] truncate">{player.archetype.name} · {player.archetype.role}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9a887a] flex items-center gap-1"><Heart size={12} className="ember" /> Vida</span>
          <strong className="text-[#d9cbb8]">{player.hp} / {player.maxHp}</strong>
        </div>
        <div className="w-full h-2 bg-[#0e0b0a] rounded-full overflow-hidden">
          <div className={`h-full transition-all ${hpClass(hpPct)}`} style={{ width: `${hpPct}%` }} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => onChangeHp(-1)} disabled={player.hp <= 0} className="w-8 h-8 flex items-center justify-center rounded border border-[#3a2a24] text-[#b8492f] disabled:opacity-30" aria-label={`Diminuir HP de ${player.nick}`}><Minus size={13} /></button>
          <button type="button" onClick={() => onChangeHp(1)} disabled={player.hp >= player.maxHp} className="w-8 h-8 flex items-center justify-center rounded border border-[#3a2a24] text-[#6a8a4a] disabled:opacity-30" aria-label={`Aumentar HP de ${player.nick}`}><Plus size={13} /></button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[#8a7a6d] mb-2">Atributos</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(player.archetype.attrs).map(([key, value]) => (
            <div key={key} className="bg-[#0e0b0a] rounded px-2.5 py-2 flex items-center justify-between">
              <span className="text-xs text-[#9a887a]">{attrLabels[key] || key}</span>
              <strong className="text-sm">{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[#8a7a6d] mb-2">Habilidades</p>
        <div className="space-y-1.5">
          {player.skills.map((skill) => (
            <div key={skill.name} className="bg-[#0e0b0a] rounded px-2.5 py-2">
              <div className="flex items-center justify-between gap-2"><span className="text-xs text-[#e8ddd0]">{skill.name}</span><span className="text-[10px] ember">Nv. {skill.level}</span></div>
              <p className="text-[11px] text-[#77685e] mt-0.5 leading-snug">{skill.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[#8a7a6d] flex items-center gap-1"><Backpack size={12} /> Inventário</p>
        {player.inventory.length === 0 && <p className="text-xs text-[#5a4d43] italic">Nenhum item ainda.</p>}
        <div className="space-y-1">
          {player.inventory.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center justify-between gap-2 bg-[#0e0b0a] rounded px-2.5 py-1.5">
              <span className="text-xs text-[#d9cbb8] break-words min-w-0">{item}</span>
              <button type="button" onClick={() => onRemoveItem(index)} className="text-[#5a4d43] hover:text-[#b8492f] flex-shrink-0" aria-label={`Remover ${item}`}><X size={13} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(); } }} maxLength={80} placeholder="Adicionar item" className="flex-1 min-w-0 bg-[#0e0b0a] border border-[#3a2a24] rounded px-2.5 py-2 text-xs placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f]" />
          <button type="button" onClick={addItem} disabled={!newItem.trim() || player.inventory.length >= 20} className="px-3 rounded bg-[#2a1f1a] hover:bg-[#3a2a24] disabled:opacity-30" aria-label="Adicionar item"><Plus size={14} /></button>
        </div>
        {player.inventory.length >= 20 && <p className="text-[10px] text-[#8a6d62]">Inventário cheio, limite de 20 itens.</p>}
      </div>
    </section>
  );
}
