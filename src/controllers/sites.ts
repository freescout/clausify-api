import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function getSitesHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const sites = await prisma.site.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      cgvVersions: {
        include: {
          analysis: {
            include: {
              clauses: true,
            },
          },
        },
      },
    },
  });

  const result = sites.map((site) => {
    // Collect all clauses across all versions
    const allClauses = site.cgvVersions.flatMap(
      (v) => v.analysis?.clauses ?? [],
    );

    const clause_count = allClauses.length;

    // Top concern = most frequent clause type
    const typeCounts = allClauses.reduce<Record<string, number>>((acc, c) => {
      acc[c.clauseType] = (acc[c.clauseType] ?? 0) + 1;
      return acc;
    }, {});
    const top_concern =
      Object.keys(typeCounts).length > 0
        ? (Object.entries(typeCounts).sort(
            (a, b) => b[1] - a[1],
          )[0][0] as string)
        : null;

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      current_global_score: site.currentGlobalScore,
      current_rating: site.currentRating,
      created_at: site.createdAt.toISOString(),
      updated_at: site.updatedAt.toISOString(),
      tags: site.tags.map((st) => ({
        id: st.tag.id,
        name: st.tag.name,
        color: st.tag.color,
        user_id: st.tag.userId,
        created_at: st.tag.createdAt.toISOString(),
      })),
      clause_count,
      top_concern,
    };
  });

  return reply.send(result);
}

export async function getSiteHistoryHandler(
  request: FastifyRequest<{ Params: { domain: string } }>,
  reply: FastifyReply,
) {
  const { domain } = request.params;

  const site = await prisma.site.findUnique({
    where: { domain },
    include: {
      tags: {
        include: { tag: true },
      },
      cgvVersions: {
        orderBy: { extractedAt: "desc" },
        include: {
          analysis: {
            include: { clauses: true },
          },
        },
      },
    },
  });

  if (!site) {
    return reply.code(404).send({ error: "Site not found" });
  }

  return reply.send({
    id: site.id,
    domain: site.domain,
    name: site.name,
    current_global_score: site.currentGlobalScore,
    current_rating: site.currentRating,
    created_at: site.createdAt.toISOString(),
    updated_at: site.updatedAt.toISOString(),
    tags: site.tags.map((st) => ({
      id: st.tag.id,
      name: st.tag.name,
      color: st.tag.color,
      user_id: st.tag.userId,
      created_at: st.tag.createdAt.toISOString(),
    })),
    cgv_versions: site.cgvVersions.map((v) => ({
      id: v.id,
      content_hash: v.contentHash,
      raw_text: v.rawText,
      source_url: v.sourceUrl,
      extracted_at: v.extractedAt.toISOString(),
      analysis: v.analysis
        ? {
            id: v.analysis.id,
            global_score: v.analysis.globalScore,
            rating: v.analysis.rating,
            analyzed_at: v.analysis.analyzedAt.toISOString(),
            clauses: v.analysis.clauses.map((c) => ({
              id: c.id,
              analysis_id: c.analysisId,
              clause_type: c.clauseType,
              content: c.content,
              severity: c.severity,
              score_impact: c.scoreImpact,
            })),
          }
        : null,
    })),
  });
}

export async function getSiteHistoryDetailHandler(
  request: FastifyRequest<{ Params: { domain: string; historyId: string } }>,
  reply: FastifyReply,
) {
  const { domain, historyId } = request.params;

  const version = await prisma.cgvVersion.findFirst({
    where: {
      id: historyId,
      site: { domain },
    },
    include: {
      analysis: {
        include: { clauses: true },
      },
    },
  });

  if (!version) {
    return reply.code(404).send({ error: "Version not found" });
  }

  return reply.send({
    id: version.id,
    content_hash: version.contentHash,
    raw_text: version.rawText,
    source_url: version.sourceUrl,
    extracted_at: version.extractedAt.toISOString(),
    analysis: version.analysis
      ? {
          id: version.analysis.id,
          global_score: version.analysis.globalScore,
          rating: version.analysis.rating,
          analyzed_at: version.analysis.analyzedAt.toISOString(),
          clauses: version.analysis.clauses.map((c) => ({
            id: c.id,
            analysis_id: c.analysisId,
            clause_type: c.clauseType,
            content: c.content,
            severity: c.severity,
            score_impact: c.scoreImpact,
          })),
        }
      : null,
  });
}
