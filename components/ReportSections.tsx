"use client";

import { useState, useEffect } from "react";
import { Audit, Bloom, Question } from "@/lib/types";

// ─── Health Score ────────────────────────────────────────────────────────────

interface HealthScoreProps {
  score: number;
}

function scoreColor(score: number) {
  if (score >= 75) return { ring: "#22c55e", text: "#16a34a", label: "Healthy", bg: "#f0fdf4" };
  if (score >= 50) return { ring: "#f59e0b", text: "#b45309", label: "Needs Attention", bg: "#fffbeb" };
  return { ring: "#ef4444", text: "#b91c1c", label: "At Risk", bg: "#fef2f2" };
}

export function HealthScore({ score }: HealthScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    const start = displayScore;
    const end = score;
    if (start === end) return;
    const duration = 1200;
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

  const { ring, text, label, bg } = scoreColor(displayScore);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - displayScore / 100);

  return (
    <section className="pl-section">
      <h2 className="pl-section-title">Assessment Health Score</h2>
      <p className="pl-section-desc">
        A composite measure of outcome coverage, cognitive level spread, and
        question integrity. Scores below 50 indicate serious structural issues,
        50–75 indicate notable gaps, and scores above 75 represent a sound assessment.
      </p>

      <div className="pl-health-card" style={{ background: bg, borderColor: ring + "40" }}>
        <div className="pl-health-gauge">
          <svg viewBox="0 0 120 120" width="160" height="160">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
            <text
              x="60" y="56"
              textAnchor="middle"
              fontSize="26"
              fontWeight="700"
              fill={text}
              fontFamily="inherit"
            >
              {displayScore}
            </text>
            <text
              x="60" y="74"
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
              fontFamily="inherit"
            >
              out of 100
            </text>
          </svg>
        </div>

        <div className="pl-health-meta">
          <span className="pl-health-badge" style={{ color: text, background: ring + "20" }}>
            {label}
          </span>
          <p className="pl-health-desc" style={{ color: text }}>
            {displayScore >= 75
              ? "This paper covers the course outcomes well and shows a sound distribution of cognitive levels."
              : displayScore >= 50
              ? "This paper has notable gaps. Address the high-severity issues before submission."
              : "This paper has serious structural issues. Several outcomes are missing or severely under-weighted."}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Coverage ────────────────────────────────────────────────────────────────

const statusMeta = {
  ok:      { label: "Good coverage",     color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  under:   { label: "Under-weighted",    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  over:    { label: "Over-weighted",     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  missing: { label: "Not assessed",      color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

interface CoverageGridProps {
  coverage: Audit["coverage"];
  coTexts?: Record<string, string>;
}

export function CoverageGrid({ coverage, coTexts = {} }: CoverageGridProps) {
  return (
    <section className="pl-section">
      <h2 className="pl-section-title">Outcome Coverage</h2>
      <p className="pl-section-desc">
        Each card represents one course outcome. The percentage reflects that
        outcome&apos;s share of total marks. Targets should typically fall between
        10% and 40% per outcome (below 10% is under-assessed, above 40% is over-weighted).
      </p>

      <div className="pl-coverage-grid">
        {coverage.map((c) => {
          const meta = statusMeta[c.status];
          return (
            <div
              key={c.co}
              className="pl-coverage-card"
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <div className="pl-coverage-header">
                <span className="pl-coverage-id">{c.co}</span>
                <span className="pl-coverage-badge" style={{ color: meta.color, background: meta.color + "18" }}>
                  {meta.label}
                </span>
              </div>

              {coTexts[c.co] && (
                <p className="pl-coverage-text">{coTexts[c.co]}</p>
              )}

              <div className="pl-coverage-stats">
                <div className="pl-coverage-stat">
                  <span className="pl-stat-value" style={{ color: meta.color }}>
                    {c.marks}
                  </span>
                  <span className="pl-stat-label">marks</span>
                </div>
                <div className="pl-coverage-stat">
                  <span className="pl-stat-value" style={{ color: meta.color }}>
                    {c.sharePct}%
                  </span>
                  <span className="pl-stat-label">share</span>
                </div>
                <div className="pl-coverage-stat">
                  <span className="pl-stat-value" style={{ color: meta.color }}>
                    {c.questionIds.length}
                  </span>
                  <span className="pl-stat-label">
                    {c.questionIds.length === 1 ? "question" : "questions"}
                  </span>
                </div>
              </div>

              {c.status === "missing" && (
                <div className="pl-missing-banner">
                  No question in this paper assesses this outcome.
                </div>
              )}

              {c.questionIds.length > 0 && (
                <div className="pl-question-tags">
                  {c.questionIds.map((q) => (
                    <span key={q} className="pl-qtag">{q}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Bloom Distribution ──────────────────────────────────────────────────────

const bloomMeta: Record<Bloom, { color: string; low: boolean }> = {
  Remember:   { color: "#94a3b8", low: true },
  Understand: { color: "#64748b", low: true },
  Apply:      { color: "#4f46e5", low: false },
  Analyze:    { color: "#7c3aed", low: false },
  Evaluate:   { color: "#0891b2", low: false },
  Create:     { color: "#059669", low: false },
};

const bloomOrder: Bloom[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

interface BloomChartProps {
  bloom: Record<Bloom, number>;
  totalMarks?: number;
}

export function BloomChart({ bloom, totalMarks = 60 }: BloomChartProps) {
  const max = Math.max(...Object.values(bloom), 1);

  return (
    <section className="pl-section">
      <h2 className="pl-section-title">Cognitive Level Distribution</h2>
      <p className="pl-section-desc">
        Bloom&apos;s Taxonomy levels are shown by total marks awarded at each level.
        The two lower-order levels — Remember and Understand — are shown in grey.
        A balanced assessment should not concentrate more than 50% of marks in
        these two levels.
      </p>

      <div className="pl-bloom-chart">
        {bloomOrder.map((level) => {
          const pct = bloom[level] ?? 0;
          const marks = Math.round((pct / 100) * totalMarks);
          const barWidth = Math.round((pct / max) * 100);
          const meta = bloomMeta[level];

          return (
            <div key={level} className="pl-bloom-row">
              <div className="pl-bloom-label">
                <span className={meta.low ? "pl-bloom-level-low" : "pl-bloom-level"}>
                  {level}
                </span>
              </div>
              <div className="pl-bloom-bar-track">
                <div
                  className="pl-bloom-bar"
                  style={{
                    width: `${barWidth}%`,
                    background: meta.color,
                    opacity: meta.low ? 0.55 : 1,
                  }}
                />
              </div>
              <div className="pl-bloom-numbers">
                <span className="pl-bloom-marks">{marks}</span>
                <span className="pl-bloom-pct">{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="pl-bloom-legend">
        <span className="pl-legend-dot" style={{ background: "#94a3b8" }} />
        Lower-order (Remember + Understand)
        <span className="pl-legend-dot" style={{ background: "#4f46e5", marginLeft: "1.5rem" }} />
        Higher-order (Apply through Create)
      </p>
    </section>
  );
}

// ─── Repeats ─────────────────────────────────────────────────────────────────

const verdictMeta: Record<
  "near-duplicate" | "related" | "distinct",
  { label: string; color: string; bg: string; border: string }
> = {
  "near-duplicate": { label: "Flagged", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  related:          { label: "Related", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  distinct:         { label: "Clear",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

interface RepeatCardProps {
  repeat: Audit["repeats"][0];
  paperQuestion?: string;
}

function RepeatCard({ repeat, paperQuestion }: RepeatCardProps) {
  const meta = verdictMeta[repeat.verdict] ?? verdictMeta.related;

  return (
    <div className="pl-repeat-card" style={{ borderColor: meta.border }}>
      <div className="pl-repeat-header">
        <span className="pl-repeat-id">{repeat.questionId}</span>
        <span className="pl-repeat-badge" style={{ color: meta.color, background: meta.color + "18" }}>
          {meta.label}
        </span>
        <span className="pl-repeat-sim" style={{ color: meta.color }}>
          {Math.round(repeat.similarity * 100)}% match
        </span>
        <span className="pl-repeat-year">{repeat.matchYear}</span>
      </div>

      <div className="pl-repeat-grid">
        <div className="pl-repeat-col">
          <div className="pl-repeat-col-label">This paper</div>
          <p className="pl-repeat-text">
            {paperQuestion ?? "Question text not available."}
          </p>
        </div>
        <div className="pl-repeat-divider" />
        <div className="pl-repeat-col">
          <div className="pl-repeat-col-label">{repeat.matchYear} paper</div>
          <p className="pl-repeat-text">{repeat.matchText}</p>
        </div>
      </div>

      <p className="pl-repeat-reason">{repeat.reason}</p>
    </div>
  );
}

interface RepeatsProps {
  repeats: Audit["repeats"];
  questionTexts?: Record<string, string>;
}

export function Repeats({ repeats, questionTexts = {} }: RepeatsProps) {
  if (repeats.length === 0) {
    return (
      <section className="pl-section">
        <h2 className="pl-section-title">Repeated Questions</h2>
        <p className="pl-empty">No matches found against the past-paper archive.</p>
      </section>
    );
  }

  return (
    <section className="pl-section">
      <h2 className="pl-section-title">Repeated Questions</h2>
      <p className="pl-section-desc">
        Questions are compared against three years of past papers (2022–2024) from this
        course. Questions with matching tasks are flagged as near-duplicates;
        similar topics with differing tasks are marked as related.
      </p>
      <div className="pl-repeat-list">
        {repeats.map((r) => (
          <RepeatCard
            key={r.questionId}
            repeat={r}
            paperQuestion={questionTexts[r.questionId]}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Issues ──────────────────────────────────────────────────────────────────

const severityMeta = {
  high:   { label: "High",   color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
  medium: { label: "Medium", color: "#92400e", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
  low:    { label: "Low",    color: "#374151", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
};

interface IssuesProps {
  issues: Audit["issues"];
  onGenerateFix?: (targetCo: string) => void;
  generatingCo?: string | null;
}

export function Issues({ issues, onGenerateFix, generatingCo }: IssuesProps) {
  const sorted = [...issues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <section className="pl-section">
      <h2 className="pl-section-title">Issues</h2>
      <p className="pl-section-desc">
        Issues are sorted by severity. High-severity items should be resolved
        before the paper is submitted for review.
      </p>

      <div className="pl-issues-list">
        {sorted.map((issue, i) => {
          const meta = severityMeta[issue.severity];
          const isGenerating = generatingCo === issue.targetCo;
          return (
            <div
              key={i}
              className="pl-issue-row"
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <span className="pl-issue-dot" style={{ background: meta.dot }} />
              <div className="pl-issue-body">
                <span className="pl-issue-badge" style={{ color: meta.color, background: meta.color + "18" }}>
                  {meta.label}
                </span>
                <p className="pl-issue-msg">{issue.message}</p>
              </div>
              {issue.severity === "high" && issue.targetCo && (
                <button
                  className="pl-fix-btn"
                  onClick={() => onGenerateFix?.(issue.targetCo!)}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating fix…" : "Generate fix"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Suggested Fix Card ──────────────────────────────────────────────────────

interface SuggestedQuestionCardProps {
  question: Question;
  targetCo?: string;
  onRerun: () => void;
  onDismiss: () => void;
  isRerunning?: boolean;
}

export function SuggestedQuestionCard({
  question,
  targetCo,
  onRerun,
  onDismiss,
  isRerunning = false,
}: SuggestedQuestionCardProps) {
  return (
    <div className="pl-suggested-card">
      <div className="pl-suggested-header">
        <div className="pl-suggested-tags">
          <span className="pl-suggested-badge">Suggested Question</span>
          <span className="pl-suggested-tag">Question {question.id}</span>
          <span className="pl-suggested-tag">{question.marks} marks</span>
          {targetCo && <span className="pl-suggested-tag">{targetCo}</span>}
        </div>
        <div className="pl-suggested-actions">
          <button
            type="button"
            className="pl-rerun-btn"
            onClick={onRerun}
            disabled={isRerunning}
          >
            {isRerunning ? "Auditing…" : "Re-run audit"}
          </button>
          <button
            type="button"
            className="pl-dismiss-btn"
            onClick={onDismiss}
            disabled={isRerunning}
            title="Reject and remove this suggestion"
          >
            Reject
          </button>
        </div>
      </div>
      <p className="pl-suggested-text">{question.text}</p>
    </div>
  );
}

