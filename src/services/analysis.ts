import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "../types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── System prompt (section 8.1 from spec) ───────────────────────────────────

const SYSTEM_PROMPT = `You are a legal expert specialized in Terms of Service (ToS) analysis and personal data protection.

# TASK
Analyze the provided ToS text and extract ALL important clauses, categorized with severity scoring.

# CATEGORIES
## personal_data
Personal data collection and usage
- Data collected
- Usage methods
- User rights on data

## third_party
Data sharing or resale to third parties
- Partner sharing
- Third-party resale
- International transfers

## abusive
Potentially abusive or unbalanced clauses
- Limited recourse rights
- Unilateral modifications
- Excessive liability limitations

## retention
Data retention duration
- Storage duration
- Deletion conditions

## recourse
Rights of recourse and withdrawal
- Right of withdrawal
- Mediation and disputes
- Competent jurisdiction

# SEVERITY LEVELS
## high (score_impact: -20)
Concerning clause for user (strong negative impact)
- Data resale without consent
- Indefinite data retention
- No withdrawal right

## medium (score_impact: -10)
Clause to monitor (moderate impact)
- Partner sharing with consent
- Long retention (>2 years)
- Limited recourse

## low (score_impact: -3)
Standard acceptable clause
- Necessary data collection for service
- Short retention (<1 year)
- Standard legal recourse

# SCORING
- Start at 100
- Add score_impact for each clause (all negative)
- Minimum: 0, Maximum: 100
- rating: "red" if score < 50, "orange" if 50 ≤ score < 75, "green" if score ≥ 75

# CONSTRAINTS
- Minimum 3 clauses extracted
- No maximum — analyze ALL relevant clauses
- Each clause must be real and present in the text
- Content understandable by non-lawyers
- score_impact must exactly match severity: high=-20, medium=-10, low=-3
- global_score = 100 + sum of all score_impact values
- If invalid or too short text: return score=50, rating="orange", 1 explanatory clause

# OUTPUT FORMAT
Return ONLY valid JSON, no text before or after:
{
  "domain": "site_name_or_unknown",
  "analyzed_at": "ISO8601_timestamp",
  "global_score": 0-100,
  "rating": "red|orange|green",
  "clauses": [
    {
      "type": "personal_data|third_party|abusive|retention|recourse",
      "content": "clause summary in plain language",
      "severity": "high|medium|low",
      "score_impact": -20|-10|-3
    }
  ]
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeScore(clauses: AnalysisResult["clauses"]): number {
  const total = clauses.reduce((sum, c) => sum + c.score_impact, 0);
  return Math.max(0, Math.min(100, 100 + total));
}

function computeRating(score: number): AnalysisResult["rating"] {
  if (score >= 75) return "green";
  if (score >= 50) return "orange";
  return "red";
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function analyzeText(
  text: string,
  domain: string,
  language: "en" | "fr" = "en",
): Promise<AnalysisResult> {
  const languageInstruction =
    language === "fr"
      ? "Write all clause content in French."
      : "Write all clause content in English.";

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${languageInstruction}

Analyze this Terms of Service for domain "${domain}":

---
${text.slice(0, 12000)}
---`,
      },
    ],
  });

  // Extract text from response
  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim()
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "");

  let result: AnalysisResult;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  // Recalculate server-side as a safeguard — never trust the AI's own math
  result.global_score = computeScore(result.clauses);
  result.rating = computeRating(result.global_score);
  result.analyzed_at = new Date().toISOString();
  result.domain = domain;

  return result;
}
