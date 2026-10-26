import { describe, expect, it } from "vitest";
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
  it("validates the configured admin secret through the lightweight login procedure", async () => {
    const caller = appRouter.createCaller(context());
    const username = process.env.ADMIN_USERNAME ?? "";
    const password = process.env.ADMIN_PASSWORD ?? "";
    expect(username.length).toBeGreaterThan(0);
    expect(password.length).toBeGreaterThan(0);
    const result = await caller.admin.login({ username, password });
    expect(result).toMatchObject({ success: true });
  });
});
