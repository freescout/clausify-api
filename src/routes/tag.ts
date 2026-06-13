import { FastifyInstance } from "fastify";

import { authenticate } from "../middlewares/auth";
import {
  assignTagToSiteHandler,
  createTagHandler,
  deleteTagHandler,
  getTagsHandler,
  removeTagFromSiteHandler,
  updateTagHandler,
} from "../controllers/tag";

export async function tagsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticate] }, getTagsHandler);

  fastify.post<{ Body: { name: string; color?: string } }>(
    "/",
    { preHandler: [authenticate] },
    createTagHandler,
  );

  fastify.patch<{
    Params: { tagId: string };
    Body: { name?: string; color?: string };
  }>("/:tagId", { preHandler: [authenticate] }, updateTagHandler);

  fastify.delete<{ Params: { tagId: string } }>(
    "/:tagId",
    { preHandler: [authenticate] },
    deleteTagHandler,
  );

  fastify.post<{ Params: { tagId: string; siteId: string } }>(
    "/:tagId/sites/:siteId",
    { preHandler: [authenticate] },
    assignTagToSiteHandler,
  );

  fastify.delete<{ Params: { tagId: string; siteId: string } }>(
    "/:tagId/sites/:siteId",
    { preHandler: [authenticate] },
    removeTagFromSiteHandler,
  );
}
