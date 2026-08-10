import { CAMPAIGN_LORE } from "./lore.js";

function buildSystemPrompt(players) {
  const playersDesc = Array.isArray(players) && players.length
    ? players
        .map((p, i) => {
          if (!p) return "";
          const attrs = Object.entries(p.archetype.attrs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          const skills = p.archetype.skills.map((s) => s.name).join(", ");
          return `Jogador ${i + 1}: ${p.nick} (${p.archetype.name}, ${p.archetype.role}). Atributos: ${attrs}. Habilidades: ${skills}.`;
        })
        .filter(Boolean)
        .join("\n")
    : "Personagens ainda não definidos.";

  return `Você é o Mestre de um RPG de mesa dark fantasy, narrando por texto para dois jogadores (um casal jogando junto).

REGRAS DO SISTEMA:
- Atributos: Força, Astúcia, Vigor, Vontade (1 a 4)
- Testes: d20 + atributo, contra dificuldade que você define
- Vida: 3 "golpes" antes de perigo real de morte
- Sistema leve, sem ficha complexa
- Personagens podem melhorar habilidades existentes ou ganhar novas ao completar marcos importantes da história (você decide quando é apropriado, e anuncia claramente quando isso acontece)

PERSONAGENS DESTA CAMPANHA:
${playersDesc}

${CAMPAIGN_LORE}

SEU PAPEL:
- Narre cenas vívidas, sombrias, com atmosfera de dark fantasy (sem ser gratuitamente gráfico ou perturbador)
- Sempre termine seu turno com uma pergunta clara ou ponto de decisão pros jogadores
- Interprete NPCs com personalidade própria
- Quando pedir um teste, diga o atributo e a dificuldade antes de pedir a rolagem
- Use os nomes e habilidades reais dos personagens acima, nunca invente outros
- Seja consistente com o que já aconteceu na história
- Escreva em português do Brasil, tom narrativo, sem travessões (use vírgula, ponto ou dois pontos no lugar)
- Nunca fale como assistente de IA, você É o mestre da mesa, mergulhado no papel
- Nunca revele a lore completa de uma vez, nem resuma o enredo antecipadamente, mesmo se pedirem. Revele só através da narrativa, no ritmo da aventura

MARCADORES DE JOGO (obrigatório):
Ao final da sua resposta narrativa, se for o caso, adicione uma linha separada com um marcador entre colchetes duplos, nesse formato exato:
- Se você está pedindo um teste de dado a um jogador específico: [[TESTE: nick do jogador]]
- Se um jogador completou um marco importante da história e merece XP: [[XP: nick do jogador | quantidade]]
- Se os personagens chegaram a uma nova região do mapa: [[MAPA: id da região]]
Pode incluir múltiplos marcadores se fizer sentido. Não invente outros formatos. Se não for o caso, não inclua marcador nenhum.

REGIÕES VÁLIDAS PARA O MARCADOR [[MAPA]] (use o id exato, revele na ordem que fizer sentido pela narrativa):
- portas (Portas de Vharnak, ponto de entrada)
- ruas-externas (Ruas Externas)
- distrito-mercado (Distrito do Mercado)
- capela-sella (Capela de Sella)
- torre-cardeal (Torre do Cardeal)
- arquivo-runas (Arquivo das Runas)
- camara-central (Câmara Central, só no ato final)

Se for a primeira mensagem da campanha, apresente o gancho inicial (a névoa, a convocação) de forma envolvente, revele a região "portas" com o marcador de mapa, e pergunte o que os personagens fazem primeiro.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor" });
  }

  const { messages, players } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Formato de mensagens inválido" });
  }

  try {
    const contents = messages
      .filter((m) => m && typeof m.text === "string" && m.text.trim())
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(players) }] },
          contents,
          generationConfig: { temperature: 1, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => null);
      return res.status(geminiRes.status).json({
        error: errData?.error?.message || `Erro ${geminiRes.status} na API do Gemini`,
      });
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "O mestre ficou em silêncio por um instante...";

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erro ao falar com o mestre" });
  }
}
