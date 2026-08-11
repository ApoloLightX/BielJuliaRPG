const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeRealtimeUserId(value) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

export function sortCampaignMembers(members) {
  if (!Array.isArray(members)) return [];
  return members
    .filter((member) => normalizeRealtimeUserId(member?.user_id))
    .map((member) => ({
      user_id: member.user_id.toLowerCase(),
      role: member.role === "owner" ? "owner" : "player",
      joined_at: typeof member.joined_at === "string" ? member.joined_at : "",
    }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.joined_at.localeCompare(b.joined_at);
    })
    .slice(0, 2);
}

export function extractOnlineUserIds(presenceState) {
  const online = new Set();
  if (!presenceState || typeof presenceState !== "object" || Array.isArray(presenceState)) return [];
  for (const presences of Object.values(presenceState)) {
    if (!Array.isArray(presences)) continue;
    for (const presence of presences) {
      const userId = normalizeRealtimeUserId(presence?.userId);
      if (userId) online.add(userId);
    }
  }
  return [...online];
}

export function buildPartyPresence(members, players, onlineUserIds = [], typingUserIds = []) {
  const sortedMembers = sortCampaignMembers(members);
  const online = new Set(onlineUserIds.map(normalizeRealtimeUserId).filter(Boolean));
  const typing = new Set(typingUserIds.map(normalizeRealtimeUserId).filter(Boolean));

  return sortedMembers.map((member, index) => ({
    userId: member.user_id,
    label: players?.[index]?.nick || `Jogador ${index + 1}`,
    online: online.has(member.user_id),
    typing: typing.has(member.user_id),
  }));
}

export function applyTypingClientEvent(currentClients, payload, now = Date.now()) {
  const next = new Map(currentClients instanceof Map ? currentClients : []);
  const userId = normalizeRealtimeUserId(payload?.userId);
  const clientId = typeof payload?.clientId === "string" ? payload.clientId.trim().slice(0, 80) : "";
  if (!userId || !clientId) return next;

  if (payload?.typing === true) next.set(clientId, { userId, expiresAt: now + 3_000 });
  else next.delete(clientId);
  return next;
}

export function getTypingUserIds(currentClients, now = Date.now()) {
  const typing = new Set();
  if (!(currentClients instanceof Map)) return [];
  for (const { userId, expiresAt } of currentClients.values()) {
    if (expiresAt > now) typing.add(userId);
  }
  return [...typing];
}
