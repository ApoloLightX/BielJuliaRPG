import { useEffect, useMemo, useState } from "react";
import { Eye, Hand, PackageOpen, Shield, Sparkles, Swords } from "lucide-react";
import { getCurrentCombatant } from "../game/engine.js";

const ACTIONS = [
  { label: "Atacar", icon: Swords, text: (nick) => `${nick} tenta atacar o alvo que considera mais perigoso.` },
  { label: "Defender", icon: Shield, text: (nick) => `${nick} assume uma postura defensiva e protege a si e seus aliados.` },
  { label: "Investigar", icon: Eye, text: (nick) => `${nick} observa o ambiente e procura pistas, riscos ou detalhes fora do lugar.` },
  { label: "Interagir", icon: Hand, text: (nick) => `${nick} tenta interagir com o elemento ou personagem em destaque na cena.` },
];

export default function QuickActions({ players, combat, disabled, onPrefill, onSend }) {
  const livingPlayers = useMemo(() => players.filter((player) => player && player.hp > 0), [players]);
  const currentCombatant = getCurrentCombatant(combat, players);
  const lockedNick = currentCombatant?.type === "player" ? currentCombatant.name : null;
  const [selectedNick, setSelectedNick] = useState(lockedNick || livingPlayers[0]?.nick || "");

  useEffect(() => {
    if (lockedNick) setSelectedNick(lockedNick);
    else if (!livingPlayers.some((player) => player.nick === selectedNick)) {
      setSelectedNick(livingPlayers[0]?.nick || "");
    }
  }, [livingPlayers, lockedNick, selectedNick]);

  if (!livingPlayers.length) return null;

  if (currentCombatant?.type === "enemy") {
    return (
      <div className="border-t border-[#2a1f1a] bg-[#15100e] px-4 py-2.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSend(`Mestre, resolva apenas o turno de ${currentCombatant.name} conforme o estado atual do combate.`)}
          className="w-full rounded border border-[#5b3328] bg-[#231713] px-3 py-2 text-xs text-[#d9cbb8] hover:border-[#b8492f] disabled:opacity-40"
        >
          Resolver turno de {currentCombatant.name}
        </button>
      </div>
    );
  }

  const selected = livingPlayers.find((player) => player.nick === selectedNick) || livingPlayers[0];

  return (
    <div className="border-t border-[#2a1f1a] bg-[#15100e] px-4 py-2.5 space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {!lockedNick && livingPlayers.length > 1 && (
          <select
            value={selected.nick}
            onChange={(event) => setSelectedNick(event.target.value)}
            className="bg-[#0e0b0a] border border-[#3a2a24] rounded px-2 py-1.5 text-xs text-[#d9cbb8]"
            aria-label="Personagem das ações rápidas"
          >
            {livingPlayers.map((player) => <option key={player.nick} value={player.nick}>{player.nick}</option>)}
          </select>
        )}
        {ACTIONS.map(({ label, icon: Icon, text }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onPrefill(text(selected.nick))}
            className="flex-shrink-0 flex items-center gap-1.5 rounded border border-[#3a2a24] bg-[#1a1310] px-2.5 py-1.5 text-[11px] text-[#b8a99d] hover:text-[#e8ddd0] hover:border-[#6a4637] disabled:opacity-40"
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {selected.skills.map((skill) => (
          <button
            key={skill.name}
            type="button"
            disabled={disabled}
            onClick={() => onPrefill(`${selected.nick} usa ${skill.name}: ${skill.desc}`)}
            className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#9f8bc0] bg-[#17121d] border border-[#2e2638] hover:border-[#7050a0] disabled:opacity-40"
            title={skill.desc}
          >
            <Sparkles size={10} /> {skill.name}
          </button>
        ))}
        {selected.inventory.map((item) => (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => onPrefill(`${selected.nick} tenta usar ${item}.`)}
            className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[10px] text-[#aa988a] bg-[#18130f] border border-[#30251e] hover:border-[#70513d] disabled:opacity-40"
          >
            <PackageOpen size={10} /> {item}
          </button>
        ))}
      </div>
    </div>
  );
}
