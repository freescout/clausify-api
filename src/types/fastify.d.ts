import "@fastify/jwt";
import type { JwtPayload } from "./index";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload; // what we sign
    user: JwtPayload; // what request.user becomes after jwtVerify
  }
}
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}
