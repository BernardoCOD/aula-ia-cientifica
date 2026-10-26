import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("ingreso del participante", () => {
  it("rechaza códigos con símbolos", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.student.register({ code: "<script>" })).rejects.toThrow();
    await expect(
      caller.student.dashboard({ code: "<other-student>" })
    ).rejects.toThrow();
  });

  it("guarda el código dictado en forma compacta, sin pedir datos personales", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.student.register({ code: "pe cero uno" });
    expect(result).toMatchObject({ code: "P01", returning: false, pretestDone: false });
  });

  it("reconoce al participante que vuelve con el mismo código", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.student.register({ code: "P77" });
    const again = await caller.student.register({ code: "pe siete siete" });
    expect(again).toMatchObject({ code: "P77", returning: true });
  });
});
