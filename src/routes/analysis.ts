import { FastifyInstance } from "fastify";
import { analyzeHandler } from "../controllers/analysis";

import { AnalyzeBody } from "../types";
import { authenticate } from "../middlewares/auth";

export async function analysisRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: AnalyzeBody }>(
    "/analyze",
    { preHandler: [authenticate] },
    analyzeHandler,
  );
}
