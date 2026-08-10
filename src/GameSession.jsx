import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Cloud,
  Flame,
  Map as MapIcon,
  MessageSquare,
  Save,
  ScrollText,
  Send,
  Skull,
  Star,
} from "lucide-react";
import CharacterCreator from "./components/CharacterCreator.jsx";
import CharacterAvatar from "./components/CharacterAvatar.jsx";
import DiceRoller from "./components/DiceRoller.jsx";
import LevelUpModal from "./components/LevelUpModal.jsx";
import CampaignMap from "./components/CampaignMap.jsx";
import { XP_PER_LEVEL } from "./data/archetypes.js";
import {
  applyXpAwards,
  GAME_SCHEMA_VERSION,
  initPlayer,
  parseDirectives,
  sanitizeSnapshot,
} from "./game/engine.js";
import { supabase } from "./lib/supabase.js";

export default function GameSession({ campaign, userId, onExit }) {
  const [phase, setPhase] = useState("create-p1");
  const [players, setPlayers] = useState([null, null]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingTests, setPendingTests] = useState([]);
  const [levelUpQueue, setLevelUpQueue] = useState([]);
  const [revealedRegions, setRevealedRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [view, setView] = useState("chat");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("carregando");

  const scrollRef = useRef(null);
  const saveTimerRef = useRef(null);
  const suppressSaveUntilRef = useRef(0);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve(true));

  const currentSnapshot = useMemo(
    () =>
      sanitizeSnapshot({
        schemaVersion: GAME_SCHEMA_VERSION,
        phase,
        players,
        messages,
        pendingTests,
        levelUpQueue,
        revealedRegions,
        currentRegion,
        view,
      }),
    [phase, players, messages, pendingTests, levelUpQueue, revealedRegions, currentRegion, view]
  );

  const applySnapshot = useCallback((state) => {
    const safe = sanitizeSnapshot(state);
    setPhase(safe.phase);
    setPlayers(safe.players);
    setMessages(safe.messages);
    setPendingTests(safe.pendingTests);
    setLevelUpQueue(safe.levelUpQueue);
    setRevealedRegions(safe.revealedRegions);
    setCurrentRegion(safe.currentRegion);
    setView(safe.view);
  }, []);

  const persistSnapshot = useCallback(
    async (nextState, quiet = false) => {
      if (!hydrated) return true;
      if (!quiet) setSaveStatus("salvando");

      const { data, error: saveError } = await supabase.rpc("save_campaign_state", {
        p_campaign_id: campaign.id,
        p_expected_revision: revisionRef.current,
        p_state: nextState,
      });

      if (saveError) {
        const conflict = /SAVE_CONFLICT|40001/i.test(
          `${saveError.message || ""} ${saveError.code || ""}`
        );
        setSaveStatus(conflict ? "conflito" : "erro ao salvar");
        setError(
          conflict
            ? "Outro aparelho salvou esta campanha antes. Volte às campanhas e abra novamente para sincronizar antes de continuar."
            : `Falha no save: ${saveError.message}`
        );
        return false;
      }

      const row = Array.isArray(data) ? data[0] : data;
      revisionRef.current = Number(row?.new_revision ?? revisionRef.current + 1);
      dirtyRef.current = false;
      setSaveStatus("salvo");
      return true;
    },
    [campaign.id, hydrated]
  );

  const enqueueSave = useCallback(
    (nextState, quiet = false) => {
      saveQueueRef.current = saveQueueRef.current
        .catch(() => false)
        .then(() => persistSnapshot(nextState, quiet));
      return saveQueueRef.current;
    },
    [persistSnapshot]
  );

  useEffect(() => {
    let active = true;
    setHydrated(false);
    setSaveStatus("carregando");

    async function loadState() {
      const { data, error: loadError } = await supabase
        .from("campaign_state")
        .select("state,updated_at,updated_by,revision")
        .eq("campaign_id", campaign.id)
        .single();

      if (!active) return;
      if (loadError) {
        setError(`Não foi possível carregar o save: ${loadError.message}`);
      } else {
        revisionRef.current = Number(data?.revision || 0);
        if (data?.state && Object.keys(data.state).length > 0) {
          try {
            applySnapshot(data.state);
          } catch {
            setError("O save remoto está corrompido e não foi carregado.");
          }
        }
      }
      dirtyRef.current = false;
      setHydrated(true);
      setSaveStatus("salvo");
    }

    loadState();

    const channel = supabase
      .channel(`campaign-state-${campaign.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaign_state",
          filter: `campaign_id=eq.${campaign.id}`,
        },
        (payload) => {
          if (!active || payload.new?.updated_by === userId) return;
          if (dirtyRef.current) {
            setSaveStatus("conflito");
            setError(
              "Outro aparelho atualizou a campanha enquanto você tinha mudanças locais. Reabra a campanha para sincronizar sem sobrescrever silenciosamente."
            );
            return;
          }
          try {
            suppressSaveUntilRef.current = Date.now() + 1200;
            revisionRef.current = Number(payload.new?.revision || revisionRef.current);
            dirtyRef.current = false;
            applySnapshot(payload.new?.state || {});
            setSaveStatus("sincronizado");
          } catch {
            setError("Foi recebida uma atualização remota inválida.");
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSaveStatus("realtime indisponível");
        }
      });

    return () => {
      active = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [applySnapshot, campaign.id, userId]);

  useEffect(() => {
    if (!hydrated || Date.now() < suppressSaveUntilRef.current) return undefined;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    dirtyRef.current = true;
    setSaveStatus("salvando");
    saveTimerRef.current = setTimeout(() => enqueueSave(currentSnapshot, true), 650);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentSnapshot, enqueueSave, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingTests, levelUpQueue]);

  function handleP1Confirm(character) {
    try {
      setPlayers([initPlayer(character), null]);
      setPhase("create-p2");
      setError("");
    } catch (characterError) {
      setError(characterError.message);
    }
  }

  function handleP2Confirm(character) {
    try {
      const nextPlayer = initPlayer(character);
      if (players[0]?.nick.toLocaleLowerCase() === nextPlayer.nick.toLocaleLowerCase()) {
        setError("Os dois personagens precisam de nomes diferentes para os testes e recompensas funcionarem corretamente.");
        return;
      }
      setPlayers((previous) => [previous[0], nextPlayer]);
      setPhase("game");
      setError("");
    } catch (characterError) {
      setError(characterError.message);
    }
  }

  async function sendMessage(text) {
    const trimmed = text.trim().slice(0, 3_000);
    if (!trimmed || loading || saveStatus === "conflito") return;

    setError("");
    const newMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setPendingTests([]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sua sessão expirou. Saia e entre novamente.");

      const response = await fetch("/api/mestre", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          messages: newMessages,
          players,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Erro ${response.status}`);

      const { cleanText, testMatches, xpMatches, mapMatches } = parseDirectives(data.reply);
      setMessages((previous) => [...previous, { role: "model", text: cleanText }]);
      if (testMatches.length) setPendingTests(testMatches);
      if (xpMatches.length) {
        const result = applyXpAwards(players, xpMatches);
        setPlayers(result.players);
        if (result.levelUps.length) {
          setLevelUpQueue((queue) => [...queue, ...result.levelUps]);
        }
      }
      if (mapMatches.length) {
        setRevealedRegions((previous) => Array.from(new Set([...previous, ...mapMatches])));
        setCurrentRegion(mapMatches.at(-1));
      }
    } catch (requestError) {
      setError(requestError.message || "Algo deu errado ao falar com o mestre.");
      setMessages((previous) => previous.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  function handleDiceResult({ nick, attr, roll, modifier, total }) {
    setPendingTests((previous) => previous.filter((name) => name !== nick));
    sendMessage(`${nick} rolou ${attr}: ${roll} + ${modifier} = ${total}`);
  }

  function handleLevelChoice(playerIdx, choice) {
    setPlayers((previous) =>
      previous.map((player, index) => {
        if (index !== playerIdx) return player;
        if (choice.type === "improve") {
          return {
            ...player,
            skills: player.skills.map((skill) =>
              skill.name === choice.skillName
                ? { ...skill, level: Math.min(20, skill.level + 1) }
                : skill
            ),
          };
        }
        if (choice.type === "unlock") {
          const locked = player.archetype.lockedSkills.find(
            (skill) => skill.name === choice.skill?.name
          );
          if (!locked) return player;
          return {
            ...player,
            skills: [...player.skills, { ...locked, level: 1 }],
            archetype: {
              ...player.archetype,
              lockedSkills: player.archetype.lockedSkills.filter(
                (skill) => skill.name !== locked.name
              ),
            },
          };
        }
        return player;
      })
    );
    setLevelUpQueue((queue) => queue.slice(1));
  }

  async function exitToCampaigns() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const saved = await enqueueSave(currentSnapshot);
    if (saved) onExit();
  }

  const currentLevelUpNick = levelUpQueue[0];
  const currentLevelUpIdx = players.findIndex(
    (player) => player?.nick === currentLevelUpNick
  );

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0e0b0a] text-[#e8ddd0] flex items-center justify-center font-serif">
        <div className="text-center space-y-2">
          <Cloud size={26} className="mx-auto text-[#b8492f] animate-pulse" />
          <p className="text-sm text-[#8a7a6d]">Carregando campanha salva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0e0b0a] text-[#e8ddd0] flex flex-col font-serif">
      <header className="border-b border-[#2a1f1a] bg-[#120e0c] px-4 py-3 flex items-center justify-between gap-3 bg-noise">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={exitToCampaigns} className="text-[#8f7b6e] hover:text-[#e8ddd0]" aria-label="Voltar às campanhas"><ArrowLeft size={18} /></button>
          <Skull size={20} className="ember flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base tracking-wide truncate">{campaign.name}</h1>
            <p className="text-[10px] text-[#75655b] tracking-wider">Código {campaign.join_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] ${saveStatus.includes("erro") || saveStatus === "conflito" ? "text-[#d26b54]" : "text-[#8b7b70]"}`}>{saveStatus}</span>
          <button onClick={() => enqueueSave(currentSnapshot)} disabled={saveStatus === "conflito"} className="text-[#9d897c] hover:text-[#e8ddd0] disabled:opacity-40" aria-label="Salvar agora"><Save size={16} /></button>
        </div>
      </header>

      {phase === "create-p1" && <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CharacterCreator playerLabel="Jogador 1" onConfirm={handleP1Confirm} /></div>}
      {phase === "create-p2" && <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CharacterCreator playerLabel="Jogador 2" onConfirm={handleP2Confirm} /></div>}

      {phase === "game" && (
        <>
          <div className="flex gap-2 px-5 py-3 border-b border-[#2a1f1a] bg-[#120e0c]">
            {players.map((player, index) => {
              if (!player) return null;
              const xpInLevel = player.xp % XP_PER_LEVEL;
              const pct = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);
              return (
                <div key={index} className="flex items-center gap-2 bg-[#1a1310] border border-[#2a1f1a] rounded px-2 py-1.5 flex-1">
                  <div className="w-8 h-8 flex-shrink-0"><CharacterAvatar skinHex={player.skin.hex} hairHex={player.hair.hex} gender={player.archetype.gender} size={32} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1"><p className="text-xs font-medium truncate">{player.nick}</p><span className="text-[9px] ember flex items-center gap-0.5"><Star size={8} /> {player.level}</span></div>
                    <div className="w-full h-1 bg-[#0e0b0a] rounded-full mt-1 overflow-hidden"><div className="h-full bg-[#b8492f]" style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex border-b border-[#2a1f1a] bg-[#120e0c]">
            <button onClick={() => setView("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "chat" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MessageSquare size={13} /> Mesa</button>
            <button onClick={() => setView("map")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "map" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MapIcon size={13} /> Mapa</button>
          </div>

          {view === "map" ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CampaignMap revealedIds={revealedRegions} currentId={currentRegion} /></div>
          ) : (
            <>
              <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-noise">
                {messages.length === 0 && <div className="text-center py-16 space-y-3"><Flame size={28} className="ember mx-auto opacity-60" /><p className="text-[#8a7a6d] text-sm max-w-sm mx-auto leading-relaxed">Os personagens estão prontos. Escreva "vamos começar" para o mestre abrir a campanha.</p></div>}
                {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-[#2a1f1a]" : "bg-[#1a1310] border border-[#2a1f1a] text-[#d9cbb8]"}`}>{message.role === "model" && <div className="flex items-center gap-2 mb-1.5 text-xs ember tracking-wider uppercase font-display"><ScrollText size={12} /> Mestre</div>}{message.text}</div></div>)}
                {loading && <div className="flex justify-start"><div className="bg-[#1a1310] border border-[#2a1f1a] rounded px-4 py-3 text-sm text-[#8a7a6d] italic">O mestre está tecendo o destino de vocês...</div></div>}
                {error && <div className="text-center"><p className="text-xs text-[#d26b54] bg-[#1a1310] inline-block px-3 py-2 rounded border border-[#3a2419]">{error}</p></div>}
                {pendingTests.map((nick) => { const player = players.find((candidate) => candidate?.nick === nick); return player ? <DiceRoller key={nick} player={player} onRoll={handleDiceResult} /> : null; })}
              </main>
              <footer className="border-t border-[#2a1f1a] bg-[#120e0c] px-5 py-4"><div className="flex gap-2 items-end"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(input); } }} placeholder="O que vocês fazem?" rows={1} maxLength={3000} className="flex-1 bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f] resize-none" /><button onClick={() => sendMessage(input)} disabled={loading || !input.trim() || saveStatus === "conflito"} className="bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 text-[#f0e6da] p-2.5 rounded" aria-label="Enviar"><Send size={18} /></button></div></footer>
            </>
          )}

          {currentLevelUpIdx >= 0 && <LevelUpModal player={players[currentLevelUpIdx]} onChoose={(choice) => handleLevelChoice(currentLevelUpIdx, choice)} />}
        </>
      )}
    </div>
  );
}
