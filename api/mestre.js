import { createClient } from "@supabase/supabase-js";
import { CAMPAIGN_LORE } from "./lore.js";
import {
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
} from "../shared/supabasePublic.js";

const MAX_BODY_CHARS = 100_000;
const MAX_MESSAGES = 60;
const MAX_MESSAGE_CHARS = 3_000;
const MAX_TOTAL_MESSAGE_CHARS = 60_000;
const PROVIDER_TIMEOUT_MS = 25_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 20;
const ATTR_KEYS = ["forca", "astucia", "vigor", "vontade"];
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const rateBuckets = globalThis.__bielJuliaRateBuckets || new Map();
globalThis.__bielJuliaRateBuckets = rateBuckets;

function compactText(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, maxLength)
    : "";
}

function clampNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

export function sanitizePlayers(players) {
  if (!Array.isArray(players)) return [];

  return players.slice(0, 2).flatMap((player) => {
    if (!player || typeof player !== "object") return [];
    const nick = compactText(player.nick, 20);
    const name = compactText(player.archetype?.name, 60);
    const role = compactText(player.archetype?.role, 60);
    if (!nick || !name || !role) return [];

    const attrs = Object.fromEntries(
      ATTR_KEYS.map((key) => [
        key,
        Math.trunc(clampNumber(player.archetype?.attrs?.[key], 1, 4, 1)),
      ])
    );
    const skills = (Array.isArray(player.skills) ? player.skills : player.archetype?.skills || [])
      .slice(0, 12)
      .map((skill) => compactText(skill?.name, 80))
      .filter(Boolean);

    return [{ nick, name, role, attrs, skills }];
  });
}

export function buildSystemPrompt(players) {
  const safePlayers = sanitizePlayers(players);
  const playersDesc = safePlayers.length
    ? safePlayers
        .map((player, index) => {
          const attrs = Object.entries(player.attrs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          return `Jogador ${index + 1}: ${player.nick} (${player.name}, ${player.role}). Atributos: ${attrs}. Habilidades: ${player.skills.join(", ") || "nenhuma"}.`;
        })
        .join("\n")
    : "Personagens ainda não definidos.";

  return `Você é o Mestre de um RPG de mesa dark fantasy, narrando por texto para dois jogadores (um casal jogando junto).

REGRAS DO SISTEMA:
- Atributos: Força, Astúcia, Vigor, Vontade (1 a 4)
- Testes: d20 + atributo, contra dificuldade que você define
- Vida: 3 "golpes" antes de perigo real de morte
- Sistema leve, sem ficha complexa
- Personagens podem melhorar habilidades existentes ou ganhar novas ao completar marcos importantes da história

PERSONAGENS DESTA CAMPANHA:
${playersDesc}

${CAMPAIGN_LORE}

SEU PAPEL:
- Narre cenas vívidas e sombrias, sem ser gratuitamente gráfico
- Sempre termine seu turno com uma pergunta clara ou ponto de decisão
- Interprete NPCs com personalidade própria
- Quando pedir um teste, diga o atributo e a dificuldade antes da rolagem
- Use apenas os nomes e habilidades dos personagens acima
- Seja consistente com o histórico fornecido
- Escreva em português do Brasil, tom narrativo, sem travessões
- Nunca fale como assistente de IA, permaneça no papel de mestre
- Nunca revele a lore completa nem antecipe o enredo

MARCADORES DE JOGO:
- Teste: [[TESTE: nick do jogador]]
- XP por marco importante: [[XP: nick do jogador | quantidade]]
- Nova região: [[MAPA: id da região]]
Não invente outros marcadores.

REGIÕES VÁLIDAS:
- portas
- ruas-externas
- distrito-mercado
- capela-sella
- torre-cardeal
- arquivo-runas
- camara-central

Na primeira mensagem, apresente o gancho inicial da névoa e da convocação, revele "portas" com o marcador e pergunte o que os personagens fazem.`;
}

export function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const candidates = messages.slice(-MAX_MESSAGES);
  const normalized = [];
  let totalChars = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const message = candidates[index];
    if (!message || typeof message.text !== "string") continue;
    const text = message.text.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text) continue;
    if (totalChars + text.length > MAX_TOTAL_MESSAGE_CHARS) break;
    totalChars += text.length;
    normalized.push({ role: message.role === "model" ? "model" : "user", text });
  }

  return normalized.reverse();
}

export function createGroqPayload(systemPrompt, messages, model = DEFAULT_GROQ_MODEL) {
  return {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.text,
      })),
    ],
    temperature: 0.9,
    max_completion_tokens: 1800,
  };
}

export function createGeminiPayload(systemPrompt, messages) {
  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    })),
    generationConfig: { temperature: 0.9, maxOutputTokens: 1800 },
  };
}

function checkRateLimit(key) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT_REQUESTS;
}

function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function authenticateRequest(req) {
  if (process.env.MESTRE_ALLOW_GUEST === "true") {
    const forwarded = compactText(req.headers?.["x-forwarded-for"], 128).split(",")[0];
    return { id: `guest:${forwarded || "unknown"}` };
  }

  const header = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError("Faça login para falar com o Mestre", 401);

  const { data, error: authError } = await getSupabaseAuthClient().auth.getUser(match[1]);
  if (authError || !data?.user?.id) {
    throw new HttpError("Sessão inválida ou expirada", 401);
  }
  return data.user;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function askGroq({ apiKey, systemPrompt, messages }) {
  const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(
      createGroqPayload(systemPrompt, messages, process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL)
    ),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new HttpError(data?.error?.message || `Groq HTTP ${response.status}`, response.status);
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Resposta vazia da Groq");
  return { reply, provider: "groq" };
}

async function askGemini({ apiKey, systemPrompt, messages }) {
  const response = await fetchWithTimeout(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(createGeminiPayload(systemPrompt, messages)),
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new HttpError(data?.error?.message || `Gemini HTTP ${response.status}`, response.status);
  }

  const reply = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();
  if (!reply) throw new Error("Resposta vazia do Gemini");
  return { reply, provider: "gemini" };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const bodySize = JSON.stringify(req.body || {}).length;
    if (bodySize > MAX_BODY_CHARS) {
      return res.status(413).json({ error: "Requisição grande demais" });
    }

    const user = await authenticateRequest(req);
    if (!checkRateLimit(user.id)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Muitas ações em pouco tempo. Tente novamente em instantes." });
    }

    const { messages, players } = req.body || {};
    const cleanMessages = normalizeMessages(messages);
    if (!cleanMessages.length) {
      return res.status(400).json({ error: "Nenhuma mensagem válida recebida" });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!groqKey && !geminiKey) {
      return res.status(503).json({ error: "Mestre temporariamente indisponível" });
    }

    const systemPrompt = buildSystemPrompt(players);

    if (groqKey) {
      try {
        return res.status(200).json(
          await askGroq({ apiKey: groqKey, systemPrompt, messages: cleanMessages })
        );
      } catch (providerError) {
        console.warn("Provider groq indisponivel", {
          status: providerError?.status || null,
          name: providerError?.name || "Error",
        });
      }
    }

    if (geminiKey) {
      try {
        return res.status(200).json(
          await askGemini({ apiKey: geminiKey, systemPrompt, messages: cleanMessages })
        );
      } catch (providerError) {
        console.error("Provider gemini indisponivel", {
          status: providerError?.status || null,
          name: providerError?.name || "Error",
        });
      }
    }

    return res.status(502).json({ error: "Os provedores de IA estão temporariamente indisponíveis" });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({ error: "O Mestre demorou demais para responder" });
    }
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) {
      console.error("Falha interna no endpoint mestre", { name: error?.name || "Error" });
    }
    return res.status(status).json({
      error: status >= 500 ? "Falha interna do Mestre" : error.message,
    });
  }
}
