import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("web app assets", () => {
  it("não deixa o manifest apontar para assets inexistentes", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest"));
    expect(manifest.name).toBe("A Mesa Sob a Sombra");
    expect(manifest.icons.length).toBeGreaterThan(0);

    for (const icon of manifest.icons) {
      const relativePath = icon.src.replace(/^\//, "");
      expect(existsSync(resolve(root, "public", relativePath))).toBe(true);
    }
  });

  it("mantém o jogo pessoal fora de indexação e com preview social", () => {
    const html = read("index.html");
    expect(html).toContain('name="robots" content="noindex,nofollow,noarchive"');
    expect(html).toContain('property="og:image" content="https://biel-julia-rpg.vercel.app/biel-julia.jpg"');
    expect(read("public/robots.txt")).toContain("Disallow: /");
  });
});
