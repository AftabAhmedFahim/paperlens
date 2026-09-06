# PaperLens — 5-Hour Build Workflow
**AUST CSE Carnival 8.0 — AI Build Hackathon, Final Round**
Team: 3 members · Lead: Aftab

---

## 1. What we are building (one sentence)

> A faculty member uploads a draft question paper and the course outcomes; PaperLens audits it for outcome coverage, cognitive-level balance and repetition against past years, then generates replacement questions that fix the gaps.

**The judge-facing journey:**
`Draft exam paper + COs` → `PaperLens audits` → `Health report + one-click fixes` → `Re-audit shows the score rise`

**Why this and not a generator:** the brief says twice to go beyond content generation. Every other team will auto-write a paper. We *evaluate* one. Our verbs are the ones they printed: inspect, compare, check, highlight, evaluate.

---

## 2. Scope lock — read this before adding anything

### IN (must work end to end)
1. **CO coverage map** — which course outcomes are tested, over-tested, or never tested (marks-weighted).
2. **Bloom's level distribution** — % of marks at Remember / Understand / Apply / Analyze / Evaluate / Create.
3. **Repeat detection** — semantic similarity of each question against a bank of past-year questions, with the matching question shown side by side.
4. **Assessment Health Score (0–100)** — single headline number.
5. **Fix-it loop** — button on a flagged gap generates a replacement question at the right CO + Bloom level, and re-running the audit visibly raises the score.

### OUT (do not build, do not discuss)
- Login / accounts / database / user roles
- Grading, rubrics, script evaluation, plagiarism between students
- Multi-course dashboards, history, export to Word/PDF
- Mobile responsiveness beyond "doesn't look broken"
- Anything requiring a vector database

**If a feature is not on the IN list, the answer is no.** Write it on a "v2" slide instead — judges reward a working small thing over a broken big thing. The brief says so explicitly.

---

## 3. Roles

| | Owner | Owns | Does not touch |
|---|---|---|---|
| **A** | Aftab (lead) | `/lib/analyze/*`, `/app/api/*` — prompts, LLM calls, similarity, scoring | UI components |
| **B** | Member 2 | `/app/page.tsx`, `/components/*` — upload, report, heatmap, fix-it UI | API internals |
| **C** | Member 3 | `/data/*` — real papers + CO lists as JSON, seeding, then slides, demo script, QA | code paths |

**Aftab also owns the clock.** Call every checkpoint out loud. Nobody merges to `main` without a green checkpoint.

---

## 4. The contract (freeze at T+0:20, never change it)

Everyone codes against this shape. B builds UI from a hardcoded mock of it while A is still writing the real thing. This is what lets three people work in parallel without blocking.

```json
{
  "paper": {
    "course": "CSE 3103",
    "totalMarks": 60,
    "questions": [
      { "id": "1a", "text": "...", "marks": 5 }
    ]
  },
  "courseOutcomes": [
    { "id": "CO1", "text": "...", "targetBloom": "Apply" }
  ],
  "audit": {
    "healthScore": 62,
    "coverage": [
      { "co": "CO1", "questionIds": ["1a"], "marks": 5, "sharePct": 8.3, "status": "ok" }
    ],
    "bloom": { "Remember": 40, "Understand": 30, "Apply": 20, "Analyze": 10, "Evaluate": 0, "Create": 0 },
    "questionAnalysis": [
      { "id": "1a", "co": "CO1", "bloom": "Understand", "rationale": "..." }
    ],
    "repeats": [
      { "questionId": "2b", "matchYear": "2023", "matchText": "...", "similarity": 0.87, "verdict": "near-duplicate", "reason": "..." }
    ],
    "issues": [
      { "severity": "high", "message": "CO4 is never assessed.", "targetCo": "CO4" }
    ]
  }
}
```

`status` ∈ `ok | under | over | missing` · `verdict` ∈ `near-duplicate | related | distinct` · `severity` ∈ `high | medium | low`

---

## 5. Hour-by-hour

### T+0:00 → 0:20 · Setup
- **All:** agree the scope above out loud. Confirm nobody is quietly planning an extra feature.
- **A:** create repo, scaffold Next.js, get the LLM API key working with one hello-world call. **Verify Node runs on the borrowed laptop before anything else.**
- **B:** scaffold the three screens with mock data pasted from §4.
- **C:** start collecting real AUST past papers + a real CO list. This is the highest-risk task in the build — start it first and do not stop until it's done.
- **A:** write the demo script (§7) before writing code.

**Checkpoint:** contract frozen, repo pushed, everyone has it cloned.

### T+0:20 → 1:40 · Parallel build
- **A:** `/api/analyze` — parse paper → classify each question to a CO + Bloom level in one structured LLM call → compute coverage, bloom histogram, health score.
- **B:** upload screen + report screen rendering the mock. Coverage as a colour-coded bar/grid, Bloom as a simple chart, issues as a list.
- **C:** at least one full paper + CO list + 20–30 past-year questions in `/data`. Then start slides.

**Checkpoint T+1:40:** real analysis output renders in the real UI. Even if repeats and fix-it are stubs, the vertical slice must run.

### T+1:40 → 3:00 · The differentiators
- **A:** repeat detection — TF-IDF cosine in JS to shortlist the top 5 candidates per question, then one LLM call to judge those 5 and write the reason. (No embeddings API, no vector DB, no network dependency for the shortlist.)
- **A:** `/api/fix` — given a `targetCo` and Bloom level, generate a replacement question.
- **B:** repeat cards with side-by-side text + similarity, and the fix-it button flow: click → new question appears → "Re-run audit" → score animates up.
- **C:** finish slides (3 max), then become the tester — try to break the app, log bugs, don't fix them yourself.

**Checkpoint T+3:00:** fix-it loop works once, end to end, on the seeded paper.

### T+3:00 → 3:30 · FEATURE FREEZE
No new features after T+3:30. None. Anything unfinished gets deleted or hidden behind a flag.
- **A:** cache the exact demo run's API responses to a JSON file and add a `DEMO_MODE` env flag that serves them. **If the venue wifi dies mid-pitch, this saves the round.**

### T+3:30 → 4:20 · Polish
- Empty states, loading spinners, no console errors, no lorem ipsum.
- Real course name and real CO text on screen — faculty judges will notice fake ones instantly.
- Make the health score big. It's the headline.

### T+4:20 → 5:00 · Dry runs
- Two full run-throughs with a timer. B drives the laptop, A narrates, C watches the clock.
- Second run must be identical to the first. If it isn't, something is non-deterministic — fix or fake it.
- Screen-record one clean run as insurance.

---

## 6. Rules

1. `main` stays runnable. Feature branches, small commits, merge at checkpoints.
2. Never `git push --force`.
3. Blocked for more than 10 minutes → say so out loud. Silent blocking is the #1 way teams lose hours.
4. One LLM call per audit, not one per question. Batch it — latency on stage is a killer.
5. Ask the model for strict JSON, parse defensively, and always have a fallback so a malformed response never white-screens the app.
6. If the demo works at T+3:00, stop building and start rehearsing. Polish beats features here.

---

## 7. Demo script (2–3 minutes, memorised)

1. **Problem (20s).** "A faculty member finishing a question paper has no way to check whether it actually covers the course, whether it's all recall questions, or whether they've unknowingly reused last year's Q5."
2. **Input (15s).** Upload the real draft paper + the CO list. Point out both are real AUST artifacts.
3. **What the AI does (45s).** Health score lands at 62. CO4: never assessed. 70% of marks sit at Remember/Understand. Q2(b) is an 87% match to 2023's Q5 — show them side by side. *This is the moment the judges lean in; slow down here.*
4. **The useful result (40s).** Click fix on CO4. A new Analyze-level question appears. Re-run. Score climbs to 84, CO4 turns green. "The faculty member keeps the judgment. We give them the evidence."
5. **Close (15s).** One line on what's next, one line on why evaluation beats generation.

Whoever presents: do not read the slides. Drive the product.

---

## 8. If things go wrong

| Problem | Do this |
|---|---|
| LLM API down or rate-limited | Flip `DEMO_MODE=1`, serve cached responses |
| Paper parsing is unreliable | Ship the pre-parsed JSON as the "sample paper" and demo from that |
| Repeat detection is weak | Drop the LLM verdict, show raw TF-IDF similarity with the matched text |
| Behind at T+3:00 | Cut repeat detection. Coverage + Bloom + fix-it is still a complete story |
| Behind at T+4:00 | Freeze whatever runs, spend the rest on the pitch |
