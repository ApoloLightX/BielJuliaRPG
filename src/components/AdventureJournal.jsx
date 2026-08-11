import { BookOpen, Compass, Footprints, Search, Users } from "lucide-react";

function Empty({ children }) {
  return <p className="text-xs text-[#6f6259] italic">{children}</p>;
}

export default function AdventureJournal({ journal }) {
  const data = journal || { summary: "", objective: "", clues: [], npcs: [], decisions: [] };

  return (
    <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2">
      <section className="md:col-span-2 bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider ember font-display"><BookOpen size={14} /> Resumo da aventura</div>
        {data.summary ? <p className="text-sm text-[#d9cbb8] leading-relaxed whitespace-pre-wrap">{data.summary}</p> : <Empty>O Mestre ainda não registrou um resumo.</Empty>}
      </section>

      <section className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c8a36d] font-display"><Compass size={14} /> Objetivo atual</div>
        {data.objective ? <p className="text-sm text-[#d9cbb8] leading-relaxed">{data.objective}</p> : <Empty>Nenhum objetivo registrado.</Empty>}
      </section>

      <section className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8fa6b8] font-display"><Search size={14} /> Pistas</div>
        {data.clues.length ? <ul className="space-y-1.5">{data.clues.map((clue) => <li key={clue} className="text-xs text-[#c9bbb0] leading-relaxed">• {clue}</li>)}</ul> : <Empty>Nenhuma pista registrada.</Empty>}
      </section>

      <section className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#9b8ab6] font-display"><Users size={14} /> NPCs conhecidos</div>
        {data.npcs.length ? <div className="space-y-2">{data.npcs.map((npc) => <div key={npc.name} className="bg-[#0e0b0a] rounded px-2.5 py-2"><p className="text-xs font-medium text-[#e8ddd0]">{npc.name}</p>{npc.description && <p className="text-[11px] text-[#77685e] mt-0.5 leading-relaxed">{npc.description}</p>}</div>)}</div> : <Empty>Nenhum NPC registrado.</Empty>}
      </section>

      <section className="bg-[#1a1310] border border-[#2a1f1a] rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#a98d73] font-display"><Footprints size={14} /> Decisões importantes</div>
        {data.decisions.length ? <ul className="space-y-1.5">{data.decisions.map((decision) => <li key={decision} className="text-xs text-[#c9bbb0] leading-relaxed">• {decision}</li>)}</ul> : <Empty>Nenhuma decisão registrada.</Empty>}
      </section>
    </div>
  );
}
