"use client";

import { useState, useEffect, useCallback } from "react";
import samplePaperJson from "@/data/sample-paper.json";
import sampleCosJson from "@/data/sample-cos.json";
import facultyData from "@/data/faculty.json";
import { mockAudit } from "@/components/mockAudit";
import { Audit, Paper, CourseOutcome, Question, Bloom } from "@/lib/types";
import { UploadPanel, Analyzing } from "@/components/UploadAndAnalyzing";
import {
  HealthScore,
  CoverageGrid,
  BloomChart,
  Repeats,
  Issues,
  SuggestedQuestionCard,
} from "@/components/ReportSections";
import { FacultySwitcher, Faculty } from "@/components/FacultySwitcher";
import {
  AuditHistory,
  AuditRecord,
  loadHistory,
  saveHistory,
} from "@/components/AuditHistory";

type Screen = "upload" | "analyzing" | "report";

const FACULTY: Faculty[] = facultyData as Faculty[];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [paper, setPaper] = useState<Paper>(samplePaperJson as Paper);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>(sampleCosJson as CourseOutcome[]);
  const [paperText, setPaperText] = useState("");
  const [cosText, setCosText] = useState("");
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Fix-it loop state ──
  const [generatingCo, setGeneratingCo] = useState<string | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<{
    question: Question;
    targetCo: string;
    targetBloom: Bloom;
  } | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);

  // ── Faculty state ──
  const [activeFaculty, setActiveFaculty] = useState<Faculty>(FACULTY[0]);
  const [history, setHistory] = useState<AuditRecord[]>([]);

  // Load history from localStorage when faculty changes or on first mount
  useEffect(() => {
    setHistory(loadHistory(activeFaculty.id));
  }, [activeFaculty.id]);

  const switchFaculty = useCallback((f: Faculty) => {
    setActiveFaculty(f);
    setPaper(samplePaperJson as Paper);
    setCourseOutcomes(sampleCosJson as CourseOutcome[]);
    setPaperText("");
    setCosText("");
    setCurrentAudit(null);
    setSuggestedFix(null);
    setError(null);
    setScreen("upload");
  }, []);

  function loadSample() {
    setPaper(samplePaperJson as Paper);
    setCourseOutcomes(sampleCosJson as CourseOutcome[]);
    setPaperText(JSON.stringify(samplePaperJson, null, 2));
    setCosText(JSON.stringify(sampleCosJson, null, 2));
    setError(null);
  }

  async function runAudit(paperToAudit: Paper, cosToAudit: CourseOutcome[]) {
    setScreen("analyzing");
    setError(null);

    const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 2500));
    const fetchPromise = fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper: paperToAudit, courseOutcomes: cosToAudit }),
    }).then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      return (await res.json()) as Audit;
    });

    try {
      const [_, result] = await Promise.all([minWaitPromise, fetchPromise]);
      setCurrentAudit(result);

      // Append real audit to history
      const record: AuditRecord = {
        paperCourse: paperToAudit.course || "CSE 3103",
        healthScore: result.healthScore,
        timestamp: new Date().toISOString(),
        issueCount: result.issues.length,
        audit: result,
      };
      const updated = [record, ...history];
      setHistory(updated);
      saveHistory(activeFaculty.id, updated);

      setScreen("report");
    } catch (err: any) {
      console.error("[runAudit] failed:", err);
      setError(err?.message || "Failed to analyze paper. Using fallback audit.");
      setCurrentAudit(mockAudit);
      setScreen("report");
    }
  }

  function startAudit() {
    let parsedPaper: Paper = samplePaperJson as Paper;
    let parsedCos: CourseOutcome[] = sampleCosJson as CourseOutcome[];

    if (paperText.trim()) {
      try {
        parsedPaper = JSON.parse(paperText);
      } catch {
        parsedPaper = samplePaperJson as Paper;
      }
    }
    if (cosText.trim()) {
      try {
        parsedCos = JSON.parse(cosText);
      } catch {
        parsedCos = sampleCosJson as CourseOutcome[];
      }
    }

    setPaper(parsedPaper);
    setCourseOutcomes(parsedCos);
    runAudit(parsedPaper, parsedCos);
  }

  function loadFromHistory(record: AuditRecord) {
    setCurrentAudit(record.audit);
    setScreen("report");
  }

  async function handleGenerateFix(targetCo: string) {
    setGeneratingCo(targetCo);
    setError(null);

    try {
      const co = courseOutcomes.find((c) => c.id === targetCo);
      const targetBloom: Bloom = co?.targetBloom ?? "Evaluate";

      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper,
          courseOutcomes,
          targetCo,
          targetBloom,
        }),
      });

      if (!res.ok) {
        throw new Error(`Fix API returned status ${res.status}`);
      }

      const newQuestion: Question = await res.json();
      if ((newQuestion as any).error) {
        throw new Error((newQuestion as any).error);
      }

      const alreadyExists = paper.questions.some((q) => q.id === newQuestion.id);
      const extendedQuestions = alreadyExists
        ? paper.questions
        : [...paper.questions, newQuestion];

      const extendedTotalMarks = extendedQuestions.reduce((s, q) => s + (q.marks || 0), 0);
      const updatedPaper: Paper = {
        ...paper,
        questions: extendedQuestions,
        totalMarks: extendedTotalMarks,
      };

      setPaper(updatedPaper);
      setSuggestedFix({
        question: newQuestion,
        targetCo,
        targetBloom,
      });
    } catch (err: any) {
      console.error("[handleGenerateFix] error:", err);
      setError(err?.message || "Failed to generate fix question.");
    } finally {
      setGeneratingCo(null);
    }
  }

  async function handleRerunAudit() {
    setIsRerunning(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper, courseOutcomes }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const updatedAudit: Audit = await res.json();
      setCurrentAudit(updatedAudit);

      const record: AuditRecord = {
        paperCourse: paper.course || "CSE 3103",
        healthScore: updatedAudit.healthScore,
        timestamp: new Date().toISOString(),
        issueCount: updatedAudit.issues.length,
        audit: updatedAudit,
      };
      const updated = [record, ...history];
      setHistory(updated);
      saveHistory(activeFaculty.id, updated);
    } catch (err: any) {
      console.error("[handleRerunAudit] error:", err);
      setError(err?.message || "Failed to re-run audit.");
    } finally {
      setIsRerunning(false);
    }
  }

  function handleRejectSuggestion() {
    if (!suggestedFix) return;
    const filteredQuestions = paper.questions.filter((q) => q.id !== suggestedFix.question.id);
    const total = filteredQuestions.reduce((s, q) => s + (q.marks || 0), 0);
    setPaper({
      ...paper,
      questions: filteredQuestions,
      totalMarks: total,
    });
    setSuggestedFix(null);
  }

  const totalMarks = paper.questions.reduce((s, q) => s + (q.marks || 0), 0) || paper.totalMarks || 60;
  const questionTexts = Object.fromEntries(paper.questions.map((q) => [q.id, q.text]));
  const coTexts = Object.fromEntries(courseOutcomes.map((co) => [co.id, co.text]));
  const audit = currentAudit ?? mockAudit;

  return (
    <>
      {/* ── Navigation ── */}
      <nav className="pl-nav">
        <div className="pl-nav-logo">
          <span className="pl-nav-logo-mark">PL</span>
          PaperLens
        </div>
        <span className="pl-nav-tag">Exam Paper Auditor</span>
        <FacultySwitcher
          faculty={FACULTY}
          active={activeFaculty}
          onSwitch={switchFaculty}
        />
      </nav>

      <main className="pl-page">
        {error && (
          <div className="pl-error-banner" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="pl-error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            UPLOAD SCREEN
        ══════════════════════════════════════════════════════════════ */}
        {screen === "upload" && (
          <>
            <div className="pl-upload-hero">
              <h1>
                Audit a question paper<br />
                <em>before</em> it reaches students.
              </h1>
              <p>
                PaperLens evaluates your draft exam against its course outcomes,
                checks cognitive level distribution, and flags questions that
                have appeared in past years. It evaluates — not generates.
              </p>
            </div>

            <div className="pl-upload-panels">
              <UploadPanel
                id="paper-input"
                label="Question paper"
                hint="Paste the full question text or upload a JSON file exported from your authoring tool."
                value={paperText}
                onChange={setPaperText}
              />
              <UploadPanel
                id="cos-input"
                label="Course outcomes"
                hint="Paste the list of course outcomes for this module, or upload the JSON from your course file."
                value={cosText}
                onChange={setCosText}
              />
            </div>

            <div className="pl-upload-actions">
              <button
                id="load-sample-btn"
                className="pl-sample-btn"
                type="button"
                onClick={loadSample}
              >
                <svg className="pl-sample-icon" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v9m0 0L5 7m3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Load sample
              </button>
              <button
                id="audit-btn"
                className="pl-audit-btn"
                type="button"
                onClick={startAudit}
              >
                Audit this paper
              </button>
            </div>

            {/* Show past audits on the upload screen too */}
            <div style={{ marginTop: "3rem" }}>
              <AuditHistory
                records={history}
                onSelect={loadFromHistory}
                facultyName={activeFaculty.name}
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ANALYZING SCREEN
        ══════════════════════════════════════════════════════════════ */}
        {screen === "analyzing" && (
          <Analyzing />
        )}

        {/* ══════════════════════════════════════════════════════════════
            REPORT SCREEN
        ══════════════════════════════════════════════════════════════ */}
        {screen === "report" && (
          <>
            <div className="pl-report-header">
              <div>
                <h1 className="pl-report-heading">Audit Report</h1>
                <p className="pl-report-sub">
                  {paper.course || "CSE 3103"} — Database Management Systems · Semester Final
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  id="header-rerun-btn"
                  type="button"
                  className="pl-rerun-btn"
                  onClick={handleRerunAudit}
                  disabled={isRerunning}
                >
                  {isRerunning ? "Re-running audit…" : "Re-run audit"}
                </button>
                <button
                  id="new-audit-btn"
                  className="pl-new-audit-btn"
                  onClick={() => {
                    setPaperText("");
                    setCosText("");
                    setCurrentAudit(null);
                    setSuggestedFix(null);
                    setError(null);
                    setScreen("upload");
                  }}
                >
                  New audit
                </button>
              </div>
            </div>

            <HealthScore score={audit.healthScore} />
            <div className="pl-divider" />

            <CoverageGrid coverage={audit.coverage} coTexts={coTexts} />
            <div className="pl-divider" />

            <BloomChart bloom={audit.bloom} totalMarks={totalMarks} />
            <div className="pl-divider" />

            <Repeats repeats={audit.repeats} questionTexts={questionTexts} />
            <div className="pl-divider" />

            {suggestedFix && (
              <>
                <SuggestedQuestionCard
                  question={suggestedFix.question}
                  targetCo={suggestedFix.targetCo}
                  onRerun={handleRerunAudit}
                  onDismiss={handleRejectSuggestion}
                  isRerunning={isRerunning}
                />
                <div className="pl-divider" />
              </>
            )}

            <Issues
              issues={audit.issues}
              onGenerateFix={handleGenerateFix}
              generatingCo={generatingCo}
            />
            <div className="pl-divider" />

            <AuditHistory
              records={history}
              onSelect={loadFromHistory}
              facultyName={activeFaculty.name}
            />
          </>
        )}
      </main>
    </>
  );
}
