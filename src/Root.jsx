import { useEffect, useState } from "react";
import {
  Gamepad2,
  KeyRound,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Skull,
  UserPlus,
} from "lucide-react";
import App from "./App.jsx";
import GameSession from "./GameSession.jsx";
import { supabase, supabaseConfigured } from "./lib/supabase.js";

const shell = "min-h-screen bg-[#0e0b0a] text-[#e8ddd0] font-serif";
const card = "bg-[#17100e] border border-[#34251f] rounded-lg p-5";
const inputClass = "w-full bg-[#0e0b0a] border border-[#3a2a24] rounded px-3 py-2.5 text-sm text-[#e8ddd0] placeholder-[#6c5b50] focus:outline-none focus:border-[#b8492f]";
const primary = "bg-[#7a2419] hover:bg-[#8e2c1f] disabled:opacity-50 text-[#f0e6da] rounded px-4 py-2.5 transition-colors";

function LoadingScreen({ text = "Abrindo o grimório..." }) {
  return (
    <div className={`${shell} flex items-center justify-center p-6`}>
      <div className="text-center space-y-3">
        <RefreshCw className="animate-spin mx-auto text-[#b8492f]" size={24} />
        <p className="text-sm text-[#9a887a]">{text}</p>
      </div>
    </div>
  );
}

function ConfigScreen({ onGuest }) {
  return (
    <div className={`${shell} flex items-center justify-center p-6`}>
      <div className={`${card} max-w-lg w-full space-y-4`}>
        <Skull className="text-[#b8492f]" />
        <div>
          <h1 className="text-xl font-semibold">Nuvem ainda não conectada</h1>
          <p className="text-sm text-[#9a887a] mt-2 leading-relaxed">
            Você ainda pode jogar agora. O modo local salva automaticamente neste aparelho e permite copiar um código para continuar em outro dispositivo.
          </p>
        </div>
        <button onClick={onGuest} className={`${primary} w-full flex items-center justify-center gap-2`}>
          <Gamepad2 size={16} /> Jogar agora neste aparelho
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onGuest }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!data.session) setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${shell} flex items-center justify-center p-5`}>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Skull size={34} className="mx-auto text-[#b8492f] mb-3" />
          <h1 className="text-2xl font-semibold">A Mesa Sob a Sombra</h1>
          <p className="text-sm text-[#8f7c70] mt-1">Entre para continuar sua campanha em qualquer aparelho.</p>
        </div>

        <form onSubmit={submit} className={`${card} space-y-3`}>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required />
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha, mínimo 6 caracteres" minLength={6} required />

          {error && <p className="text-sm text-[#d26b54]">{error}</p>}
          {message && <p className="text-sm text-[#b9aa9e]">{message}</p>}

          <button className={`${primary} w-full flex items-center justify-center gap-2`} disabled={busy}>
            {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          className="w-full text-sm text-[#a99284] hover:text-[#e8ddd0]"
          onClick={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setError("");
            setMessage("");
          }}
        >
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>

        <div className={`${card} space-y-2 border-[#4a3027]`}>
          <p className="text-sm text-[#c7b6aa]">Quer jogar hoje sem esperar a nuvem?</p>
          <p className="text-xs text-[#806f64] leading-relaxed">
            O modo local salva automaticamente. Você pode copiar o código do save e colar no celular, PC ou aparelho da Julia.
          </p>
          <button onClick={onGuest} className="w-full border border-[#6b392d] hover:border-[#9a4b39] text-[#d8c6b9] rounded px-4 py-2.5 flex items-center justify-center gap-2 transition-colors">
            <Gamepad2 size={16} /> Jogar agora neste aparelho
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignHub({ user, onOpen }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("O Silêncio de Vharnak");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  async function loadCampaigns() {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("campaigns")
      .select("id,name,join_code,owner_id,created_at,updated_at")
      .order("updated_at", { ascending: false });

    if (queryError) setError(queryError.message);
    else setCampaigns(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function createCampaign() {
    setBusy(true);
    setError("");
    const { data, error: createError } = await supabase
      .from("campaigns")
      .insert({ name: name.trim() || "Nova campanha", owner_id: user.id })
      .select("id,name,join_code,owner_id,created_at,updated_at")
      .single();

    if (createError) setError(createError.message);
    else onOpen(data);
    setBusy(false);
  }

  async function joinCampaign() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setError("");

    const { data: campaignId, error: joinError } = await supabase.rpc("join_campaign", { p_code: code });
    if (joinError) {
      setError(joinError.message);
      setBusy(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("campaigns")
      .select("id,name,join_code,owner_id,created_at,updated_at")
      .eq("id", campaignId)
      .single();

    if (queryError) setError(queryError.message);
    else onOpen(data);
    setBusy(false);
  }

  return (
    <div className={shell}>
      <header className="border-b border-[#2a1f1a] bg-[#120e0c] px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skull size={22} className="text-[#b8492f]" />
          <div>
            <h1 className="text-lg font-semibold">Suas campanhas</h1>
            <p className="text-xs text-[#827064]">{user.email}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-[#a99284] flex items-center gap-1.5 hover:text-[#e8ddd0]">
          <LogOut size={14} /> Sair
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-5 space-y-5">
        {error && <div className="border border-[#5b2d24] bg-[#1b100e] rounded p-3 text-sm text-[#d47a65]">{error}</div>}

        <section className={`${card} space-y-3`}>
          <h2 className="font-semibold flex items-center gap-2"><Plus size={16} /> Nova campanha</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da campanha" />
            <button onClick={createCampaign} disabled={busy} className={`${primary} sm:w-40`}>Criar</button>
          </div>
          <p className="text-xs text-[#7f6e63]">Crie uma campanha de teste sem afetar a campanha principal.</p>
        </section>

        <section className={`${card} space-y-3`}>
          <h2 className="font-semibold flex items-center gap-2"><KeyRound size={16} /> Entrar com código</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={`${inputClass} uppercase tracking-widest`} value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Ex: A1B2C3D4" maxLength={12} />
            <button onClick={joinCampaign} disabled={busy} className={`${primary} sm:w-40`}>Entrar</button>
          </div>
          <p className="text-xs text-[#7f6e63]">A outra pessoa usa o código mostrado na campanha criada.</p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Continuar</h2>
            <button onClick={loadCampaigns} className="text-xs text-[#9b887b] flex items-center gap-1"><RefreshCw size={12} /> Atualizar</button>
          </div>

          {loading ? (
            <p className="text-sm text-[#837267]">Carregando campanhas...</p>
          ) : campaigns.length === 0 ? (
            <div className={`${card} text-sm text-[#837267]`}>Nenhuma campanha ainda.</div>
          ) : (
            campaigns.map((campaign) => (
              <button key={campaign.id} onClick={() => onOpen(campaign)} className={`${card} w-full text-left hover:border-[#6b392d] transition-colors`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#e8ddd0]">{campaign.name}</p>
                    <p className="text-xs text-[#88766b] mt-1">Código: <span className="tracking-widest text-[#c6aea0]">{campaign.join_code}</span></p>
                  </div>
                  <span className="text-xs text-[#b8492f]">Continuar</span>
                </div>
              </button>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default function Root() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setCampaign(null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (guestMode) return <App onExit={() => setGuestMode(false)} />;
  if (!supabaseConfigured) return <ConfigScreen onGuest={() => setGuestMode(true)} />;
  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen onGuest={() => setGuestMode(true)} />;
  if (!campaign) return <CampaignHub user={session.user} onOpen={setCampaign} />;

  return (
    <GameSession
      key={campaign.id}
      campaign={campaign}
      userId={session.user.id}
      onExit={() => setCampaign(null)}
    />
  );
}