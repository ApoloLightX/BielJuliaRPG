function HairBackLayer({ style, hairHex }) {
  if (style === "long") return <path d="M78 126 Q65 55 120 48 Q176 56 164 132 L178 234 Q151 218 149 150 Q140 90 120 86 Q99 90 91 150 Q89 218 62 236Z" fill={hairHex} opacity="0.98" />;
  if (style === "ponytail") return <><path d="M80 121 Q70 58 120 49 Q169 58 160 122 Q148 89 120 84 Q92 89 80 121Z" fill={hairHex} /><path d="M156 74 Q203 79 200 137 Q196 197 159 237 Q172 174 156 116Z" fill={hairHex} opacity="0.96" /></>;
  if (style === "braid") return <><path d="M80 121 Q70 58 120 49 Q169 58 160 122 Q148 89 120 84 Q92 89 80 121Z" fill={hairHex} /><path d="M160 104 C190 123 160 144 184 164 C207 185 169 207 186 243" stroke={hairHex} strokeWidth="14" fill="none" strokeLinecap="round" /></>;
  return null;
}

function HairFrontLayer({ style, hairHex }) {
  if (style === "shaved") return <path d="M84 85 Q91 53 120 52 Q150 53 157 84 Q142 69 121 68 Q100 69 84 85Z" fill={hairHex} opacity="0.9" />;
  if (style === "long") return <><path d="M82 93 Q83 56 120 51 Q158 56 159 95 Q148 73 123 68 Q99 72 82 93Z" fill={hairHex} /><path d="M84 84 Q94 73 106 69 Q97 93 91 120" fill={hairHex} /><path d="M157 84 Q147 73 134 69 Q143 93 149 119" fill={hairHex} /></>;
  if (style === "ponytail" || style === "braid") return <path d="M83 91 Q82 57 120 51 Q158 57 158 92 Q145 72 120 69 Q96 72 83 91Z" fill={hairHex} />;
  return <><path d="M84 91 Q84 57 120 51 Q157 57 157 91 Q144 72 121 68 Q99 72 84 91Z" fill={hairHex} /><path d="M91 72 Q111 59 141 70" stroke="#fff" strokeOpacity="0.08" strokeWidth="5" fill="none" strokeLinecap="round" /></>;
}

function FaceMarkLayer({ mark, accent }) {
  if (mark === "scar") return <g stroke="#9f493e" strokeWidth="2.3" strokeLinecap="round" opacity="0.9"><path d="M101 103 L112 128" /><path d="M106 101 L116 124" /></g>;
  if (mark === "warpaint") return <g stroke={accent} strokeWidth="4.2" strokeLinecap="round" opacity="0.82"><path d="M90 113 Q100 108 109 112" /><path d="M131 112 Q141 108 150 113" /></g>;
  if (mark === "rune") return <g stroke={accent} strokeWidth="2.2" fill="none" opacity="0.92"><path d="M120 89 L114 99 L120 110 L126 99 Z" /><path d="M120 89 V80" /><path d="M115 99 H125" /></g>;
  return null;
}

export function BackdropLayer({ theme, primary, accent, backgroundId, auraId, frame = true }) {
  const runeThemes = new Set(["arcane", "shadow", "frost", "guardian"]);
  return <>{frame && <rect x="5" y="5" width="230" height="310" rx="28" fill={`url(#${backgroundId})`} stroke="#4c342b" strokeWidth="3" />}<ellipse cx="120" cy="142" rx="91" ry="118" fill={`url(#${auraId})`} opacity="0.94" /><ellipse cx="120" cy="290" rx="72" ry="13" fill="#050403" opacity="0.55" />{runeThemes.has(theme) && <g fill="none" stroke={accent} strokeOpacity="0.28" pointerEvents="none"><circle cx="120" cy="145" r="78" strokeWidth="1.2" /><circle cx="120" cy="145" r="66" strokeWidth="0.8" strokeDasharray="3 8" /><path d="M120 63 V72 M120 218 V227 M38 145 H48 M192 145 H202" strokeWidth="1.4" /></g>}{theme === "hunter" && <g stroke={accent} strokeOpacity="0.18" fill="none" pointerEvents="none"><path d="M48 248 Q70 223 68 194 M192 248 Q170 223 172 194" /><path d="M56 232 l-8 -8 M184 232 l8 -8" /></g>}<path d="M35 276 Q120 252 205 276" stroke={primary} strokeOpacity="0.24" strokeWidth="2" fill="none" /></>;
}

export function BodyLayer({ skinHex }) {
  return <g><path d="M101 137 L139 137 L142 163 Q120 178 98 163Z" fill={skinHex} /><path d="M87 167 Q120 151 153 167 L162 250 Q120 268 78 250Z" fill={skinHex} opacity="0.4" /><ellipse cx="120" cy="106" rx="38" ry="47" fill={skinHex} stroke="#67483c" strokeWidth="1.4" /><ellipse cx="82" cy="110" rx="5" ry="10" fill={skinHex} opacity="0.92" /><ellipse cx="158" cy="110" rx="5" ry="10" fill={skinHex} opacity="0.92" /></g>;
}

export function OutfitLayer({ theme, style, primary, secondary, leather }) {
  const light = style === "light";
  const heavy = style === "heavy";
  if (["arcane", "shadow", "frost"].includes(theme)) return <g><path d="M83 164 Q120 146 157 164 L176 284 Q120 308 64 284Z" fill={primary} stroke={secondary} strokeWidth="3" /><path d="M98 158 L120 190 L142 158 L156 279 L84 279Z" fill={secondary} opacity="0.34" /><path d="M81 170 Q58 197 53 247" stroke={primary} strokeWidth={heavy ? 24 : 17} strokeLinecap="round" /><path d="M159 170 Q182 197 187 247" stroke={primary} strokeWidth={heavy ? 24 : 17} strokeLinecap="round" />{!light && <path d="M86 166 Q120 150 154 166" stroke={secondary} strokeOpacity="0.45" strokeWidth="8" strokeLinecap="round" />}</g>;
  if (["hunter", "rogue"].includes(theme)) return <g><path d="M82 165 Q120 150 158 165 L166 280 Q120 299 74 280Z" fill={primary} stroke={leather} strokeWidth="3" /><path d="M89 171 L153 265 M151 171 L87 265" stroke={secondary} strokeWidth={light ? 5 : 8} opacity="0.68" /><path d="M78 174 L57 244" stroke={primary} strokeWidth={heavy ? 22 : 15} strokeLinecap="round" /><path d="M162 174 L183 244" stroke={primary} strokeWidth={heavy ? 22 : 15} strokeLinecap="round" /></g>;
  return <g><path d="M80 164 Q120 146 160 164 L170 282 Q120 302 70 282Z" fill={primary} stroke={leather} strokeWidth="3" /><path d="M93 169 L120 191 L147 169 L143 272 Q120 286 97 272Z" fill={secondary} opacity="0.36" /><path d="M78 174 L54 247" stroke={primary} strokeWidth={heavy ? 23 : light ? 13 : 18} strokeLinecap="round" /><path d="M162 174 L186 247" stroke={primary} strokeWidth={heavy ? 23 : light ? 13 : 18} strokeLinecap="round" /></g>;
}

export function ArmorLayer({ theme, style, metal, accent, secondary }) {
  if (style === "light") return <path d="M96 168 Q120 158 144 168" stroke={metal} strokeWidth="5" strokeLinecap="round" opacity="0.58" />;
  if (theme === "arcane") return <g><path d="M91 168 Q120 151 149 168 L144 210 Q120 222 96 210Z" fill={metal} opacity="0.36" stroke={accent} strokeWidth="2" /><circle cx="120" cy="187" r="8" fill={accent} opacity="0.75" /></g>;
  if (theme === "shadow") return <g><path d="M91 168 Q120 151 149 168 L146 222 Q120 234 94 222Z" fill="#171018" stroke={accent} strokeWidth="2.2" /><path d="M101 176 L120 202 L139 176" stroke={secondary} strokeWidth="4" fill="none" opacity="0.66" /></g>;
  if (theme === "frost") return <g><path d="M91 168 Q120 151 149 168 L145 219 Q120 230 95 219Z" fill={metal} opacity="0.5" stroke={accent} strokeWidth="2.4" /><path d="M99 173 L120 203 L141 173" stroke="#d7f3ff" strokeOpacity="0.52" strokeWidth="3" fill="none" /></g>;
  if (theme === "guardian") return <g><path d="M88 164 Q120 146 152 164 L153 230 Q120 247 87 230Z" fill={metal} stroke={accent} strokeWidth="3.2" /><path d="M105 170 L120 185 L135 170 L132 218 L108 218Z" fill={secondary} opacity="0.44" /><circle cx="83" cy="175" r={style === "heavy" ? 21 : 16} fill={metal} stroke={accent} strokeWidth="3" /><circle cx="157" cy="175" r={style === "heavy" ? 21 : 16} fill={metal} stroke={accent} strokeWidth="3" /></g>;
  if (theme === "hunter" || theme === "rogue") return <g><path d="M92 168 Q120 156 148 168 L143 215 Q120 225 97 215Z" fill={metal} opacity="0.42" stroke={secondary} strokeWidth="2" /><path d="M94 177 L146 209 M146 177 L95 209" stroke={accent} strokeWidth="3" opacity="0.3" /></g>;
  return <g><path d="M89 165 Q120 147 151 165 L149 229 Q120 244 91 229Z" fill={metal} stroke={accent} strokeWidth="2.8" /><path d="M104 173 L120 190 L136 173 L133 219 L107 219Z" fill={secondary} opacity="0.42" />{style === "heavy" && <><circle cx="84" cy="176" r="19" fill={metal} stroke={accent} strokeWidth="3" /><circle cx="156" cy="176" r="19" fill={metal} stroke={accent} strokeWidth="3" /></>}</g>;
}

export function FaceLayer({ hairHex, mark, accent }) {
  return <g><path d="M92 98 Q101 91 111 97" stroke={hairHex} strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M129 97 Q139 91 148 98" stroke={hairHex} strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cx="103" cy="108" rx="7.1" ry="5.3" fill="#f3ede7" /><ellipse cx="137" cy="108" rx="7.1" ry="5.3" fill="#f3ede7" /><circle cx="103" cy="108" r="3.5" fill="#201814" /><circle cx="137" cy="108" r="3.5" fill="#201814" /><circle cx="101.8" cy="106.8" r="1" fill="#fff" opacity="0.85" /><circle cx="135.8" cy="106.8" r="1" fill="#fff" opacity="0.85" /><path d="M120 109 L115 122 Q120 126 126 122" stroke="#855b4e" strokeWidth="1.6" fill="none" strokeLinecap="round" /><path d="M105 137 Q120 145 135 137" stroke="#92554c" strokeWidth="2.5" fill="none" strokeLinecap="round" /><FaceMarkLayer mark={mark} accent={accent} /></g>;
}

function Blade({ x1, y1, x2, y2, metal, accent, width = 7 }) {
  return <g><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#15100e" strokeWidth={width + 4} strokeLinecap="round" /><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={metal} strokeWidth={width} strokeLinecap="round" /><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.72" /></g>;
}

export function WeaponLayer({ phase, type, metal, accent, leather }) {
  if (phase === "back") {
    if (type === "greatsword") return <Blade x1={176} y1={277} x2={145} y2={62} metal={metal} accent={accent} width={10} />;
    if (type === "sword") return <Blade x1={174} y1={275} x2={151} y2={93} metal={metal} accent={accent} width={7} />;
    if (type === "dual" || type === "dual-daggers") return <><Blade x1={52} y1={268} x2={92} y2={178} metal={metal} accent={accent} width={type === "dual" ? 7 : 5} /><Blade x1={188} y1={268} x2={149} y2={178} metal={metal} accent={accent} width={type === "dual" ? 7 : 5} /></>;
    if (type === "bow") return <g fill="none"><path d="M183 78 Q222 164 183 275" stroke={leather} strokeWidth="7" /><path d="M183 78 L183 275" stroke={metal} strokeWidth="1.5" opacity="0.82" /></g>;
    if (type === "staff" || type === "totem") return <g><path d="M184 54 L180 286" stroke={leather} strokeWidth="7" strokeLinecap="round" /><circle cx="184" cy="55" r={type === "totem" ? 14 : 11} fill={accent} opacity="0.76" /><circle cx="184" cy="55" r="22" fill="none" stroke={accent} strokeOpacity="0.42" strokeWidth="2" /></g>;
    if (type === "spear") return <g><path d="M188 50 L165 292" stroke={leather} strokeWidth="7" /><path d="M188 42 L199 66 L180 61Z" fill={metal} stroke={accent} strokeWidth="2" /></g>;
    if (type === "hammer") return <g><path d="M180 114 L164 292" stroke={leather} strokeWidth="9" /><rect x="158" y="83" width="55" height="36" rx="7" fill={metal} stroke={accent} strokeWidth="3" /></g>;
    if (type === "crossbow") return <g transform="rotate(-10 185 205)"><path d="M169 164 L201 256" stroke={leather} strokeWidth="7" /><path d="M151 180 Q185 150 215 184" stroke={metal} strokeWidth="6" fill="none" /><path d="M153 181 L214 184" stroke={accent} strokeWidth="1.6" /></g>;
    return null;
  }
  if (type === "dagger") return <g><Blade x1={165} y1={257} x2={148} y2={196} metal={metal} accent={accent} width={5} /><path d="M145 199 L157 195" stroke={leather} strokeWidth="5" /></g>;
  if (type === "gauntlets") return <g><path d="M65 224 Q81 212 94 228 L90 266 Q72 278 58 260Z" fill={metal} stroke={accent} strokeWidth="3" /><path d="M175 224 Q159 212 146 228 L150 266 Q168 278 182 260Z" fill={metal} stroke={accent} strokeWidth="3" /></g>;
  if (type === "orb") return <g><circle cx="183" cy="232" r="22" fill={accent} opacity="0.5" /><circle cx="183" cy="232" r="13" fill="#f3ede7" opacity="0.3" /><circle cx="183" cy="232" r="31" fill="none" stroke={accent} strokeWidth="2.4" opacity="0.42" /></g>;
  if (type === "shield" || type === "tower-shield") return <g><path d={type === "tower-shield" ? "M151 164 L211 174 L207 286 Q180 307 153 284Z" : "M154 176 Q183 156 210 181 L205 271 Q183 292 158 270Z"} fill={metal} stroke={accent} strokeWidth="4" /><path d="M175 191 L193 191 L198 246 L184 260 L169 246Z" fill={accent} opacity="0.5" />{type === "shield" && <path d="M74 253 L92 201" stroke={leather} strokeWidth="8" strokeLinecap="round" />}</g>;
  return null;
}

export function ClassFxLayer({ theme, accent, phase }) {
  if (phase === "back") {
    if (theme === "frost") return <g fill="none" stroke={accent} strokeLinecap="round" pointerEvents="none"><path d="M48 126 Q120 54 192 126" strokeWidth="2" strokeDasharray="4 8" opacity="0.38" /><path d="M63 88 L71 78 M174 94 L182 82 M56 174 L45 170" opacity="0.55" /></g>;
    if (theme === "shadow") return <g fill="none" stroke={accent} pointerEvents="none"><circle cx="120" cy="104" r="49" strokeOpacity="0.22" strokeWidth="3" /><path d="M77 76 Q57 105 73 140 M164 74 Q184 104 168 143" strokeOpacity="0.28" strokeWidth="4" /></g>;
    if (theme === "arcane") return <g fill="none" stroke={accent} strokeOpacity="0.32" pointerEvents="none"><path d="M58 204 Q43 159 64 121 M182 205 Q198 159 176 120" strokeWidth="3" /><circle cx="120" cy="80" r="35" strokeDasharray="3 7" /></g>;
    return null;
  }
  if (theme === "plate" || theme === "bruiser") return <g fill={accent} pointerEvents="none"><circle cx="74" cy="213" r="3" opacity="0.7" /><circle cx="167" cy="196" r="2.5" opacity="0.55" /><path d="M72 213 l5 -10 l2 12Z" opacity="0.56" /></g>;
  if (theme === "rogue") return <g stroke={accent} strokeOpacity="0.35" fill="none" pointerEvents="none"><path d="M62 246 Q89 230 105 245" /><path d="M173 220 q-9 -8 -17 0 q8 3 14 11" /></g>;
  if (theme === "guardian") return <g stroke={accent} fill="none" pointerEvents="none"><path d="M89 284 Q120 297 151 284" strokeOpacity="0.48" strokeWidth="2.4" /><path d="M120 269 V293 M108 281 H132" strokeOpacity="0.34" /></g>;
  if (theme === "hunter") return <g fill={accent} opacity="0.34" pointerEvents="none"><circle cx="68" cy="240" r="2.5" /><circle cx="177" cy="213" r="2" /></g>;
  return null;
}

export { HairBackLayer, HairFrontLayer };