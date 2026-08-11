import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";

const ATTR_LABELS = { forca: "Força", astucia: "Astúcia", vigor: "Vigor", vontade: "Vontade" };

function DiceRoller({ player, onRoll }) {
  const [rolling, setRolling] = useState(false);
  const [attrKey, setAttrKey] = useState(Object.keys(player.archetype.attrs)[0]);
  const [displayValue, setDisplayValue] = useState(null);
  const intervalRef = useRef(null);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  function roll() {
    if (rolling) return;
    setRolling(true);
    setDisplayValue(null);

    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setDisplayValue(1 + Math.floor(Math.random() * 20));
      ticks += 1;
      if (ticks > 10) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        const finalRoll = 1 + Math.floor(Math.random() * 20);
        const modifier = player.archetype.attrs[attrKey];
        const total = finalRoll + modifier;
        setDisplayValue(finalRoll);
        setRolling(false);
        onRoll({
          nick: player.nick,
          attr: ATTR_LABELS[attrKey],
          roll: finalRoll,
          modifier,
          total,
        });
      }
    }, 80);
  }

  return (
    <div className="bg-[#1a1310] border border-[#2a1f1a] rounded p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-[#8a7a6d]" htmlFor={`dice-attr-${player.nick}`}>
          {player.nick} rola com
        </label>
        <select
          id={`dice-attr-${player.nick}`}
          value={attrKey}
          onChange={(event) => setAttrKey(event.target.value)}
          disabled={rolling}
          className="bg-[#0e0b0a] border border-[#3a2a24] rounded px-2 py-1 text-xs text-[#e8ddd0] focus:outline-none"
        >
          {Object.entries(player.archetype.attrs).map(([key, value]) => (
            <option key={key} value={key}>
              {ATTR_LABELS[key]} (+{value})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div
          aria-live="polite"
          className={`w-14 h-14 flex-shrink-0 rounded-lg border-2 flex items-center justify-center font-display text-xl ${
            rolling ? "border-[#8a7a6d] text-[#8a7a6d]" : "border-[#b8492f] text-[#e8ddd0]"
          }`}
        >
          {displayValue ?? "?"}
        </div>
        <button
          type="button"
          onClick={roll}
          disabled={rolling}
          className="flex-1 bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-50 text-[#f0e6da] py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Dices size={16} className={rolling ? "animate-spin" : ""} />
          {rolling ? "Rolando..." : "Rolar d20"}
        </button>
      </div>
    </div>
  );
}

export default DiceRoller;
