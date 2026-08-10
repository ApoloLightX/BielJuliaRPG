import { useState } from "react";
import { Sparkles, TrendingUp, Lock } from "lucide-react";

function LevelUpModal({ player, onChoose }) {
  const [mode, setMode] = useState(null); // "improve" | "unlock" | null

  const hasLocked = player.archetype.lockedSkills?.length > 0;

  function chooseImprove(skillName) {
    onChoose({ type: "improve", skillName });
  }

  function chooseUnlock(skill) {
    onChoose({ type: "unlock", skill });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#120e0c] border border-[#3a2a24] rounded-lg max-w-sm w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <Sparkles size={24} className="ember mx-auto" />
          <h3 className="font-display text-lg text-[#e8ddd0]">{player.nick} subiu de nível</h3>
          <p className="text-xs text-[#8a7a6d]">Escolha como evoluir</p>
        </div>

        {!mode && (
          <div className="space-y-2">
            <button
              onClick={() => setMode("improve")}
              className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left flex items-center gap-3 transition-colors"
            >
              <TrendingUp size={18} className="ember flex-shrink-0" />
              <div>
                <p className="text-sm text-[#e8ddd0] font-medium">Melhorar habilidade</p>
                <p className="text-xs text-[#8a7a6d]">Fortalece uma habilidade que já domina</p>
              </div>
            </button>
            {hasLocked && (
              <button
                onClick={() => setMode("unlock")}
                className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left flex items-center gap-3 transition-colors"
              >
                <Lock size={18} className="ember flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#e8ddd0] font-medium">Destravar nova habilidade</p>
                  <p className="text-xs text-[#8a7a6d]">Aprende algo novo do seu arquétipo</p>
                </div>
              </button>
            )}
          </div>
        )}

        {mode === "improve" && (
          <div className="space-y-2">
            {player.skills.map((s) => (
              <button
                key={s.name}
                onClick={() => chooseImprove(s.name)}
                className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left transition-colors"
              >
                <p className="text-sm text-[#e8ddd0] font-medium">
                  {s.name} {s.level > 1 && <span className="ember text-xs">Nv.{s.level}</span>}
                </p>
                <p className="text-xs text-[#8a7a6d] mt-0.5">{s.desc}</p>
              </button>
            ))}
            <button onClick={() => setMode(null)} className="text-xs text-[#8a7a6d] underline">
              Voltar
            </button>
          </div>
        )}

        {mode === "unlock" && (
          <div className="space-y-2">
            {player.archetype.lockedSkills.map((s) => (
              <button
                key={s.name}
                onClick={() => chooseUnlock(s)}
                className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left transition-colors"
              >
                <p className="text-sm text-[#e8ddd0] font-medium">{s.name}</p>
                <p className="text-xs text-[#8a7a6d] mt-0.5">{s.desc}</p>
              </button>
            ))}
            <button onClick={() => setMode(null)} className="text-xs text-[#8a7a6d] underline">
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LevelUpModal;
