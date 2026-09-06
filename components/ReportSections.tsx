"use client";

import { useState, useEffect } from "react";
import { Audit, Bloom, Question } from "@/lib/types";

// ─── Health Score ────────────────────────────────────────────────────────────

interface HealthScoreProps {
  score: number;
}

function scoreMeta(score: number) {
  if (score >= 75) {
    return {
      color: "#198754",
      bg: "#19875418",
      border: "#19875440",
      label: "Healthy",
      desc: "This paper covers the course outcomes well and shows a sound distribution of cognitive levels.",
    };
  }
  if (score >= 50) {
    return {
      color: "#c9a84c",
      bg: "#c9a84c20",
      border: "#c9a84c40",
      label: "Needs Attention",
      desc: "This paper has notable gaps. Address the high-severity issues before submission.",
    };
  }
  return {
    color: "#dc3545",
    bg: "#dc354520",
    border: "#dc354540",
    label: "At Risk",
    desc: "This paper has serious structural issues. Several outcomes are missing or severely under-weighted.",
  };
}

export function HealthScore({ score }: HealthScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    const start = displayScore;
    const end = score;
    if (start === end) return;
    const duration = 1000;
    const startTime = performance.now();

    let animationFrameId: number;
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayScore(current);
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [score]);

  const meta = scoreMeta(displayScore);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - displayScore / 100);

  return (
    <div className="health-card" id="healthCard">
      <div className="gauge">
        <svg id="healthGauge" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s" }}
          />
          <text
            x="60"
            y="56"
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            fill={meta.color}
            fontFamily="Inter, sans-serif"
          >
            {displayScore}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            out of 100
          </text>
        </svg>
      </div>

      <div className="info">
        <div className="score-label">Assessment Health Score</div>
        <span className="badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
          {meta.label}
        </span>
        <p className="desc">{meta.desc}</p>
      </div>
    </div>
  );
}

// ─── Coverage ────────────────────────────────────────────────────────────────

const coverageMeta = {
  ok:      { label: "Good coverage",  color: "#198754", bg: "#19875415", border: "#19875435" },
  under:   { label: "Under-weighted", color: "#c9a84c", bg: "#c9a84c18", border: "#c9a84c35" },
  over:    { label: "Over-weighted",  color: "#7c3aed", bg: "#7c3aed18", border: "#7c3aed35" },
  missing: { label: "Not assessed",   color: "#dc3545", bg: "#dc354515", border: "#dc354535" },
};

interface CoverageGridProps {
  coverage: Audit["coverage"];
  coTexts?: Record<string, string>;
  suggestedQuestionIds?: string[];
}

export function CoverageGrid({
  coverage,
  coTexts = {},
  suggestedQuestionIds = [],
}: CoverageGridProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ marginBottom: "14px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
          🎯 Outcome Coverage
        </h3>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
          Each card represents one course outcome. The percentage reflects that outcome&apos;s share of total marks.
        </p>
      </div>

      <div className="coverage-grid" id="coverageGrid">
        {coverage.map((c) => {
          const meta = coverageMeta[c.status] || coverageMeta.ok;
          const isMissing = c.status === "missing";
          return (
            <div
              key={c.co}
              className="coverage-card"
              style={{ borderColor: meta.border, background: meta.bg }}
            >
              <div className="header">
                <span className="co-id">{c.co}</span>
                <span
                  className="co-badge"
                  style={{ color: meta.color, background: meta.color + "20" }}
                >
                  {meta.label}
                </span>
              </div>

              {coTexts[c.co] && <div className="co-text">{coTexts[c.co]}</div>}

              <div className="stats">
                <div className="stat">
                  <div className="num" style={{ color: meta.color }}>
                    {c.marks}
                  </div>
                  <div className="lbl">marks</div>
                </div>
                <div className="stat">
                  <div className="num" style={{ color: meta.color }}>
                    {c.sharePct}%
                  </div>
                  <div className="lbl">share</div>
                </div>
                <div className="stat">
                  <div className="num" style={{ color: meta.color }}>
                    {c.questionIds.length}
                  </div>
                  <div className="lbl">questions</div>
                </div>
              </div>

              {isMissing && (
                <div className="missing-banner">No question assesses this outcome.</div>
              )}

              {c.questionIds.length > 0 && (
                <div className="q-tags">
                  {c.questionIds.map((qid) => {
                    const isSuggested = suggestedQuestionIds.includes(qid);
                    return (
                      <span
                        key={qid}
                        className={`tag ${isSuggested ? "suggested" : ""}`}
                        title={isSuggested ? "AI-suggested question" : `Question ${qid}`}
                      >
                        {qid}
                        {isSuggested && " ✨"}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bloom Chart ─────────────────────────────────────────────────────────────

const BLOOM_ORDER: Bloom[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

interface BloomChartProps {
  bloom: Audit["bloom"];
  totalMarks: number;
}

export function BloomChart({ bloom, totalMarks }: BloomChartProps) {
  const bloomMax = Math.max(...Object.values(bloom), 1);

  return (
    <div className="bloom-section">
      <h3>🧠 Cognitive Level Distribution</h3>
      <p className="sub">
        Bloom&apos;s Taxonomy levels shown by total marks. Lower-order levels (Remember, Understand) are shown in neutral grey.
      </p>

      <div id="bloomChart">
        {BLOOM_ORDER.map((level) => {
          const pct = bloom[level] || 0;
          const marks = Math.round((pct / 100) * totalMarks);
          const barWidth = Math.round((pct / bloomMax) * 100);
          const isLow = level === "Remember" || level === "Understand";

          return (
            <div key={level} className="bloom-row">
              <span className={`level ${isLow ? "low" : ""}`}>{level}</span>
              <div className="bar-track">
                <div
                  className="bar"
                  style={{
                    width: `${barWidth}%`,
                    background: isLow ? "#94a3b8" : "var(--gold)",
                    opacity: isLow ? 0.6 : 1,
                  }}
                />
              </div>
              <div className="nums">
                <span className="marks">{marks} m</span>
                <span className="pct">{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bloom-legend">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="dot" style={{ background: "#94a3b8" }} /> Lower-order (Remember + Understand)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 16 }}>
          <span className="dot" style={{ background: "var(--gold)" }} /> Higher-order (Apply through Create)
        </span>
      </div>
    </div>
  );
}

// ─── Repeats ─────────────────────────────────────────────────────────────────

const verdictMeta: Record<
  "near-duplicate" | "related" | "distinct",
  { label: string; color: string; bg: string }
> = {
  "near-duplicate": { label: "Flagged", color: "#dc3545", bg: "#dc354518" },
  related:          { label: "Related", color: "#c9a84c", bg: "#c9a84c18" },
  distinct:         { label: "Clear",   color: "#198754", bg: "#19875418" },
};

interface RepeatCardProps {
  repeat: Audit["repeats"][0];
  paperQuestion?: string;
}

function RepeatCard({ repeat, paperQuestion }: RepeatCardProps) {
  const meta = verdictMeta[repeat.verdict] ?? verdictMeta.related;

  return (
    <div className="repeat-card">
      <div className="header">
        <span className="qid">{repeat.questionId}</span>
        <span
          className="r-badge"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
        <span className="sim" style={{ color: meta.color }}>
          {Math.round(repeat.similarity * 100)}% match
        </span>
        <span className="year">{repeat.matchYear} paper</span>
      </div>

      <div className="grid">
        <div className="col">
          <div className="label">This paper</div>
          <p className="text">
            {paperQuestion ?? "Question text not available."}
          </p>
        </div>
        <div className="divider" />
        <div className="col">
          <div className="label">{repeat.matchYear} past paper</div>
          <p className="text">{repeat.matchText}</p>
        </div>
      </div>

      <div className="reason">
        <strong>Review recommendation:</strong> {repeat.reason}
      </div>
    </div>
  );
}

interface RepeatsProps {
  repeats: Audit["repeats"];
  questionTexts?: Record<string, string>;
}

export function Repeats({ repeats, questionTexts = {} }: RepeatsProps) {
  return (
    <div className="repeats-section">
      <h3>🔁 Repeated Questions</h3>
      <p className="sub">
        Questions compared against three years of past papers (2022–2024). Near-duplicates and related tasks are flagged.
      </p>

      {repeats.length === 0 ? (
        <div className="no-repeats">
          ✅ No matches found against the past-paper archive. All questions are distinct!
        </div>
      ) : (
        <div id="repeatsList">
          {repeats.map((r) => (
            <RepeatCard
              key={r.questionId}
              repeat={r}
              paperQuestion={questionTexts[r.questionId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Suggested Fix Card ──────────────────────────────────────────────────────

interface SuggestedQuestionCardProps {
  question: Question;
  targetCo?: string;
  replacedQuestionId?: string;
  onRerun: () => void;
  onAccept?: () => void;
  onDismiss: () => void;
  isRerunning?: boolean;
  isAccepted?: boolean;
}

export function SuggestedQuestionCard({
  question,
  targetCo,
  replacedQuestionId,
  onRerun,
  onAccept,
  onDismiss,
  isRerunning = false,
  isAccepted = false,
}: SuggestedQuestionCardProps) {
  return (
    <div id="suggested-fix-card" className="suggested-fix">
      <div className="header">
        <div className="tags">
          <span className="tag badge">
            {replacedQuestionId ? "✨ Suggested Replacement" : "✨ Suggested Question"}
          </span>
          <span className="tag">Question {question.id}</span>
          <span className="tag">{question.marks} marks</span>
          {targetCo && <span className="tag">{targetCo}</span>}
          {replacedQuestionId && (
            <span className="tag" style={{ background: "#fef3c7", color: "#92400e" }}>
              Replaces {replacedQuestionId}
            </span>
          )}
          {isAccepted && (
            <span className="tag" style={{ background: "#198754", color: "#fff" }}>
              ✓ Saved to Paper
            </span>
          )}
        </div>

        <div className="actions">
          {onAccept && (
            <button
              type="button"
              className={`btn btn-success btn-sm`}
              onClick={onAccept}
              disabled={isRerunning || isAccepted}
            >
              {isAccepted ? "✓ Accepted" : "✓ Accept fix"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRerun}
            disabled={isRerunning}
          >
            {isRerunning ? "Auditing…" : "🔄 Re-run audit"}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onDismiss}
            disabled={isRerunning}
            title="Dismiss suggestion"
          >
            ✕ Reject
          </button>
        </div>
      </div>

      <div className="question-text">{question.text}</div>
    </div>
  );
}

// ─── Issues ──────────────────────────────────────────────────────────────────

const severityMeta = {
  high:   { label: "High",   color: "#dc3545", bg: "#dc354512", dot: "#dc3545" },
  medium: { label: "Medium", color: "#c9a84c", bg: "#c9a84c14", dot: "#c9a84c" },
  low:    { label: "Low",    color: "#6b7a8f", bg: "#6b7a8f12", dot: "#6b7a8f" },
};

interface ActiveFixInfo {
  question: Question;
  targetCo?: string;
  replacedQuestionId?: string;
  issueMessage?: string;
}

interface IssuesProps {
  issues: Audit["issues"];
  onGenerateFix?: (issue: Audit["issues"][0], index: number) => void;
  generatingIndex?: number | null;
  activeFix?: ActiveFixInfo | null;
  fixError?: { index: number; message: string } | null;
  onRerun?: () => void;
  onAccept?: () => void;
  onDismiss?: () => void;
  isRerunning?: boolean;
  isAccepted?: boolean;
}

export function Issues({
  issues,
  onGenerateFix,
  generatingIndex,
  activeFix,
  fixError,
  onRerun,
  onAccept,
  onDismiss,
  isRerunning,
  isAccepted,
}: IssuesProps) {
  const sorted = [...issues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="issues-section">
      <h3>⚠️ Issues</h3>
      <p className="sub">
        Sorted by severity. You can generate an AI fix for any issue below. High-severity issues should be resolved before exam submission.
      </p>

      <div id="issuesList">
        {sorted.map((issue, i) => {
          const meta = severityMeta[issue.severity];
          const isGenerating = generatingIndex === i;
          const isCurrentFix =
            !!activeFix &&
            (activeFix.issueMessage === issue.message ||
              (!!activeFix.replacedQuestionId && issue.message.startsWith(activeFix.replacedQuestionId + " ")) ||
              (!!activeFix.targetCo && issue.message.includes(activeFix.targetCo)));
          const currentError = fixError?.index === i ? fixError.message : null;

          return (
            <div
              key={i}
              id={`issue-row-${i}`}
              className="issue-row"
              style={{
                background: isCurrentFix ? "#f0fdf4" : meta.bg,
                borderColor: isCurrentFix ? "#10b981" : meta.dot + "35",
              }}
            >
              <span
                className="dot"
                style={{ background: isCurrentFix ? "#10b981" : meta.dot }}
              />
              <div className="body">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: 4 }}>
                  <span
                    className="i-badge"
                    style={{ color: meta.color, background: meta.color + "20" }}
                  >
                    {meta.label}
                  </span>
                  {isCurrentFix && activeFix && (
                    <span className="pl-fix-active-badge">
                      ✓ Fix Ready (Q{activeFix.question.id})
                    </span>
                  )}
                </div>
                <div className="msg">{issue.message}</div>

                {currentError && (
                  <div className="pl-inline-fix-error">
                    ⚠️ {currentError}
                  </div>
                )}

                {isCurrentFix && activeFix && (
                  <div className="pl-inline-fix-box">
                    <div className="pl-inline-fix-meta">
                      <span className="pl-inline-fix-tag">
                        {activeFix.replacedQuestionId
                          ? `Replacement for ${activeFix.replacedQuestionId}`
                          : `Suggested Question ${activeFix.question.id}`}
                      </span>
                      <span className="pl-inline-fix-tag">{activeFix.question.marks} marks</span>
                      {activeFix.targetCo && (
                        <span className="pl-inline-fix-tag">{activeFix.targetCo}</span>
                      )}
                      {isAccepted && (
                        <span className="tag" style={{ background: "#198754", color: "#fff", fontSize: "0.72rem", padding: "2px 8px", borderRadius: 4 }}>
                          ✓ Saved to Paper
                        </span>
                      )}
                    </div>
                    <p className="pl-inline-fix-text">{activeFix.question.text}</p>
                    <div className="pl-inline-fix-actions">
                      {onAccept && (
                        <button
                          type="button"
                          className={`btn btn-success btn-sm`}
                          onClick={onAccept}
                          disabled={isRerunning || isAccepted}
                        >
                          {isAccepted ? "✓ Accepted" : "✓ Accept fix"}
                        </button>
                      )}
                      {onRerun && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={onRerun}
                          disabled={isRerunning}
                        >
                          {isRerunning ? "Auditing…" : "🔄 Re-run audit"}
                        </button>
                      )}
                      {onDismiss && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={onDismiss}
                          disabled={isRerunning}
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {onGenerateFix && (
                <button
                  type="button"
                  className={`fix-btn ${isCurrentFix ? "pl-fix-btn-active" : ""}`}
                  onClick={() => onGenerateFix(issue, i)}
                  disabled={generatingIndex !== null && generatingIndex !== undefined}
                  title={`Generate fix for this ${issue.severity}-severity issue`}
                >
                  {isGenerating ? "Generating…" : isCurrentFix ? "Regenerate fix" : "Generate fix"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
