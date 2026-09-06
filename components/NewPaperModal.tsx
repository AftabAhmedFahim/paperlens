"use client";

import { useState } from "react";
import { Bloom, BLOOM_LEVELS, CourseOutcome, Paper, Question } from "@/lib/types";

interface NewPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newPaperId: string, paper: Paper, outcomes: CourseOutcome[]) => void;
  facultyId: string;
  facultyName: string;
}

const DEFAULT_COS: CourseOutcome[] = [
  { id: "CO1", text: "Recall and state fundamental definitions, principles, and architectural concepts.", targetBloom: "Remember" },
  { id: "CO2", text: "Explain algorithms, theoretical mechanisms, and operational workflows.", targetBloom: "Understand" },
  { id: "CO3", text: "Apply procedures, formalisms, and techniques to solve computational problems.", targetBloom: "Apply" },
  { id: "CO4", text: "Analyze systems, trace behaviors, and debug defects or structural bottlenecks.", targetBloom: "Analyze" },
  { id: "CO5", text: "Evaluate design alternatives, performance trade-offs, and empirical bounds.", targetBloom: "Evaluate" },
  { id: "CO6", text: "Design and synthesize modular components or comprehensive system solutions.", targetBloom: "Create" },
];

export function NewPaperModal({
  isOpen,
  onClose,
  onCreated,
  facultyId,
  facultyName,
}: NewPaperModalProps) {
  const [mode, setMode] = useState<"builder" | "json">("builder");

  // Basic Info
  const [course, setCourse] = useState("");
  const [title, setTitle] = useState("");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1a", text: "", marks: 7 },
    { id: "1b", text: "", marks: 8 },
    { id: "2a", text: "", marks: 7 },
    { id: "2b", text: "", marks: 8 },
  ]);

  // Course Outcomes
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>([
    { id: "CO1", text: "State fundamental terminology and principles.", targetBloom: "Remember" },
    { id: "CO2", text: "Explain core architectural mechanisms and operational flows.", targetBloom: "Understand" },
    { id: "CO3", text: "Apply standard algorithms and procedures to solve stated problems.", targetBloom: "Apply" },
    { id: "CO4", text: "Analyze and trace computational behaviors to detect defects.", targetBloom: "Analyze" },
    { id: "CO5", text: "Evaluate competing approaches and justify design decisions.", targetBloom: "Evaluate" },
    { id: "CO6", text: "Design comprehensive modular solutions for engineering scenarios.", targetBloom: "Create" },
  ]);

  // JSON mode textareas
  const [paperJsonText, setPaperJsonText] = useState("");
  const [cosJsonText, setCosJsonText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Question helpers
  function handleAddQuestion() {
    const nextNum = Math.floor(questions.length / 2) + 1;
    const nextSub = questions.length % 2 === 0 ? "a" : "b";
    const nextId = `${nextNum}${nextSub}`;
    setQuestions([...questions, { id: nextId, text: "", marks: 8 }]);
  }

  function handleUpdateQuestion(index: number, field: keyof Question, value: any) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function handleRemoveQuestion(index: number) {
    if (questions.length <= 1) {
      setError("Paper must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  // Outcome helpers
  function handleAddOutcome() {
    const nextNum = outcomes.length + 1;
    const nextId = `CO${nextNum}`;
    setOutcomes([...outcomes, { id: nextId, text: "", targetBloom: "Apply" }]);
  }

  function handleUpdateOutcome(index: number, field: keyof CourseOutcome, value: any) {
    setOutcomes((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function handleRemoveOutcome(index: number) {
    if (outcomes.length <= 1) {
      setError("Paper must have at least one course outcome.");
      return;
    }
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePreFillStandardCos() {
    setOutcomes(DEFAULT_COS);
  }

  // Switch to JSON mode
  function handleSwitchToJson() {
    const p: Paper = {
      course: course || "CSE 4101",
      totalMarks,
      questions,
    };
    setPaperJsonText(JSON.stringify(p, null, 2));
    setCosJsonText(JSON.stringify(outcomes, null, 2));
    setMode("json");
  }

  // Switch to Builder mode
  function handleSwitchToBuilder() {
    try {
      if (paperJsonText.trim()) {
        const parsedP = JSON.parse(paperJsonText);
        if (parsedP.course) setCourse(parsedP.course);
        if (parsedP.questions) setQuestions(parsedP.questions);
      }
      if (cosJsonText.trim()) {
        const parsedCos = JSON.parse(cosJsonText);
        if (Array.isArray(parsedCos)) setOutcomes(parsedCos);
      }
      setMode("builder");
      setError(null);
    } catch {
      setError("Invalid JSON formatting. Please correct before switching back to Builder.");
    }
  }

  // Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let finalCourse = course.trim();
    let finalTitle = title.trim();
    let finalQuestions: Question[] = [];
    let finalOutcomes: CourseOutcome[] = [];

    if (mode === "builder") {
      if (!finalCourse) {
        setError("Please provide a course code (e.g. CSE 4101).");
        return;
      }

      if (!finalTitle) {
        finalTitle = `${finalCourse} — Semester Final Examination`;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
          setError(`Question ${q.id || i + 1} text cannot be empty.`);
          return;
        }
        if (!q.marks || Number(q.marks) <= 0) {
          setError(`Question ${q.id || i + 1} must carry at least 1 mark.`);
          return;
        }
      }

      for (let i = 0; i < outcomes.length; i++) {
        const c = outcomes[i];
        if (!c.text.trim()) {
          setError(`Course Outcome ${c.id || i + 1} description cannot be empty.`);
          return;
        }
      }

      finalQuestions = questions.map((q) => ({
        id: q.id.trim(),
        text: q.text.trim(),
        marks: Number(q.marks),
      }));

      finalOutcomes = outcomes.map((c) => ({
        id: c.id.trim(),
        text: c.text.trim(),
        targetBloom: c.targetBloom,
      }));
    } else {
      // JSON mode
      try {
        const parsedP = JSON.parse(paperJsonText);
        finalCourse = parsedP.course || course || "CSE 4101";
        finalQuestions = parsedP.questions || [];
      } catch {
        setError("Invalid question paper JSON.");
        return;
      }

      try {
        finalOutcomes = JSON.parse(cosJsonText);
      } catch {
        setError("Invalid course outcomes JSON.");
        return;
      }

      if (!finalQuestions.length) {
        setError("Paper must include at least one question in questions array.");
        return;
      }

      if (!finalOutcomes.length) {
        setError("Paper must include at least one course outcome in JSON array.");
        return;
      }

      finalTitle = title.trim() || `${finalCourse} — Semester Final Examination`;
    }

    const calculatedTotalMarks = finalQuestions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
    const paperPayload: Paper = {
      course: finalCourse,
      totalMarks: calculatedTotalMarks,
      questions: finalQuestions,
    };

    setLoading(true);

    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId,
          title: finalTitle,
          paper: paperPayload,
          courseOutcomes: finalOutcomes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      onCreated(data.id, paperPayload, finalOutcomes);
      onClose();
    } catch (err: any) {
      console.error("[NewPaperModal] creation error:", err);
      setError(err?.message || "Failed to create new examination paper.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pl-modal-overlay">
      <div className="pl-modal-card" style={{ maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="pl-modal-header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "var(--navy)", color: "var(--gold)", width: 32, height: 32, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700 }}>
                +
              </span>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--navy)", fontWeight: 800 }}>
                Create New Examination Paper
              </h2>
            </div>
            <p style={{ margin: "4px 0 0 42px", color: "var(--text-muted)", fontSize: "0.84rem" }}>
              Author paper for {facultyName}. Saved automatically to SQLite library and ready for audit.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === "builder" ? "btn-secondary" : "btn-outline"}`}
              onClick={() => mode !== "builder" && handleSwitchToBuilder()}
              style={{ borderRadius: 8, padding: "6px 14px", fontSize: "0.82rem" }}
            >
              📝 Structured Builder
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === "json" ? "btn-secondary" : "btn-outline"}`}
              onClick={() => mode !== "json" && handleSwitchToJson()}
              style={{ borderRadius: 8, padding: "6px 14px", fontSize: "0.82rem" }}
            >
              {"{ }"} Raw JSON Mode
            </button>
          </div>

          {/* Basic Course Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                Course Code *
              </label>
              <input
                type="text"
                placeholder="e.g. CSE 4101"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1.5px solid var(--gray-light)",
                  fontSize: "0.88rem",
                  background: "var(--cream)",
                  outline: "none",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                Paper Title
              </label>
              <input
                type="text"
                placeholder="e.g. CSE 4101 — Artificial Intelligence, Semester Final"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1.5px solid var(--gray-light)",
                  fontSize: "0.88rem",
                  background: "var(--cream)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {mode === "builder" ? (
            <>
              {/* ─── Questions Builder ─── */}
              <div style={{ marginBottom: 26, padding: "16px", background: "var(--off-white)", borderRadius: 12, border: "1px solid var(--gray-light)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--navy)", fontWeight: 700 }}>
                      Questions ({questions.length})
                    </h3>
                    <span style={{ background: "var(--gold-glow)", color: "#9a7620", fontSize: "0.76rem", fontWeight: 700, padding: "2px 8px", borderRadius: 12, border: "1px solid var(--gold)" }}>
                      Total: {totalMarks} marks
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleAddQuestion}
                    style={{ borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem" }}
                  >
                    + Add Question
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        background: "#fff",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--gray-light)",
                      }}
                    >
                      <div style={{ width: 64 }}>
                        <label style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>
                          ID
                        </label>
                        <input
                          type="text"
                          value={q.id}
                          onChange={(e) => handleUpdateQuestion(idx, "id", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div style={{ width: 70 }}>
                        <label style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>
                          Marks
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.marks}
                          onChange={(e) => handleUpdateQuestion(idx, "marks", Number(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>
                          Question Text *
                        </label>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleUpdateQuestion(idx, "text", e.target.value)}
                          placeholder="State, explain, derive, or design..."
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.84rem",
                            fontFamily: "inherit",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        style={{
                          marginTop: 18,
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          padding: "6px",
                          fontSize: "1rem",
                        }}
                        title="Delete question"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Course Outcomes Builder ─── */}
              <div style={{ padding: "16px", background: "var(--off-white)", borderRadius: 12, border: "1px solid var(--gray-light)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--navy)", fontWeight: 700 }}>
                      Course Outcomes ({outcomes.length})
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handlePreFillStandardCos}
                      style={{ borderRadius: 8, padding: "4px 10px", fontSize: "0.76rem" }}
                    >
                      Pre-fill CO1–CO6
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleAddOutcome}
                      style={{ borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem" }}
                    >
                      + Add Outcome
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {outcomes.map((co, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        background: "#fff",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--gray-light)",
                      }}
                    >
                      <div style={{ width: 68 }}>
                        <input
                          type="text"
                          value={co.id}
                          onChange={(e) => handleUpdateOutcome(idx, "id", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div style={{ width: 120 }}>
                        <select
                          value={co.targetBloom}
                          onChange={(e) => handleUpdateOutcome(idx, "targetBloom", e.target.value as Bloom)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            background: "var(--cream)",
                          }}
                        >
                          {BLOOM_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={co.text}
                          onChange={(e) => handleUpdateOutcome(idx, "text", e.target.value)}
                          placeholder="Outcome description (e.g. State principles...)"
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid var(--gray-light)",
                            fontSize: "0.84rem",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOutcome(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          padding: "6px",
                          fontSize: "0.95rem",
                        }}
                        title="Delete outcome"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ─── Raw JSON Mode ─── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                  Draft Question Paper (JSON)
                </label>
                <textarea
                  rows={8}
                  value={paperJsonText}
                  onChange={(e) => setPaperJsonText(e.target.value)}
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid var(--gray-light)",
                    background: "#1e293b",
                    color: "#f8fafc",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                  Course Outcomes (JSON Array)
                </label>
                <textarea
                  rows={7}
                  value={cosJsonText}
                  onChange={(e) => setCosJsonText(e.target.value)}
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid var(--gray-light)",
                    background: "#1e293b",
                    color: "#f8fafc",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--gray-light)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, background: "var(--cream)" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
            style={{ borderRadius: 8, padding: "8px 18px" }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ borderRadius: 8, padding: "8px 22px" }}
          >
            {loading ? "Saving to Database…" : "💾 Save Paper & Load"}
          </button>
        </div>
      </div>
    </div>
  );
}
