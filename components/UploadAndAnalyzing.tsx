"use client";

import { useState, useEffect, useRef } from "react";

interface UploadPanelProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  icon?: string;
}

export function UploadPanel({ label, hint, value, onChange, id, icon }: UploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange((ev.target?.result as string) ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="upload-panel">
      <div className="panel-header">
        <label htmlFor={id}>
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
          {label}
        </label>
        <button
          className="file-btn"
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Upload JSON file"
        >
          Load JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      <p className="hint">{hint}</p>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} JSON here…`}
        spellCheck={false}
      />
    </div>
  );
}

// ─── Analyzing State with Motion & Animated Steps ────────────────────────────

const STEPS = [
  { id: "parse",  label: "Parsing questions and course outcomes",        durationMs: 420 },
  { id: "map",    label: "Mapping questions to course outcomes",          durationMs: 460 },
  { id: "bloom",  label: "Assessing cognitive levels (Bloom's Taxonomy)", durationMs: 460 },
  { id: "repeat", label: "Comparing against past-year papers",            durationMs: 460 },
  { id: "score",  label: "Computing assessment health score",             durationMs: 460 },
];

interface AnalyzingProps {
  onComplete?: () => void;
}

export function Analyzing({ onComplete }: AnalyzingProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    let idx = 0;
    let cancelled = false;

    function advance() {
      if (cancelled) return;
      const step = STEPS[idx];
      if (!step) {
        setTimeout(() => {
          if (!cancelled && onComplete) onComplete();
        }, 220);
        return;
      }
      setActiveStep(idx);
      setTimeout(() => {
        if (cancelled) return;
        setDone((d) => new Set([...d, idx]));
        idx++;
        setTimeout(advance, 90);
      }, step.durationMs);
    }

    advance();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="analyzing-overlay">
      <div className="spinner">
        <svg viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100 28"
          />
        </svg>
      </div>

      <h3>Auditing your paper</h3>
      <p>This usually takes a few seconds. Each step runs against your actual course outcomes.</p>

      <div className="steps" id="analysisSteps">
        {STEPS.map((step, i) => {
          const isDone = done.has(i);
          const isActive = activeStep === i && !isDone;
          return (
            <div
              key={step.id}
              className={`step ${isDone ? "done" : isActive ? "active" : ""}`}
            >
              <span className="icon">
                <span className="circle" />
              </span>
              <span className="label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
