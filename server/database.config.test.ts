import { describe, expect, it } from "vitest";
import { databaseConfig } from "./db";

describe("configuración de la base de datos", () => {
  it("usa el archivo SQLite local por defecto", () => {
    expect(databaseConfig({})).toEqual({ url: "file:./data/aula.db" });
    expect(databaseConfig({ DATABASE_URL: "file:./data/aula.db" })).toEqual({
      url: "file:./data/aula.db",
    });
  });

  it("usa una base Turso en la nube con su token", () => {
    expect(
      databaseConfig({
        DATABASE_URL: "libsql://aula-ia-bernardo.turso.io",
        DATABASE_AUTH_TOKEN: " token-secreto ",
      })
    ).toEqual({ url: "libsql://aula-ia-bernardo.turso.io", authToken: "token-secreto" });
  });

  it("no acepta direcciones de otros motores (por ejemplo MySQL)", () => {
    expect(databaseConfig({ DATABASE_URL: "mysql://root@localhost/aula" })).toEqual({
      url: "file:./data/aula.db",
    });
  });
});
