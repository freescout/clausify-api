import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";
import { analysisRoutes } from "./routes/analysis";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info",
    },
  });

  // ─── Plugins ──────────────────────────────────────────

  await app.register(helmet);

  await app.register(cors, {
    origin: (origin, cb) => {
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

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(analysisRoutes, { prefix: "/api" });

  return app;
}
