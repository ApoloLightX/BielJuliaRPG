import { ChevronRight, Swords, Skull as SkullIcon } from "lucide-react";

function hpClass(pct) {
  if (pct > 50) return "bg-[#6a8a4a]";
  if (pct > 20) return "bg-[#c98a2a]";
  return "bg-[#b8492f]";
}

export default function CombatTracker({ combat, players, onAdvanceTurn, disabled = false }) {
  if (!combat || !Array.isArray(combat.order) || combat.order.length === 0) return null;
  const current = combat.order[combat.currentTurnIndex] || combat.order[0];

  return (
    <section className="bg-[#1a1310] border border-[#7a2419] rounded p-3 space-y-2.5" aria-label="Combate em andamento">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Swords size={15} className="ember flex-shrink-0" />
          <div className="min-w-0"><p className="text-xs uppercase tracking-wider ember font-display truncate">Combate: {combat.name || "Confronto"}</p><p className="text-[10px] text-[#77685e]">Rodada {combat.round || 1} · turno de {current.name}</p></div>
        </div>
        {onAdvanceTurn && <button type="button" disabled={disabled} onClick={onAdvanceTurn} className="flex items-center gap-1 rounded border border-[#4b2f25] px-2 py-1.5 text-[10px] text-[#c5b5aa] hover:border-[#b8492f] disabled:opacity-40">Encerrar turno <ChevronRight size={11} /></button>}
      </div>

      <div className="space-y-1.5">
        {combat.order.map((entry, index) => {
          const player = entry.type === "player" ? players.find((candidate) => candidate?.nick === entry.name) : null;
          const hp = entry.type === "player" ? player?.hp : entry.hp;
          const maxHp = entry.type === "player" ? player?.maxHp : entry.maxHp;
          const pct = maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
          const defeated = typeof hp === "number" && hp <= 0;
          const active = index === combat.currentTurnIndex && !defeated;
          return (
            <div key={`${entry.type}-${entry.name}-${index}`} className={`flex items-center gap-2 rounded px-2 py-1.5 border ${active ? "bg-[#241510] border-[#b8492f] shadow-[0_0_0_1px_rgba(184,73,47,0.15)]" : "bg-[#0e0b0a] border-transparent"} ${defeated ? "opacity-40" : ""}`}>
              <span className={`text-[10px] w-5 flex-shrink-0 ${active ? "ember" : "text-[#5a4d43]"}`}>{index + 1}º</span>
              {entry.type === "enemy" && <SkullIcon size={12} className="text-[#8a7a6d] flex-shrink-0" />}
              <div className="min-w-0 flex-1"><p className="text-xs text-[#e8ddd0] truncate">{entry.name}{active ? " · AGORA" : ""}</p>{maxHp != null && <div className="w-full h-1 bg-[#241a16] rounded-full overflow-hidden mt-1"><div className={`h-full transition-all ${hpClass(pct)}`} style={{ width: `${pct}%` }} /></div>}</div>
              {maxHp != null && <span className="text-[10px] text-[#8a7a6d] flex-shrink-0">{hp}/{maxHp}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
