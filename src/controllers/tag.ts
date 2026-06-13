import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

interface TagBody {
  name: string;
  color?: string;
}

interface TagPatchBody {
  name?: string;
  color?: string;
}

export async function getTagsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user.userId;

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return reply.send(
    tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      user_id: t.userId,
      created_at: t.createdAt.toISOString(),
    })),
  );
}

export async function createTagHandler(
  request: FastifyRequest<{ Body: TagBody }>,
  reply: FastifyReply,
) {
  const userId = request.user.userId;
  const { name, color } = request.body;

  const tag = await prisma.tag.create({
    data: { userId, name, color: color ?? "#6366f1" },
  });

  return reply.code(201).send({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    user_id: tag.userId,
    created_at: tag.createdAt.toISOString(),
  });
}

export async function updateTagHandler(
  request: FastifyRequest<{ Params: { tagId: string }; Body: TagPatchBody }>,
  reply: FastifyReply,
) {
  const userId = request.user.userId;
  const { tagId } = request.params;
  const { name, color } = request.body;

  const existing = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!existing) {
    return reply.code(404).send({ error: "Tag not found" });
  }

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: { ...(name && { name }), ...(color && { color }) },
  });

  return reply.send({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    user_id: tag.userId,
    created_at: tag.createdAt.toISOString(),
  });
}

export async function deleteTagHandler(
  request: FastifyRequest<{ Params: { tagId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.userId;
  const { tagId } = request.params;

  const existing = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!existing) {
    return reply.code(404).send({ error: "Tag not found" });
  }

  await prisma.tag.delete({ where: { id: tagId } });

  return reply.code(204).send();
}

export async function assignTagToSiteHandler(
  request: FastifyRequest<{ Params: { tagId: string; siteId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.userId;
  const { tagId, siteId } = request.params;

  const tag = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!tag) {
    return reply.code(404).send({ error: "Tag not found" });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return reply.code(404).send({ error: "Site not found" });
  }

  await prisma.siteTag.upsert({
    where: { siteId_tagId: { siteId, tagId } },
    update: {},
    create: { siteId, tagId },
  });

  return reply.code(204).send();
}

export async function removeTagFromSiteHandler(
  request: FastifyRequest<{ Params: { tagId: string; siteId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.userId;
  const { tagId, siteId } = request.params;

  const tag = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!tag) {
    return reply.code(404).send({ error: "Tag not found" });
  }

  await prisma.siteTag.deleteMany({ where: { siteId, tagId } });

  return reply.code(204).send();
}
