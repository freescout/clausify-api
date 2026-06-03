import "@fastify/jwt";
import type { JwtPayload } from "./index";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload; // what we sign
    user: JwtPayload; // what request.user becomes after jwtVerify
  }
}
