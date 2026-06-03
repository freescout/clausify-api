import { FastifyRequest, FastifyReply } from "fastify";
import { registerUser, verifyCredentials } from "../services/auth";
import type { RegisterBody, LoginBody } from "../types";

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
) {
  const { email, password, name } = request.body;

  try {
    const user = await registerUser(email, password, name);

    // Sign a JWT for the new user (jwtSign comes from @fastify/jwt)
    const token = await reply.jwtSign({ userId: user.id, email: user.email });

    return reply.code(201).send({ token, user });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return reply.code(409).send({ error: "Email already in use" });
    }
    throw err; // unexpected — let the global error handler deal with it
  }
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;

  const user = await verifyCredentials(email, password);
  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  const token = await reply.jwtSign({ userId: user.id, email: user.email });

  return reply.send({ token, user });
}
