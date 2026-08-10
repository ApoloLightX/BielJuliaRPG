import { describe, expect, it } from "vitest";
import { ARCHETYPES, HAIR_COLORS, SKIN_TONES } from "../data/archetypes.js";
import {
  applyXpAwards,
  initPlayer,
  parseDirectives,
  sanitizeSnapshot,
} from "./engine.js";

function character(nick = "Biel", archetype = ARCHETYPES[4]) {
  return {
    nick,
    archetype,
    hair: HAIR_COLORS[0],
    skin: SKIN_TONES[0],
  };
}

describe("game engine", () => {
  it("cria personagem somente a partir de dados canonicos", () => {
    const player = initPlayer(character());
    expect(player.nick).toBe("Biel");
    expect(player.level).toBe(1);
    expect(player.skills).toHaveLength(player.archetype.skills.length);
  });

  it("rejeita save que nao seja objeto", () => {
    expect(() => sanitizeSnapshot("corrupcao")).toThrow("Save invalido");
  });

  it("remove dados arbitrarios e corrige nivel a partir do XP", () => {
    const base = initPlayer(character());
    const state = sanitizeSnapshot({
      phase: "game",
      players: [{ ...base, xp: 250, level: 999, injected: true }, null],
      messages: [{ role: "admin", text: "teste" }],
      revealedRegions: ["portas", "regiao-inexistente"],
      currentRegion: "regiao-inexistente",
    });

    expect(state.phase).toBe("create-p2");
    expect(state.players[0].level).toBe(3);
    expect(state.players[0].injected).toBeUndefined();
    expect(state.messages[0].role).toBe("user");
    expect(state.revealedRegions).toEqual(["portas"]);
    expect(state.currentRegion).toBeNull();
  });

  it("filtra marcadores invalidos e limita XP", () => {
    const parsed = parseDirectives(
      "Cena [[XP: Biel | 999999]] [[MAPA: portas]] [[MAPA: segredo]] [[TESTE: Biel]]"
    );
    expect(parsed.xpMatches).toEqual([{ nick: "Biel", amount: 500 }]);
    expect(parsed.mapMatches).toEqual(["portas"]);
    expect(parsed.testMatches).toEqual(["Biel"]);
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
