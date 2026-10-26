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

describe("teacher student management", () => {
  it("does not expose student deletion without teacher authentication", async () => {
    const caller = appRouter.createCaller(context());
    await expect(
      caller.admin.deleteStudent({ code: "ATE_024", confirmation: "ELIMINAR" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
