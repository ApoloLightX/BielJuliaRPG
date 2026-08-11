import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  createGeminiPayload,
  createGroqPayload,
  DEFAULT_GROQ_MODEL,
  normalizeCampaignId,
  normalizeMessages,
  sanitizeCombat,
  sanitizePlayers,
} from "./mestre.js";

describe("mestre request hardening", () => {
  it("normaliza roles e limita mensagens", () => {
    const input = Array.from({ length: 80 }, (_, index) => ({ role: index % 2 ? "model" : "admin", text: `mensagem-${index}` }));
    const result = normalizeMessages(input);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.every((message) => ["user", "model"].includes(message.role))).toBe(true);
  });

  it("ignora jogadores malformados em vez de quebrar o endpoint", () => {
    expect(sanitizePlayers([null, { nick: "x" }])).toEqual([]);
    expect(() => buildSystemPrompt([null, { nick: "x" }])).not.toThrow();
  });

  it("limita campos do cliente e recalcula HP pelo Vigor", () => {
    const [player] = sanitizePlayers([{
      nick: "N".repeat(100),
      archetype: { name: "Guerreiro", role: "Tanque", attrs: { forca: 999, astucia: -5, vigor: 3, vontade: 2 }, skills: [{ name: "Golpe" }] },
      hp: 999,
      maxHp: 999,
      inventory: ["Poção", "x".repeat(200)],
    }]);
    expect(player.nick).toHaveLength(20);
    expect(player.attrs.forca).toBe(4);
    expect(player.attrs.astucia).toBe(1);
    expect(player.maxHp).toBe(19);
    expect(player.hp).toBe(19);
    expect(player.inventory[1]).toHaveLength(80);
  });

  it("sanitiza combate contra jogadores conhecidos", () => {
    const players = sanitizePlayers([{
      nick: "Biel",
      archetype: { name: "Guerreiro", role: "Tanque", attrs: { forca: 4, astucia: 1, vigor: 4, vontade: 1 }, skills: [] },
    }]);
    const combat = sanitizeCombat({ name: "Emboscada", order: [
      { type: "player", name: "Biel" },
      { type: "player", name: "Intruso" },
      { type: "enemy", name: "Lobo", hp: 500, maxHp: 12 },
    ] }, players);
    expect(combat.order).toEqual([
      { type: "player", name: "Biel" },
      { type: "enemy", name: "Lobo", hp: 12, maxHp: 12 },
    ]);
  });

  it("inclui regras fechadas de HP e marcadores de combate no prompt", () => {
    const prompt = buildSystemPrompt([{
      nick: "Biel",
      archetype: { name: "Guerreiro", role: "Tanque", attrs: { forca: 4, astucia: 1, vigor: 4, vontade: 1 }, skills: [] },
      hp: 10,
      inventory: ["Lanterna"],
    }], { name: "Emboscada", order: [{ type: "enemy", name: "Lobo", hp: 6, maxHp: 12 }, { type: "player", name: "Biel" }] });
    expect(prompt).toContain("PONTOS DE VIDA");
    expect(prompt).toContain("[[DANO: nick do jogador | quantidade]]");
    expect(prompt).toContain("COMBATE EM ANDAMENTO: Emboscada");
    expect(prompt).toContain("Lanterna");
  });

  it("usa um modelo Groq de produção que não depende do modelo legado", () => {
    expect(DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-120b");
    const payload = createGroqPayload("sistema", [{ role: "user", text: "oi" }]);
    expect(payload.model).toBe(DEFAULT_GROQ_MODEL);
    expect(payload.messages[0]).toEqual({ role: "system", content: "sistema" });
  });

  it("usa systemInstruction camelCase no Gemini", () => {
    const payload = createGeminiPayload("sistema", [{ role: "model", text: "resposta" }]);
    expect(payload.systemInstruction).toEqual({ parts: [{ text: "sistema" }] });
    expect(payload.system_instruction).toBeUndefined();
    expect(payload.contents[0]).toEqual({ role: "model", parts: [{ text: "resposta" }] });
  });

  it("aceita somente campaign IDs UUID válidos", () => {
    expect(normalizeCampaignId("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(normalizeCampaignId("../../outra-campanha")).toBeNull();
    expect(normalizeCampaignId("not-a-uuid")).toBeNull();
  });
});
