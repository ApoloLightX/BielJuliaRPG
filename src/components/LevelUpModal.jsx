import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingUp, Lock } from "lucide-react";

function LevelUpModal({ player, onChoose }) {
  const [mode, setMode] = useState(null);
  const dialogRef = useRef(null);
  const hasLocked = player.archetype.lockedSkills?.length > 0;
  const titleId = `level-up-title-${player.nick.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    const firstButton = dialogRef.current?.querySelector("button");
    firstButton?.focus();
  }, [mode]);

  function chooseImprove(skillName) {
    onChoose({ type: "improve", skillName });
  }

  function chooseUnlock(skill) {
    onChoose({ type: "unlock", skill });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[#120e0c] border border-[#3a2a24] rounded-lg max-w-sm w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="text-center space-y-1">
          <Sparkles size={24} className="ember mx-auto" aria-hidden="true" />
          <h3 id={titleId} className="font-display text-lg text-[#e8ddd0]">{player.nick} subiu de nível</h3>
          <p className="text-xs text-[#8a7a6d]">Escolha como evoluir</p>
        </div>

        {!mode && (
          <div className="space-y-2">
            <button type="button" onClick={() => setMode("improve")} className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left flex items-center gap-3 transition-colors">
              <TrendingUp size={18} className="ember flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm text-[#e8ddd0] font-medium">Melhorar habilidade</p>
                <p className="text-xs text-[#8a7a6d]">Fortalece uma habilidade que já domina</p>
              </div>
            </button>
            {hasLocked && (
              <button type="button" onClick={() => setMode("unlock")} className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left flex items-center gap-3 transition-colors">
                <Lock size={18} className="ember flex-shrink-0" aria-hidden="true" />
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
            {player.skills.map((skill) => (
              <button type="button" key={skill.name} onClick={() => chooseImprove(skill.name)} className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left transition-colors">
                <p className="text-sm text-[#e8ddd0] font-medium">
                  {skill.name} {skill.level > 1 && <span className="ember text-xs">Nv.{skill.level}</span>}
                </p>
                <p className="text-xs text-[#8a7a6d] mt-0.5">{skill.desc}</p>
              </button>
            ))}
            <button type="button" onClick={() => setMode(null)} className="text-xs text-[#8a7a6d] underline">Voltar</button>
          </div>
        )}

        {mode === "unlock" && (
          <div className="space-y-2">
            {player.archetype.lockedSkills.map((skill) => (
              <button type="button" key={skill.name} onClick={() => chooseUnlock(skill)} className="w-full bg-[#1a1310] border border-[#2a1f1a] hover:border-[#b8492f] rounded p-3 text-left transition-colors">
                <p className="text-sm text-[#e8ddd0] font-medium">{skill.name}</p>
                <p className="text-xs text-[#8a7a6d] mt-0.5">{skill.desc}</p>
              </button>
            ))}
            <button type="button" onClick={() => setMode(null)} className="text-xs text-[#8a7a6d] underline">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LevelUpModal;
