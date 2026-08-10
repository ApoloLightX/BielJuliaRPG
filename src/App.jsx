import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  Upload,
  RotateCcw,
  ScrollText,
  Send,
  Skull,
  Flame,
  Star,
  Map as MapIcon,
  MessageSquare,
} from "lucide-react";
import CharacterCreator from "./components/CharacterCreator.jsx";
import CharacterAvatar from "./components/CharacterAvatar.jsx";
import DiceRoller from "./components/DiceRoller.jsx";
import LevelUpModal from "./components/LevelUpModal.jsx";
import CampaignMap from "./components/CampaignMap.jsx";
import { XP_PER_LEVEL } from "./data/archetypes.js";

const STORAGE_KEY = "biel-julia-rpg-local-v1";

function initPlayer(character) {
  return {
    ...character,
    level: 1,
    xp: 0,
    skills: character.archetype.skills.map((s) => ({ ...s, level: 1 })),
  };
}

function parseDirectives(text) {
  const testMatches = [...text.matchAll(/\[\[TESTE:\s*([^\]]+)\]\]/g)].map((m) => m[1].trim());
  const xpMatches = [...text.matchAll(/\[\[XP:\s*([^|]+)\|\s*(\d+)\]\]/g)].map((m) => ({
    nick: m[1].trim(),
    amount: parseInt(m[2], 10),
  }));
  const mapMatches = [...text.matchAll(/\[\[MAPA:\s*([^\]]+)\]\]/g)].map((m) => m[1].trim());
  const cleanText = text
    .replace(/\[\[TESTE:[^\]]+\]\]/g, "")
    .replace(/\[\[XP:[^\]]+\]\]/g, "")
    .replace(/\[\[MAPA:[^\]]+\]\]/g, "")
    .trim();
  return { cleanText, testMatches, xpMatches, mapMatches };
}

function encodeSave(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeSave(code) {
  const binary = atob(code.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
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

  function snapshot() {
    return {
      schemaVersion: 1,
      phase,
      players,
      messages,
      pendingTests,
      levelUpQueue,
      revealedRegions,
      currentRegion,
      view,
      savedAt: new Date().toISOString(),
    };
  }

  function applySnapshot(state) {
    if (!state || typeof state !== "object") throw new Error("Save inválido");
    setPhase(state.phase || "create-p1");
    setPlayers(Array.isArray(state.players) ? state.players : [null, null]);
    setMessages(Array.isArray(state.messages) ? state.messages : []);
    setPendingTests(Array.isArray(state.pendingTests) ? state.pendingTests : []);
    setLevelUpQueue(Array.isArray(state.levelUpQueue) ? state.levelUpQueue : []);
    setRevealedRegions(Array.isArray(state.revealedRegions) ? state.revealedRegions : []);
    setCurrentRegion(state.currentRegion || null);
    setView(state.view === "map" ? "map" : "chat");
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applySnapshot(JSON.parse(raw));
        setSaveStatus("restaurado");
      } else {
        setSaveStatus("novo");
      }
    } catch (err) {
      console.error("Falha ao restaurar save local", err);
      setSaveStatus("novo");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus("salvando");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
        setSaveStatus("salvo");
      } catch (err) {
        console.error("Falha ao salvar localmente", err);
        setSaveStatus("erro no save");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [phase, players, messages, pendingTests, levelUpQueue, revealedRegions, currentRegion, view, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingTests, levelUpQueue]);

  async function exportSave() {
    try {
      const code = encodeSave(snapshot());
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setSaveStatus("código copiado");
        window.alert("Código do save copiado. Envie para a Julia ou para você mesmo no WhatsApp.");
      } else {
        window.prompt("Copie este código de save:", code);
      }
    } catch (err) {
      setError(`Não foi possível exportar o save: ${err.message}`);
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
      window.alert("Save importado. A campanha foi carregada neste aparelho.");
    } catch (err) {
      setError("Código de save inválido ou incompleto.");
    }
  }

  function resetLocalSave() {
    if (!window.confirm("Apagar o save local deste aparelho e começar uma campanha nova?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function handleP1Confirm(character) {
    setPlayers([initPlayer(character), null]);
    setPhase("create-p2");
  }

  function handleP2Confirm(character) {
    setPlayers((prev) => [prev[0], initPlayer(character)]);
    setPhase("game");
  }

  function applyXp(nick, amount) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (!p || p.nick !== nick) return p;
        const newXp = p.xp + amount;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        if (newLevel > p.level) setLevelUpQueue((q) => [...q, p.nick]);
        return { ...p, xp: newXp, level: newLevel };
      })
    );
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setError("");
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setPendingTests([]);

    try {
      const res = await fetch("/api/mestre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, players }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);

      const { cleanText, testMatches, xpMatches, mapMatches } = parseDirectives(data.reply);
      setMessages((prev) => [...prev, { role: "model", text: cleanText }]);
      if (testMatches.length) setPendingTests(testMatches);
      xpMatches.forEach(({ nick, amount }) => applyXp(nick, amount));
      if (mapMatches.length) {
        setRevealedRegions((prev) => Array.from(new Set([...prev, ...mapMatches])));
        setCurrentRegion(mapMatches[mapMatches.length - 1]);
      }
    } catch (err) {
      setError(err.message || "Algo deu errado ao falar com o mestre.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  function handleDiceResult({ nick, attr, roll, modifier, total }) {
    setPendingTests((prev) => prev.filter((n) => n !== nick));
    sendMessage(`${nick} rolou ${attr}: ${roll} + ${modifier} = ${total}`);
  }

  function handleLevelChoice(playerIdx, choice) {
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i !== playerIdx) return p;
        if (choice.type === "improve") {
          return {
            ...p,
            skills: p.skills.map((s) => (s.name === choice.skillName ? { ...s, level: s.level + 1 } : s)),
          };
        }
        if (choice.type === "unlock") {
          return {
            ...p,
            skills: [...p.skills, { ...choice.skill, level: 1 }],
            archetype: {
              ...p.archetype,
              lockedSkills: p.archetype.lockedSkills.filter((s) => s.name !== choice.skill.name),
            },
          };
        }
        return p;
      })
    );
    setLevelUpQueue((q) => q.slice(1));
  }

  const currentLevelUpNick = levelUpQueue[0];
  const currentLevelUpIdx = players.findIndex((p) => p?.nick === currentLevelUpNick);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0e0b0a] text-[#e8ddd0] flex items-center justify-center font-serif">
        <p className="text-sm text-[#8a7a6d]">Abrindo save local...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0e0b0a] text-[#e8ddd0] flex flex-col font-serif">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&display=swap');
        .font-display { font-family: 'Cinzel', serif; }
        .font-serif { font-family: 'Crimson Pro', serif; }
        .bg-noise { background-image: radial-gradient(circle at 20% 30%, rgba(139,0,0,0.06), transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,0,0,0.05), transparent 45%); }
        .ember { color: #b8492f; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3a2a24; border-radius: 3px; }
      `}</style>

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
          <button onClick={exportSave} className="p-2 text-[#a99284] hover:text-[#e8ddd0]" title="Copiar código do save" aria-label="Exportar save">
            <ClipboardCopy size={16} />
          </button>
          <button onClick={importSave} className="p-2 text-[#a99284] hover:text-[#e8ddd0]" title="Importar save" aria-label="Importar save">
            <Upload size={16} />
          </button>
          <button onClick={resetLocalSave} className="p-2 text-[#7f6e63] hover:text-[#d26b54]" title="Nova campanha" aria-label="Resetar save">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {phase === "create-p1" && (
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise">
          <CharacterCreator playerLabel="Jogador 1" onConfirm={handleP1Confirm} />
        </div>
      )}

      {phase === "create-p2" && (
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise">
          <CharacterCreator playerLabel="Jogador 2" onConfirm={handleP2Confirm} />
        </div>
      )}

      {phase === "game" && (
        <>
          <div className="flex gap-2 px-5 py-3 border-b border-[#2a1f1a] bg-[#120e0c]">
            {players.map((p, i) => {
              if (!p) return null;
              const xpInLevel = p.xp % XP_PER_LEVEL;
              const pct = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);
              return (
                <div key={i} className="flex items-center gap-2 bg-[#1a1310] border border-[#2a1f1a] rounded px-2 py-1.5 flex-1">
                  <div className="w-8 h-8 flex-shrink-0">
                    <CharacterAvatar skinHex={p.skin.hex} hairHex={p.hair.hex} gender={p.archetype.gender} size={32} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium text-[#e8ddd0] truncate">{p.nick}</p>
                      <span className="text-[9px] ember flex items-center gap-0.5 flex-shrink-0"><Star size={8} /> {p.level}</span>
                    </div>
                    <div className="w-full h-1 bg-[#0e0b0a] rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[#b8492f]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex border-b border-[#2a1f1a] bg-[#120e0c]">
            <button onClick={() => setView("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display transition-colors ${view === "chat" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}>
              <MessageSquare size={13} /> Mesa
            </button>
            <button onClick={() => setView("map")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider font-display transition-colors ${view === "map" ? "text-[#e8ddd0] border-b-2 border-[#b8492f]" : "text-[#8a7a6d]"}`}>
              <MapIcon size={13} /> Mapa
            </button>
          </div>

          {view === "map" ? (
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-noise">
              <CampaignMap revealedIds={revealedRegions} currentId={currentRegion} />
            </div>
          ) : (
            <>
              <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-noise">
                {messages.length === 0 && (
                  <div className="text-center py-16 space-y-3">
                    <Flame size={28} className="ember mx-auto opacity-60" />
                    <p className="text-[#8a7a6d] text-sm max-w-sm mx-auto leading-relaxed">
                      Os personagens estão prontos. Escreva "vamos começar" para o mestre abrir a campanha.
                    </p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#2a1f1a] text-[#e8ddd0]" : "bg-[#1a1310] border border-[#2a1f1a] text-[#d9cbb8]"}`}>
                      {m.role === "model" && (
                        <div className="flex items-center gap-2 mb-1.5 text-xs ember tracking-wider uppercase font-display"><ScrollText size={12} /> Mestre</div>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1a1310] border border-[#2a1f1a] rounded px-4 py-3 text-sm text-[#8a7a6d] italic">O mestre está tecendo o destino de vocês...</div>
                  </div>
                )}
                {error && (
                  <div className="text-center"><p className="text-xs text-[#b8492f] bg-[#1a1310] inline-block px-3 py-2 rounded border border-[#3a2419]">{error}</p></div>
                )}
                {pendingTests.map((nick) => {
                  const p = players.find((pl) => pl?.nick === nick);
                  if (!p) return null;
                  return <DiceRoller key={nick} player={p} onRoll={handleDiceResult} />;
                })}
              </main>

              <footer className="border-t border-[#2a1f1a] bg-[#120e0c] px-5 py-4">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="O que vocês fazem?"
                    rows={1}
                    className="flex-1 bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#5a4d43] focus:outline-none focus:border-[#b8492f] resize-none"
                  />
                  <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-40 disabled:hover:bg-[#7a2419] text-[#f0e6da] p-2.5 rounded transition-colors" aria-label="Enviar">
                    <Send size={18} />
                  </button>
                </div>
              </footer>
            </>
          )}

          {currentLevelUpIdx >= 0 && (
            <LevelUpModal player={players[currentLevelUpIdx]} onChoose={(choice) => handleLevelChoice(currentLevelUpIdx, choice)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;