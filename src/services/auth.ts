import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import type { PublicUser } from "../types";

const SALT_ROUNDS = 10;

/**
 * Create a new user with a hashed password.
 * Throws if the email is already registered.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.createdAt.toISOString(),
  };
}

/**
 * Verify credentials. Returns the user if valid, otherwise null.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.createdAt.toISOString(),
  };
}
