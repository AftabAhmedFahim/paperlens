"use client";

import { useState } from "react";
import samplePaperJson from "@/data/sample-paper.json";
import sampleCosJson from "@/data/sample-cos.json";
import { mockAudit } from "@/components/mockAudit";
import { UploadPanel, Analyzing } from "@/components/UploadAndAnalyzing";
import {
  HealthScore,
  CoverageGrid,
  BloomChart,
  Repeats,
  Issues,
} from "@/components/ReportSections";

type Screen = "upload" | "analyzing" | "report";

// Co texts from sample-cos for display in coverage cards
const CO_TEXTS: Record<string, string> = {
  CO1: "Explain fundamental database concepts, DBMS architecture, and the relational data model.",
  CO2: "Design an entity-relationship model for a given domain and map it to a relational schema.",
  CO3: "Formulate queries over a relational database using relational algebra and SQL.",
  CO4: "Analyse functional dependencies and apply normalisation up to BCNF.",
  CO5: "Evaluate transaction concurrency control and recovery mechanisms.",
  CO6: "Assess indexing structures and query-optimisation strategies.",
};

// Question texts from sample-paper for repeat-card context
const Q_TEXTS: Record<string, string> = {
  Q1: "Define a database management system. List four advantages of a DBMS over a traditional file-processing system.",
  Q2: "Explain the three-schema architecture of a DBMS. Describe the two levels of data independence it provides.",
  Q3: "Draw an ER diagram for a university course-registration system covering students, courses, sections and instructors.",
  Q4: "Map the ER diagram of Question 3 into a set of relational schemas. Identify the primary key and foreign keys of every relation.",
  Q5: "Consider Enrollment(student_id, course_id, semester, grade, instructor_name, instructor_dept)… Normalise up to 3NF.",
  Q6: "Using Student(id, name, dept, cgpa) and Enrollment(id, course_id, grade), write SQL for three distinct query tasks.",
  Q7: "State the ACID properties of a transaction. Briefly explain each property with a suitable example.",
  Q8: "Explain conflict serializability and view serializability. Give one schedule that is view serializable but not conflict serializable.",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [paperText, setPaperText] = useState("");
  const [cosText, setCosText] = useState("");

  function loadSample() {
    setPaperText(JSON.stringify(samplePaperJson, null, 2));
    setCosText(JSON.stringify(sampleCosJson, null, 2));
  }

  function startAudit() {
    setScreen("analyzing");
  }

  function handleGenerateFix(targetCo: string) {
    // No-op: will be wired to backend later
    console.log("Generate fix requested for", targetCo);
  }

  const canAudit = paperText.trim().length > 0 && cosText.trim().length > 0;

  return (
    <>
      {/* ── Navigation ── */}
      <nav className="pl-nav">
        <div className="pl-nav-logo">
          <span className="pl-nav-logo-mark">PL</span>
          PaperLens
        </div>
        <span className="pl-nav-tag">Exam Paper Auditor</span>
      </nav>

      <main className="pl-page">
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
                disabled={!canAudit}
              >
                Audit this paper
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ANALYZING SCREEN
        ══════════════════════════════════════════════════════════════ */}
        {screen === "analyzing" && (
          <Analyzing onComplete={() => setScreen("report")} />
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
                  CSE 3103 — Database Management Systems · Semester Final
                </p>
              </div>
              <button
                id="new-audit-btn"
                className="pl-new-audit-btn"
                onClick={() => {
                  setPaperText("");
                  setCosText("");
                  setScreen("upload");
                }}
              >
                New audit
              </button>
            </div>

            <HealthScore score={mockAudit.healthScore} />
            <div className="pl-divider" />

            <CoverageGrid coverage={mockAudit.coverage} coTexts={CO_TEXTS} />
            <div className="pl-divider" />

            <BloomChart bloom={mockAudit.bloom} totalMarks={100} />
            <div className="pl-divider" />

            <Repeats repeats={mockAudit.repeats} questionTexts={Q_TEXTS} />
            <div className="pl-divider" />

            <Issues issues={mockAudit.issues} onGenerateFix={handleGenerateFix} />
          </>
        )}
      </main>
    </>
  );
}
