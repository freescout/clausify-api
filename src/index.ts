import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info",
    },
  });

  // ─── Plugins ──────────────────────────────────────────

  await app.register(helmet);

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return cb(null, true);
      const allowed =
        CORS_ORIGINS.includes(origin) || /^chrome-extension:\/\//.test(origin);
      cb(null, allowed);
    },
    credentials: true,
  });

  await app.register(jwt, { secret: JWT_SECRET });

  // ─── Routes ───────────────────────────────────────────

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // Route registration will go here as we build them:
  await app.register(authRoutes, { prefix: "/auth" });
  // await app.register(analysisRoutes, { prefix: "/api" });
  // await app.register(tagRoutes, { prefix: "/api/tags" });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
