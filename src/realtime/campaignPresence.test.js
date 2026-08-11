import { describe, expect, it } from "vitest";
import {
  applyTypingClientEvent,
  buildPartyPresence,
  extractOnlineUserIds,
  getTypingUserIds,
  normalizeRealtimeUserId,
  sortCampaignMembers,
} from "./campaignPresence.js";

const OWNER = "550e8400-e29b-41d4-a716-446655440000";
const PLAYER = "550e8400-e29b-41d4-a716-446655440001";

describe("campaign presence helpers", () => {
  it("aceita apenas UUIDs válidos", () => {
    expect(normalizeRealtimeUserId(OWNER)).toBe(OWNER);
    expect(normalizeRealtimeUserId("../../intruso")).toBeNull();
  });

  it("ordena owner antes do segundo membro", () => {
    const members = sortCampaignMembers([
      { user_id: PLAYER, role: "player", joined_at: "2026-08-11T10:01:00Z" },
      { user_id: OWNER, role: "owner", joined_at: "2026-08-11T10:02:00Z" },
    ]);
    expect(members.map((member) => member.user_id)).toEqual([OWNER, PLAYER]);
  });

  it("extrai usuários online sem duplicar múltiplas abas", () => {
    const result = extractOnlineUserIds({
      tab1: [{ userId: OWNER }],
      tab2: [{ userId: OWNER }],
      tab3: [{ userId: PLAYER }],
      malformed: [{ userId: "not-a-uuid" }],
    });
    expect(new Set(result)).toEqual(new Set([OWNER, PLAYER]));
  });

  it("mapeia membros para os personagens da campanha", () => {
    const party = buildPartyPresence(
      [
        { user_id: PLAYER, role: "player", joined_at: "2026-08-11T10:01:00Z" },
        { user_id: OWNER, role: "owner", joined_at: "2026-08-11T10:00:00Z" },
      ],
      [{ nick: "Biel" }, { nick: "Julia" }],
      [OWNER],
      [PLAYER]
    );
    expect(party).toEqual([
      { userId: OWNER, label: "Biel", online: true, typing: false },
      { userId: PLAYER, label: "Julia", online: false, typing: true },
    ]);
  });

  it("expira typing e separa múltiplos clientes", () => {
    let clients = new Map();
    clients = applyTypingClientEvent(clients, { userId: OWNER, clientId: "tab-a", typing: true }, 1_000);
    clients = applyTypingClientEvent(clients, { userId: OWNER, clientId: "tab-b", typing: true }, 1_500);
    expect(getTypingUserIds(clients, 2_000)).toEqual([OWNER]);
    expect(getTypingUserIds(clients, 4_600)).toEqual([]);
    clients = applyTypingClientEvent(clients, { userId: OWNER, clientId: "tab-a", typing: false }, 2_000);
    expect(clients.has("tab-a")).toBe(false);
    expect(clients.has("tab-b")).toBe(true);
  });
});
