import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// Contexto de cada solicitud a la API. La app no tiene cuentas de usuario: los participantes se
// identifican con su código y el panel docente usa su propia cookie firmada (server/adminAuth.ts).
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return { req: opts.req, res: opts.res };
}
