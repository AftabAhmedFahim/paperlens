import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { Paper, CourseOutcome, Question, Audit, Bloom, PastQuestion } from "./types";
import facultyData from "@/data/faculty.json";
import samplePaperJson from "@/data/sample-paper.json";
import sampleCosJson from "@/data/sample-cos.json";
import pastQuestionsJson from "@/data/past-questions.json";
import samplePaperCse1101Json from "@/data/sample-paper-cse1101.json";
import samplePaperCse2101Json from "@/data/sample-paper-cse2101.json";

const DB_PATH = path.join(process.cwd(), "data", "paperlens.db");

export const SEED_PAPER_ID = "paper-cse3103-sample";
export const SEED_PAPER_CSE1101_ID = "paper-cse1101-sample";
export const SEED_PAPER_CSE2101_ID = "paper-cse2101-sample";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  seedIfEmpty(db);

  dbInstance = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      email TEXT UNIQUE,
      passwordHash TEXT
    );

    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      faculty_id TEXT NOT NULL,
      course TEXT NOT NULL,
      title TEXT NOT NULL,
      totalMarks INT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL,
      qid TEXT NOT NULL,
      text TEXT NOT NULL,
      marks INT NOT NULL,
      position INT NOT NULL,
      is_suggested INT DEFAULT 0,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS outcomes (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL,
      co_id TEXT NOT NULL,
      text TEXT NOT NULL,
      targetBloom TEXT NOT NULL,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS past_questions (
      id TEXT PRIMARY KEY,
      course TEXT NOT NULL,
      year TEXT NOT NULL,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL,
      faculty_id TEXT NOT NULL,
      healthScore INT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  // 1. Faculty
  const countFaculty = (db.prepare("SELECT count(*) as count FROM faculty").get() as any).count;
  if (countFaculty === 0) {
    const insertFaculty = db.prepare(`
      INSERT OR IGNORE INTO faculty (id, name, department, email, passwordHash)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertManyFaculty = db.transaction((list: any[]) => {
      for (const f of list) {
        insertFaculty.run(f.id, f.name, f.department, f.email || null, f.passwordHash || null);
      }
    });
    insertManyFaculty(facultyData as any[]);
  }

  // 2. Past questions
  const insertPast = db.prepare(`
    INSERT OR IGNORE INTO past_questions (id, course, year, text)
    VALUES (?, ?, ?, ?)
  `);

  const countPast3103 = (db.prepare("SELECT count(*) as count FROM past_questions WHERE course = ?").get("CSE 3103") as any).count;
  if (countPast3103 === 0) {
    const insert3103 = db.transaction((list: any[]) => {
      list.forEach((pq, idx) => {
        insertPast.run(`pq_3103_${idx + 1}`, "CSE 3103", String(pq.year), pq.text);
      });
    });
    insert3103(pastQuestionsJson as any[]);
  }

  const countPast1101 = (db.prepare("SELECT count(*) as count FROM past_questions WHERE course = ?").get("CSE 1101") as any).count;
  if (countPast1101 === 0 && (samplePaperCse1101Json as any).pastQuestions) {
    const insert1101 = db.transaction((list: any[]) => {
      list.forEach((pq, idx) => {
        insertPast.run(`pq_1101_${idx + 1}`, "CSE 1101", String(pq.year), pq.text);
      });
    });
    insert1101((samplePaperCse1101Json as any).pastQuestions);
  }

  const countPast2101 = (db.prepare("SELECT count(*) as count FROM past_questions WHERE course = ?").get("CSE 2101") as any).count;
  if (countPast2101 === 0 && (samplePaperCse2101Json as any).pastQuestions) {
    const insert2101 = db.transaction((list: any[]) => {
      list.forEach((pq, idx) => {
        insertPast.run(`pq_2101_${idx + 1}`, "CSE 2101", String(pq.year), pq.text);
      });
    });
    insert2101((samplePaperCse2101Json as any).pastQuestions);
  }

  // 3. Helper to seed a paper with its questions, outcomes, and initial baseline audit
  const insertPaper = db.prepare(`
    INSERT OR IGNORE INTO papers (id, faculty_id, course, title, totalMarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT OR IGNORE INTO questions (id, paper_id, qid, text, marks, position, is_suggested)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOutcome = db.prepare(`
    INSERT OR IGNORE INTO outcomes (id, paper_id, co_id, text, targetBloom)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT OR IGNORE INTO audits (id, paper_id, faculty_id, healthScore, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  function seedPaper(
    paperId: string,
    facultyId: string,
    course: string,
    title: string,
    totalMarks: number,
    questions: any[],
    outcomes: any[],
    baselineScore: number
  ) {
    const paperExists = (db.prepare("SELECT count(*) as count FROM papers WHERE id = ?").get(paperId) as any).count;
    const now = new Date().toISOString();

    if (paperExists === 0) {
      const seedTxn = db.transaction(() => {
        insertPaper.run(paperId, facultyId, course, title, totalMarks, now, now);

        questions.forEach((q, idx) => {
          insertQuestion.run(
            `${paperId}_q_${idx + 1}`,
            paperId,
            q.id,
            q.text,
            q.marks,
            idx,
            q.is_suggested ? 1 : 0
          );
        });

        outcomes.forEach((c, idx) => {
          insertOutcome.run(
            `${paperId}_co_${idx + 1}`,
            paperId,
            c.id,
            c.text,
            c.targetBloom
          );
        });
      });
      seedTxn();
    }

    // Seed baseline audit if no audits exist yet for this paper
    const auditCount = (db.prepare("SELECT count(*) as count FROM audits WHERE paper_id = ?").get(paperId) as any).count;
    if (auditCount === 0) {
      const payload = {
        healthScore: baselineScore,
        bloom: { Remember: 25, Understand: 25, Apply: 30, Analyze: 10, Evaluate: 10, Create: 0 },
        coverage: outcomes.map((c: any) => ({
          co: c.id,
          marks: 10,
          sharePct: 16.7,
          questionIds: ["1a"],
          status: "covered",
        })),
        repeats: [],
        issues: [
          {
            severity: "high",
            message: `${course} baseline evaluation recorded upon initial course setup.`,
          },
        ],
        questionAnalysis: questions.map((q: any) => ({
          id: q.id,
          co: "CO1",
          bloom: "Apply",
          rationale: "Initial baseline classification.",
        })),
      };

      insertAudit.run(
        `audit-init-${paperId}`,
        paperId,
        facultyId,
        baselineScore,
        JSON.stringify(payload),
        now
      );
    }
  }

  // Seed Paper 1: CSE 3103 (Dr. Aris Thorne - fac-01)
  seedPaper(
    SEED_PAPER_ID,
    "fac-01",
    "CSE 3103",
    "CSE 3103 — Database Management Systems, Semester Final",
    60,
    (samplePaperJson as any).questions,
    (sampleCosJson as any),
    65
  );

  // Seed Paper 2: CSE 1101 (Dr. Tanvir Ahmed - fac-03)
  seedPaper(
    SEED_PAPER_CSE1101_ID,
    "fac-03",
    "CSE 1101",
    (samplePaperCse1101Json as any).title || "CSE 1101 — Structured Programming Language, Semester Final",
    (samplePaperCse1101Json as any).totalMarks || 60,
    (samplePaperCse1101Json as any).questions,
    (samplePaperCse1101Json as any).outcomes,
    88
  );

  // Seed Paper 3: CSE 2101 (Dr. Nusrat Jahan - fac-02)
  seedPaper(
    SEED_PAPER_CSE2101_ID,
    "fac-02",
    "CSE 2101",
    (samplePaperCse2101Json as any).title || "CSE 2101 — Data Structures, Semester Final",
    (samplePaperCse2101Json as any).totalMarks || 60,
    (samplePaperCse2101Json as any).questions,
    (samplePaperCse2101Json as any).outcomes,
    70
  );
}

// ─── Mapper Functions ────────────────────────────────────────────────────────

export interface DbPaperMeta {
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

/** Reconstructs the exact existing Paper shape: course, totalMarks, questions (ids 1a-4b in position order) */
export function getPaper(id: string): (Paper & { id: string; title: string; faculty_id: string }) | null {
  const db = getDb();
  const paperRow = db.prepare("SELECT * FROM papers WHERE id = ?").get(id) as any;
  if (!paperRow) return null;

  const questionRows = db
    .prepare("SELECT * FROM questions WHERE paper_id = ? ORDER BY position ASC")
    .all(id) as any[];

  const questions: Question[] = questionRows.map((q) => ({
    id: q.qid,
    text: q.text,
    marks: q.marks,
    ...((q as any).is_suggested ? { is_suggested: 1 } : {}),
  }));

  return {
    id: paperRow.id,
    faculty_id: paperRow.faculty_id,
    title: paperRow.title,
    course: paperRow.course,
    totalMarks: paperRow.totalMarks,
    questions,
  };
}

/** Reconstructs the exact existing CourseOutcome[] shape */
export function getOutcomes(paperId: string): CourseOutcome[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM outcomes WHERE paper_id = ? ORDER BY co_id ASC")
    .all(paperId) as any[];

  return rows.map((r) => ({
    id: r.co_id,
    text: r.text,
    targetBloom: r.targetBloom as Bloom,
  }));
}

/** Reconstructs past questions array */
export function getPastQuestions(course?: string): PastQuestion[] {
  const db = getDb();
  const rows = course
    ? (db.prepare("SELECT * FROM past_questions WHERE course = ?").all(course) as any[])
    : (db.prepare("SELECT * FROM past_questions").all() as any[]);

  return rows.map((r) => ({
    id: r.id,
    year: r.year,
    course: r.course,
    text: r.text,
  }));
}

/** Lists all papers for a faculty with question count and latest audit health score */
export function getPapersForFaculty(facultyId: string): DbPaperMeta[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      p.*,
      COUNT(DISTINCT q.id) AS questionCount,
      (
        SELECT a.healthScore
        FROM audits a
        WHERE a.paper_id = p.id
        ORDER BY a.created_at DESC
        LIMIT 1
      ) AS latestHealthScore
    FROM papers p
    LEFT JOIN questions q ON q.paper_id = p.id
    WHERE p.faculty_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(facultyId) as any[];

  return rows.map((r) => ({
    id: r.id,
    faculty_id: r.faculty_id,
    course: r.course,
    title: r.title,
    totalMarks: r.totalMarks,
    questionCount: r.questionCount || 0,
    latestHealthScore: r.latestHealthScore !== null ? Number(r.latestHealthScore) : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/** Create a new paper with questions and course outcomes in a single transaction */
export function createPaperInDb(
  facultyId: string,
  paper: Paper,
  outcomes: CourseOutcome[],
  title?: string
): { id: string } {
  const db = getDb();
  const paperId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const paperTitle = title || `${paper.course} — Examination Paper`;
  const totalMarks = paper.questions.reduce((s, q) => s + (q.marks || 0), 0) || paper.totalMarks || 60;

  const insertPaper = db.prepare(`
    INSERT INTO papers (id, faculty_id, course, title, totalMarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, paper_id, qid, text, marks, position, is_suggested)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOutcome = db.prepare(`
    INSERT INTO outcomes (id, paper_id, co_id, text, targetBloom)
    VALUES (?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    insertPaper.run(paperId, facultyId, paper.course, paperTitle, totalMarks, now, now);

    paper.questions.forEach((q, idx) => {
      insertQuestion.run(
        `${paperId}_q_${idx + 1}`,
        paperId,
        q.id,
        q.text,
        q.marks,
        idx,
        (q as any).is_suggested ? 1 : 0
      );
    });

    outcomes.forEach((c, idx) => {
      insertOutcome.run(
        `${paperId}_co_${idx + 1}`,
        paperId,
        c.id,
        c.text,
        c.targetBloom
      );
    });
  });

  txn();
  return { id: paperId };
}

/** Updates paper course, title, and/or replaces the questions list */
export function updatePaperInDb(
  paperId: string,
  updates: {
    course?: string;
    title?: string;
    questions?: (Question & { is_suggested?: number })[];
  }
): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const txn = db.transaction(() => {
    if (updates.course || updates.title) {
      db.prepare(`
        UPDATE papers
        SET course = COALESCE(?, course),
            title = COALESCE(?, title),
            updated_at = ?
        WHERE id = ?
      `).run(updates.course || null, updates.title || null, now, paperId);
    }

    if (updates.questions) {
      const totalMarks = updates.questions.reduce((s, q) => s + (q.marks || 0), 0);
      db.prepare(`
        UPDATE papers
        SET totalMarks = ?, updated_at = ?
        WHERE id = ?
      `).run(totalMarks, now, paperId);

      // Re-populate questions
      db.prepare("DELETE FROM questions WHERE paper_id = ?").run(paperId);
      const insertQ = db.prepare(`
        INSERT INTO questions (id, paper_id, qid, text, marks, position, is_suggested)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      updates.questions.forEach((q, idx) => {
        insertQ.run(
          `${paperId}_q_${idx + 1}_${Date.now()}`,
          paperId,
          q.id,
          q.text,
          q.marks,
          idx,
          q.is_suggested ? 1 : 0
        );
      });
    }
  });

  txn();
  return true;
}

/** Delete paper and cascade delete its questions, outcomes, and audits */
export function deletePaperFromDb(paperId: string): boolean {
  const db = getDb();
  const res = db.prepare("DELETE FROM papers WHERE id = ?").run(paperId);
  return res.changes > 0;
}

/** Get audit history for a paper */
export function getAuditsForPaper(paperId: string): {
  id: string;
  paper_id: string;
  faculty_id: string;
  healthScore: number;
  audit: Audit;
  created_at: string;
}[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM audits WHERE paper_id = ? ORDER BY created_at DESC")
    .all(paperId) as any[];

  return rows.map((r) => ({
    id: r.id,
    paper_id: r.paper_id,
    faculty_id: r.faculty_id,
    healthScore: r.healthScore,
    audit: JSON.parse(r.payload),
    created_at: r.created_at,
  }));
}

/** Save an audit for a paper */
export function saveAuditToDb(
  paperId: string,
  facultyId: string,
  healthScore: number,
  payload: Audit
): { id: string } {
  const db = getDb();
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO audits (id, paper_id, faculty_id, healthScore, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(auditId, paperId, facultyId, healthScore, JSON.stringify(payload), now);

  return { id: auditId };
}

/** Delete a saved audit */
export function deleteAuditFromDb(auditId: string): boolean {
  const db = getDb();
  const res = db.prepare("DELETE FROM audits WHERE id = ?").run(auditId);
  return res.changes > 0;
}
