import { getPapersForFaculty, getPaper, getOutcomes, createPaperInDb, deletePaperFromDb } from "../lib/db";
import { Paper, CourseOutcome } from "../lib/types";

async function run() {
  console.log("=== VERIFY CREATE PAPER FEATURE START ===\n");

  const testPaper: Paper = {
    course: "CSE 4199",
    totalMarks: 30,
    questions: [
      { id: "1a", text: "Explain the architecture of distributed message queues.", marks: 15 },
      { id: "1b", text: "Design a fault-tolerant leader election algorithm in distributed consensus.", marks: 15 },
    ],
  };

  const testOutcomes: CourseOutcome[] = [
    { id: "CO1", text: "Understand distributed systems architecture and messaging.", targetBloom: "Understand" },
    { id: "CO2", text: "Design distributed consensus and leader election protocols.", targetBloom: "Create" },
  ];

  const testTitle = "CSE 4199 — Distributed Systems Comprehensive";
  const facultyId = "fac-01";

  console.log("1. Testing createPaperInDb / direct SQLite insertion...");
  const { id } = createPaperInDb(facultyId, testPaper, testOutcomes, testTitle);
  console.log(`? Paper created with ID: ${id}`);

  console.log("2. Fetching created paper from SQLite...");
  const fetched = getPaper(id);
  if (!fetched) {
    throw new Error(`Paper with id ${id} was not found in SQLite!`);
  }
  console.log(`? Paper retrieved: Course = ${fetched.course}, Title = ${fetched.title}`);
  if (fetched.questions.length !== 2) {
    throw new Error(`Expected 2 questions, got ${fetched.questions.length}`);
  }
  const fetchedCos = getOutcomes(id);
  if (fetchedCos.length !== 2) {
    throw new Error(`Expected 2 outcomes, got ${fetchedCos.length}`);
  }
  console.log(`? Questions: ${fetched.questions.map(q => q.id).join(", ")}`);
  console.log(`? Outcomes: ${fetchedCos.map(c => c.id).join(", ")}`);

  console.log("3. Checking paper library for faculty fac-01...");
  const list = getPapersForFaculty(facultyId);
  const found = list.find(p => p.id === id);
  if (!found) {
    throw new Error(`Created paper ${id} not found in library list!`);
  }
  console.log(`? Paper found in library: ${found.title} (${found.questionCount} questions, ${found.totalMarks} marks)`);

  console.log("4. Testing POST /api/papers via HTTP fetch to server...");
  const res = await fetch("http://localhost:3000/api/papers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facultyId,
      title: "CSE 4200 — Cloud Native Systems",
      paper: {
        course: "CSE 4200",
        totalMarks: 20,
        questions: [{ id: "1a", text: "Explain Kubernetes pod lifecycle.", marks: 20 }],
      },
      courseOutcomes: [
        { id: "CO1", text: "Explain cloud native container lifecycle.", targetBloom: "Understand" },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP POST /api/papers failed with status ${res.status}`);
  }
  const apiData = await res.json();
  console.log(`? HTTP POST created paper with ID: ${apiData.id}`);

  const getRes = await fetch(`http://localhost:3000/api/papers?facultyId=${facultyId}`);
  const getData = await getRes.json();
  const apiFound = getData.papers.find((p: any) => p.id === apiData.id);
  if (!apiFound) {
    throw new Error("HTTP created paper not returned in GET /api/papers");
  }
  console.log(`? HTTP GET verified paper ${apiData.id} present in library`);

  console.log("5. Cleaning up test papers...");
  deletePaperFromDb(id);
  deletePaperFromDb(apiData.id);
  console.log("? Test papers deleted cleanly.");

  console.log("\n?? ALL CREATE PAPER VERIFICATION TESTS PASSED! ??");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
