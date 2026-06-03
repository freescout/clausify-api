import { FastifyInstance } from "fastify";
import { registerHandler, loginHandler } from "../controllers/auth";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password", "name"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            name: { type: "string", minLength: 1 },
          },
        },
      },
    },
    registerHandler,
  );

  // POST /auth/login
  app.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    loginHandler,
  );
}
