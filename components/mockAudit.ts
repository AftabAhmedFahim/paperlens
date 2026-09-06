import { Audit } from "@/lib/types";

export const mockAudit: Audit = {
  healthScore: 62,

  coverage: [
    {
      co: "CO1",
      questionIds: ["Q1", "Q2"],
      marks: 18,
      sharePct: 18,
      status: "ok",
    },
    {
      co: "CO2",
      questionIds: ["Q3", "Q4"],
      marks: 27,
      sharePct: 27,
      status: "over",
    },
    {
      co: "CO3",
      questionIds: ["Q6"],
      marks: 14,
      sharePct: 14,
      status: "under",
    },
    {
      co: "CO4",
      questionIds: ["Q5"],
      marks: 12,
      sharePct: 12,
      status: "ok",
    },
    {
      co: "CO5",
      questionIds: ["Q7", "Q8"],
      marks: 29,
      sharePct: 29,
      status: "over",
    },
    {
      co: "CO6",
      questionIds: [],
      marks: 0,
      sharePct: 0,
      status: "missing",
    },
  ],

  bloom: {
    Remember: 18,
    Understand: 20,
    Apply: 26,
    Analyze: 12,
    Evaluate: 24,
    Create: 0,
  },

  questionAnalysis: [
    {
      id: "Q1",
      co: "CO1",
      bloom: "Remember",
      rationale:
        "Asks students to define a term and list advantages — a pure recall task aligned to foundational concept knowledge.",
    },
    {
      id: "Q2",
      co: "CO1",
      bloom: "Understand",
      rationale:
        "Requires explanation of three-schema architecture, demonstrating conceptual comprehension of DBMS layering.",
    },
    {
      id: "Q3",
      co: "CO2",
      bloom: "Apply",
      rationale:
        "Students construct an ER diagram for a novel scenario, applying modelling techniques to an unseen domain.",
    },
    {
      id: "Q4",
      co: "CO2",
      bloom: "Apply",
      rationale:
        "Mapping ER to relational schemas is a procedural application of a learned algorithm.",
    },
    {
      id: "Q5",
      co: "CO4",
      bloom: "Analyze",
      rationale:
        "Decomposing functional dependencies and tracing normalisation steps requires analytical breakdown of data relationships.",
    },
    {
      id: "Q6",
      co: "CO3",
      bloom: "Apply",
      rationale:
        "Writing SQL for three distinct query patterns applies a learned language to a specified schema.",
    },
    {
      id: "Q7",
      co: "CO5",
      bloom: "Understand",
      rationale:
        "Stating and illustrating ACID properties demonstrates conceptual understanding rather than higher-order evaluation.",
    },
    {
      id: "Q8",
      co: "CO5",
      bloom: "Evaluate",
      rationale:
        "Distinguishing conflict- from view-serializability and constructing a counterexample requires evaluative reasoning about correctness.",
    },
  ],

  repeats: [
    {
      questionId: "Q1",
      matchYear: "2023",
      matchText:
        "Define a database management system. State four advantages it offers over file-based data management.",
      similarity: 0.91,
      verdict: "near-duplicate",
      reason:
        "Near-identical phrasing and identical scope. High chance students have access to the past solution.",
    },
    {
      questionId: "Q7",
      matchYear: "2022",
      matchText:
        "What are the ACID properties of a transaction? Explain each with an example.",
      similarity: 0.78,
      verdict: "related",
      reason:
        "Substantial overlap in structure and expected answer. Consider adding a scenario-based twist.",
    },
  ],

  issues: [
    {
      severity: "high",
      message:
        "CO6 (Indexing and query optimisation) carries 0 marks. It appears in the course syllabus but is entirely absent from this paper.",
      targetCo: "CO6",
    },
    {
      severity: "high",
      message:
        "Q1 has 91% similarity to a 2023 past-paper question. Using it without modification undermines assessment integrity.",
    },
    {
      severity: "medium",
      message:
        "CO2 accounts for 27% of total marks. The recommended ceiling for a single outcome is 20% to ensure breadth of coverage.",
      targetCo: "CO2",
    },
    {
      severity: "medium",
      message:
        "No question targets the 'Create' level of Bloom's Taxonomy. The paper lacks any synthesis or design task.",
    },
    {
      severity: "low",
      message:
        "CO3 is under-represented at 14 marks (14%). Consider adding a relational algebra question to strengthen SQL-and-algebra parity.",
      targetCo: "CO3",
    },
    {
      severity: "low",
      message:
        "Q7 is flagged as a near-repeat from 2022. Low severity since the phrasing differs enough, but a scenario variant is recommended.",
    },
  ],
};
