"use client";

import type { Audit } from "./mockAudit";

export interface AuditRecord {
  paperCourse: string;
  healthScore: number;
  timestamp: string;
  issueCount: number;
  /** We store the full audit so clicking a record can reload it */
  audit: Audit;
}

const STORAGE_PREFIX = "paperlens_history_";

export function loadHistory(facultyId: string): AuditRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + facultyId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(facultyId: string, records: AuditRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + facultyId, JSON.stringify(records));
}

// ─── Colour helpers ──────────────────────────────────────────────────────────

function scoreDot(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AuditHistoryProps {
  records: AuditRecord[];
  onSelect: (record: AuditRecord) => void;
  facultyName: string;
}

export function AuditHistory({ records, onSelect, facultyName }: AuditHistoryProps) {
  if (records.length === 0) {
    return (
      <section className="pl-section">
        <h2 className="pl-section-title">My Audits</h2>
        <div className="pl-history-empty">
          <p className="pl-history-empty-text">
            No audits yet for {facultyName}. Completed audits will appear here
            so you can review past reports without re-running the analysis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="pl-section">
      <h2 className="pl-section-title">My Audits</h2>
      <p className="pl-section-desc">
        Your past audit reports, most recent first. Click any row to reload that
        report.
      </p>
      <div className="pl-history-list">
        {records.map((r, i) => {
          const d = new Date(r.timestamp);
          const dateStr = d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeStr = d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <button
              key={i}
              className="pl-history-row"
              onClick={() => onSelect(r)}
              type="button"
            >
              <span className="pl-history-dot" style={{ background: scoreDot(r.healthScore) }} />
              <span className="pl-history-course">{r.paperCourse}</span>
              <span className="pl-history-score">{r.healthScore}</span>
              <span className="pl-history-issues">
                {r.issueCount} {r.issueCount === 1 ? "issue" : "issues"}
              </span>
              <span className="pl-history-time">
                {dateStr} {timeStr}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
