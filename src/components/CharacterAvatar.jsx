import { useId } from "react";
import {
  defaultAppearance,
  getClassAvatarConfig,
  getPalette,
  getWeapon,
  normalizeAppearance,
} from "../data/avatarCustomization.js";

function HairLayer({ style, hairHex }) {
  if (style === "shaved") return <path d="M67 58 Q90 40 113 58 Q105 45 90 44 Q74 45 67 58Z" fill={hairHex} opacity="0.92" />;
  if (style === "long") return <path d="M62 83 Q55 38 90 36 Q126 38 119 84 L126 137 Q112 127 112 89 Q103 61 90 59 Q76 61 68 89 Q68 126 55 138Z" fill={hairHex} />;
  if (style === "ponytail") return <><path d="M63 82 Q58 39 90 36 Q122 39 117 82 Q108 62 90 58 Q72 62 63 82Z" fill={hairHex} /><path d="M110 47 Q139 49 139 77 Q135 105 115 122 Q123 88 111 68Z" fill={hairHex} /></>;
  if (style === "braid") return <><path d="M63 82 Q58 39 90 36 Q122 39 117 82 Q108 62 90 58 Q72 62 63 82Z" fill={hairHex} /><path d="M113 65 C131 76 112 88 128 99 C143 110 122 121 133 135" stroke={hairHex} strokeWidth="9" fill="none" strokeLinecap="round" /></>;
  return <path d="M64 75 Q61 41 90 37 Q120 40 117 75 Q108 59 90 57 Q73 59 64 75Z" fill={hairHex} />;
}

function FaceMark({ mark, accent }) {
  if (mark === "scar") return <path d="M76 72 L84 89 M80 71 L88 87" stroke="#8f4037" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />;
  if (mark === "warpaint") return <path d="M69 79 Q77 74 84 78 M96 78 Q104 74 111 79" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8" />;
  if (mark === "rune") return <path d="M90 66 L86 72 L90 78 L94 72 Z M90 66 V60" stroke={accent} strokeWidth="1.7" fill="none" opacity="0.9" />;
  return null;
}

function WeaponLayer({ type, metal, accent }) {
  if (type === "dual" || type === "dual-daggers") return <g opacity="0.96"><path d="M38 164 L73 115" stroke={metal} strokeWidth="5" strokeLinecap="round" /><path d="M34 169 L42 154 L48 162 Z" fill={accent} /><path d="M142 164 L108 115" stroke={metal} strokeWidth="5" strokeLinecap="round" /><path d="M146 169 L138 154 L132 162 Z" fill={accent} /></g>;
  if (type === "sword" || type === "greatsword") return <g><path d="M140 178 L109 75" stroke={metal} strokeWidth={type === "greatsword" ? 8 : 5} strokeLinecap="round" /><path d="M103 91 L119 86" stroke={accent} strokeWidth="4" /><path d="M108 72 L115 88 L102 84 Z" fill={metal} /></g>;
  if (type === "dagger") return <g><path d="M139 164 L116 121" stroke={metal} strokeWidth="5" strokeLinecap="round" /><path d="M112 125 L122 121" stroke={accent} strokeWidth="3" /></g>;
  if (type === "bow") return <g fill="none"><path d="M139 63 Q164 111 139 169" stroke={accent} strokeWidth="5" /><path d="M139 63 L139 169" stroke={metal} strokeWidth="1.5" /></g>;
  if (type === "crossbow") return <g><path d="M126 132 L151 157" stroke={metal} strokeWidth="5" /><path d="M120 137 Q143 124 158 143" stroke={accent} strokeWidth="4" fill="none" /></g>;
  if (type === "staff" || type === "totem") return <g><path d="M142 43 L142 181" stroke={metal} strokeWidth="6" strokeLinecap="round" /><circle cx="142" cy="43" r="10" fill={accent} opacity="0.75" /><circle cx="142" cy="43" r="17" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" /></g>;
  if (type === "spear") return <g><path d="M143 47 L130 182" stroke={metal} strokeWidth="5" /><path d="M143 39 L151 57 L137 53 Z" fill={accent} /></g>;
  if (type === "hammer") return <g><path d="M139 94 L129 180" stroke={metal} strokeWidth="7" /><rect x="121" y="75" width="38" height="25" rx="5" fill={metal} stroke={accent} strokeWidth="3" /></g>;
  if (type === "gauntlets") return <g><rect x="48" y="144" width="26" height="30" rx="9" fill={metal} stroke={accent} strokeWidth="3" /><rect x="106" y="144" width="26" height="30" rx="9" fill={metal} stroke={accent} strokeWidth="3" /></g>;
  if (type === "orb") return <g><circle cx="139" cy="145" r="16" fill={accent} opacity="0.55" /><circle cx="139" cy="145" r="10" fill="#efe8dd" opacity="0.35" /><circle cx="139" cy="145" r="22" fill="none" stroke={accent} strokeWidth="2" opacity="0.45" /></g>;
  if (type === "shield" || type === "tower-shield") return <g><path d={type === "tower-shield" ? "M119 104 L160 111 L156 180 Q139 194 121 179Z" : "M121 112 Q142 98 160 116 L155 170 Q141 185 124 170Z"} fill={metal} stroke={accent} strokeWidth="4" /><path d="M135 121 L148 121 L151 156 L141 166 L132 156Z" fill={accent} opacity="0.55" /></g>;
  return null;
}

function OutfitLayer({ theme, style, primary, secondary, metal }) {
  const heavy = style === "heavy";
  const light = style === "light";
  if (["arcane", "shadow", "frost"].includes(theme)) return <g><path d="M58 117 Q90 98 122 117 L137 198 Q90 218 43 198Z" fill={primary} stroke={secondary} strokeWidth="3" /><path d="M74 110 L90 132 L106 110 L119 196 L61 196Z" fill={secondary} opacity="0.45" /><path d="M54 121 Q41 139 38 169" stroke={primary} strokeWidth={heavy ? 18 : 12} strokeLinecap="round" /><path d="M126 121 Q139 139 142 169" stroke={primary} strokeWidth={heavy ? 18 : 12} strokeLinecap="round" />{!light && <path d="M66 115 Q90 105 114 115" stroke={metal} strokeWidth="8" strokeLinecap="round" opacity="0.8" />}</g>;
  if (["hunter", "rogue"].includes(theme)) return <g><path d="M57 116 Q90 102 123 116 L128 191 Q90 208 52 191Z" fill={primary} stroke={metal} strokeWidth="2.5" /><path d="M63 120 L116 181 M116 120 L64 181" stroke={secondary} strokeWidth={light ? 4 : 7} opacity="0.7" /><path d="M51 125 L34 168" stroke={primary} strokeWidth={heavy ? 17 : 11} strokeLinecap="round" /><path d="M129 125 L146 168" stroke={primary} strokeWidth={heavy ? 17 : 11} strokeLinecap="round" />{heavy && <path d="M52 113 Q90 96 128 113" stroke={metal} strokeWidth="10" strokeLinecap="round" />}</g>;
  return <g><path d="M56 115 Q90 99 124 115 L132 193 Q90 210 48 193Z" fill={primary} stroke={metal} strokeWidth="3" /><path d="M66 119 L90 129 L114 119 L109 180 Q90 192 71 180Z" fill={metal} opacity={light ? 0.35 : 0.78} stroke={secondary} strokeWidth="2" /><path d="M51 122 L33 169" stroke={metal} strokeWidth={heavy ? 20 : light ? 9 : 14} strokeLinecap="round" /><path d="M129 122 L147 169" stroke={metal} strokeWidth={heavy ? 20 : light ? 9 : 14} strokeLinecap="round" />{heavy && <><circle cx="55" cy="116" r="14" fill={metal} stroke={secondary} strokeWidth="3" /><circle cx="125" cy="116" r="14" fill={metal} stroke={secondary} strokeWidth="3" /></>}<path d="M58 180 Q90 194 122 180" stroke={secondary} strokeWidth="5" fill="none" /></g>;
}

function CharacterAvatar({ skinHex = "#d9ab7c", hairHex = "#1a1512", gender = "female", archetypeId = "lamina-cinzas", appearance = null, size = 160 }) {
  const unique = useId().replace(/:/g, "");
  const safeAppearance = normalizeAppearance(archetypeId, gender, appearance || defaultAppearance(archetypeId, gender));
  const config = getClassAvatarConfig(archetypeId);
  const palette = getPalette(safeAppearance.paletteId);
  const weapon = getWeapon(archetypeId, safeAppearance.weaponId);
  const bgId = `avatar-bg-${unique}`;
  const auraId = `avatar-aura-${unique}`;
  return (
    <svg width={size} height={size} viewBox="0 0 180 220" className="mx-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]" role="img" aria-label="Avatar customizado do personagem">
      <defs><radialGradient id={bgId} cx="50%" cy="34%" r="72%"><stop offset="0%" stopColor={palette.primary} stopOpacity="0.55" /><stop offset="70%" stopColor="#17100e" /><stop offset="100%" stopColor="#090706" /></radialGradient><radialGradient id={auraId}><stop offset="0%" stopColor={palette.secondary} stopOpacity="0.45" /><stop offset="100%" stopColor={palette.secondary} stopOpacity="0" /></radialGradient></defs>
      <rect x="4" y="4" width="172" height="212" rx="24" fill={`url(#${bgId})`} stroke="#4b3028" strokeWidth="3" /><circle cx="90" cy="90" r="66" fill={`url(#${auraId})`} /><path d="M49 200 Q90 183 131 200" stroke="#000" strokeOpacity="0.35" strokeWidth="18" strokeLinecap="round" />
      <WeaponLayer type={weapon.type} metal={palette.metal} accent={palette.secondary} /><OutfitLayer theme={config.theme} style={safeAppearance.outfitStyle} primary={palette.primary} secondary={palette.secondary} metal={palette.metal} />
      <path d="M78 102 L102 102 L103 121 Q90 129 77 121Z" fill={skinHex} /><ellipse cx="90" cy="79" rx="28" ry="34" fill={skinHex} stroke="#5f4035" strokeWidth="1.2" /><HairLayer style={safeAppearance.hairStyle} hairHex={hairHex} />
      <path d="M70 76 Q77 71 84 75 M96 75 Q103 71 110 76" stroke={hairHex} strokeWidth="2.8" fill="none" strokeLinecap="round" /><ellipse cx="78" cy="83" rx="5.5" ry="4.2" fill="#f2ece6" /><ellipse cx="102" cy="83" rx="5.5" ry="4.2" fill="#f2ece6" /><circle cx="78" cy="83" r="2.5" fill="#17110f" /><circle cx="102" cy="83" r="2.5" fill="#17110f" /><circle cx="77" cy="82" r="0.8" fill="#fff" /><circle cx="101" cy="82" r="0.8" fill="#fff" /><path d="M90 84 L86 94 Q90 97 94 94" stroke="#805548" strokeWidth="1.3" fill="none" strokeLinecap="round" /><path d="M80 103 Q90 109 100 103" stroke="#8f5148" strokeWidth="2.1" fill="none" strokeLinecap="round" /><FaceMark mark={safeAppearance.faceMark} accent={palette.secondary} />
      {config.theme === "rogue" && <path d="M57 111 Q90 88 123 111" fill="none" stroke="#111015" strokeWidth="12" opacity="0.7" />}{config.theme === "frost" && <path d="M42 57 Q90 24 138 57" fill="none" stroke={palette.secondary} strokeWidth="2" strokeDasharray="3 5" opacity="0.6" />}{config.theme === "shadow" && <circle cx="90" cy="42" r="24" fill="none" stroke={palette.secondary} strokeWidth="2" opacity="0.38" />}
    </svg>
  );
}

export default CharacterAvatar;