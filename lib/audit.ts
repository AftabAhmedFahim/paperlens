import { Audit, Bloom, BLOOM_LEVELS, CourseOutcome, Paper, emptyBloom } from "./types";

type Classification = { id: string; co: string; bloom: Bloom; rationale: string };

/** ------------------------------------------------------------------
 *  SCORING CONSTANTS - the only knobs. Everything else follows from these.
 *  ------------------------------------------------------------------ */
const MISSING_CO_PENALTY = 15;
const UNDER_CO_PENALTY = 5;
const SKEW_THRESHOLD = 50; // % of marks at Remember+Understand that is tolerated
const SKEW_MAX_PENALTY = 20;
const SKEW_SCALE = 0.4; // 0.4 => the full 20 points at 100% lower-order marks
const NEAR_DUP_PENALTY = 6;
const NEAR_DUP_MAX_PENALTY = 24;

const UNDER_SHARE = 10; // sharePct below this is under-covered
const OVER_SHARE = 40; // sharePct above this is over-covered

const LOWER: Bloom[] = ["Remember", "Understand"];

/**
 * Deterministic. The model only says which CO and which Bloom level each
 * question sits at; coverage, the histogram and the score are computed here,
 * so the same classification always yields the same number.
 */
export function buildAudit(
  paper: Paper,
  cos: CourseOutcome[],
  classification: Classification[],
  repeats: Audit["repeats"] = []
): Audit {
  const byId = new Map(paper.questions.map((q) => [q.id, q]));
  const totalMarks =
    paper.questions.reduce((s, q) => s + (q.marks || 0), 0) || paper.totalMarks || 1;

  const questionAnalysis = classification.filter((c) => byId.has(c.id));

  // --- Bloom histogram: % of total marks at each level ---
  const bloomMarks = emptyBloom();
  for (const c of questionAnalysis) bloomMarks[c.bloom] += byId.get(c.id)!.marks || 0;

  const bloom = emptyBloom();
  for (const level of BLOOM_LEVELS) {
    bloom[level] = round1((bloomMarks[level] / totalMarks) * 100);
  }

  // --- CO coverage, weighted by marks ---
  const coverage: Audit["coverage"] = cos.map((co) => {
    const hits = questionAnalysis.filter((c) => c.co === co.id);
    const marks = hits.reduce((s, c) => s + (byId.get(c.id)!.marks || 0), 0);
    const sharePct = round1((marks / totalMarks) * 100);

    let status: Audit["coverage"][number]["status"];
    if (hits.length === 0) status = "missing";
    else if (sharePct < UNDER_SHARE) status = "under";
    else if (sharePct > OVER_SHARE) status = "over";
    else status = "ok";

    return { co: co.id, questionIds: hits.map((h) => h.id), marks, sharePct, status };
  });

  // --- Health score ---
  const lowerShare = LOWER.reduce((s, l) => s + bloom[l], 0);
  const missing = coverage.filter((c) => c.status === "missing");
  const under = coverage.filter((c) => c.status === "under");
  const nearDupes = repeats.filter((r) => r.verdict === "near-duplicate").length;

  const skewPenalty = Math.min(
    SKEW_MAX_PENALTY,
    Math.max(0, lowerShare - SKEW_THRESHOLD) * SKEW_SCALE
  );

  const dupPenalty = Math.min(NEAR_DUP_MAX_PENALTY, nearDupes * NEAR_DUP_PENALTY);

  const healthScore = clamp(
    Math.round(
      100 -
        missing.length * MISSING_CO_PENALTY -
        under.length * UNDER_CO_PENALTY -
        skewPenalty -
        dupPenalty
    )
  );

  // --- Issues ---
  const issues: Audit["issues"] = [];

  for (const c of missing) {
    issues.push({
      severity: "high",
      message: `${c.co} is not assessed anywhere in this paper. No question carries marks against this outcome.`,
      targetCo: c.co,
    });
  }

  for (const r of repeats) {
    if (r.verdict === "near-duplicate") {
      issues.push({
        severity: "high",
        message: `${r.questionId} is a near-duplicate of a ${r.matchYear} question (${Math.round(
          r.similarity * 100
        )}% similar). Students working from past papers can pre-memorise the answer.`,
      });
    }
  }

  for (const c of under) {
    issues.push({
      severity: "medium",
      message: `${c.co} is under-assessed at ${c.sharePct}% of total marks (${c.marks} of ${totalMarks}).`,
      targetCo: c.co,
    });
  }

  if (lowerShare > SKEW_THRESHOLD) {
    issues.push({
      severity: "medium",
      message: `${round1(
        lowerShare
      )}% of marks sit at Remember or Understand. The paper is skewed toward lower-order thinking.`,
    });
  }

  for (const c of coverage) {
    if (c.status === "over") {
      issues.push({
        severity: "low",
        message: `${c.co} takes ${c.sharePct}% of total marks - it is crowding out the other outcomes.`,
        targetCo: c.co,
      });
    }
  }

  for (const r of repeats) {
    if (r.verdict === "related") {
      issues.push({
        severity: "low",
        message: `${r.questionId} resembles a ${r.matchYear} question (${Math.round(
          r.similarity * 100
        )}% similar), though the task differs.`,
      });
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return { healthScore, coverage, bloom, questionAnalysis, repeats, issues };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
