import { describe, expect, it } from "vitest";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import { defaultAppearance } from "../data/avatarCustomization.js";
import {
  advanceCombatTurn,
  applyEnemyDamage,
  applyHpEffects,
  applyJournalUpdates,
  applyXpAwards,
  calculateMaxHp,
  GAME_SCHEMA_VERSION,
  getCurrentCombatant,
  initPlayer,
  parseDirectives,
  sanitizeCombat,
  sanitizeSnapshot,
} from "./engine.js";

function character(nick = "Biel", archetype = ARCHETYPES[4]) {
  return {
    nick,
    archetype,
    hair: HAIR_COLORS[0],
    skin: SKIN_TONES[0],
    appearance: defaultAppearance(archetype.id, archetype.gender),
  };
}

describe("game engine", () => {
  it("cria personagem canonico com HP, inventario e aparencia", () => {
    const player = initPlayer(character());
    expect(player.nick).toBe("Biel");
    expect(player.level).toBe(1);
    expect(player.maxHp).toBe(calculateMaxHp(player.archetype.attrs));
    expect(player.hp).toBe(player.maxHp);
    expect(player.inventory).toEqual([]);
    expect(player.appearance.archetypeId).toBe(player.archetype.id);
    expect(player.appearance.weaponId).toBeTruthy();
  });

  it("rejeita save que nao seja objeto", () => {
    expect(() => sanitizeSnapshot("corrupcao")).toThrow("Save invalido");
  });

  it("migra save v4 para schema atual sem perder personagem e cria aparencia padrao", () => {
    const base = initPlayer(character());
    delete base.hp;
    delete base.maxHp;
    delete base.inventory;
    delete base.appearance;
    const state = sanitizeSnapshot({ schemaVersion: 4, phase: "create-p2", players: [base, null], view: "chat" });
    expect(state.schemaVersion).toBe(GAME_SCHEMA_VERSION);
    expect(state.players[0].hp).toBe(state.players[0].maxHp);
    expect(state.players[0].inventory).toEqual([]);
    expect(state.players[0].appearance).toEqual(defaultAppearance(state.players[0].archetype.id, state.players[0].archetype.gender));
    expect(state.journal).toEqual({ summary: "", objective: "", clues: [], npcs: [], decisions: [] });
  });

  it("preserva aparencia valida e rejeita IDs arbitrarios", () => {
    const base = initPlayer(character("Julia", ARCHETYPES[0]));
    const customized = {
      ...base,
      appearance: {
        ...base.appearance,
        hairStyle: "braid",
        outfitStyle: "heavy",
        paletteId: "royal",
        weaponId: "dual-swords",
        faceMark: "scar",
      },
    };
    const valid = sanitizeSnapshot({ phase: "create-p2", players: [customized, null] });
    expect(valid.players[0].appearance).toMatchObject({
      hairStyle: "braid",
      outfitStyle: "heavy",
      paletteId: "royal",
      weaponId: "dual-swords",
      faceMark: "scar",
    });

    const invalid = sanitizeSnapshot({
      phase: "create-p2",
      players: [{ ...customized, appearance: { hairStyle: "hack", weaponId: "bazuca", paletteId: "neon" } }, null],
    });
    expect(invalid.players[0].appearance).toEqual(defaultAppearance(ARCHETYPES[0].id, ARCHETYPES[0].gender));
  });

  it("remove dados arbitrarios e corrige nivel a partir do XP", () => {
    const base = initPlayer(character());
    const state = sanitizeSnapshot({
      phase: "game",
      players: [{ ...base, xp: 250, level: 999, hp: 999, inventory: ["Lanterna", "x".repeat(200)], injected: true }, null],
      messages: [{ role: "admin", text: "teste" }],
      revealedRegions: ["portas", "regiao-inexistente"],
      currentRegion: "regiao-inexistente",
    });
    expect(state.phase).toBe("create-p2");
    expect(state.players[0].level).toBe(3);
    expect(state.players[0].hp).toBe(state.players[0].maxHp);
    expect(state.players[0].inventory[1]).toHaveLength(80);
    expect(state.players[0].injected).toBeUndefined();
    expect(state.messages[0].role).toBe("user");
    expect(state.revealedRegions).toEqual(["portas"]);
    expect(state.currentRegion).toBeNull();
  });

  it("filtra marcadores e entende combate, dano, cura e diario", () => {
    const parsed = parseDirectives("Cena [[XP: Biel | 999999]] [[MAPA: portas]] [[MAPA: segredo]] [[TESTE: Biel]] [[DANO: Biel | 4]] [[CURA: Biel | 2]] [[INICIAR_COMBATE: Emboscada | Lobo:12, Biel]] [[INIMIGO_DANO: Lobo | 5]] [[OBJETIVO: Entrar em Vharnak]] [[PISTA: O sino não emite som]] [[NPC: Sella | sobrevivente silenciosa]] [[DECISAO: Recusaram o pacto]] [[RESUMO: A dupla chegou às portas.]]");
    expect(parsed.xpMatches).toEqual([{ nick: "Biel", amount: 500 }]);
    expect(parsed.mapMatches).toEqual(["portas"]);
    expect(parsed.testMatches).toEqual(["Biel"]);
    expect(parsed.damageMatches).toEqual([{ nick: "Biel", amount: 4 }]);
    expect(parsed.healMatches).toEqual([{ nick: "Biel", amount: 2 }]);
    expect(parsed.startCombat).toEqual({
      name: "Emboscada",
      round: 1,
      currentTurnIndex: 0,
      order: [
        { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
        { type: "player", name: "Biel" },
      ],
    });
    expect(parsed.enemyDamageMatches).toEqual([{ name: "Lobo", amount: 5 }]);
    expect(parsed.journalUpdates.objective).toBe("Entrar em Vharnak");
    expect(parsed.journalUpdates.clues).toEqual(["O sino não emite som"]);
    expect(parsed.journalUpdates.npcs).toEqual([{ name: "Sella", description: "sobrevivente silenciosa" }]);
    expect(parsed.cleanText).toBe("Cena");
  });

  it("sanitiza combate, cursor e remove jogador inexistente", () => {
    const player = initPlayer(character());
    const combat = sanitizeCombat({ name: "Teste", round: 2, currentTurnIndex: 99, order: [
      { type: "player", name: "Biel" },
      { type: "player", name: "Intruso" },
      { type: "enemy", name: "Lobo", hp: 999, maxHp: 12 },
    ] }, [player, null]);
    expect(combat.round).toBe(2);
    expect(combat.currentTurnIndex).toBe(1);
    expect(combat.order).toEqual([
      { type: "player", name: "Biel" },
      { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
    ]);
  });

  it("avanca turno, pula derrotados e incrementa rodada ao dar a volta", () => {
    const biel = initPlayer(character("Biel"));
    const julia = initPlayer(character("Julia", ARCHETYPES[0]));
    const combat = sanitizeCombat({ name: "Luta", round: 1, currentTurnIndex: 0, order: [
      { type: "player", name: "Biel" },
      { type: "enemy", name: "Lobo", hp: 0, maxHp: 12 },
      { type: "player", name: "Julia" },
    ] }, [biel, julia]);
    const second = advanceCombatTurn(combat, [biel, julia]);
    expect(getCurrentCombatant(second, [biel, julia]).name).toBe("Julia");
    expect(second.round).toBe(1);
    const third = advanceCombatTurn(second, [biel, julia]);
    expect(getCurrentCombatant(third, [biel, julia]).name).toBe("Biel");
    expect(third.round).toBe(2);
  });

  it("mantem diario estruturado, deduplicado e atualizavel", () => {
    const first = applyJournalUpdates(null, {
      summary: "Chegaram às portas",
      objective: "Entrar",
      clues: ["Sino mudo", "Sino mudo"],
      npcs: [{ name: "Sella", description: "silenciosa" }],
      decisions: ["Esperar a noite"],
    });
    const second = applyJournalUpdates(first, {
      clues: ["Runas azuis"],
      npcs: [{ name: "sella", description: "sobrevivente da Vigília" }],
    });
    expect(second.clues).toEqual(["Sino mudo", "Runas azuis"]);
    expect(second.npcs).toEqual([{ name: "Sella", description: "sobrevivente da Vigília" }]);
  });

  it("aplica dano e cura sem ultrapassar limites", () => {
    const player = initPlayer(character());
    const damaged = applyHpEffects([player, null], [{ nick: "Biel", amount: 999 }], []);
    expect(damaged[0].hp).toBe(0);
    const healed = applyHpEffects(damaged, [], [{ nick: "Biel", amount: 999 }]);
    expect(healed[0].hp).toBe(player.maxHp);
  });

  it("aplica dano de inimigo pelo nome sem afetar jogadores", () => {
    const combat = { name: "Luta", round: 1, currentTurnIndex: 0, order: [
      { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
      { type: "player", name: "Biel" },
    ] };
    const next = applyEnemyDamage(combat, [{ name: "Lobo", amount: 5 }]);
    expect(next.order[0].hp).toBe(7);
    expect(next.order[1]).toEqual(combat.order[1]);
  });

  it("aplica XP sem efeito colateral e gera um unico level-up", () => {
    const player = initPlayer(character());
    const result = applyXpAwards([player, null], [
      { nick: "Biel", amount: 100 },
      { nick: "desconhecido", amount: 100 },
    ]);
    expect(result.players[0].xp).toBe(100);
    expect(result.players[0].level).toBe(2);
    expect(result.levelUps).toEqual(["Biel"]);
  });
});