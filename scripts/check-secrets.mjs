import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SELF = "scripts/check-secrets.mjs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => file !== SELF && !file.endsWith("package-lock.json"));

const forbiddenNames = [
  "VITE_GROQ_API_KEY",
  "VITE_GEMINI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
];

const secretPatterns = [
  { name: "Supabase secret key", regex: /sb_secret_[A-Za-z0-9_-]{20,}/g },
  { name: "OpenAI-style secret", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: "Google API key", regex: /\bAIza[A-Za-z0-9_-]{25,}\b/g },
  { name: "Private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const findings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const documentation = file === "README.md" || file.startsWith("docs/");

  // Documentation may explain names that must never be used in code/config.
  // Actual secret-looking values are still scanned in documentation below.
  if (!documentation) {
    for (const name of forbiddenNames) {
      if (content.includes(name)) {
        findings.push(`${file}: forbidden client/service secret name ${name}`);
      }
    }
  }

  for (const pattern of secretPatterns) {
    if (pattern.regex.test(content)) findings.push(`${file}: possible ${pattern.name}`);
    pattern.regex.lastIndex = 0;
  }

  if (!documentation && file !== ".env.example") {
    for (const variable of ["GROQ_API_KEY", "GEMINI_API_KEY"]) {
      const assignment = new RegExp(`${variable}\\s*=\\s*[^\\s'";]+`, "g");
      if (assignment.test(content)) findings.push(`${file}: literal assignment to ${variable}`);
    }
  }
}

if (findings.length) {
  console.error("Potential secrets or unsafe secret names found:\n" + findings.join("\n"));
  process.exit(1);
}

console.log(`Secret regression scan passed (${files.length} tracked files checked).`);
