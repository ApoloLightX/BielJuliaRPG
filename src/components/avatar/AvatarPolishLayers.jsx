const ROBE_THEMES = new Set(["arcane", "shadow", "frost"]);
const ARMORED_THEMES = new Set(["plate", "bruiser", "guardian"]);

export function FacePolishLayer({ skinHex, hairHex, mark, accent }) {
  return (
    <g pointerEvents="none">
      <ellipse cx="120" cy="106" rx="31" ry="40" fill={skinHex} />
      <path d="M94 108 Q95 82 104 72 Q120 61 136 72 Q145 82 146 108" fill="none" stroke="#6f4434" strokeOpacity=".18" strokeWidth="1.5" />
      <path d="M98 91 Q105 86 112 90 M128 90 Q135 86 142 91" fill="none" stroke={hairHex} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M99 100 Q105 96 111 100 M129 100 Q135 96 141 100" fill="#f4eee8" stroke="#5a3b31" strokeWidth="1" />
      <ellipse cx="106" cy="99" rx="2.6" ry="3.1" fill="#34231f" />
      <ellipse cx="134" cy="99" rx="2.6" ry="3.1" fill="#34231f" />
      <circle cx="105.2" cy="98.2" r=".7" fill="#fff" /><circle cx="133.2" cy="98.2" r=".7" fill="#fff" />
      <path d="M120 101 Q117 111 115 117 Q120 121 126 117" fill="none" stroke="#775044" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M109 127 Q120 133 131 127" fill="none" stroke="#8e5150" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M111 130 Q120 132 129 130" fill="none" stroke="#fff" strokeOpacity=".1" />
      <path d="M97 116 Q102 119 107 118 M133 118 Q138 119 143 116" fill="none" stroke="#a16f5e" strokeOpacity=".18" strokeWidth="1.8" />
      {mark === "scar" && <g stroke="#7d403e" strokeWidth="2" strokeLinecap="round"><path d="M101 87 L111 112" /><path d="M104 95 L99 100 M108 104 L103 109" /></g>}
      {mark === "warpaint" && <g fill={accent} opacity=".72"><path d="M96 106 L111 110 L109 114 L95 112Z" /><path d="M144 106 L129 110 L131 114 L145 112Z" /></g>}
      {mark === "rune" && <path d="M120 78 L125 88 L120 99 L115 88Z M120 80 V97" fill="none" stroke={accent} strokeWidth="2.1" />}
    </g>
  );
}

export function HairPolishLayer({ style, hairHex }) {
  if (style === "shaved") return <path d="M93 76 Q120 58 147 76" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="2" />;
  return (
    <g fill="none" stroke="#fff" strokeLinecap="round" pointerEvents="none">
      <path d={style === "short" ? "M91 80 Q101 57 120 55 Q140 57 151 78" : "M91 79 Q105 56 124 55 Q142 57 153 80"} strokeOpacity=".13" strokeWidth="2.2" />
      <path d="M101 69 Q112 62 124 64" strokeOpacity=".08" strokeWidth="1.5" />
      {style === "long" && <path d="M88 103 Q84 139 91 170 M152 103 Q158 139 151 172" strokeOpacity=".08" strokeWidth="1.8" />}
      {style === "ponytail" && <path d="M158 93 Q168 120 162 153 Q164 172 156 187" strokeOpacity=".11" strokeWidth="1.8" />}
      {style === "braid" && <path d="M157 104 Q168 126 158 145 Q168 163 158 184" strokeOpacity=".12" strokeWidth="1.5" />}
      <path d="M92 78 Q120 58 148 78" stroke={hairHex} strokeOpacity=".08" strokeWidth="5" />
    </g>
  );
}

export function OutfitPolishLayer({ theme, style, primary, secondary, metal, accent }) {
  const robe = ROBE_THEMES.has(theme);
  const armored = ARMORED_THEMES.has(theme) || style === "heavy";
  return (
    <g pointerEvents="none">
      <path d="M97 172 Q120 160 143 172" fill="none" stroke="#fff" strokeOpacity=".11" strokeWidth="2" />
      <path d="M94 219 Q120 228 146 219" fill="none" stroke="#070504" strokeOpacity=".35" strokeWidth="2" />
      <path d="M99 226 Q120 234 141 226" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="1.5" />
      {robe ? <><path d="M108 165 L120 183 L132 165" fill="none" stroke={secondary} strokeOpacity=".55" strokeWidth="2.5" /><path d="M120 185 V275" stroke={secondary} strokeOpacity=".2" strokeWidth="1.5" /><path d="M89 273 Q120 283 151 273" fill="none" stroke={accent} strokeOpacity=".35" strokeWidth="2" /></> : <><path d="M103 167 L120 183 L137 167" fill="none" stroke={secondary} strokeOpacity=".6" strokeWidth="2.5" /><path d="M91 238 Q120 248 149 238" fill="none" stroke="#1b1210" strokeOpacity=".5" strokeWidth="3" /></>}
      {armored && <><path d="M101 178 Q120 166 139 178" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2" /><path d="M103 185 L120 197 L137 185" fill="none" stroke={metal} strokeOpacity=".5" strokeWidth="2" /><circle cx="120" cy="207" r="3" fill={accent} opacity=".55" /><path d="M80 169 Q84 163 91 166 M149 166 Q156 163 160 169" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="2" /></>}
      {style === "light" && <path d="M84 232 Q120 242 156 232" fill="none" stroke={primary} strokeOpacity=".35" strokeWidth="2" />}
    </g>
  );
}

export function GripPolishLayer({ type, leather, metal, accent }) {
  if (type === "orb") return <g pointerEvents="none"><path d="M153 224 Q166 217 178 223" fill="none" stroke={leather} strokeWidth="7" strokeLinecap="round" /><circle cx="171" cy="198" r="16" fill={accent} opacity=".1" /></g>;
  if (type === "gauntlets") return <g fill={metal} stroke={accent} strokeWidth="2" pointerEvents="none"><path d="M57 220 Q68 211 80 219 L82 238 Q69 246 58 238Z" /><path d="M183 220 Q172 211 160 219 L158 238 Q171 246 182 238Z" /></g>;
  if (type === "shield" || type === "tower-shield") return <circle cx="151" cy="219" r="7" fill={leather} stroke="#15100e" strokeWidth="2" pointerEvents="none" />;
  if (["staff", "spear", "hammer", "greatsword", "sword", "dual", "dual-daggers", "bow", "dagger", "crossbow", "totem"].includes(type)) return <g pointerEvents="none"><circle cx="160" cy="219" r="7" fill={leather} stroke="#15100e" strokeWidth="2" /><path d="M156 217 Q160 213 164 217" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="1.3" /></g>;
  return null;
}
