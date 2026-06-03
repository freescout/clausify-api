import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Verifies the JWT on incoming requests.
 * Attach as a preHandler to any route that requires authentication.
 * On success, request.user is populated with the JWT payload.
 * On failure, responds 401 and the route handler never runs.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
