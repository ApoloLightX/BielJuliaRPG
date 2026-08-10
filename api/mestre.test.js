import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  normalizeMessages,
  sanitizePlayers,
} from "./mestre.js";

describe("mestre request hardening", () => {
  it("normaliza roles e limita mensagens", () => {
    const input = Array.from({ length: 80 }, (_, index) => ({
      role: index % 2 ? "model" : "admin",
      text: `mensagem-${index}`,
    }));
    const result = normalizeMessages(input);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.every((message) => ["user", "model"].includes(message.role))).toBe(true);
  });

  it("ignora jogadores malformados em vez de quebrar o endpoint", () => {
    expect(sanitizePlayers([null, { nick: "x" }])).toEqual([]);
    expect(() => buildSystemPrompt([null, { nick: "x" }])).not.toThrow();
  });

  it("limita campos controlados pelo cliente", () => {
    const [player] = sanitizePlayers([
      {
        nick: "N".repeat(100),
        archetype: {
          name: "Guerreiro",
          role: "Tanque",
          attrs: { forca: 999, astucia: -5, vigor: 3, vontade: 2 },
          skills: [{ name: "Golpe" }],
        },
      },
    ]);
    expect(player.nick).toHaveLength(20);
    expect(player.attrs.forca).toBe(4);
    expect(player.attrs.astucia).toBe(1);
  });
});
