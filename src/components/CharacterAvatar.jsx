import { useId } from "react";
import {
  defaultAppearance,
  getClassAvatarConfig,
  getPalette,
  getWeapon,
  normalizeAppearance,
} from "../data/avatarCustomization.js";
import { getV2ClassPortrait } from "../data/v2ClassPortraits.js";
import {
  ArmorLayer,
  BackdropLayer,
  BodyLayer,
  ClassFxLayer,
  FaceLayer,
  HairBackLayer,
  HairFrontLayer,
  OutfitLayer,
  WeaponLayer,
} from "./avatar/AvatarLayers.jsx";

const V2_PREVIEW_SIGNATURES = {
  "corvo-silencioso": { hairHex: "#8a8a85", skinHex: "#5c3a24" },
};

function CharacterAvatar({
  skinHex = "#d9ab7c",
  hairHex = "#1a1512",
  gender = "female",
  archetypeId = "lamina-cinzas",
  appearance = null,
  size = 160,
  fluid = false,
  frame = true,
  className = "",
}) {
  const unique = useId().replace(/:/g, "");
  const safeAppearance = normalizeAppearance(
    archetypeId,
    gender,
    appearance || defaultAppearance(archetypeId, gender)
  );
  const config = getClassAvatarConfig(archetypeId);
  const palette = getPalette(safeAppearance.paletteId);
  const weapon = getWeapon(archetypeId, safeAppearance.weaponId);
  const backgroundId = `avatar-bg-${unique}`;
  const auraId = `avatar-aura-${unique}`;
  const skinLightId = `avatar-skin-${unique}`;
  const dimension = fluid ? "100%" : size;
  const previewSignature = V2_PREVIEW_SIGNATURES[archetypeId];
  const v2Portrait =
    previewSignature &&
    previewSignature.hairHex === hairHex &&
    previewSignature.skinHex === skinHex
      ? getV2ClassPortrait(archetypeId)
      : null;

  if (v2Portrait) {
    return (
      <img
        src={v2Portrait}
        alt={`Retrato V2 de ${archetypeId}`}
        className={`mx-auto h-full w-full object-cover object-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${className}`}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 240 320"
      preserveAspectRatio="xMidYMid meet"
      className={`mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${className}`}
      role="img"
      aria-label="Avatar customizado do personagem"
    >
      <defs>
        <radialGradient id={backgroundId} cx="50%" cy="26%" r="86%">
          <stop offset="0%" stopColor={palette.primary} stopOpacity="0.72" />
          <stop offset="48%" stopColor="#17100e" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#080605" />
        </radialGradient>
        <radialGradient id={auraId} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={palette.secondary} stopOpacity="0.42" />
          <stop offset="58%" stopColor={palette.secondary} stopOpacity="0.12" />
          <stop offset="100%" stopColor={palette.secondary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={skinLightId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#3d251d" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      <BackdropLayer
        theme={config.theme}
        primary={palette.primary}
        accent={palette.secondary}
        backgroundId={backgroundId}
        auraId={auraId}
        frame={frame}
      />
      <ClassFxLayer theme={config.theme} accent={palette.secondary} phase="back" />
      <WeaponLayer
        phase="back"
        type={weapon.type}
        metal={palette.metal}
        accent={palette.secondary}
        leather={palette.primary}
      />
      <HairBackLayer style={safeAppearance.hairStyle} hairHex={hairHex} />
      <BodyLayer skinHex={skinHex} />
      <OutfitLayer
        theme={config.theme}
        style={safeAppearance.outfitStyle}
        primary={palette.primary}
        secondary={palette.secondary}
        leather="#35251f"
      />
      <ArmorLayer
        theme={config.theme}
        style={safeAppearance.outfitStyle}
        metal={palette.metal}
        accent={palette.secondary}
        secondary={palette.primary}
      />
      <ellipse
        cx="120"
        cy="106"
        rx="37"
        ry="46"
        fill={`url(#${skinLightId})`}
        pointerEvents="none"
      />
      <FaceLayer hairHex={hairHex} mark={safeAppearance.faceMark} accent={palette.secondary} />
      <HairFrontLayer style={safeAppearance.hairStyle} hairHex={hairHex} />
      <WeaponLayer
        phase="front"
        type={weapon.type}
        metal={palette.metal}
        accent={palette.secondary}
        leather="#35251f"
      />
      <ClassFxLayer theme={config.theme} accent={palette.secondary} phase="front" />
      <path
        d="M24 291 Q120 272 216 291 L211 315 H29Z"
        fill="#080605"
        opacity="0.38"
        pointerEvents="none"
      />
    </svg>
  );
}

export default CharacterAvatar;
