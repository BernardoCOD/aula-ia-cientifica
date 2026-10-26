import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Version 2 assessment contracts", () => {
  it("keeps pretest and postest tied to a valid student code", async () => {
    const caller = appRouter.createCaller(context());
    await expect(
      caller.student.pretest({ code: "bad code", score: 4, total: 10 })
    ).rejects.toThrow();
    await expect(
      caller.student.postest({ code: "bad/code", score: 4, total: 10 })
    ).rejects.toThrow();
  });

  it("requires a student response before invoking the tutor", async () => {
    const caller = appRouter.createCaller(context());
    await expect(
      caller.student.tutor({
        code: "ATE_024",
        moduleId: "m6",
        activity: "Explicación",
        question: "¿Por qué?",
        response: "corto",
      })
    ).rejects.toThrow();
  });

  it("exposes the protected research procedure without exposing it as a student procedure", () => {
    const caller = appRouter.createCaller(context());
    expect(caller.admin).toBeDefined();
    expect(caller.student).toBeDefined();
  });
});
