import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeText } from "../services/analysis";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

function claudeResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

beforeEach(() => {
  createMock.mockReset();
});

describe("analyzeText", () => {
  it("recalculates global_score and rating server-side instead of trusting Claude", async () => {
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          domain: "wrong-domain.com",
          analyzed_at: "2020-01-01T00:00:00.000Z",
          global_score: 999, // Claude's own (wrong) math — must be ignored
          rating: "green",
          clauses: [
            { type: "personal_data", content: "a", severity: "high", score_impact: -20 },
            { type: "retention", content: "b", severity: "medium", score_impact: -10 },
          ],
        }),
      ),
    );

    const result = await analyzeText("some tos text", "example.com", "en");

    // 100 - 20 - 10 = 70 → orange
    expect(result.global_score).toBe(70);
    expect(result.rating).toBe("orange");
    expect(result.domain).toBe("example.com");
    expect(result.analyzed_at).not.toBe("2020-01-01T00:00:00.000Z");
  });

  it("clamps the score at 0 and rates it red when clauses are severe", async () => {
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          domain: "example.com",
          analyzed_at: "2020-01-01T00:00:00.000Z",
          global_score: 0,
          rating: "red",
          clauses: Array.from({ length: 6 }, (_, i) => ({
            type: "abusive",
            content: `clause ${i}`,
            severity: "high",
            score_impact: -20,
          })),
        }),
      ),
    );

    const result = await analyzeText("some tos text", "example.com", "en");

    expect(result.global_score).toBe(0);
    expect(result.rating).toBe("red");
  });

  it("rates green at 75 and above", async () => {
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          domain: "example.com",
          analyzed_at: "2020-01-01T00:00:00.000Z",
          global_score: 0,
          rating: "red",
          clauses: [{ type: "retention", content: "a", severity: "low", score_impact: -3 }],
        }),
      ),
    );

    const result = await analyzeText("some tos text", "example.com", "en");

    // 100 - 3 = 97
    expect(result.global_score).toBe(97);
    expect(result.rating).toBe("green");
  });

  it("strips markdown code fences before parsing", async () => {
    createMock.mockResolvedValue(
      claudeResponse(
        "```json\n" +
          JSON.stringify({
            domain: "example.com",
            analyzed_at: "2020-01-01T00:00:00.000Z",
            global_score: 100,
            rating: "green",
            clauses: [],
          }) +
          "\n```",
      ),
    );

    const result = await analyzeText("some tos text", "example.com", "en");

    expect(result.global_score).toBe(100);
    expect(result.rating).toBe("green");
  });

  it("throws a descriptive error when Claude returns invalid JSON", async () => {
    createMock.mockResolvedValue(claudeResponse("not json at all"));

    await expect(analyzeText("some tos text", "example.com", "en")).rejects.toThrow(
      "Claude returned invalid JSON",
    );
  });
});
