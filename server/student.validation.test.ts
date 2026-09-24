import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("student input validation", () => {
  it("rejects identifiers with spaces or special characters", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.student.register({
        code: "ATE 024",
        grade: "2.º de secundaria",
        section: "A",
      })
    ).rejects.toThrow();
    await expect(
      caller.student.dashboard({ code: "<other-student>" })
    ).rejects.toThrow();
  });

  it("accepts a normalized-looking student code at the contract boundary", async () => {
    const caller = appRouter.createCaller(createContext());
    // Without a configured DB the helper returns a local-shaped student record; this keeps the contract test deterministic.
    const result = await caller.student.register({
      code: "ATE_024",
      grade: "2.º de secundaria",
      section: "A",
    });
    expect(result.code).toBe("ATE_024");
    expect(result.grade).toBe("2.º de secundaria");
  });
});
