import { FastifyInstance } from "fastify";
import { analyzeHandler } from "../controllers/analysis";
import { AnalyzeBody } from "../types";

export async function analysisRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: AnalyzeBody }>(
    "/analyze",
    { preHandler: [fastify.authenticate] },
    analyzeHandler,
  );
}
