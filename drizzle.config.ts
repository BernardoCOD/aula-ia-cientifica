import { defineConfig } from "drizzle-kit";

// Solo se usa para inspeccionar la base local con "pnpm db:studio"; las tablas se crean
// automáticamente al iniciar el servidor (server/db.ts).
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL?.startsWith("file:")
      ? process.env.DATABASE_URL
      : "file:./data/aula.db",
  },
});
