"use client";

import { useState, useEffect, useRef } from "react";

interface UploadPanelProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}

export function UploadPanel({ label, hint, value, onChange, id }: UploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  return (
    <div className="pl-upload-panel">
      <div className="pl-upload-header">
        <label className="pl-upload-label" htmlFor={id}>{label}</label>
        <button
          className="pl-upload-file-btn"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          Load JSON file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      <p className="pl-upload-hint">{hint}</p>
      <textarea
        id={id}
        className="pl-upload-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} here, or load a JSON file above…`}
        spellCheck={false}
      />
    </div>
  );
}

// ─── Analyzing State ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "parse",   label: "Parsing questions and course outcomes",        durationMs: 800  },
  { id: "map",     label: "Mapping questions to course outcomes",          durationMs: 1400 },
  { id: "bloom",   label: "Assessing cognitive levels (Bloom's Taxonomy)", durationMs: 1600 },
  { id: "repeat",  label: "Comparing against past-year papers",            durationMs: 1800 },
  { id: "score",   label: "Computing assessment health score",             durationMs: 900  },
];

interface AnalyzingProps {
  onComplete: () => void;
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
        setTimeout(() => { if (!cancelled) onComplete(); }, 400);
        return;
      }
      setActiveStep(idx);
      setTimeout(() => {
        if (cancelled) return;
        setDone((d) => new Set([...d, idx]));
        idx++;
        setTimeout(advance, 200);
      }, step.durationMs);
    }

    advance();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pl-analyzing">
      <div className="pl-analyzing-inner">
        <div className="pl-analyzing-spinner" aria-hidden="true">
          <svg viewBox="0 0 50 50" width="48" height="48">
            <circle
              cx="25" cy="25" r="20"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="100 28"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 25 25"
                to="360 25 25"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        <h2 className="pl-analyzing-title">Auditing your paper</h2>
        <p className="pl-analyzing-sub">
          This usually takes a few seconds. Each step runs against your actual
          course outcomes.
        </p>

        <ol className="pl-steps">
          {STEPS.map((step, i) => {
            const isDone = done.has(i);
            const isActive = activeStep === i && !isDone;
            return (
              <li key={step.id} className={`pl-step ${isDone ? "pl-step-done" : isActive ? "pl-step-active" : "pl-step-pending"}`}>
                <span className="pl-step-icon" aria-hidden="true">
                  {isDone ? (
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="#4f46e5" />
                      <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <span className="pl-step-pulse" />
                  ) : (
                    <span className="pl-step-circle" />
                  )}
                </span>
                <span className="pl-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
