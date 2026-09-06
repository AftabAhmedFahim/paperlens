"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import samplePaperJson from "@/data/sample-paper.json";
import sampleCosJson from "@/data/sample-cos.json";
import samplePaperCse1101Json from "@/data/sample-paper-cse1101.json";
import samplePaperCse2101Json from "@/data/sample-paper-cse2101.json";
import facultyData from "@/data/faculty.json";
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
import {
  AuditHistory,
  AuditRecord,
} from "@/components/AuditHistory";
import { PaperLibrary, PaperMeta } from "@/components/PaperLibrary";
import { NewPaperModal } from "@/components/NewPaperModal";

type Screen = "upload" | "analyzing" | "report";
type Tab = "dashboard" | "library" | "history";

interface Faculty {
  id: string;
  name: string;
  department: string;
  courses: string[];
}

const FACULTY: Faculty[] = facultyData as Faculty[];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [screen, setScreen] = useState<Screen>("upload");
  const [paper, setPaper] = useState<Paper>(samplePaperJson as Paper);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>(sampleCosJson as CourseOutcome[]);
  const [paperText, setPaperText] = useState("");
  const [cosText, setCosText] = useState("");
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Database & Paper Library state ──
  const [currentPaperId, setCurrentPaperId] = useState<string | null>("paper-cse3103-sample");
  const [papers, setPapers] = useState<PaperMeta[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [isNewPaperModalOpen, setIsNewPaperModalOpen] = useState(false);

  // ── Fix-it loop state ──
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<{
    question: Question;
    targetCo: string;
    targetBloom: Bloom;
    replacedQuestion?: Question;
    issueMessage?: string;
  } | null>(null);
  const [fixError, setFixError] = useState<{ index: number; message: string } | null>(null);
  const [fixAccepted, setFixAccepted] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);

  // ── Faculty state ──
  const [activeFaculty, setActiveFaculty] = useState<Faculty>(FACULTY[0]);
  const [history, setHistory] = useState<AuditRecord[]>([]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

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
      }
    } catch (err) {
      console.error("[fetchAuditsForPaper] error:", err);
    }
  }, [paper.course]);

  // Check current session from /api/auth/me on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.faculty) {
            const match = FACULTY.find((f) => f.id === data.faculty.id);
            if (match) {
              setActiveFaculty(match);
              fetchPapers(match.id);
            }
          }
        }
      } catch {
        // demo fallback
      }
    }
    checkAuthSession();
  }, [fetchPapers]);

  // Initial load
  useEffect(() => {
    fetchPapers(activeFaculty.id);
  }, [activeFaculty.id, fetchPapers]);

  useEffect(() => {
    if (currentPaperId) {
      fetchAuditsForPaper(currentPaperId);
    }
  }, [currentPaperId, fetchAuditsForPaper]);

  // Check for URL query param to open Add Paper modal or switch tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "library" || tabParam === "history") {
        setActiveTab(tabParam as Tab);
      }
      if (params.get("action") === "new-paper" || params.get("new") === "true") {
        setIsNewPaperModalOpen(true);
      }
    }
  }, []);

  // Keyboard shortcut: Ctrl+Enter to audit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (screen === "upload" && activeTab === "dashboard") {
          e.preventDefault();
          startAudit();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, activeTab, paperText, cosText]);

  // Load sample paper and course outcomes
  function loadSample() {
    let p: Paper;
    let c: CourseOutcome[];
    let pid: string;

    if (activeFaculty.id === "fac-03") {
      p = {
        course: samplePaperCse1101Json.course,
        totalMarks: samplePaperCse1101Json.totalMarks,
        questions: samplePaperCse1101Json.questions as Question[],
      };
      c = samplePaperCse1101Json.outcomes as CourseOutcome[];
      pid = "paper-cse1101-sample";
    } else if (activeFaculty.id === "fac-02") {
      p = {
        course: samplePaperCse2101Json.course,
        totalMarks: samplePaperCse2101Json.totalMarks,
        questions: samplePaperCse2101Json.questions as Question[],
      };
      c = samplePaperCse2101Json.outcomes as CourseOutcome[];
      pid = "paper-cse2101-sample";
    } else {
      p = samplePaperJson as Paper;
      c = sampleCosJson as CourseOutcome[];
      pid = "paper-cse3103-sample";
    }

    setPaper(p);
    setCourseOutcomes(c);
    setPaperText(JSON.stringify(p, null, 2));
    setCosText(JSON.stringify(c, null, 2));
    setCurrentPaperId(pid);
    setSuggestedFix(null);
    setFixAccepted(false);
    setFixError(null);
    showToast(`Loaded ${p.course} sample paper & outcomes`);
  }

  // Handle selecting a paper from the Library
  async function handleSelectPaper(paperId: string) {
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      if (!res.ok) throw new Error("Failed to load paper");
      const data = await res.json();
      const p: Paper = {
        course: data.paper.course,
        totalMarks: data.paper.totalMarks,
        questions: data.paper.questions,
      };
      setPaper(p);
      setPaperText(JSON.stringify(p, null, 2));
      if (data.courseOutcomes && data.courseOutcomes.length > 0) {
        setCourseOutcomes(data.courseOutcomes);
        setCosText(JSON.stringify(data.courseOutcomes, null, 2));
      }
      setCurrentPaperId(paperId);
      setSuggestedFix(null);
      setFixAccepted(false);
      setFixError(null);
      setActiveTab("dashboard");
      setScreen("upload");
      showToast(`Loaded ${data.paper.course} paper`);
    } catch (err) {
      console.error("[handleSelectPaper] error:", err);
      showToast("Error loading paper");
    }
  }

  // Handle deleting a paper from the Library
  async function handleDeletePaper(paperId: string) {
    try {
      const res = await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
      if (res.ok) {
        if (currentPaperId === paperId) {
          setCurrentPaperId(null);
        }
        fetchPapers(activeFaculty.id);
        showToast("Paper deleted from library");
      }
    } catch (err) {
      console.error("[handleDeletePaper] error:", err);
    }
  }

  // Handle newly created paper from modal
  function handlePaperCreated(newPaperId: string, newPaper: Paper, newCos: CourseOutcome[]) {
    setPaper(newPaper);
    setCourseOutcomes(newCos);
    setPaperText(JSON.stringify(newPaper, null, 2));
    setCosText(JSON.stringify(newCos, null, 2));
    setCurrentPaperId(newPaperId);
    setSuggestedFix(null);
    setFixAccepted(false);
    setFixError(null);
    setActiveTab("dashboard");
    setScreen("upload");
    fetchPapers(activeFaculty.id);
    showToast(`Paper '${newPaper.course}' created and saved to library!`);
  }

  // Start analysis
  async function startAudit() {
    let currentPaperObj = paper;
    let currentCosObj = courseOutcomes;

    if (paperText.trim()) {
      try {
        currentPaperObj = JSON.parse(paperText);
        setPaper(currentPaperObj);
      } catch {
        setError("Invalid question paper JSON. Please verify formatting.");
        return;
      }
    }

    if (cosText.trim()) {
      try {
        currentCosObj = JSON.parse(cosText);
        setCourseOutcomes(currentCosObj);
      } catch {
        setError("Invalid course outcomes JSON. Please verify formatting.");
        return;
      }
    }

    setError(null);
    setScreen("analyzing");
  }

  // Run audit against server API
  async function runAudit(paperData: Paper, cosData: CourseOutcome[]) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper: paperData, courseOutcomes: cosData }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const audit: Audit = await res.json();
      setCurrentAudit(audit);
      setScreen("report");

      // Save to SQLite
      if (currentPaperId) {
        try {
          const saveRes = await fetch(`/api/papers/${currentPaperId}/audits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              healthScore: audit.healthScore,
              audit,
              facultyId: activeFaculty.id,
            }),
          });
          if (saveRes.ok) {
            fetchAuditsForPaper(currentPaperId);
          }
        } catch (dbErr) {
          console.error("[runAudit] failed to save audit to DB:", dbErr);
        }
      }

      showToast("Audit completed successfully!");
    } catch (err: any) {
      console.error("[runAudit] error:", err);
      setError(err?.message || "Could not analyze question paper. Please try again.");
      setScreen("upload");
    }
  }

  function resetToUpload() {
    setScreen("upload");
    setCurrentAudit(null);
    setSuggestedFix(null);
    setFixAccepted(false);
    setFixError(null);
  }

  // Generate Fix for an issue
  async function handleGenerateFix(issue: Audit["issues"][0], index: number) {
    try {
      setGeneratingIndex(index);
      setError(null);
      setFixError(null);

      const repeatMatch = issue.message.match(/^(\w+)\s+(is a near-duplicate|resembles)/);
      const targetQId = repeatMatch ? repeatMatch[1] : undefined;

      const coMatch = issue.message.match(/\b(CO\d+)\b/);
      const targetCo = issue.targetCo || (coMatch ? coMatch[1] : targetQId ? "CO1" : "CO6");

      const targetBloom: Bloom =
        issue.message.includes("Remember or Understand")
          ? "Evaluate"
          : ((issue as any).targetBloom || "Apply");

      const isRegenerating = Boolean(suggestedFix && (suggestedFix.issueMessage === issue.message || suggestedFix.question.id === targetQId));

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
          currentFixText: suggestedFix?.question?.text,
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
        originalReplacedQuestion = suggestedFix?.replacedQuestion || paper.questions.find((q) => q.id === targetQId);
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
      setPaperText(JSON.stringify(updatedPaper, null, 2));

      setSuggestedFix({
        question: newQuestion,
        targetCo: targetCo || "CO6",
        targetBloom,
        replacedQuestion: originalReplacedQuestion,
        issueMessage: issue.message,
      });
      setFixAccepted(false);
      setFixError(null);

      showToast(isRegenerating ? `Generated alternative fix for Question ${newQuestion.id}` : `Generated fix for Question ${newQuestion.id}`);

      // Smooth scroll to ensure the suggested fix is visible
      setTimeout(() => {
        const el = document.getElementById("suggested-fix-card") || document.getElementById(`issue-row-${index}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } catch (err: any) {
      console.error("[handleGenerateFix] error:", err);
      const errMsg = err?.message || "Failed to generate fix question.";
      setError(errMsg);
      setFixError({ index, message: errMsg });
      showToast(`Fix failed: ${errMsg}`);
    } finally {
      setGeneratingIndex(null);
    }
  }

  // Accept suggested fix
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
        showToast("Fix saved to database");
      }
    } catch (err) {
      console.error("[handleAcceptFix] error:", err);
    }
  }

  // Re-run audit with updated questions
  async function handleRerunAudit() {
    setIsRerunning(true);
    setError(null);

    try {
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

      if (currentPaperId) {
        try {
          await fetch(`/api/papers/${currentPaperId}/audits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              healthScore: updatedAudit.healthScore,
              audit: updatedAudit,
              facultyId: activeFaculty.id,
            }),
          });
          fetchAuditsForPaper(currentPaperId);
        } catch (dbErr) {
          console.error("[handleRerunAudit] DB save error:", dbErr);
        }
      }

      showToast(`Audit re-run! Health score: ${updatedAudit.healthScore}/100`);
    } catch (err: any) {
      console.error("[handleRerunAudit] error:", err);
      setError(err?.message || "Failed to re-run audit.");
    } finally {
      setIsRerunning(false);
    }
  }

  // Reject suggestion
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
    const restoredPaper: Paper = {
      ...paper,
      questions: restoredQuestions,
      totalMarks: total,
    };
    setPaper(restoredPaper);
    setPaperText(JSON.stringify(restoredPaper, null, 2));
    setSuggestedFix(null);
    setFixAccepted(false);
    setFixError(null);

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

    showToast("Suggestion dismissed");
  }

  // Load audit report from history
  function loadFromHistory(record: AuditRecord) {
    setCurrentAudit(record.audit);
    setScreen("report");
    setActiveTab("dashboard");
    setSuggestedFix(null);
    setFixAccepted(false);
    showToast(`Loaded audit record (${record.healthScore}/100)`);
  }

  // Delete an audit record
  async function handleDeleteAudit(recordId: string) {
    try {
      const res = await fetch(`/api/audits/${recordId}`, { method: "DELETE" });
      if (res.ok && currentPaperId) {
        fetchAuditsForPaper(currentPaperId);
        showToast("Audit record deleted");
      }
    } catch (err) {
      console.error("[handleDeleteAudit] error:", err);
    }
  }

  // Switch faculty
  function cycleFaculty() {
    const currentIndex = FACULTY.findIndex((f) => f.id === activeFaculty.id);
    const nextIndex = (currentIndex + 1) % FACULTY.length;
    const nextFaculty = FACULTY[nextIndex];
    setActiveFaculty(nextFaculty);
    fetchPapers(nextFaculty.id);
    showToast(`Switched to ${nextFaculty.name}`);
  }

  // Sign out
  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  const coTexts = useMemo(
    () => Object.fromEntries(courseOutcomes.map((c) => [c.id, c.text || (c as any).description])),
    [courseOutcomes]
  );

  const questionTexts = useMemo(
    () => Object.fromEntries(paper.questions.map((q) => [q.id, q.text])),
    [paper.questions]
  );

  const totalMarks = paper.questions.reduce((s, q) => s + (q.marks || 0), 0);
  const audit = currentAudit;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      {/* ═══════════════════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
        <Link href="/" className="logo">
          <span className="logo-icon">PL</span>
          PaperLens
        </Link>

        <div className="nav-label">Workspace</div>

        <div style={{ padding: "0 10px 10px 10px" }}>
          <button
            type="button"
            id="sidebar-new-paper-btn"
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              gap: 8,
              borderRadius: "8px",
              padding: "9px 12px",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(201, 168, 76, 0.25)",
            }}
            onClick={() => {
              setIsNewPaperModalOpen(true);
              setSidebarOpen(false);
            }}
          >
            <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>＋</span> Add New Paper
          </button>
        </div>

        <button
          type="button"
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("dashboard");
            setSidebarOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "library" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("library");
            setSidebarOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 014 16.5z" />
            <path d="M4 16.5A2.5 2.5 0 016.5 14H20" />
          </svg>
          Paper Library
          <span className="badge">{papers.length}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
            setSidebarOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          Audit History
          <span className="badge">{history.length}</span>
        </button>

        <Link
          href="/"
          className="nav-item"
          style={{ textDecoration: "none" }}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Explore Features
        </Link>

        <div className="nav-label" style={{ marginTop: 14 }}>
          Account
        </div>

        <button
          type="button"
          className="nav-item"
          onClick={() => showToast("Notifications are up to date")}
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          Notifications
        </button>

        <div className="profile-section">
          <div className="profile-row">
            <div className="avatar" style={{ background: "#4f46e5" }}>
              {activeFaculty.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="info">
              <div className="name">{activeFaculty.name}</div>
              <div className="dept">{activeFaculty.department}</div>
            </div>
          </div>

          <button
            type="button"
            className="faculty-switch-btn"
            onClick={cycleFaculty}
            title="Switch faculty profile"
          >
            🔄 Switch Profile ({activeFaculty.name.split(" ")[1] || "Faculty"})
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <main className="main">
        {/* Header */}
        <header className="main-header">
          <div>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1>
              {activeTab === "dashboard" && <>Audit <span>Dashboard</span></>}
              {activeTab === "library" && <>Paper <span>Library</span></>}
              {activeTab === "history" && <>Audit <span>History</span></>}
            </h1>
            <div className="sub">
              {activeTab === "dashboard" && "Upload a paper, run an audit, and review the quality report"}
              {activeTab === "library" && "Manage and load your saved exam question papers"}
              {activeTab === "history" && "Review and reload past audit reports and scores"}
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              id="add-paper-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setIsNewPaperModalOpen(true)}
              style={{
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>+</span> Add Paper
            </button>
            <Link href="/" className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>
              Explore Features
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "4px 12px 4px 6px", borderRadius: 30, border: "1.5px solid var(--gray-light)" }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#4f46e5",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {activeFaculty.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--navy)" }}>
                {activeFaculty.name}
              </span>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 18px",
              borderRadius: 12,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
            role="alert"
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontWeight: 700 }}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: DASHBOARD
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div id="dashboardTab">
            {screen === "upload" && (
              <>
                <div className="upload-grid">
                  <UploadPanel
                    id="paper-input"
                    label="Question Paper"
                    icon="📄"
                    hint="Paste the full question text or upload a JSON file exported from your authoring tool."
                    value={paperText}
                    onChange={setPaperText}
                    onNewPaper={() => setIsNewPaperModalOpen(true)}
                    newPaperLabel="Build Paper"
                  />
                  <UploadPanel
                    id="cos-input"
                    label="Course Outcomes"
                    icon="🎯"
                    hint="Paste the list of course outcomes for this module, or upload the JSON from your course file."
                    value={cosText}
                    onChange={setCosText}
                  />
                </div>

                <div className="actions-bar">
                  <button
                    id="load-sample-btn"
                    className="btn btn-outline"
                    type="button"
                    onClick={loadSample}
                  >
                    📥 Load Sample
                  </button>
                  <button
                    id="new-paper-action-btn"
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setIsNewPaperModalOpen(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span>➕</span> Create New Paper
                  </button>
                  <span className="spacer" />
                  <span className="status-text" id="statusText">
                    {paperText.trim() ? "Ready to audit" : "Paste JSON or load sample"}
                  </span>
                  <button
                    id="audit-btn"
                    className="btn btn-primary"
                    type="button"
                    onClick={startAudit}
                  >
                    🚀 Audit this paper
                  </button>
                </div>
              </>
            )}

            {/* Analyzing Screen with Animated Loading */}
            {screen === "analyzing" && (
              <Analyzing onComplete={() => runAudit(paper, courseOutcomes)} />
            )}

            {/* Audit Report View */}
            {screen === "report" && audit && (
              <div className="report-section" id="reportSection">
                <div className="report-header-bar">
                  <div className="left">
                    <h2 id="reportTitle">Audit Report</h2>
                    <div className="meta" id="reportMeta">
                      {paper.course || "CSE 3103"} · {totalMarks} marks total · {paper.questions.length} questions
                    </div>
                  </div>
                  <div className="right">
                    <button
                      id="re-audit-btn"
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => runAudit(paper, courseOutcomes)}
                    >
                      🔄 Re-run audit
                    </button>
                    <button
                      id="add-paper-report-btn"
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={() => setIsNewPaperModalOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <span>＋</span> Add Paper
                    </button>
                    <button
                      id="new-audit-btn"
                      className="btn btn-outline btn-sm"
                      type="button"
                      onClick={resetToUpload}
                    >
                      ✕ New audit
                    </button>
                  </div>
                </div>

                <HealthScore score={audit.healthScore} />

                <CoverageGrid
                  coverage={audit.coverage}
                  coTexts={coTexts}
                  suggestedQuestionIds={paper.questions
                    .filter((q: any) => q.is_suggested || (suggestedFix && q.id === suggestedFix.question.id))
                    .map((q) => q.id)}
                />

                <BloomChart bloom={audit.bloom} totalMarks={totalMarks} />

                <Repeats repeats={audit.repeats} questionTexts={questionTexts} />

                {suggestedFix && (
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
                )}

                <Issues
                  issues={audit.issues}
                  onGenerateFix={handleGenerateFix}
                  generatingIndex={generatingIndex}
                  activeFix={
                    suggestedFix
                      ? {
                          question: suggestedFix.question,
                          targetCo: suggestedFix.targetCo,
                          replacedQuestionId: suggestedFix.replacedQuestion?.id,
                          issueMessage: suggestedFix.issueMessage,
                        }
                      : null
                  }
                  fixError={fixError}
                  onRerun={handleRerunAudit}
                  onAccept={handleAcceptFix}
                  onDismiss={handleRejectSuggestion}
                  isRerunning={isRerunning}
                  isAccepted={fixAccepted}
                />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: PAPER LIBRARY
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "library" && (
          <div id="libraryTab">
            <PaperLibrary
              papers={papers}
              activePaperId={currentPaperId}
              onSelect={handleSelectPaper}
              onDelete={handleDeletePaper}
              facultyName={activeFaculty.name}
              loading={loadingPapers}
              onOpenNewPaper={() => setIsNewPaperModalOpen(true)}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: AUDIT HISTORY
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div id="historyTab">
            <AuditHistory
              records={history}
              onSelect={loadFromHistory}
              onDelete={handleDeleteAudit}
              facultyName={activeFaculty.name}
            />
          </div>
        )}
      </main>

      {/* New Paper Creator Modal */}
      <NewPaperModal
        isOpen={isNewPaperModalOpen}
        onClose={() => setIsNewPaperModalOpen(false)}
        onCreated={handlePaperCreated}
        facultyId={activeFaculty.id}
        facultyName={activeFaculty.name}
      />

      {/* Floating Toast Notification */}
      <div className={`toast ${toastMessage ? "show" : ""}`} id="toast">
        <span>✨</span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
