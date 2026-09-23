import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";

const { prismaMock, analyzeTextMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    site: { upsert: vi.fn(), update: vi.fn() },
    cgvVersion: { findUnique: vi.fn(), upsert: vi.fn() },
    analysis: { create: vi.fn() },
    clause: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
  analyzeTextMock: vi.fn(),
}));

vi.mock("../lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../services/analysis", () => ({ analyzeText: analyzeTextMock }));

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = await buildApp();
});

afterAll(async () => {
  await app?.close();
});

describe("POST /api/auth/register", () => {
  it("returns 201 with a token and the public user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: any) => ({
      id: "user-1",
      email: data.email,
      name: data.name,
      password: data.password,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }));

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "alice@example.com", password: "hunter22", name: "Alice" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.user).toEqual({
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      created_at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns 409 when the email is already registered", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "alice@example.com", password: "hunter22", name: "Alice" },
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 for an invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "not-an-email", password: "short", name: "" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 for unknown credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "nobody@example.com", password: "whatever" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "Invalid credentials" });
  });
});

describe("POST /api/analyze", () => {
  it("returns a cached analysis with 200 when the content hash already exists", async () => {
    prismaMock.site.upsert.mockResolvedValue({ id: "site-1", domain: "example.com" });
    prismaMock.cgvVersion.findUnique.mockResolvedValue({
      analysis: {
        analyzedAt: new Date("2026-01-01T00:00:00.000Z"),
        globalScore: 70,
        rating: "orange",
        clauses: [
          { clauseType: "retention", content: "a", severity: "low", scoreImpact: -3 },
        ],
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      payload: {
        text: "some tos text",
        domain: "example.com",
        sourceUrl: "https://example.com/tos",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(analyzeTextMock).not.toHaveBeenCalled();
    expect(res.json().global_score).toBe(70);
  });

  it("runs a fresh analysis and returns 201 when there is no cached version", async () => {
    prismaMock.site.upsert.mockResolvedValue({ id: "site-1", domain: "example.com" });
    prismaMock.cgvVersion.findUnique.mockResolvedValue(null);
    analyzeTextMock.mockResolvedValue({
      domain: "example.com",
      analyzed_at: "2026-03-01T00:00:00.000Z",
      global_score: 80,
      rating: "green",
      clauses: [
        { type: "personal_data", content: "a", severity: "low", score_impact: -3 },
      ],
    });
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        cgvVersion: { upsert: vi.fn().mockResolvedValue({ id: "version-1" }) },
        analysis: { create: vi.fn().mockResolvedValue({ id: "analysis-1" }) },
        clause: { createMany: vi.fn().mockResolvedValue({}) },
        site: { update: vi.fn().mockResolvedValue({}) },
      }),
    );

    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      payload: {
        text: "some tos text",
        domain: "example.com",
        sourceUrl: "https://example.com/tos",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(analyzeTextMock).toHaveBeenCalledWith("some tos text", "example.com", "en");
    expect(res.json().global_score).toBe(80);
  });
});
