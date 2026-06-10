import "dotenv/config";
import { analyzeText } from "../services/analysis";

const SAMPLE_TEXT = `
These Terms of Service govern your use of our platform.

1. Data Collection: We collect your name, email, browsing history, purchase history, 
and device information. This data is used to personalize your experience and target advertising.

2. Third Party Sharing: We may share your personal data with advertising partners, 
analytics providers, and affiliated companies. Your data may be transferred internationally.

3. Data Retention: We retain your data indefinitely, even after account deletion, 
for legal and business purposes.

4. Limitation of Liability: We are not liable for any damages arising from use of 
our service. You waive your right to class action lawsuits.

5. Modifications: We may modify these terms at any time without notice. 
Continued use of the service constitutes acceptance.
`;

async function main() {
  console.log("Running analysis smoke test...\n");

  const result = await analyzeText(SAMPLE_TEXT, "example.com", "en");

  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));
  console.log("\nSummary:");
  console.log(`  Domain:      ${result.domain}`);
  console.log(`  Score:       ${result.global_score}/100`);
  console.log(`  Rating:      ${result.rating}`);
  console.log(`  Clauses:     ${result.clauses.length} found`);
}

main().catch(console.error);
