import { describe, expect, it } from "vitest";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import {
  applyEnemyDamage,
  applyHpEffects,
  applyXpAwards,
  calculateMaxHp,
  GAME_SCHEMA_VERSION,
  initPlayer,
  parseDirectives,
  sanitizeCombat,
  sanitizeSnapshot,
} from "./engine.js";

function character(nick = "Biel", archetype = ARCHETYPES[4]) {
  return { nick, archetype, hair: HAIR_COLORS[0], skin: SKIN_TONES[0] };
}

describe("game engine", () => {
  it("cria personagem canonico com HP e inventario", () => {
    const player = initPlayer(character());
    expect(player.nick).toBe("Biel");
    expect(player.level).toBe(1);
    expect(player.maxHp).toBe(calculateMaxHp(player.archetype.attrs));
    expect(player.hp).toBe(player.maxHp);
    expect(player.inventory).toEqual([]);
  });

  it("rejeita save que nao seja objeto", () => {
    expect(() => sanitizeSnapshot("corrupcao")).toThrow("Save invalido");
  });

  it("migra save antigo para schema 3 sem perder personagem", () => {
    const base = initPlayer(character());
    delete base.hp;
    delete base.maxHp;
    delete base.inventory;
    const state = sanitizeSnapshot({ phase: "create-p2", players: [base, null], view: "chat" });
    expect(state.schemaVersion).toBe(GAME_SCHEMA_VERSION);
    expect(state.players[0].hp).toBe(state.players[0].maxHp);
    expect(state.players[0].inventory).toEqual([]);
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

  it("filtra marcadores e entende combate, dano e cura", () => {
    const parsed = parseDirectives("Cena [[XP: Biel | 999999]] [[MAPA: portas]] [[MAPA: segredo]] [[TESTE: Biel]] [[DANO: Biel | 4]] [[CURA: Biel | 2]] [[INICIAR_COMBATE: Emboscada | Lobo:12, Biel]] [[INIMIGO_DANO: Lobo | 5]]");
    expect(parsed.xpMatches).toEqual([{ nick: "Biel", amount: 500 }]);
    expect(parsed.mapMatches).toEqual(["portas"]);
    expect(parsed.testMatches).toEqual(["Biel"]);
    expect(parsed.damageMatches).toEqual([{ nick: "Biel", amount: 4 }]);
    expect(parsed.healMatches).toEqual([{ nick: "Biel", amount: 2 }]);
    expect(parsed.startCombat.order).toEqual([
      { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
      { type: "player", name: "Biel" },
    ]);
    expect(parsed.enemyDamageMatches).toEqual([{ name: "Lobo", amount: 5 }]);
    expect(parsed.cleanText).toBe("Cena");
  });

  it("sanitiza combate e remove jogador inexistente", () => {
    const player = initPlayer(character());
    const combat = sanitizeCombat({ name: "Teste", order: [
      { type: "player", name: "Biel" },
      { type: "player", name: "Intruso" },
      { type: "enemy", name: "Lobo", hp: 999, maxHp: 12 },
    ] }, [player, null]);
    expect(combat.order).toEqual([
      { type: "player", name: "Biel" },
      { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
    ]);
  });

  it("aplica dano e cura sem ultrapassar limites", () => {
    const player = initPlayer(character());
    const damaged = applyHpEffects([player, null], [{ nick: "Biel", amount: 999 }], []);
    expect(damaged[0].hp).toBe(0);
    const healed = applyHpEffects(damaged, [], [{ nick: "Biel", amount: 999 }]);
    expect(healed[0].hp).toBe(player.maxHp);
  });

  it("aplica dano de inimigo pelo nome sem afetar jogadores", () => {
    const combat = { name: "Luta", order: [
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
