import { getPaper, getOutcomes, SEED_PAPER_ID } from "../lib/db";

async function verifyStage1() {
  console.log("Loading paper and course outcomes from SQLite database...");
  const paper = getPaper(SEED_PAPER_ID);
  if (!paper) {
    throw new Error(`Paper with id ${SEED_PAPER_ID} not found in database.`);
  }

  const outcomes = getOutcomes(SEED_PAPER_ID);
  if (!outcomes || outcomes.length === 0) {
    throw new Error(`Outcomes for paper ${SEED_PAPER_ID} not found in database.`);
  }

  console.log(`Loaded paper "${paper.title}" (${paper.course})`);
  console.log(`Questions count: ${paper.questions.length}, total marks: ${paper.totalMarks}`);
  console.log(`Question IDs: ${paper.questions.map((q) => q.id).join(", ")}`);
  console.log(`Course outcomes count: ${outcomes.length} (${outcomes.map((o) => o.id).join(", ")})`);

  console.log("POSTing DB paper and outcomes to http://localhost:3000/api/analyze...");
  const response = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper, courseOutcomes: outcomes }),
  });

  if (!response.ok) {
    throw new Error(`API returned HTTP ${response.status}: ${await response.text()}`);
  }

  const audit = await response.json();
  console.log(`Health score: ${audit.healthScore}`);

  if (audit.healthScore === 65) {
    console.log("SUCCESS: Health score is exactly 65! DB mappers verified.");
  } else {
    console.error(`ERROR: Expected health score 65, got ${audit.healthScore}`);
    process.exit(1);
  }
}

verifyStage1().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
