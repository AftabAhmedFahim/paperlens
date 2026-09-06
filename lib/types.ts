export type Bloom =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";

export const BLOOM_LEVELS: Bloom[] = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];

export type Question = { id: string; text: string; marks: number };

export type Paper = { course: string; totalMarks: number; questions: Question[] };

export type CourseOutcome = { id: string; text: string; targetBloom: Bloom };

export type Audit = {
  healthScore: number;
  coverage: {
    co: string;
    questionIds: string[];
    marks: number;
    sharePct: number;
    status: "ok" | "under" | "over" | "missing";
  }[];
  bloom: Record<Bloom, number>;
  questionAnalysis: { id: string; co: string; bloom: Bloom; rationale: string }[];
  repeats: {
    questionId: string;
    matchYear: string;
    matchText: string;
    similarity: number;
    verdict: "near-duplicate" | "related" | "distinct";
    reason: string;
  }[];
  issues: {
    severity: "high" | "medium" | "low";
    message: string;
    targetCo?: string;
  }[];
};

export type PastQuestion = {
  id: string;
  year: string;
  course: string;
  text: string;
};

export function emptyBloom(): Record<Bloom, number> {
  return {
    Remember: 0,
    Understand: 0,
    Apply: 0,
    Analyze: 0,
    Evaluate: 0,
    Create: 0,
  };
}

export function emptyAudit(): Audit {
  return {
    healthScore: 0,
    coverage: [],
    bloom: emptyBloom(),
    questionAnalysis: [],
    repeats: [],
    issues: [
      {
        severity: "high",
        message:
          "The audit could not be completed. The analysis model returned an unreadable response - please re-run the audit.",
      },
    ],
  };
}
