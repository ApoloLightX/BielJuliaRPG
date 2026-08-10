import { MAP_REGIONS } from "../data/mapRegions.js";
import { MapPin, Lock } from "lucide-react";

function CampaignMap({ revealedIds, currentId }) {
  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border border-[#3a2a24]">
        <svg viewBox="0 0 100 125" className="w-full h-full">
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#1a1310" />
              <stop offset="100%" stopColor="#0a0807" />
            </radialGradient>
            <filter id="roughPaper">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            </filter>
          </defs>

          <rect width="100" height="125" fill="url(#bgGrad)" />

          {/* contorno irregular da cidadela */}
          <path
            d="M 15 95 Q 10 60 25 35 Q 35 15 50 8 Q 65 15 75 35 Q 90 60 85 95 Q 70 115 50 118 Q 30 115 15 95 Z"
            fill="none"
            stroke="#3a2a24"
            strokeWidth="0.6"
            filter="url(#roughPaper)"
            opacity="0.7"
          />

          {/* caminhos conectando regiões, em ordem de progressão */}
          {MAP_REGIONS.slice(0, -1).map((r, i) => {
            const next = MAP_REGIONS[i + 1];
            const bothVisible = revealedIds.includes(r.id);
            return (
              <line
                key={r.id}
                x1={r.x}
                y1={r.y}
                x2={next.x}
                y2={next.y}
                stroke={bothVisible ? "#5a3a2a" : "#241c18"}
                strokeWidth="0.5"
                strokeDasharray="1.5,1.5"
              />
            );
          })}

          {/* névoa cobrindo regiões não reveladas */}
          {MAP_REGIONS.map((r) => {
            const revealed = revealedIds.includes(r.id);
            if (revealed) return null;
            return (
              <circle key={`fog-${r.id}`} cx={r.x} cy={r.y} r="9" fill="#0e0b0a" opacity="0.85" />
            );
          })}
        </svg>

        {/* pontos de região, sobrepostos como HTML pra facilitar texto/ícone */}
        {MAP_REGIONS.map((r) => {
          const revealed = revealedIds.includes(r.id);
          const isCurrent = r.id === currentId;
          return (
            <div
              key={r.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${r.x}%`, top: `${(r.y / 125) * 100}%` }}
            >
              {revealed ? (
                <MapPin
                  size={isCurrent ? 20 : 14}
                  className={isCurrent ? "text-[#e8ddd0] animate-pulse" : "ember"}
                  fill={isCurrent ? "#b8492f" : "none"}
                />
              ) : (
                <Lock size={11} className="text-[#3a2a24]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {MAP_REGIONS.map((r) => {
          const revealed = revealedIds.includes(r.id);
          const isCurrent = r.id === currentId;
          return (
            <div
              key={r.id}
              className={`flex items-center gap-2 rounded px-3 py-2 border ${
                isCurrent
                  ? "border-[#b8492f] bg-[#1a1310]"
                  : revealed
                  ? "border-[#2a1f1a] bg-[#120e0c]"
                  : "border-[#1a1310] bg-[#0e0b0a] opacity-50"
              }`}
            >
              {revealed ? (
                <MapPin size={13} className={isCurrent ? "text-[#e8ddd0]" : "ember"} />
              ) : (
                <Lock size={12} className="text-[#3a2a24]" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#e8ddd0] truncate">
                  {revealed ? r.name : "Região não descoberta"}
                </p>
                {revealed && <p className="text-[10px] text-[#8a7a6d] truncate">{r.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CampaignMap;
