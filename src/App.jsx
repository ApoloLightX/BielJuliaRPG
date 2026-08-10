import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  Flame,
  Map as MapIcon,
  MessageSquare,
  RotateCcw,
  ScrollText,
  Send,
  Skull,
  Star,
  Upload,
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

const STORAGE_KEY = "biel-julia-rpg-local-v1";

function encodeSave(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function decodeSave(code) {
  if (typeof code !== "string" || code.length > 2_000_000) {
    throw new Error("Save inválido");
  }
  const binary = atob(code.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return sanitizeSnapshot(JSON.parse(new TextDecoder().decode(bytes)));
}

function App({ onExit }) {
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applySnapshot(JSON.parse(raw));
        setSaveStatus("restaurado");
      } else {
        setSaveStatus("novo");
      }
    } catch (error) {
      console.error("Falha ao restaurar save local", error);
      localStorage.removeItem(STORAGE_KEY);
      setSaveStatus("novo");
      setError("O save local estava inválido e foi ignorado para proteger a campanha.");
    } finally {
      setHydrated(true);
    }
  }, [applySnapshot]);

  useEffect(() => {
    if (!hydrated) return undefined;
    setSaveStatus("salvando");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
        setSaveStatus("salvo");
      } catch (error) {
        console.error("Falha ao salvar localmente", error);
        setSaveStatus("erro no save");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [currentSnapshot, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingTests, levelUpQueue]);

  async function exportSave() {
    try {
      const code = encodeSave(currentSnapshot);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setSaveStatus("código copiado");
        window.alert("Código do save copiado. Guarde-o em um local seguro para continuar em outro aparelho.");
      } else {
        window.prompt("Copie este código de save:", code);
      }
    } catch (error) {
      setError(`Não foi possível exportar o save: ${error.message}`);
    }
  }

  function importSave() {
    const code = window.prompt("Cole o código de save recebido:");
    if (!code) return;
    try {
      const state = decodeSave(code);
      applySnapshot(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveStatus("save importado");
      setError("");
      window.alert("Save importado e validado neste aparelho.");
    } catch {
      setError("Código de save inválido, corrompido ou incompatível.");
    }
  }

  function resetLocalSave() {
    if (!window.confirm("Apagar o save local deste aparelho e começar uma campanha nova?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function handleP1Confirm(character) {
    try {
      setPlayers([initPlayer(character), null]);
      setPhase("create-p2");
      setError("");
    } catch (error) {
      setError(error.message);
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
    } catch (error) {
      setError(error.message);
    }
  }

  async function sendMessage(text) {
    const trimmed = text.trim().slice(0, 3_000);
    if (!trimmed || loading) return;

    setError("");
    const newMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setPendingTests([]);

    try {
      const response = await fetch("/api/mestre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, players }),
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
              skill.name === choice.skillName ? { ...skill, level: Math.min(20, skill.level + 1) } : skill
            ),
          };
        }
        if (choice.type === "unlock") {
          const locked = player.archetype.lockedSkills.find((skill) => skill.name === choice.skill?.name);
          if (!locked) return player;
          return {
            ...player,
            skills: [...player.skills, { ...locked, level: 1 }],
            archetype: {
              ...player.archetype,
              lockedSkills: player.archetype.lockedSkills.filter((skill) => skill.name !== locked.name),
            },
          };
        }
        return player;
      })
    );
    setLevelUpQueue((queue) => queue.slice(1));
  }

  const currentLevelUpNick = levelUpQueue[0];
  const currentLevelUpIdx = players.findIndex((player) => player?.nick === currentLevelUpNick);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0e0b0a] text-[#e8ddd0] flex items-center justify-center font-serif">
        <p className="text-sm text-[#8a7a6d]">Abrindo save local...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0e0b0a] text-[#e8ddd0] flex flex-col font-serif">
      <header className="border-b border-[#2a1f1a] bg-[#120e0c] px-3 sm:px-5 py-3 flex items-center justify-between gap-2 bg-noise">
        <div className="flex items-center gap-2 min-w-0">
          {onExit && (
            <button onClick={onExit} className="text-[#8f7b6e] hover:text-[#e8ddd0]" aria-label="Voltar">
              <ArrowLeft size={18} />
            </button>
          )}
          <Skull size={20} className="ember flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-lg tracking-wide truncate">A Mesa Sob a Sombra</h1>
            <p className="text-[10px] sm:text-xs text-[#8a7a6d]">Modo local · {saveStatus}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={exportSave} className="p-2 text-[#a99284] hover:text-[#e8ddd0]" title="Copiar código do save" aria-label="Exportar save"><ClipboardCopy size={16} /></button>
          <button onClick={importSave} className="p-2 text-[#a99284] hover:text-[#e8ddd0]" title="Importar save" aria-label="Importar save"><Upload size={16} /></button>
          <button onClick={resetLocalSave} className="p-2 text-[#7f6e63] hover:text-[#d26b54]" title="Nova campanha" aria-label="Resetar save"><RotateCcw size={16} /></button>
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
                    <div className="flex items-center gap-1"><p className="text-xs font-medium text-[#e8ddd0] truncate">{player.nick}</p><span className="text-[9px] ember flex items-center gap-0.5 flex-shrink-0"><Star size={8} /> {player.level}</span></div>
                    <div className="w-full h-1 bg-[#0e0b0a] rounded-full mt-1 overflow-hidden"><div className="h-full bg-[#b8492f]" style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex border-b border-[#2a1f1a] bg-[#120e0c]">
            <button onClick={() => setView("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display transition-colors ${view === "chat" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MessageSquare size={13} /> Mesa</button>
            <button onClick={() => setView("map")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display transition-colors ${view === "map" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}><MapIcon size={13} /> Mapa</button>
          </div>

          {view === "map" ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise"><CampaignMap revealedIds={revealedRegions} currentId={currentRegion} /></div>
          ) : (
            <>
              <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-noise">
                {messages.length === 0 && <div className="text-center py-16 space-y-3"><Flame size={28} className="ember mx-auto opacity-60" /><p className="text-[#8a7a6d] text-sm max-w-sm mx-auto leading-relaxed">Os personagens estão prontos. Escreva "vamos começar" para o mestre abrir a campanha.</p></div>}
                {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-[#2a1f1a] text-[#e8ddd0]" : "bg-[#1a1310] border border-[#2a1f1a] text-[#d9cbb8]"}`}>{message.role === "model" && <div className="flex items-center gap-2 mb-1.5 text-xs ember tracking-wider uppercase font-display"><ScrollText size={12} /> Mestre</div>}{message.text}</div></div>)}
                {loading && <div className="flex justify-start"><div className="bg-[#1a1310] border border-[#2a1f1a] rounded px-4 py-3 text-sm text-[#8a7a6d] italic">O mestre está tecendo o destino de vocês...</div></div>}
                {error && <div className="text-center"><p className="text-xs text-[#b8492f] bg-[#1a1310] inline-block px-3 py-2 rounded border border-[#3a2419]">{error}</p></div>}
                {pendingTests.map((nick) => { const player = players.find((candidate) => candidate?.nick === nick); return player ? <DiceRoller key={nick} player={player} onRoll={handleDiceResult} /> : null; })}
              </main>

              <footer className="border-t border-[#2a1f1a] bg-[#120e0c] px-5 py-4">
                <div className="flex gap-2 items-end">
                  <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(input); } }} placeholder="O que vocês fazem?" rows={1} maxLength={3000} className="flex-1 bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f] resize-none" />
                  <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 disabled:hover:bg-[#7a2419] text-[#f0e6da] p-2.5 rounded transition-colors" aria-label="Enviar"><Send size={18} /></button>
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

export default App;
