import {
  ARCHETYPES,
  HAIR_COLORS,
  SKIN_TONES,
  XP_PER_LEVEL,
} from "../data/archetypes.js";
import { normalizeAppearance } from "../data/avatarCustomization.js";
import { MAP_REGIONS } from "../data/mapRegions.js";

export const GAME_SCHEMA_VERSION = 5;
export const MAX_SAVED_MESSAGES = 200;
export const MAX_INVENTORY_ITEMS = 20;
export const EMPTY_JOURNAL = Object.freeze({
  summary: "",
  objective: "",
  clues: [],
  npcs: [],
  decisions: [],
});

const VALID_PHASES = new Set(["create-p1", "create-p2", "game"]);
const VALID_VIEWS = new Set(["chat", "map", "sheet", "journal"]);
const VALID_REGION_IDS = new Set(MAP_REGIONS.map((region) => region.id));

function clampNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function uniqueTextList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const text = cleanText(item, maxLength);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function calculateMaxHp(attrs) {
  const vigor = Math.trunc(clampNumber(attrs?.vigor, 1, 4, 1));
  return 10 + vigor * 3;
}

function normalizeInventory(value) {
  return uniqueTextList(value, MAX_INVENTORY_ITEMS, 80);
}

function normalizePlayer(player) {
  if (!player || typeof player !== "object") return null;
  const archetypeId = cleanText(player.archetype?.id, 64);
  const archetype = ARCHETYPES.find((item) => item.id === archetypeId);
  if (!archetype) return null;
  const nick = cleanText(player.nick, 20);
  if (!nick) return null;
  const hair = HAIR_COLORS.find((item) => item.id === player.hair?.id) || HAIR_COLORS[0];
  const skin = SKIN_TONES.find((item) => item.id === player.skin?.id) || SKIN_TONES[0];
  const appearance = normalizeAppearance(archetype.id, archetype.gender, player.appearance);
  const allowedSkills = [...archetype.skills, ...archetype.lockedSkills];
  const allowedByName = new Map(allowedSkills.map((skill) => [skill.name, skill]));
  const skillLevels = new Map();
  if (Array.isArray(player.skills)) {
    for (const skill of player.skills) {
      const canonical = allowedByName.get(skill?.name);
      if (!canonical) continue;
      skillLevels.set(canonical.name, Math.trunc(clampNumber(skill?.level, 1, 20, 1)));
    }
  }
  for (const skill of archetype.skills) {
    if (!skillLevels.has(skill.name)) skillLevels.set(skill.name, 1);
  }
  const skills = [...skillLevels.entries()].map(([name, level]) => ({ ...allowedByName.get(name), level }));
  const unlocked = new Set(skills.map((skill) => skill.name));
  const xp = Math.trunc(clampNumber(player.xp, 0, 1_000_000, 0));
  const maxHp = calculateMaxHp(archetype.attrs);
  const hp = Math.trunc(clampNumber(player.hp, 0, maxHp, maxHp));
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
    appearance,
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    hp,
    maxHp,
    inventory: normalizeInventory(player.inventory),
    skills,
  };
}

export function initPlayer(character) {
  const archetype = ARCHETYPES.find((item) => item.id === character?.archetype?.id);
  const hair = HAIR_COLORS.find((item) => item.id === character?.hair?.id);
  const skin = SKIN_TONES.find((item) => item.id === character?.skin?.id);
  const nick = cleanText(character?.nick, 20);
  if (!archetype || !hair || !skin || !nick) throw new Error("Personagem invalido");
  const maxHp = calculateMaxHp(archetype.attrs);
  return {
    nick,
    archetype: {
      ...archetype,
      skills: archetype.skills.map((skill) => ({ ...skill })),
      lockedSkills: archetype.lockedSkills.map((skill) => ({ ...skill })),
    },
    hair: { ...hair },
    skin: { ...skin },
    appearance: normalizeAppearance(archetype.id, archetype.gender, character.appearance),
    level: 1,
    xp: 0,
    hp: maxHp,
    maxHp,
    inventory: [],
    skills: archetype.skills.map((skill) => ({ ...skill, level: 1 })),
  };
}

export function sanitizeJournal(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : EMPTY_JOURNAL;
  const npcs = [];
  const seenNpcs = new Set();
  for (const raw of Array.isArray(source.npcs) ? source.npcs : []) {
    const name = cleanText(raw?.name, 80);
    const description = cleanText(raw?.description, 300);
    const key = name.toLocaleLowerCase();
    if (!name || seenNpcs.has(key)) continue;
    seenNpcs.add(key);
    npcs.push({ name, description });
    if (npcs.length >= 20) break;
  }
  return {
    summary: cleanText(source.summary, 1_200),
    objective: cleanText(source.objective, 400),
    clues: uniqueTextList(source.clues, 20, 300),
    npcs,
    decisions: uniqueTextList(source.decisions, 20, 300),
  };
}

function combatEntryHp(entry, players) {
  if (entry?.type === "enemy") return entry.hp;
  if (entry?.type === "player") {
    return players.find((player) => player?.nick === entry.name)?.hp ?? 0;
  }
  return 0;
}

function findAliveCombatIndex(order, players, startIndex = 0) {
  if (!Array.isArray(order) || order.length === 0) return -1;
  for (let offset = 0; offset < order.length; offset += 1) {
    const index = (startIndex + offset + order.length) % order.length;
    if (combatEntryHp(order[index], players) > 0) return index;
  }
  return -1;
}

export function sanitizeCombat(input, players = []) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const name = cleanText(input.name, 80) || "Confronto";
  const validPlayers = new Map(
    players.filter(Boolean).map((player) => [player.nick.toLocaleLowerCase(), player.nick])
  );
  const seen = new Set();
  const order = [];
  for (const rawEntry of Array.isArray(input.order) ? input.order.slice(0, 12) : []) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const rawName = cleanText(rawEntry.name, 80);
    if (!rawName) continue;
    if (rawEntry.type === "player") {
      const canonical = validPlayers.get(rawName.toLocaleLowerCase());
      if (!canonical) continue;
      const key = `player:${canonical.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      order.push({ type: "player", name: canonical });
      continue;
    }
    if (rawEntry.type === "enemy") {
      const key = `enemy:${rawName.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const maxHp = Math.trunc(clampNumber(rawEntry.maxHp, 1, 200, 10));
      const hp = Math.trunc(clampNumber(rawEntry.hp, 0, maxHp, maxHp));
      order.push({ type: "enemy", name: rawName, hp, maxHp });
    }
  }
  if (!order.length) return null;
  const round = Math.trunc(clampNumber(input.round, 1, 999, 1));
  const requestedIndex = Math.trunc(clampNumber(input.currentTurnIndex, 0, order.length - 1, 0));
  const currentTurnIndex = findAliveCombatIndex(order, players, requestedIndex);
  return currentTurnIndex < 0 ? null : { name, order, round, currentTurnIndex };
}

export function getCurrentCombatant(combat, players = []) {
  const safe = sanitizeCombat(combat, players);
  if (!safe) return null;
  return safe.order[safe.currentTurnIndex] || null;
}

export function advanceCombatTurn(combat, players = []) {
  const safe = sanitizeCombat(combat, players);
  if (!safe) return null;
  const start = (safe.currentTurnIndex + 1) % safe.order.length;
  const nextIndex = findAliveCombatIndex(safe.order, players, start);
  if (nextIndex < 0) return null;
  const wrapped = nextIndex <= safe.currentTurnIndex;
  return {
    ...safe,
    currentTurnIndex: nextIndex,
    round: Math.min(999, safe.round + (wrapped ? 1 : 0)),
  };
}

export function sanitizeSnapshot(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Save invalido");
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
  const pendingTests = [
    ...new Set(
      (Array.isArray(input.pendingTests) ? input.pendingTests : [])
        .map((nick) => validNicks.get(cleanText(nick, 20).toLocaleLowerCase()))
        .filter(Boolean)
    ),
  ];
  const levelUpQueue = (Array.isArray(input.levelUpQueue) ? input.levelUpQueue : [])
    .map((nick) => validNicks.get(cleanText(nick, 20).toLocaleLowerCase()))
    .filter(Boolean)
    .slice(0, 20);
  const revealedRegions = [
    ...new Set(
      (Array.isArray(input.revealedRegions) ? input.revealedRegions : []).filter((id) =>
        VALID_REGION_IDS.has(id)
      )
    ),
  ];
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
    combat: sanitizeCombat(input.combat, players),
    journal: sanitizeJournal(input.journal),
    view: VALID_VIEWS.has(input.view) ? input.view : "chat",
  };
}

function parseCombatStart(source) {
  const match = source.match(/\[\[INICIAR_COMBATE:\s*([^|\]]+)\|\s*([^\]]+)\]\]/);
  if (!match) return null;
  const name = cleanText(match[1], 80) || "Confronto";
  const order = [];
  const seen = new Set();
  for (const raw of match[2].split(",").slice(0, 12)) {
    const entry = cleanText(raw, 120);
    if (!entry) continue;
    const separator = entry.lastIndexOf(":");
    if (separator > 0) {
      const enemyName = cleanText(entry.slice(0, separator), 80);
      const parsedHp = Number.parseInt(entry.slice(separator + 1).trim(), 10);
      if (!enemyName || !Number.isFinite(parsedHp)) continue;
      const key = `enemy:${enemyName.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const maxHp = Math.trunc(clampNumber(parsedHp, 1, 200, 10));
      order.push({ type: "enemy", name: enemyName, hp: maxHp, maxHp });
    } else {
      const playerName = cleanText(entry, 20);
      if (!playerName) continue;
      const key = `player:${playerName.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      order.push({ type: "player", name: playerName });
    }
  }
  return order.length ? { name, order, round: 1, currentTurnIndex: 0 } : null;
}

function parseJournalUpdates(source) {
  const lastText = (pattern, maxLength) => {
    const matches = [...source.matchAll(pattern)];
    return matches.length ? cleanText(matches.at(-1)[1], maxLength) : "";
  };
  return {
    summary: lastText(/\[\[RESUMO:\s*([^\]]+)\]\]/g, 1_200),
    objective: lastText(/\[\[OBJETIVO:\s*([^\]]+)\]\]/g, 400),
    clues: [...source.matchAll(/\[\[PISTA:\s*([^\]]+)\]\]/g)]
      .map((match) => cleanText(match[1], 300))
      .filter(Boolean),
    npcs: [...source.matchAll(/\[\[NPC:\s*([^|\]]+)\|\s*([^\]]*)\]\]/g)]
      .map((match) => ({ name: cleanText(match[1], 80), description: cleanText(match[2], 300) }))
      .filter((npc) => npc.name),
    decisions: [...source.matchAll(/\[\[DECISAO:\s*([^\]]+)\]\]/g)]
      .map((match) => cleanText(match[1], 300))
      .filter(Boolean),
  };
}

export function parseDirectives(text) {
  const source = typeof text === "string" ? text : "";
  const testMatches = [
    ...new Set(
      [...source.matchAll(/\[\[TESTE:\s*([^\]]+)\]\]/g)]
        .map((match) => cleanText(match[1], 20))
        .filter(Boolean)
    ),
  ];
  const xpMatches = [...source.matchAll(/\[\[XP:\s*([^|]+)\|\s*(\d+)\]\]/g)]
    .map((match) => ({
      nick: cleanText(match[1], 20),
      amount: Math.trunc(clampNumber(match[2], 1, 500, 1)),
    }))
    .filter((award) => award.nick);
  const mapMatches = [
    ...new Set(
      [...source.matchAll(/\[\[MAPA:\s*([^\]]+)\]\]/g)]
        .map((match) => cleanText(match[1], 64))
        .filter((id) => VALID_REGION_IDS.has(id))
    ),
  ];
  const damageMatches = [...source.matchAll(/\[\[DANO:\s*([^|]+)\|\s*(\d+)\]\]/g)]
    .map((match) => ({ nick: cleanText(match[1], 20), amount: Math.trunc(clampNumber(match[2], 1, 100, 1)) }))
    .filter((effect) => effect.nick);
  const healMatches = [...source.matchAll(/\[\[CURA:\s*([^|]+)\|\s*(\d+)\]\]/g)]
    .map((match) => ({ nick: cleanText(match[1], 20), amount: Math.trunc(clampNumber(match[2], 1, 100, 1)) }))
    .filter((effect) => effect.nick);
  const enemyDamageMatches = [
    ...source.matchAll(/\[\[INIMIGO_DANO:\s*([^|]+)\|\s*(\d+)\]\]/g),
  ]
    .map((match) => ({ name: cleanText(match[1], 80), amount: Math.trunc(clampNumber(match[2], 1, 100, 1)) }))
    .filter((effect) => effect.name);
  const startCombat = parseCombatStart(source);
  const endCombat = /\[\[FIM_COMBATE\]\]/.test(source);
  const journalUpdates = parseJournalUpdates(source);
  const cleanNarrative = source
    .replace(/\[\[TESTE:[^\]]+\]\]/g, "")
    .replace(/\[\[XP:[^\]]+\]\]/g, "")
    .replace(/\[\[MAPA:[^\]]+\]\]/g, "")
    .replace(/\[\[DANO:[^\]]+\]\]/g, "")
    .replace(/\[\[CURA:[^\]]+\]\]/g, "")
    .replace(/\[\[INICIAR_COMBATE:[^\]]+\]\]/g, "")
    .replace(/\[\[INIMIGO_DANO:[^\]]+\]\]/g, "")
    .replace(/\[\[FIM_COMBATE\]\]/g, "")
    .replace(/\[\[RESUMO:[^\]]+\]\]/g, "")
    .replace(/\[\[OBJETIVO:[^\]]+\]\]/g, "")
    .replace(/\[\[PISTA:[^\]]+\]\]/g, "")
    .replace(/\[\[NPC:[^\]]+\]\]/g, "")
    .replace(/\[\[DECISAO:[^\]]+\]\]/g, "")
    .trim();
  return {
    cleanText: cleanNarrative,
    testMatches,
    xpMatches,
    mapMatches,
    damageMatches,
    healMatches,
    startCombat,
    enemyDamageMatches,
    endCombat,
    journalUpdates,
  };
}

export function applyJournalUpdates(journal, updates) {
  const current = sanitizeJournal(journal);
  const next = {
    ...current,
    summary: cleanText(updates?.summary, 1_200) || current.summary,
    objective: cleanText(updates?.objective, 400) || current.objective,
    clues: uniqueTextList([...current.clues, ...(updates?.clues || [])], 20, 300),
    decisions: uniqueTextList([...current.decisions, ...(updates?.decisions || [])], 20, 300),
    npcs: [...current.npcs],
  };
  for (const raw of Array.isArray(updates?.npcs) ? updates.npcs : []) {
    const name = cleanText(raw?.name, 80);
    const description = cleanText(raw?.description, 300);
    if (!name) continue;
    const index = next.npcs.findIndex((npc) => npc.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (index >= 0) next.npcs[index] = { name: next.npcs[index].name, description: description || next.npcs[index].description };
    else if (next.npcs.length < 20) next.npcs.push({ name, description });
  }
  return sanitizeJournal(next);
}

export function applyXpAwards(players, awards) {
  const nextPlayers = players.map((player) => (player ? { ...player } : null));
  const levelUps = [];
  for (const award of Array.isArray(awards) ? awards : []) {
    const index = nextPlayers.findIndex(
      (player) =>
        player && player.nick.toLocaleLowerCase() === cleanText(award?.nick, 20).toLocaleLowerCase()
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

export function applyHpEffects(players, damage = [], healing = []) {
  const nextPlayers = players.map((player) => (player ? { ...player } : null));
  const apply = (effects, direction) => {
    for (const effect of Array.isArray(effects) ? effects : []) {
      const index = nextPlayers.findIndex(
        (player) =>
          player && player.nick.toLocaleLowerCase() === cleanText(effect?.nick, 20).toLocaleLowerCase()
      );
      if (index < 0) continue;
      const player = nextPlayers[index];
      const amount = Math.trunc(clampNumber(effect?.amount, 1, 100, 1));
      const hp = Math.trunc(
        clampNumber(player.hp + direction * amount, 0, player.maxHp, player.hp)
      );
      nextPlayers[index] = { ...player, hp };
    }
  };
  apply(damage, -1);
  apply(healing, 1);
  return nextPlayers;
}

export function applyEnemyDamage(combat, hits) {
  if (!combat || !Array.isArray(combat.order)) return combat;
  const totals = new Map();
  for (const hit of Array.isArray(hits) ? hits : []) {
    const name = cleanText(hit?.name, 80).toLocaleLowerCase();
    if (!name) continue;
    const amount = Math.trunc(clampNumber(hit?.amount, 1, 100, 1));
    totals.set(name, (totals.get(name) || 0) + amount);
  }
  return {
    ...combat,
    order: combat.order.map((entry) => {
      if (entry.type !== "enemy") return entry;
      const damage = totals.get(entry.name.toLocaleLowerCase()) || 0;
      return damage ? { ...entry, hp: Math.max(0, entry.hp - damage) } : entry;
    }),
  };
}
