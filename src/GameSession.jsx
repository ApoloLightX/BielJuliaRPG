import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Backpack,
  BookOpen,
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
import AdventureJournal from "./components/AdventureJournal.jsx";
import CampaignMap from "./components/CampaignMap.jsx";
import CharacterAvatar from "./components/CharacterAvatar.jsx";
import CharacterCreator from "./components/CharacterCreator.jsx";
import CharacterSheet from "./components/CharacterSheet.jsx";
import CombatTracker from "./components/CombatTracker.jsx";
import DiceRoller from "./components/DiceRoller.jsx";
import LevelUpModal from "./components/LevelUpModal.jsx";
import PartyPresence from "./components/PartyPresence.jsx";
import QuickActions from "./components/QuickActions.jsx";
import { XP_PER_LEVEL } from "./data/archetypes.js";
import {
  advanceCombatTurn,
  applyEnemyDamage,
  applyHpEffects,
  applyJournalUpdates,
  applyXpAwards,
  GAME_SCHEMA_VERSION,
  initPlayer,
  parseDirectives,
  sanitizeCombat,
  sanitizeSnapshot,
} from "./game/engine.js";
import { supabase } from "./lib/supabase.js";
import useCampaignPresence from "./realtime/useCampaignPresence.js";

function hpBarClass(player) {
  const pct = player.maxHp ? (player.hp / player.maxHp) * 100 : 0;
  if (pct > 50) return "bg-[#6a8a4a]";
  if (pct > 20) return "bg-[#c98a2a]";
  return "bg-[#b8492f]";
}

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
  const [combat, setCombat] = useState(null);
  const [journal, setJournal] = useState({ summary: "", objective: "", clues: [], npcs: [], decisions: [] });
  const [view, setView] = useState("chat");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("carregando");

  const scrollRef = useRef(null);
  const saveTimerRef = useRef(null);
  const suppressSaveUntilRef = useRef(0);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve(true));

  const {
    party,
    status: presenceStatus,
    handleTypingInput,
    stopTyping,
  } = useCampaignPresence({ campaignId: campaign.id, userId, players });

  const currentSnapshot = useMemo(
    () => sanitizeSnapshot({ schemaVersion: GAME_SCHEMA_VERSION, phase, players, messages, pendingTests, levelUpQueue, revealedRegions, currentRegion, combat, journal, view }),
    [phase, players, messages, pendingTests, levelUpQueue, revealedRegions, currentRegion, combat, journal, view]
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
    setCombat(safe.combat);
    setJournal(safe.journal);
    setView(safe.view);
  }, []);

  const persistSnapshot = useCallback(async (nextState, quiet = false) => {
    if (!hydrated) return true;
    if (!quiet) setSaveStatus("salvando");
    const { data, error: saveError } = await supabase.rpc("save_campaign_state", {
      p_campaign_id: campaign.id,
      p_expected_revision: revisionRef.current,
      p_state: nextState,
    });
    if (saveError) {
      const conflict = /SAVE_CONFLICT|40001/i.test(`${saveError.message || ""} ${saveError.code || ""}`);
      setSaveStatus(conflict ? "conflito" : "erro ao salvar");
      setError(conflict ? "Outro aparelho salvou esta campanha antes. Volte às campanhas e abra novamente para sincronizar." : `Falha no save: ${saveError.message}`);
      return false;
    }
    const row = Array.isArray(data) ? data[0] : data;
    revisionRef.current = Number(row?.new_revision ?? revisionRef.current + 1);
    dirtyRef.current = false;
    setSaveStatus("salvo");
    return true;
  }, [campaign.id, hydrated]);

  const enqueueSave = useCallback((nextState, quiet = false) => {
    saveQueueRef.current = saveQueueRef.current.catch(() => false).then(() => persistSnapshot(nextState, quiet));
    return saveQueueRef.current;
  }, [persistSnapshot]);

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
      if (loadError) setError(`Não foi possível carregar o save: ${loadError.message}`);
      else {
        revisionRef.current = Number(data?.revision || 0);
        if (data?.state && Object.keys(data.state).length > 0) {
          try { applySnapshot(data.state); }
          catch { setError("O save remoto está corrompido e não foi carregado."); }
        }
      }
      dirtyRef.current = false;
      setHydrated(true);
      setSaveStatus("salvo");
    }

    loadState();

    const stateChannel = supabase
      .channel(`campaign-state-${campaign.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "campaign_state",
        filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => {
        if (!active || payload.new?.updated_by === userId) return;
        if (dirtyRef.current) {
          setSaveStatus("conflito");
          setError("Outro aparelho atualizou a campanha enquanto você tinha mudanças locais. Reabra a campanha para sincronizar sem sobrescrever.");
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
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSaveStatus("realtime indisponível");
      });

    return () => {
      active = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      supabase.removeChannel(stateChannel);
    };
  }, [applySnapshot, campaign.id, userId]);

  useEffect(() => {
    if (!hydrated || Date.now() < suppressSaveUntilRef.current) return undefined;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    dirtyRef.current = true;
    setSaveStatus("salvando");
    saveTimerRef.current = setTimeout(() => enqueueSave(currentSnapshot, true), 650);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [currentSnapshot, enqueueSave, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingTests, levelUpQueue, combat]);

  function handleP1Confirm(character) {
    try { setPlayers([initPlayer(character), null]); setPhase("create-p2"); setError(""); }
    catch (characterError) { setError(characterError.message); }
  }

  function handleP2Confirm(character) {
    try {
      const nextPlayer = initPlayer(character);
      if (players[0]?.nick.toLocaleLowerCase() === nextPlayer.nick.toLocaleLowerCase()) {
        setError("Os dois personagens precisam de nomes diferentes.");
        return;
      }
      setPlayers((previous) => [previous[0], nextPlayer]);
      setPhase("game");
      setError("");
    } catch (characterError) {
      setError(characterError.message);
    }
  }

  function applyMasterDirectives(reply, { advanceTurnAfter = false } = {}) {
    const directives = parseDirectives(reply);
    if (directives.cleanText) setMessages((previous) => [...previous, { role: "model", text: directives.cleanText }]);
    if (directives.testMatches.length) setPendingTests(directives.testMatches);

    let nextPlayers = players;
    if (directives.xpMatches.length) {
      const xpResult = applyXpAwards(nextPlayers, directives.xpMatches);
      nextPlayers = xpResult.players;
      if (xpResult.levelUps.length) setLevelUpQueue((queue) => [...queue, ...xpResult.levelUps]);
    }
    if (directives.damageMatches.length || directives.healMatches.length) {
      nextPlayers = applyHpEffects(nextPlayers, directives.damageMatches, directives.healMatches);
    }
    if (nextPlayers !== players) setPlayers(nextPlayers);

    if (directives.mapMatches.length) {
      setRevealedRegions((previous) => Array.from(new Set([...previous, ...directives.mapMatches])));
      setCurrentRegion(directives.mapMatches.at(-1));
    }

    setJournal((current) => applyJournalUpdates(current, directives.journalUpdates));

    let nextCombat = combat;
    if (directives.startCombat) nextCombat = sanitizeCombat(directives.startCombat, nextPlayers);
    if (directives.enemyDamageMatches.length) nextCombat = applyEnemyDamage(nextCombat, directives.enemyDamageMatches);
    if (directives.endCombat) nextCombat = null;
    else if (advanceTurnAfter && nextCombat) nextCombat = advanceCombatTurn(nextCombat, nextPlayers);
    if (nextCombat !== combat) setCombat(nextCombat);
  }

  async function sendMessage(text, options = {}) {
    const trimmed = text.trim().slice(0, 3_000);
    if (!trimmed || loading || saveStatus === "conflito") return;
    stopTyping();
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campaignId: campaign.id, messages: newMessages, players, combat, journal }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Erro ${response.status}`);
      applyMasterDirectives(data.reply, options);
    } catch (requestError) {
      setError(requestError.message || "Algo deu errado ao falar com o mestre.");
      setMessages((previous) => previous.slice(0, -1));
      setInput(trimmed);
      handleTypingInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  function handleDiceResult({ nick, attr, roll, modifier, total }) {
    setPendingTests((previous) => previous.filter((name) => name !== nick));
    sendMessage(`${nick} rolou ${attr}: ${roll} + ${modifier} = ${total}`);
  }

  function handleInputChange(event) {
    const value = event.target.value;
    setInput(value);
    handleTypingInput(value);
  }

  function changeHp(playerIdx, delta) {
    setPlayers((previous) => previous.map((player, index) => index !== playerIdx || !player ? player : { ...player, hp: Math.max(0, Math.min(player.maxHp, player.hp + delta)) }));
  }

  function addItem(playerIdx, item) {
    setPlayers((previous) => previous.map((player, index) => {
      if (index !== playerIdx || !player || player.inventory.length >= 20) return player;
      return { ...player, inventory: [...player.inventory, item.trim().slice(0, 80)].filter(Boolean) };
    }));
  }

  function removeItem(playerIdx, itemIdx) {
    setPlayers((previous) => previous.map((player, index) => index === playerIdx && player ? { ...player, inventory: player.inventory.filter((_, current) => current !== itemIdx) } : player));
  }

  function handleLevelChoice(playerIdx, choice) {
    setPlayers((previous) => previous.map((player, index) => {
      if (index !== playerIdx) return player;
      if (choice.type === "improve") {
        return { ...player, skills: player.skills.map((skill) => skill.name === choice.skillName ? { ...skill, level: Math.min(20, skill.level + 1) } : skill) };
      }
      if (choice.type === "unlock") {
        const locked = player.archetype.lockedSkills.find((skill) => skill.name === choice.skill?.name);
        if (!locked) return player;
        return {
          ...player,
          skills: [...player.skills, { ...locked, level: 1 }],
          archetype: { ...player.archetype, lockedSkills: player.archetype.lockedSkills.filter((skill) => skill.name !== locked.name) },
        };
      }
      return player;
    }));
    setLevelUpQueue((queue) => queue.slice(1));
  }

  function handleAdvanceTurn() {
    setCombat((current) => advanceCombatTurn(current, players));
  }

  async function exitToCampaigns() {
    stopTyping();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const saved = await enqueueSave(currentSnapshot);
    if (saved) onExit();
  }

  const currentLevelUpNick = levelUpQueue[0];
  const currentLevelUpIdx = players.findIndex((player) => player?.nick === currentLevelUpNick);
  const interactionBlocked = loading || saveStatus === "conflito";

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
          <button type="button" onClick={exitToCampaigns} className="text-[#8f7b6e] hover:text-[#e8ddd0]" aria-label="Voltar às campanhas"><ArrowLeft size={18} /></button>
          <Skull size={20} className="ember flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base tracking-wide truncate">{campaign.name}</h1>
            <p className="text-[10px] text-[#75655b] tracking-wider">Código {campaign.join_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] ${saveStatus.includes("erro") || saveStatus === "conflito" ? "text-[#d26b54]" : "text-[#8b7b70]"}`}>{saveStatus}</span>
          <button type="button" onClick={() => enqueueSave(currentSnapshot)} disabled={saveStatus === "conflito"} className="text-[#9d897c] hover:text-[#e8ddd0] disabled:opacity-40" aria-label="Salvar agora"><Save size={16} /></button>
        </div>
      </header>

      {phase === "game" && <PartyPresence party={party} status={presenceStatus} />}

      {phase === "create-p1" && <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CharacterCreator playerLabel="Jogador 1" onConfirm={handleP1Confirm} /></div>}
      {phase === "create-p2" && <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CharacterCreator playerLabel="Jogador 2" onConfirm={handleP2Confirm} /></div>}

      {phase === "game" && (
        <>
          <div className="flex gap-2 px-3 sm:px-5 py-3 border-b border-[#2a1f1a] bg-[#120e0c]">
            {players.map((player, index) => {
              if (!player) return null;
              const xpPct = Math.min(100, ((player.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
              const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
              return (
                <div key={index} className="flex items-center gap-2 bg-[#1a1310] border border-[#2a1f1a] rounded px-2 py-1.5 flex-1 min-w-0">
                  <CharacterAvatar skinHex={player.skin.hex} hairHex={player.hair.hex} gender={player.archetype.gender} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1"><p className="text-xs font-medium truncate">{player.nick}</p><span className="text-[9px] ember flex items-center gap-0.5"><Star size={8} /> {player.level}</span></div>
                    <div className="w-full h-1 bg-[#0e0b0a] rounded-full mt-1 overflow-hidden"><div className={hpBarClass(player)} style={{ width: `${hpPct}%`, height: "100%" }} /></div>
                    <div className="w-full h-0.5 bg-[#0e0b0a] rounded-full mt-1 overflow-hidden"><div className="h-full bg-[#7050a0]" style={{ width: `${xpPct}%` }} /></div>
                    <p className="text-[9px] text-[#76675d] mt-0.5">HP {player.hp}/{player.maxHp}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <nav className="flex border-b border-[#2a1f1a] bg-[#120e0c] overflow-x-auto" aria-label="Visões da campanha">
            <button type="button" onClick={() => setView("chat")} className={`min-w-[80px] flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "chat" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MessageSquare size={13} /> Mesa</button>
            <button type="button" onClick={() => setView("map")} className={`min-w-[80px] flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "map" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MapIcon size={13} /> Mapa</button>
            <button type="button" onClick={() => setView("sheet")} className={`min-w-[80px] flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "sheet" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><Backpack size={13} /> Fichas</button>
            <button type="button" onClick={() => setView("journal")} className={`min-w-[80px] flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display ${view === "journal" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><BookOpen size={13} /> Diário</button>
          </nav>

          {view === "map" ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CampaignMap revealedIds={revealedRegions} currentId={currentRegion} /></div>
          ) : view === "sheet" ? (
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 bg-noise"><div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">{players.map((player, index) => player ? <CharacterSheet key={player.nick} player={player} onChangeHp={(delta) => changeHp(index, delta)} onAddItem={(item) => addItem(index, item)} onRemoveItem={(itemIndex) => removeItem(index, itemIndex)} /> : null)}</div></div>
          ) : view === "journal" ? (
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 bg-noise"><AdventureJournal journal={journal} /></div>
          ) : (
            <>
              <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-6 space-y-5 bg-noise">
                {combat && <CombatTracker combat={combat} players={players} onAdvanceTurn={handleAdvanceTurn} disabled={interactionBlocked} />}
                {messages.length === 0 && <div className="text-center py-16 space-y-3"><Flame size={28} className="ember mx-auto opacity-60" /><p className="text-[#8a7a6d] text-sm max-w-sm mx-auto leading-relaxed">Os personagens estão prontos. Escreva “vamos começar” para o mestre abrir a campanha.</p></div>}
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-[#2a1f1a]" : "bg-[#1a1310] border border-[#2a1f1a] text-[#d9cbb8]"}`}>
                      {message.role === "model" && <div className="flex items-center gap-2 mb-1.5 text-xs ember tracking-wider uppercase font-display"><ScrollText size={12} /> Mestre</div>}
                      {message.text}
                    </div>
                  </div>
                ))}
                {loading && <div className="flex justify-start"><div className="bg-[#1a1310] border border-[#2a1f1a] rounded px-4 py-3 text-sm text-[#8a7a6d] italic">O mestre está tecendo o destino de vocês...</div></div>}
                {error && <div className="text-center"><p className="text-xs text-[#d26b54] bg-[#1a1310] inline-block px-3 py-2 rounded border border-[#3a2419]">{error}</p></div>}
                {pendingTests.map((nick) => { const player = players.find((candidate) => candidate?.nick === nick); return player ? <DiceRoller key={nick} player={player} onRoll={handleDiceResult} /> : null; })}
              </main>

              <QuickActions players={players} combat={combat} disabled={interactionBlocked} onPrefill={(value) => { setInput(value); handleTypingInput(value); }} onSend={(text) => sendMessage(text, { advanceTurnAfter: true })} />

              <footer className="border-t border-[#2a1f1a] bg-[#120e0c] px-4 sm:px-5 py-4">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder={combat ? "Descreva a ação do personagem no turno" : "O que vocês fazem?"}
                    rows={1}
                    maxLength={3000}
                    className="flex-1 bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f] resize-none"
                  />
                  <button type="button" onClick={() => sendMessage(input)} disabled={interactionBlocked || !input.trim()} className="bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 text-[#f0e6da] p-2.5 rounded" aria-label="Enviar"><Send size={18} /></button>
                </div>
              </footer>
            </>
          )}

          {currentLevelUpIdx >= 0 && <LevelUpModal player={players[currentLevelUpIdx]} onChoose={(choice) => handleLevelChoice(currentLevelUpIdx, choice)} />}
        </>
      )}
    </div>
  );
}
