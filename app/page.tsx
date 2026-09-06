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
import { PaperLibrary, PaperMeta } from "@/components/PaperLibrary";

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

  // ── Database & Paper Library state ──
  const [currentPaperId, setCurrentPaperId] = useState<string | null>("paper-cse3103-sample");
  const [papers, setPapers] = useState<PaperMeta[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // ── Fix-it loop state ──
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<{
    question: Question;
    targetCo: string;
    targetBloom: Bloom;
    replacedQuestion?: Question;
  } | null>(null);
  const [fixAccepted, setFixAccepted] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);

  // ── Faculty state ──
  const [activeFaculty, setActiveFaculty] = useState<Faculty>(FACULTY[0]);
  const [history, setHistory] = useState<AuditRecord[]>([]);

  // Fetch papers for active faculty
  const fetchPapers = useCallback(async (facultyId: string) => {
    try {
      setLoadingPapers(true);
      const res = await fetch(`/api/papers?facultyId=${facultyId}`);
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch (err) {
      console.error("[fetchPapers] error:", err);
    } finally {
      setLoadingPapers(false);
    }
  }, []);

  // Fetch audits from server for a specific paper
  const fetchAuditsForPaper = useCallback(async (paperId: string) => {
    try {
      const res = await fetch(`/api/papers/${paperId}/audits`);
      if (res.ok) {
        const data = await res.json();
        const mapped: AuditRecord[] = (data.audits || []).map((a: any) => ({
          id: a.id,
          paperCourse: paper.course || "CSE 3103",
          healthScore: a.healthScore,
          timestamp: a.created_at,
          issueCount: a.audit?.issues?.length || 0,
          audit: a.audit,
        }));
        setHistory(mapped);
        return;
      }
    } catch (err) {
      console.warn("[fetchAuditsForPaper] server fetch failed, fallback to localStorage:", err);
    }
    setHistory(loadHistory(activeFaculty.id));
  }, [activeFaculty.id, paper.course]);

  // Load papers and initial paper state/audits on mount and faculty change
  useEffect(() => {
    fetchPapers(activeFaculty.id);
    const pid = currentPaperId || (activeFaculty.id === "fac-01" ? "paper-cse3103-sample" : null);
    if (pid) {
      fetchAuditsForPaper(pid);
      fetch(`/api/papers/${pid}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.paper) {
            setPaper(data.paper);
            setCourseOutcomes(data.courseOutcomes);
            const hasSuggested = data.paper.questions.some((q: any) => q.is_suggested);
            if (hasSuggested) setFixAccepted(true);
          }
        })
        .catch(() => {});
    } else {
      setHistory(loadHistory(activeFaculty.id));
    }
  }, [activeFaculty.id, fetchPapers, fetchAuditsForPaper]);

  const switchFaculty = useCallback((f: Faculty) => {
    setActiveFaculty(f);
    setPaper(samplePaperJson as Paper);
    setCourseOutcomes(sampleCosJson as CourseOutcome[]);
    setPaperText("");
    setCosText("");
    setCurrentAudit(null);
    setSuggestedFix(null);
    setFixAccepted(false);
    setError(null);
    setScreen("upload");

    const defaultPid = f.id === "fac-01" ? "paper-cse3103-sample" : null;
    setCurrentPaperId(defaultPid);
    fetchPapers(f.id);
    if (defaultPid) {
      fetchAuditsForPaper(defaultPid);
    } else {
      setHistory([]);
    }
  }, [fetchPapers, fetchAuditsForPaper]);

  async function loadSample() {
    setError(null);
    setSuggestedFix(null);
    setFixAccepted(false);

    try {
      // Ensure the sample paper in DB is reset to pristine 8 questions (60 marks)
      await fetch("/api/papers/paper-cse3103-sample", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: samplePaperJson.questions,
        }),
      });
    } catch (err) {
      console.warn("Could not reset sample paper in DB:", err);
    }

    setCurrentPaperId("paper-cse3103-sample");
    setPaper(samplePaperJson as Paper);
    setCourseOutcomes(sampleCosJson as CourseOutcome[]);
    setPaperText(JSON.stringify(samplePaperJson, null, 2));
    setCosText(JSON.stringify(sampleCosJson, null, 2));
    fetchAuditsForPaper("paper-cse3103-sample");
    fetchPapers(activeFaculty.id);
  }

  async function handleSelectPaper(paperId: string) {
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      if (!res.ok) {
        throw new Error(`Failed to load paper (${res.status})`);
      }
      const data = await res.json();
      setCurrentPaperId(data.id);
      setPaper(data.paper);
      setCourseOutcomes(data.courseOutcomes);
      setPaperText(JSON.stringify(data.paper, null, 2));
      setCosText(JSON.stringify(data.courseOutcomes, null, 2));
      setSuggestedFix(null);
      setFixAccepted(false);
      setError(null);
      fetchAuditsForPaper(data.id);
      runAudit(data.paper, data.courseOutcomes, data.id);
    } catch (err: any) {
      console.error("[handleSelectPaper] error:", err);
      setError(err?.message || "Failed to load paper from library.");
    }
  }

  async function handleDeletePaper(paperId: string) {
    try {
      const res = await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete paper (${res.status})`);
      }
      fetchPapers(activeFaculty.id);
      if (currentPaperId === paperId) {
        setCurrentPaperId("paper-cse3103-sample");
        setHistory([]);
      }
    } catch (err: any) {
      console.error("[handleDeletePaper] error:", err);
      setError(err?.message || "Failed to delete paper.");
    }
  }

  async function handleDeleteAudit(auditId: string) {
    try {
      const res = await fetch(`/api/audits/${auditId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete audit (${res.status})`);
      }
      setHistory((prev) => prev.filter((r) => r.id !== auditId));
      fetchPapers(activeFaculty.id);
    } catch (err: any) {
      console.error("[handleDeleteAudit] error:", err);
      setError(err?.message || "Failed to delete audit.");
    }
  }

  async function runAudit(paperToAudit: Paper, cosToAudit: CourseOutcome[], paperId?: string) {
    setScreen("analyzing");
    setError(null);

    const targetPaperId = paperId || currentPaperId;
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

      let newRecordId: string | undefined;
      if (targetPaperId) {
        try {
          const saveRes = await fetch(`/api/papers/${targetPaperId}/audits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              healthScore: result.healthScore,
              audit: result,
              facultyId: activeFaculty.id,
            }),
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            newRecordId = saveData.id;
          }
        } catch (saveErr) {
          console.warn("[runAudit] failed to persist audit to DB:", saveErr);
        }
      }

      const record: AuditRecord = {
        id: newRecordId,
        paperCourse: paperToAudit.course || "CSE 3103",
        healthScore: result.healthScore,
        timestamp: new Date().toISOString(),
        issueCount: result.issues.length,
        audit: result,
      };
      const updated = [record, ...history.filter((h) => h.id !== newRecordId)];
      setHistory(updated);
      saveHistory(activeFaculty.id, updated);
      fetchPapers(activeFaculty.id);

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
    runAudit(parsedPaper, parsedCos, currentPaperId || undefined);
  }

  function loadFromHistory(record: AuditRecord) {
    setCurrentAudit(record.audit);
    setScreen("report");
  }

  async function handleGenerateFix(issue: Audit["issues"][0], index: number) {
    setGeneratingIndex(index);
    setError(null);

    try {
      // 1. Detect if the issue is a repeat or specific to a question (e.g. "1a is a near-duplicate...", "2a resembles...")
      const repeatMatch = issue.message.match(/^(\w+)\s+(is a near-duplicate|resembles)/);
      const targetQId = repeatMatch ? repeatMatch[1] : undefined;

      // 2. Determine targetCo and targetBloom
      let targetCo = issue.targetCo;
      let targetBloom: Bloom = "Apply";

      if (targetQId) {
        const qa = currentAudit?.questionAnalysis?.find((q) => q.id === targetQId);
        if (qa) {
          targetCo = qa.co;
          targetBloom = qa.bloom;
        } else if (!targetCo) {
          targetCo = targetQId.startsWith("1") ? "CO1" : targetQId.startsWith("2") ? "CO2" : targetQId.startsWith("3") ? "CO3" : "CO4";
        }
      } else if (!targetCo) {
        // e.g. Bloom skew: "55% of marks sit at Remember or Understand"
        targetCo = courseOutcomes.find((c) => c.targetBloom === "Evaluate" || c.targetBloom === "Analyze")?.id || "CO6";
        targetBloom = "Evaluate";
      } else {
        const co = courseOutcomes.find((c) => c.id === targetCo);
        targetBloom = co?.targetBloom ?? (targetCo === "CO6" ? "Evaluate" : "Apply");
      }

      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper,
          courseOutcomes,
          targetCo,
          targetBloom,
          replaceQuestionId: targetQId,
          issueMessage: issue.message,
        }),
      });

      if (!res.ok) {
        throw new Error(`Fix API returned status ${res.status}`);
      }

      const newQuestion: Question = await res.json();
      if ((newQuestion as any).error) {
        throw new Error((newQuestion as any).error);
      }

      const qWithSuggested = { ...newQuestion, is_suggested: 1 };

      let updatedQuestions: Question[];
      let originalReplacedQuestion: Question | undefined;

      if (targetQId && paper.questions.some((q) => q.id === targetQId)) {
        originalReplacedQuestion = paper.questions.find((q) => q.id === targetQId);
        updatedQuestions = paper.questions.map((q) =>
          q.id === targetQId ? qWithSuggested : q
        );
      } else {
        const alreadyExists = paper.questions.some((q) => q.id === newQuestion.id);
        updatedQuestions = alreadyExists
          ? paper.questions.map((q) => (q.id === newQuestion.id ? qWithSuggested : q))
          : [...paper.questions, qWithSuggested];
      }

      const extendedTotalMarks = updatedQuestions.reduce((s, q) => s + (q.marks || 0), 0);
      const updatedPaper: Paper = {
        ...paper,
        questions: updatedQuestions,
        totalMarks: extendedTotalMarks,
      };

      setPaper(updatedPaper);
      setSuggestedFix({
        question: newQuestion,
        targetCo: targetCo || "CO6",
        targetBloom,
        replacedQuestion: originalReplacedQuestion,
      });
      setFixAccepted(false);
    } catch (err: any) {
      console.error("[handleGenerateFix] error:", err);
      setError(err?.message || "Failed to generate fix question.");
    } finally {
      setGeneratingIndex(null);
    }
  }

  async function handleAcceptFix() {
    if (!suggestedFix || !currentPaperId) return;
    try {
      const questionsToSave = paper.questions.map((q) => ({
        id: q.id,
        text: q.text,
        marks: q.marks,
        is_suggested: q.id === suggestedFix.question.id || (q as any).is_suggested ? 1 : 0,
      }));

      const res = await fetch(`/api/papers/${currentPaperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsToSave }),
      });

      if (res.ok) {
        setFixAccepted(true);
        fetchPapers(activeFaculty.id);
      }
    } catch (err) {
      console.error("[handleAcceptFix] error:", err);
    }
  }

  async function handleRerunAudit() {
    setIsRerunning(true);
    setError(null);

    try {
      // Ensure the suggested fix is saved to SQLite
      if (suggestedFix && currentPaperId && !fixAccepted) {
        const questionsToSave = paper.questions.map((q) => ({
          id: q.id,
          text: q.text,
          marks: q.marks,
          is_suggested: q.id === suggestedFix.question.id || (q as any).is_suggested ? 1 : 0,
        }));
        await fetch(`/api/papers/${currentPaperId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsToSave }),
        });
        setFixAccepted(true);
      }

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

      let newRecordId: string | undefined;
      if (currentPaperId) {
        try {
          const saveRes = await fetch(`/api/papers/${currentPaperId}/audits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              healthScore: updatedAudit.healthScore,
              audit: updatedAudit,
              facultyId: activeFaculty.id,
            }),
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            newRecordId = saveData.id;
          }
        } catch (saveErr) {
          console.warn("[handleRerunAudit] failed to persist audit to DB:", saveErr);
        }
      }

      const record: AuditRecord = {
        id: newRecordId,
        paperCourse: paper.course || "CSE 3103",
        healthScore: updatedAudit.healthScore,
        timestamp: new Date().toISOString(),
        issueCount: updatedAudit.issues.length,
        audit: updatedAudit,
      };
      const updated = [record, ...history.filter((h) => h.id !== newRecordId)];
      setHistory(updated);
      saveHistory(activeFaculty.id, updated);
      fetchPapers(activeFaculty.id);
    } catch (err: any) {
      console.error("[handleRerunAudit] error:", err);
      setError(err?.message || "Failed to re-run audit.");
    } finally {
      setIsRerunning(false);
    }
  }

  async function handleRejectSuggestion() {
    if (!suggestedFix) return;

    let restoredQuestions: Question[];
    if (suggestedFix.replacedQuestion) {
      restoredQuestions = paper.questions.map((q) =>
        q.id === suggestedFix.question.id ? suggestedFix.replacedQuestion! : q
      );
    } else {
      restoredQuestions = paper.questions.filter((q) => q.id !== suggestedFix.question.id);
    }

    const total = restoredQuestions.reduce((s, q) => s + (q.marks || 0), 0);
    setPaper({
      ...paper,
      questions: restoredQuestions,
      totalMarks: total,
    });
    setSuggestedFix(null);
    setFixAccepted(false);

    if (currentPaperId && fixAccepted) {
      try {
        await fetch(`/api/papers/${currentPaperId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: restoredQuestions }),
        });
        fetchPapers(activeFaculty.id);
      } catch (err) {
        console.error("[handleRejectSuggestion] error reverting DB:", err);
      }
    }
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

            <PaperLibrary
              papers={papers}
              activePaperId={currentPaperId}
              onSelect={handleSelectPaper}
              onDelete={handleDeletePaper}
              facultyName={activeFaculty.name}
              loading={loadingPapers}
            />

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
                onDelete={handleDeleteAudit}
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
                    setFixAccepted(false);
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

            <CoverageGrid
              coverage={audit.coverage}
              coTexts={coTexts}
              suggestedQuestionIds={paper.questions
                .filter((q: any) => q.is_suggested || (suggestedFix && q.id === suggestedFix.question.id))
                .map((q) => q.id)}
            />
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
                  replacedQuestionId={suggestedFix.replacedQuestion?.id}
                  onRerun={handleRerunAudit}
                  onAccept={handleAcceptFix}
                  onDismiss={handleRejectSuggestion}
                  isRerunning={isRerunning}
                  isAccepted={fixAccepted}
                />
                <div className="pl-divider" />
              </>
            )}

            <Issues
              issues={audit.issues}
              onGenerateFix={handleGenerateFix}
              generatingIndex={generatingIndex}
            />
            <div className="pl-divider" />

            <AuditHistory
              records={history}
              onSelect={loadFromHistory}
              onDelete={handleDeleteAudit}
              facultyName={activeFaculty.name}
            />
          </>
        )}
      </main>
    </>
  );
}
