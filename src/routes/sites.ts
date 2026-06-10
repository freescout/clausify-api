import { FastifyInstance } from "fastify";

import {
  getSitesHandler,
  getSiteHistoryHandler,
  getSiteHistoryDetailHandler,
} from "../controllers/sites";
import { authenticate } from "../middlewares/auth";

export async function sitesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticate] }, getSitesHandler);

  fastify.get<{ Params: { domain: string } }>(
    "/:domain/history",
    { preHandler: [authenticate] },
    getSiteHistoryHandler,
  );

  fastify.get<{ Params: { domain: string; historyId: string } }>(
    "/:domain/history/:historyId",
    { preHandler: [authenticate] },
    getSiteHistoryDetailHandler,
  );
}
