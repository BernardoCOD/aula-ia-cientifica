import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: () => undefined } as TrpcContext["res"],
  };
}

describe("teacher credentials", () => {
  const original = { ...process.env };
  beforeEach(() => {
    process.env.ADMIN_USERNAME = "docente-prueba";
    process.env.ADMIN_PASSWORD = "clave-de-prueba";
  });
  afterEach(() => {
    process.env.ADMIN_USERNAME = original.ADMIN_USERNAME;
    process.env.ADMIN_PASSWORD = original.ADMIN_PASSWORD;
  });

  it("accepts the configured admin credentials", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.admin.login({
      username: "docente-prueba",
      password: "clave-de-prueba",
    });
    expect(result).toMatchObject({ success: true });
  });

  it("rejects a wrong password", async () => {
    const caller = appRouter.createCaller(context());
    await expect(
      caller.admin.login({ username: "docente-prueba", password: "otra" })
    ).rejects.toThrow("Usuario o contraseña incorrectos");
  });
});
