import {
  ARCHETYPES,
  HAIR_COLORS,
  SKIN_TONES,
  XP_PER_LEVEL,
} from "../data/archetypes.js";
import { MAP_REGIONS } from "../data/mapRegions.js";

export const GAME_SCHEMA_VERSION = 2;
export const MAX_SAVED_MESSAGES = 200;

const VALID_PHASES = new Set(["create-p1", "create-p2", "game"]);
const VALID_REGION_IDS = new Set(MAP_REGIONS.map((region) => region.id));

function clampNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePlayer(player) {
  if (!player || typeof player !== "object") return null;

  const archetypeId = cleanText(player.archetype?.id, 64);
  const archetype = ARCHETYPES.find((item) => item.id === archetypeId);
  if (!archetype) return null;

  const nick = cleanText(player.nick, 20);
  if (!nick) return null;

  const hair =
    HAIR_COLORS.find((item) => item.id === player.hair?.id) || HAIR_COLORS[0];
  const skin =
    SKIN_TONES.find((item) => item.id === player.skin?.id) || SKIN_TONES[0];

  const allowedSkills = [...archetype.skills, ...archetype.lockedSkills];
  const allowedByName = new Map(allowedSkills.map((skill) => [skill.name, skill]));
  const skillLevels = new Map();

  if (Array.isArray(player.skills)) {
    for (const skill of player.skills) {
      const canonical = allowedByName.get(skill?.name);
      if (!canonical) continue;
      skillLevels.set(
        canonical.name,
        Math.trunc(clampNumber(skill?.level, 1, 20, 1))
      );
    }
  }

  for (const skill of archetype.skills) {
    if (!skillLevels.has(skill.name)) skillLevels.set(skill.name, 1);
  }

  const skills = [...skillLevels.entries()].map(([name, level]) => ({
    ...allowedByName.get(name),
    level,
  }));
  const unlocked = new Set(skills.map((skill) => skill.name));
  const xp = Math.trunc(clampNumber(player.xp, 0, 1_000_000, 0));

  return {
    nick,
    archetype: {
      ...archetype,
      skills: archetype.skills.map((skill) => ({ ...skill })),
      lockedSkills: archetype.lockedSkills
        .filter((skill) => !unlocked.has(skill.name))
        .map((skill) => ({ ...skill })),
    },
    hair: { ...hair },
    skin: { ...skin },
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    skills,
  };
}

export function initPlayer(character) {
  const archetype = ARCHETYPES.find((item) => item.id === character?.archetype?.id);
  const hair = HAIR_COLORS.find((item) => item.id === character?.hair?.id);
  const skin = SKIN_TONES.find((item) => item.id === character?.skin?.id);
  const nick = cleanText(character?.nick, 20);

  if (!archetype || !hair || !skin || !nick) {
    throw new Error("Personagem invalido");
  }

  return {
    nick,
    archetype: {
      ...archetype,
      skills: archetype.skills.map((skill) => ({ ...skill })),
      lockedSkills: archetype.lockedSkills.map((skill) => ({ ...skill })),
    },
    hair: { ...hair },
    skin: { ...skin },
    level: 1,
    xp: 0,
    skills: archetype.skills.map((skill) => ({ ...skill, level: 1 })),
  };
}

export function sanitizeSnapshot(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Save invalido");
  }

  const sourcePlayers = Array.isArray(input.players) ? input.players.slice(0, 2) : [];
  const players = [normalizePlayer(sourcePlayers[0]), normalizePlayer(sourcePlayers[1])];

  if (
    players[0] &&
    players[1] &&
    players[0].nick.localeCompare(players[1].nick, undefined, { sensitivity: "accent" }) === 0
  ) {
    const suffix = " 2";
    players[1] = {
      ...players[1],
      nick: `${players[1].nick.slice(0, 20 - suffix.length)}${suffix}`,
    };
  }

  let phase = VALID_PHASES.has(input.phase) ? input.phase : "create-p1";
  if (!players[0]) phase = "create-p1";
  else if (!players[1] && phase === "game") phase = "create-p2";

  const messages = (Array.isArray(input.messages) ? input.messages : [])
    .slice(-MAX_SAVED_MESSAGES)
    .map((message) => ({
      role: message?.role === "model" ? "model" : "user",
      text: cleanText(message?.text, 4_000),
    }))
    .filter((message) => message.text);

  const validNicks = new Map(
    players.filter(Boolean).map((player) => [player.nick.toLocaleLowerCase(), player.nick])
  );

  const pendingTests = [...new Set(
    (Array.isArray(input.pendingTests) ? input.pendingTests : [])
      .map((nick) => validNicks.get(cleanText(nick, 20).toLocaleLowerCase()))
      .filter(Boolean)
  )];

  const levelUpQueue = (Array.isArray(input.levelUpQueue) ? input.levelUpQueue : [])
    .map((nick) => validNicks.get(cleanText(nick, 20).toLocaleLowerCase()))
    .filter(Boolean)
    .slice(0, 20);

  const revealedRegions = [...new Set(
    (Array.isArray(input.revealedRegions) ? input.revealedRegions : [])
      .filter((id) => VALID_REGION_IDS.has(id))
  )];

  const currentRegion =
    VALID_REGION_IDS.has(input.currentRegion) && revealedRegions.includes(input.currentRegion)
      ? input.currentRegion
      : null;

  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase,
    players,
    messages,
    pendingTests,
    levelUpQueue,
    revealedRegions,
    currentRegion,
    view: input.view === "map" ? "map" : "chat",
  };
}

export function parseDirectives(text) {
  const source = typeof text === "string" ? text : "";
  const testMatches = [...new Set(
    [...source.matchAll(/\[\[TESTE:\s*([^\]]+)\]\]/g)]
      .map((match) => cleanText(match[1], 20))
      .filter(Boolean)
  )];

  const xpMatches = [...source.matchAll(/\[\[XP:\s*([^|]+)\|\s*(\d+)\]\]/g)]
    .map((match) => ({
      nick: cleanText(match[1], 20),
      amount: Math.trunc(clampNumber(match[2], 1, 500, 1)),
    }))
    .filter((award) => award.nick);

  const mapMatches = [...new Set(
    [...source.matchAll(/\[\[MAPA:\s*([^\]]+)\]\]/g)]
      .map((match) => cleanText(match[1], 64))
      .filter((id) => VALID_REGION_IDS.has(id))
  )];

  const cleanNarrative = source
    .replace(/\[\[TESTE:[^\]]+\]\]/g, "")
    .replace(/\[\[XP:[^\]]+\]\]/g, "")
    .replace(/\[\[MAPA:[^\]]+\]\]/g, "")
    .trim();

  return { cleanText: cleanNarrative, testMatches, xpMatches, mapMatches };
}

export function applyXpAwards(players, awards) {
  const nextPlayers = players.map((player) => (player ? { ...player } : null));
  const levelUps = [];

  for (const award of Array.isArray(awards) ? awards : []) {
    const index = nextPlayers.findIndex(
      (player) =>
        player &&
        player.nick.toLocaleLowerCase() === cleanText(award?.nick, 20).toLocaleLowerCase()
    );
    if (index < 0) continue;

    const player = nextPlayers[index];
    const amount = Math.trunc(clampNumber(award?.amount, 1, 500, 1));
    const xp = Math.min(1_000_000, player.xp + amount);
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    if (level > player.level) levelUps.push(player.nick);
    nextPlayers[index] = { ...player, xp, level };
  }

  return { players: nextPlayers, levelUps: [...new Set(levelUps)] };
}
