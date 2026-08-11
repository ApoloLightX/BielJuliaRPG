import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const base = readFileSync(
  new URL("./migrations/20260810210600_campaign_saves.sql", import.meta.url),
  "utf8"
);
const harden = readFileSync(
  new URL("./migrations/20260810223500_harden_campaign_saves.sql", import.meta.url),
  "utf8"
);
const quota = readFileSync(
  new URL("./migrations/20260810224500_protect_campaign_creation.sql", import.meta.url),
  "utf8"
);
const realtime = readFileSync(
  new URL("./migrations/20260811101500_secure_campaign_realtime.sql", import.meta.url),
  "utf8"
);
const all = `${base}\n${harden}\n${quota}\n${realtime}`.toLowerCase();

describe("Supabase migration security invariants", () => {
  it("habilita RLS nas três tabelas acessíveis pelo cliente", () => {
    for (const table of ["campaigns", "campaign_members", "campaign_state"]) {
      expect(all).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("não contém policies deliberadamente abertas", () => {
    expect(all).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(all).not.toMatch(/with\s+check\s*\(\s*true\s*\)/);
  });

  it("serializa entrada na campanha para preservar o limite de dois membros", () => {
    expect(harden.toLowerCase()).toContain("for update");
    expect(harden).toContain("v_member_count >= 2");
  });

  it("remove UPDATE direto do save e exige revisão esperada no RPC", () => {
    expect(harden.toLowerCase()).toContain("revoke update on public.campaign_state from authenticated");
    expect(harden).toContain("p_expected_revision bigint");
    expect(harden).toContain("SAVE_CONFLICT");
  });

  it("restringe criação de campanhas por ownership e quota", () => {
    expect(quota).toContain("owner_id = auth.uid()");
    expect(quota).toContain("public.can_create_campaign()");
    expect(quota).toContain(") < 20");
  });

  it("protege Presence e Broadcast pelo membership da campanha", () => {
    expect(realtime).toContain("ON realtime.messages");
    expect(realtime).toContain("FOR SELECT");
    expect(realtime).toContain("FOR INSERT");
    expect(realtime).toContain("realtime.messages.extension IN ('presence', 'broadcast')");
    expect(realtime).toContain("cm.user_id = (SELECT auth.uid())");
    expect(realtime).toContain("('campaign:' || cm.campaign_id::text)");
    expect(realtime.toLowerCase()).not.toMatch(/using\s*\(\s*true\s*\)/);
  });
});
