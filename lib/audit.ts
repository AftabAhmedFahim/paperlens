import {
  Audit,
  Bloom,
  BLOOM_LEVELS,
  CourseOutcome,
  Paper,
  emptyBloom,
} from "./types";

type Classification = { id: string; co: string; bloom: Bloom; rationale: string };

const LOWER: Bloom[] = ["Remember", "Understand"];
const HIGHER: Bloom[] = ["Analyze", "Evaluate", "Create"];

/**
 * Everything below is deterministic TypeScript. The model only says which CO
 * and which Bloom level a question sits at - coverage, the histogram and the
 * score are computed here so the same paper always produces the same number.
 */
export function buildAudit(
  paper: Paper,
  cos: CourseOutcome[],
  classification: Classification[],
  repeats: Audit["repeats"]
): Audit {
  const byId = new Map(paper.questions.map((q) => [q.id, q]));
  const totalMarks =
    paper.questions.reduce((s, q) => s + (q.marks || 0), 0) || paper.totalMarks || 1;

  const questionAnalysis = classification.filter((c) => byId.has(c.id));

  // --- Bloom histogram: % of total marks at each cognitive level ---
  const bloomMarks = emptyBloom();
  for (const c of questionAnalysis) {
    bloomMarks[c.bloom] += byId.get(c.id)!.marks || 0;
  }
  const bloom = emptyBloom();
  for (const level of BLOOM_LEVELS) {
    bloom[level] = round1((bloomMarks[level] / totalMarks) * 100);
  }

  // --- CO coverage, weighted by marks ---
  const expectedShare = 100 / Math.max(cos.length, 1);
  const coverage: Audit["coverage"] = cos.map((co) => {
    const hits = questionAnalysis.filter((c) => c.co === co.id);
    const marks = hits.reduce((s, c) => s + (byId.get(c.id)!.marks || 0), 0);
    const sharePct = round1((marks / totalMarks) * 100);
    let status: Audit["coverage"][number]["status"];
    if (marks === 0) status = "missing";
    else if (sharePct < expectedShare * 0.6) status = "under";
    else if (sharePct > expectedShare * 1.8) status = "over";
    else status = "ok";
    return { co: co.id, questionIds: hits.map((h) => h.id), marks, sharePct, status };
  });

  // --- Health score ---
  const lowerShare = LOWER.reduce((s, l) => s + bloom[l], 0);
  const higherShare = HIGHER.reduce((s, l) => s + bloom[l], 0);

  const missing = coverage.filter((c) => c.status === "missing").length;
  const under = coverage.filter((c) => c.status === "under").length;
  const over = coverage.filter((c) => c.status === "over").length;
  const nearDupes = repeats.filter((r) => r.verdict === "near-duplicate").length;
  const related = repeats.filter((r) => r.verdict === "related").length;

  const penalties =
    missing * 12 +
    under * 5 +
    over * 3 +
    Math.min(15, Math.max(0, lowerShare - 45) * 0.6) +
    Math.min(9, Math.max(0, 25 - higherShare) * 0.3) +
    Math.min(15, nearDupes * 5) +
    Math.min(4.5, related * 1.5);

  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalties)));

  // --- Issues, sorted by severity ---
  const issues: Audit["issues"] = [];

  for (const c of coverage) {
    if (c.status === "missing") {
      issues.push({
        severity: "high",
        message: `${c.co} is not assessed anywhere in this paper. No question carries marks against this outcome.`,
        targetCo: c.co,
      });
    } else if (c.status === "under") {
      issues.push({
        severity: "medium",
        message: `${c.co} is under-assessed at ${c.sharePct}% of total marks (${c.marks} marks), well below the ${round1(
          expectedShare
        )}% even split across ${cos.length} outcomes.`,
        targetCo: c.co,
      });
    } else if (c.status === "over") {
      issues.push({
        severity: "low",
        message: `${c.co} takes ${c.sharePct}% of total marks - it is crowding out the other outcomes.`,
        targetCo: c.co,
      });
    }
  }

  for (const co of cos) {
    const cov = coverage.find((c) => c.co === co.id);
    if (!cov || cov.marks === 0) continue;
    const reached = questionAnalysis
      .filter((c) => c.co === co.id)
      .map((c) => BLOOM_LEVELS.indexOf(c.bloom));
    const target = BLOOM_LEVELS.indexOf(co.targetBloom);
    if (reached.length && Math.max(...reached) < target) {
      issues.push({
        severity: "medium",
        message: `${co.id} is targeted at "${co.targetBloom}" but the paper only assesses it at "${
          BLOOM_LEVELS[Math.max(...reached)]
        }" level.`,
        targetCo: co.id,
      });
    }
  }

  for (const r of repeats) {
    if (r.verdict === "near-duplicate") {
      issues.push({
        severity: "high",
        message: `${r.questionId} is a near-duplicate of a ${r.matchYear} question (${Math.round(
          r.similarity * 100
        )}% similar). Students working from past papers can pre-memorise the answer.`,
      });
    } else if (r.verdict === "related") {
      issues.push({
        severity: "low",
        message: `${r.questionId} closely resembles a ${r.matchYear} question (${Math.round(
          r.similarity * 100
        )}% similar), though the task differs.`,
      });
    }
  }

  if (higherShare < 25) {
    issues.push({
      severity: higherShare < 10 ? "high" : "medium",
      message: `Only ${round1(
        higherShare
      )}% of marks sit at Analyze, Evaluate or Create. The paper mostly rewards recall and routine procedure.`,
    });
  }
  if (lowerShare > 55) {
    issues.push({
      severity: "medium",
      message: `${round1(
        lowerShare
      )}% of marks are at Remember or Understand level - the paper is skewed toward lower-order thinking.`,
    });
  }

  const rank = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return { healthScore, coverage, bloom, questionAnalysis, repeats, issues };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
