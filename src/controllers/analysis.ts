import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { analyzeText } from "../services/analysis";
import { prisma } from "../lib/prisma";
import { AnalyzeBody } from "../types";

export async function analyzeHandler(
  request: FastifyRequest<{ Body: AnalyzeBody }>,
  reply: FastifyReply,
) {
  const { text, domain, sourceUrl, language } = request.body;

  // 1. Hash the raw text for change detection
  const contentHash = crypto.createHash("sha256").update(text).digest("hex");

  // 2. Upsert the Site (global — one record per domain)
  const site = await prisma.site.upsert({
    where: { domain },
    update: {},
    create: { domain },
  });

  // 3. Check if we already have an analysis for this exact text hash
  const existingVersion = await prisma.cgvVersion.findUnique({
    where: { siteId_contentHash: { siteId: site.id, contentHash } },
    include: { analysis: { include: { clauses: true } } },
  });

  if (existingVersion?.analysis) {
    const cached = existingVersion.analysis;
    return reply.send({
      domain: site.domain,
      analyzed_at: cached.analyzedAt,
      global_score: cached.globalScore,
      rating: cached.rating,
      clauses: cached.clauses.map((c) => ({
        type: c.clauseType,
        content: c.content,
        severity: c.severity,
        score_impact: c.scoreImpact,
      })),
    });
  }

  // 4. Call Claude
  const result = await analyzeText(text, domain, language ?? "en");

  // 5. Persist everything in a transaction
  await prisma.$transaction(async (tx) => {
    const version = await tx.cgvVersion.upsert({
      where: { siteId_contentHash: { siteId: site.id, contentHash } },
      update: {},
      create: { siteId: site.id, contentHash, sourceUrl, rawText: text },
    });

    const analysis = await tx.analysis.create({
      data: {
        cgvVersionId: version.id,
        globalScore: result.global_score,
        rating: result.rating,
        analyzedAt: new Date(result.analyzed_at),
      },
    });

    if (result.clauses.length > 0) {
      await tx.clause.createMany({
        data: result.clauses.map((c) => ({
          analysisId: analysis.id,
          clauseType: c.type,
          content: c.content,
          severity: c.severity,
          scoreImpact: c.score_impact,
        })),
      });
    }

    // 6. Update Site score cache
    await tx.site.update({
      where: { id: site.id },
      data: {
        currentGlobalScore: result.global_score,
        currentRating: result.rating,
      },
    });
  });

  // 7. Return fresh result
  return reply.code(201).send(result);
}
