import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import {
  applyTypingClientEvent,
  buildPartyPresence,
  extractOnlineUserIds,
  getTypingUserIds,
  normalizeRealtimeUserId,
} from "./campaignPresence.js";

function makeClientId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function useCampaignPresence({ campaignId, userId, players }) {
  const [members, setMembers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [status, setStatus] = useState("CONNECTING");

  const channelRef = useRef(null);
  const clientIdRef = useRef(makeClientId());
  const typingClientsRef = useRef(new Map());
  const localTypingRef = useRef(false);
  const localTypingTimerRef = useRef(null);
  const remoteTypingTimersRef = useRef(new Map());

  const safeUserId = normalizeRealtimeUserId(userId);

  const refreshTypingUsers = useCallback(() => {
    const now = Date.now();
    for (const [clientId, value] of typingClientsRef.current.entries()) {
      if (value.expiresAt <= now) typingClientsRef.current.delete(clientId);
    }
    setTypingUserIds(getTypingUserIds(typingClientsRef.current, now));
  }, []);

  const sendTyping = useCallback((typing) => {
    const channel = channelRef.current;
    if (!channel || status !== "SUBSCRIBED" || !safeUserId) return;
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: safeUserId, clientId: clientIdRef.current, typing: typing === true },
    }).catch(() => {});
  }, [safeUserId, status]);

  const stopTyping = useCallback(() => {
    if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);
    localTypingTimerRef.current = null;
    if (!localTypingRef.current) return;
    localTypingRef.current = false;
    sendTyping(false);
  }, [sendTyping]);

  const handleTypingInput = useCallback((value) => {
    const hasText = typeof value === "string" && value.trim().length > 0;
    if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);

    if (!hasText) {
      stopTyping();
      return;
    }

    if (!localTypingRef.current) {
      localTypingRef.current = true;
      sendTyping(true);
    }

    localTypingTimerRef.current = setTimeout(() => {
      localTypingTimerRef.current = null;
      if (!localTypingRef.current) return;
      localTypingRef.current = false;
      sendTyping(false);
    }, 1_400);
  }, [sendTyping, stopTyping]);

  useEffect(() => {
    let active = true;
    async function loadMembers() {
      const { data, error } = await supabase
        .from("campaign_members")
        .select("user_id,role,joined_at")
        .eq("campaign_id", campaignId)
        .order("joined_at", { ascending: true });
      if (!active) return;
      if (!error) setMembers(data || []);
    }
    loadMembers();
    return () => { active = false; };
  }, [campaignId]);

  useEffect(() => {
    if (!safeUserId || !campaignId) return undefined;
    let active = true;
    const remoteTypingTimers = remoteTypingTimersRef.current;
    const topic = `campaign:${campaignId}`;
    const channel = supabase.channel(topic, {
      config: {
        private: true,
        broadcast: { self: false },
      },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        if (!active) return;
        setOnlineUserIds(extractOnlineUserIds(channel.presenceState()));
      })
      .on("presence", { event: "leave" }, () => {
        if (!active) return;
        setOnlineUserIds(extractOnlineUserIds(channel.presenceState()));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!active) return;
        const clientId = typeof payload?.clientId === "string" ? payload.clientId.trim().slice(0, 80) : "";
        typingClientsRef.current = applyTypingClientEvent(typingClientsRef.current, payload);
        if (clientId) {
          const oldTimer = remoteTypingTimers.get(clientId);
          if (oldTimer) clearTimeout(oldTimer);
          if (payload?.typing === true) {
            const timer = setTimeout(() => {
              typingClientsRef.current.delete(clientId);
              remoteTypingTimers.delete(clientId);
              refreshTypingUsers();
            }, 3_100);
            remoteTypingTimers.set(clientId, timer);
          } else {
            remoteTypingTimers.delete(clientId);
          }
        }
        refreshTypingUsers();
      })
      .subscribe(async (nextStatus) => {
        if (!active) return;
        setStatus(nextStatus);
        if (nextStatus === "SUBSCRIBED") {
          await channel.track({ userId: safeUserId, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      active = false;
      if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);
      for (const timer of remoteTypingTimers.values()) clearTimeout(timer);
      remoteTypingTimers.clear();
      localTypingRef.current = false;
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [campaignId, refreshTypingUsers, safeUserId]);

  const party = useMemo(
    () => buildPartyPresence(members, players, onlineUserIds, typingUserIds),
    [members, onlineUserIds, players, typingUserIds]
  );

  return { party, status, handleTypingInput, stopTyping };
}
