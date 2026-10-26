import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

// Fase 1: la app debe funcionar sin ninguna pieza ni variable de Manus.
const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIRS = ["client", "server", "shared", "drizzle"];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourceFiles(full);
    return /\.(ts|tsx|js|html)$/.test(entry.name) ? [full] : [];
  });
}

describe("independencia de Manus", () => {
  it("no quedan referencias a Manus en el código fuente", () => {
    const offenders = SOURCE_DIRS.flatMap(dir => sourceFiles(path.join(ROOT, dir)))
      .filter(file => !file.endsWith("no.manus.test.ts"))
      .filter(file => /manus|forge\.|BUILT_IN_FORGE|OAUTH_SERVER_URL|VITE_APP_ID/i.test(fs.readFileSync(file, "utf8")))
      .map(file => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it("no expone el inicio de sesión ni las rutas del sistema de Manus", () => {
    const routes = Object.keys(appRouter._def.record);
    expect(routes).not.toContain("auth");
    expect(routes).not.toContain("system");
  });
});
