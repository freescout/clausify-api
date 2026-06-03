// ─── Domain enums (mirror the Prisma enums & frontend contract) ──────────

export type ClauseType =
  | "personal_data"
  | "third_party"
  | "abusive"
  | "retention"
  | "recourse";

export type Severity = "high" | "medium" | "low";
export type Rating = "green" | "orange" | "red";

// ─── Auth ────────────────────────────────────────────────────────────────

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

// What we encode inside the JWT
export interface JwtPayload {
  userId: string;
  email: string;
}

// Public-facing user shape (never expose the password hash)
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}
