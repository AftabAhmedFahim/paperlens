# PaperLens 🔍
> **University Exam Question Paper Auditor** — Evaluate draft exam papers before they reach students.

PaperLens is an assessment quality auditor designed for university faculty and academic committees. A faculty member supplies a draft question paper along with the course learning outcomes (CLOs); the platform audits the paper against outcome coverage, cognitive level balance (Bloom's Taxonomy), and repeat detection against historical past-year exam archives.

PaperLens calculates a deterministic **0–100 Assessment Health Score** and offers an intelligent fix-it loop to suggest compliant replacement questions for identified curriculum gaps.

***It evaluates — it does not generate blindly.***

---

## 🚀 Key Features

- 🎯 **Assessment Health Score (0–100)**: A composite measure reflecting outcome coverage, cognitive level spread, and repetition penalties.
- 📊 **Course Outcome Coverage**: Quantifies mark share per outcome, immediately identifying unassessed (missing), under-weighted (<10%), and over-weighted (>40%) outcomes.
- 🧠 **Bloom's Taxonomy Balance**: Categorizes questions into cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create) to ensure assessments test higher-order thinking.
- 🔁 **Historical Repeat Detection**: Compares drafted questions against past-year papers (2022–2024) using TF-IDF cosine similarity shortlisting to identify near-duplicates and related tasks.
- 💡 **AI Fix-It Loop**: Suggests replacement questions targeting uncovered outcomes with specific cognitive levels via Google Gemini (`gemini-2.0-flash`) or deterministic offline fallback.
- 🗄️ **Paper Library & Persistence**: SQLite persistence via `better-sqlite3` — save drafts, track audit history across revisions, and persist accepted suggestions.
- 🔐 **Zero-Dependency Faculty Auth**: Fast, local authentication using `jose` JWT cookies (HS256) and `bcryptjs` password hashing with 1-click demo logins.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism Design System
- **Database**: SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (local, zero cloud DB configuration)
- **AI & Similarity**: Google Gemini API (`gemini-2.0-flash`) + In-Memory TF-IDF Vector Space Analysis
- **Security & Session**: [`jose`](https://github.com/panva/jose) (JWT HTTP-only cookies) + `bcryptjs`

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v18.17+` or `v20+` (tested and verified on Node `v24.x`)
- **npm** or **pnpm** / **yarn**

### 2. Installation
```bash
git clone https://github.com/aftabhossain/paperlens.git
cd paperlens
npm install
```

### 3. Environment Setup
Copy the example environment template:
```bash
cp .env.example .env
```

Your `.env` contains:
```ini
# Live AI calls (optional in demo mode):
GEMINI_API_KEY=

# Model configuration:
GEMINI_MODEL=gemini-2.0-flash

# 1 = Offline deterministic demo mode; 0 = Live Gemini API:
NEXT_PUBLIC_DEMO_MODE=1

# Session signing key:
AUTH_SECRET=paperlens_super_secret_jwt_key_2026_aust_carnival
```

> **Note**: In `NEXT_PUBLIC_DEMO_MODE=1`, PaperLens runs completely offline without requiring any Gemini API key or external network access.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Seeded Demo Accounts

PaperLens includes seeded faculty accounts with one-click demo login buttons at `/login`:

| Faculty Member | Email | Password | Department |
| :--- | :--- | :--- | :--- |
| **Dr. Sarah Rahman** | `dr.sarah@aust.edu` | `sarah2026` | Computer Science & Engineering |
| **Prof. Ahmed Khan** | `prof.ahmed@aust.edu` | `ahmed2026` | Software Engineering |
| **Dr. Nadia Islam** | `dr.nadia@aust.edu` | `nadia2026` | Computer Science & Engineering |

---

## 🎬 The Verified Demo Flow

1. **Load Sample Paper**:
   - On the upload screen, click **Load sample** (loads *CSE 3103 — Database Management Systems*, 8 questions, 60 marks).
2. **Initial Audit**:
   - Click **Audit this paper** $\rightarrow$ Health Score reads **65/100**.
   - Review the report: Outcome **CO6 is missing (0 marks)**, lower-order Bloom levels dominate, and **5 repeat matches** are detected against past-year archives.
3. **Generate Fix**:
   - Under **Issues**, locate the high-severity item for **CO6** and click **Generate fix**.
   - PaperLens synthesizes a 8-mark question assessing CO6 at the **Evaluate** cognitive tier.
4. **Accept & Re-run**:
   - Click **Accept fix** or **Re-run audit**.
   - Health score jumps to **82/100**, CO6 turns green, and the Evaluate Bloom bar activates.
5. **Persistence Across Reloads**:
   - Refresh the page ($F5$) $\rightarrow$ SQLite preserves the 9 questions (68 marks) with the **AI Fix** visual badge and retains both audit records in history.

---

## 📁 Project Structure

```
paperlens/
├── app/
│   ├── api/
│   │   ├── analyze/        # Audit evaluation engine endpoint
│   │   ├── fix/            # Question suggestion engine endpoint
│   │   ├── papers/         # Paper CRUD endpoints
│   │   ├── audits/         # Audit deletion endpoint
│   │   └── auth/           # Faculty login/logout/session handlers
│   ├── login/              # Faculty login page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main auditor workflow (Upload / Analyzing / Report)
│   └── globals.css         # PaperLens custom stylesheet
├── components/
│   ├── PaperLibrary.tsx    # Faculty saved papers library & actions
│   ├── ReportSections.tsx  # HealthScore, CoverageGrid, BloomChart, Repeats, Issues
│   ├── AuditHistory.tsx    # Audit history list with in-place deletion
│   ├── FacultySwitcher.tsx # Multi-faculty profile switcher
│   └── UploadAndAnalyzing.tsx # File drag-and-drop & animated audit progress
├── lib/
│   ├── audit.ts            # Deterministic scoring, weighting & penalty algorithms
│   ├── auth.ts             # JWT session cookie signing/verification
│   ├── db.ts               # SQLite schema, idempotent seeding, and CRUD mappers
│   ├── gemini.ts           # Google Gemini API client
│   ├── similarity.ts       # TF-IDF cosine similarity shortlisting
│   └── types.ts            # Canonical data types and contracts
├── data/
│   ├── sample-paper.json   # Seed CSE 3103 exam question paper (60 marks)
│   ├── sample-cos.json     # Course Learning Outcomes (CO1-CO6)
│   ├── past-questions.json # 3-year historical question archive (2022-2024)
│   └── faculty.json        # Seeded faculty directory
└── scripts/
    ├── verify-stage1.ts    # Verification script for SQLite schema & seeding
    ├── verify-stage2.ts    # Verification script for Paper & Audit REST APIs
    └── verify-stage3.ts    # Verification script for end-to-end demo flow
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Evaluates `{ paper, courseOutcomes }` and returns full `Audit` object |
| `POST` | `/api/fix` | Suggests a replacement question for `{ targetCo, targetBloom }` |
| `GET` | `/api/papers` | Lists saved papers for the active faculty |
| `POST` | `/api/papers` | Creates a new paper with questions and course outcomes |
| `GET` | `/api/papers/[id]` | Retrieves paper questions and mapped outcomes |
| `PATCH`| `/api/papers/[id]` | Updates paper title, course, or replaces question list |
| `DELETE`|`/api/papers/[id]` | Deletes paper and cascades questions, outcomes, and audits |
| `GET` | `/api/papers/[id]/audits` | Returns audit history for a specific paper |
| `POST`| `/api/papers/[id]/audits` | Persists an audit run result to SQLite |
| `DELETE`|`/api/audits/[id]` | Deletes an audit record |
| `POST` | `/api/auth/login` | Authenticates faculty credentials and sets session cookie |
| `POST` | `/api/auth/logout` | Clears faculty session cookie |
| `GET` | `/api/auth/me` | Returns currently logged-in faculty info |

---

## 🧪 Verification & Testing

To run the automated verification test suites:
```bash
# Verify SQLite DB schema and initial score (65):
npx tsx scripts/verify-stage1.ts

# Verify Paper & Audit CRUD REST routes:
npx tsx scripts/verify-stage2.ts

# Verify end-to-end demo flow, fix-it persistence, and audit deletion:
npx tsx scripts/verify-stage3.ts
```

---

## 📄 License
MIT License. Developed for University Examination & Quality Assurance Committees.
