"use client";

import { useState } from "react";

export interface PaperMeta {
  id: string;
  faculty_id: string;
  course: string;
  title: string;
  totalMarks: number;
  questionCount: number;
  latestHealthScore: number | null;
  created_at: string;
  updated_at: string;
}

interface PaperLibraryProps {
  papers: PaperMeta[];
  activePaperId?: string | null;
  onSelect: (paperId: string) => void;
  onDelete: (paperId: string) => void;
  facultyName: string;
  loading?: boolean;
}

function scoreDot(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function PaperLibrary({
  papers,
  activePaperId,
  onSelect,
  onDelete,
  facultyName,
  loading = false,
}: PaperLibraryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (loading) {
    return (
      <section className="pl-section pl-library-section">
        <div className="pl-library-header">
          <div>
            <h2 className="pl-section-title">Paper Library</h2>
            <p className="pl-section-desc">Loading saved question papers…</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pl-section pl-library-section">
      <div className="pl-library-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h2 className="pl-section-title" style={{ margin: 0 }}>Paper Library</h2>
            <span className="pl-library-count-badge">
              {papers.length} {papers.length === 1 ? "paper" : "papers"}
            </span>
          </div>
          <p className="pl-section-desc" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
            Question papers for {facultyName}. Click any paper to load and audit it.
          </p>
        </div>
      </div>

      {papers.length === 0 ? (
        <div className="pl-history-empty" style={{ marginTop: "1rem" }}>
          <p className="pl-history-empty-text">
            No saved question papers found for {facultyName}. Click &ldquo;Load sample&rdquo; or upload a draft paper below.
          </p>
        </div>
      ) : (
        <div className="pl-library-list">
          {papers.map((p) => {
            const isSelected = activePaperId === p.id;
            const isConfirming = confirmDeleteId === p.id;

            return (
              <div
                key={p.id}
                className={`pl-library-card ${isSelected ? "pl-library-card-active" : ""}`}
                onClick={() => {
                  if (!isConfirming) onSelect(p.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (!isConfirming) onSelect(p.id);
                  }
                }}
              >
                <div className="pl-library-card-body">
                  <div className="pl-library-top">
                    <span className="pl-library-course-tag">{p.course}</span>
                    <h3 className="pl-library-title">{p.title}</h3>
                  </div>
                  <div className="pl-library-meta">
                    <span>{p.questionCount} {p.questionCount === 1 ? "question" : "questions"}</span>
                    <span>·</span>
                    <span>{p.totalMarks} marks</span>
                  </div>
                </div>

                <div className="pl-library-card-right">
                  {p.latestHealthScore !== null ? (
                    <div
                      className="pl-library-score-badge"
                      title={`Latest Health Score: ${p.latestHealthScore}/100`}
                    >
                      <span
                        className="pl-history-dot"
                        style={{ background: scoreDot(p.latestHealthScore) }}
                      />
                      <span className="pl-library-score-val">{p.latestHealthScore}</span>
                      <span className="pl-library-score-label">score</span>
                    </div>
                  ) : (
                    <span className="pl-library-unaudited-badge">Not audited</span>
                  )}

                  <div
                    className="pl-library-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isConfirming ? (
                      <div className="pl-library-confirm-box">
                        <span className="pl-library-confirm-label">Delete?</span>
                        <button
                          type="button"
                          className="pl-library-btn-confirm-delete"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            onDelete(p.id);
                          }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="pl-library-btn-cancel-delete"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pl-library-delete-btn"
                        onClick={() => setConfirmDeleteId(p.id)}
                        title="Delete this paper"
                        aria-label={`Delete ${p.title}`}
                      >
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                          <path
                            d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
