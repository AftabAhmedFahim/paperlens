"use client";

import { useState } from "react";
import samplePaper from "@/data/sample-paper.json";
import sampleCos from "@/data/sample-cos.json";
import type { Audit, CourseOutcome, Paper } from "@/lib/types";

export default function Home() {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper: samplePaper as Paper,
          courseOutcomes: sampleCos as CourseOutcome[],
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setAudit(data as Audit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">PaperLens</h1>
      <p className="mt-2 text-zinc-600">
        Step 1 + 2 smoke test. The real report UI lands in Step 3.
      </p>

      <button
        onClick={run}
        disabled={busy}
        className="mt-8 rounded-lg bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {busy ? "Auditing…" : "Audit the sample paper"}
      </button>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {audit && (
        <>
          <div className="mt-8 text-6xl font-bold text-accent">
            {audit.healthScore}
            <span className="text-2xl text-zinc-400">/100</span>
          </div>
          <pre className="mt-6 overflow-auto rounded-lg border bg-white p-4 text-xs">
            {JSON.stringify(audit, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}
