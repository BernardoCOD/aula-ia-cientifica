import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { aiProvider } from "./ai";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // La "fotografía" de la pantalla que envía el asistente cabe holgadamente en 5 MB (su esquema
  // limita textos, controles y tablas). Ya no hay subida de archivos.
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Aula IA lista en http://localhost:${port}/`);
    const teacherUser = process.env.ADMIN_USERNAME;
    const teacherPassword = process.env.ADMIN_PASSWORD;
    if (teacherUser && teacherPassword)
      console.log(
        `[Panel docente] Usuario "${teacherUser}", contraseña de ${teacherPassword.length} caracteres.`
      );
    else
      console.warn(
        "[Panel docente] Falta ADMIN_USERNAME o ADMIN_PASSWORD en el archivo .env: no se podrá ingresar al panel."
      );
    if (!process.env.JWT_SECRET)
      console.warn(
        "[Panel docente] Falta JWT_SECRET en el archivo .env: escribe un texto largo y aleatorio antes de compartir la app."
      );
    const provider = aiProvider();
    if (provider)
      console.log(`[IA] Usando ${provider === "gemini" ? "Google Gemini" : "Claude"}.`);
    else
      console.warn(
        "[IA] Falta GEMINI_API_KEY en el archivo .env: el asistente solo entenderá órdenes directas."
      );
  });
}

startServer().catch(console.error);
