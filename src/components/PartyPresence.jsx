import { Circle, Wifi, WifiOff } from "lucide-react";

export default function PartyPresence({ party, status = "connecting" }) {
  const connected = status === "SUBSCRIBED";
  const typing = party.filter((member) => member.typing);

  return (
    <div className="border-b border-[#2a1f1a] bg-[#100c0b] px-4 py-2 space-y-1.5" aria-live="polite">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${connected ? "text-[#728c6a]" : "text-[#7f6e63]"}`}>
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />} Mesa online
        </span>
        {party.map((member) => (
          <span key={member.userId} className="flex items-center gap-1.5 rounded-full border border-[#2d221d] bg-[#17110f] px-2 py-1 text-[10px] text-[#aa9a8f] whitespace-nowrap">
            <Circle size={7} className={member.online ? "fill-[#6a8a4a] text-[#6a8a4a]" : "fill-[#4b4039] text-[#4b4039]"} />
            {member.label} {member.online ? "online" : "offline"}
          </span>
        ))}
      </div>
      {typing.length > 0 && (
        <p className="text-[10px] italic text-[#8d7c71]">
          {typing.map((member) => member.label).join(" e ")} {typing.length > 1 ? "estão" : "está"} digitando...
        </p>
      )}
    </div>
  );
}
