import { getPaper, getOutcomes, SEED_PAPER_ID } from "../lib/db";

const BASE_URL = "http://localhost:3000";

async function verifyStage2() {
  console.log("==================================================");
  console.log("STAGE 2 VERIFICATION: CRUD PIPELINE");
  console.log("==================================================");

  // 1. LIST PAPERS
  console.log("\n[1] GET /api/papers - List faculty papers");
  const listRes = await fetch(`${BASE_URL}/api/papers`);
  if (!listRes.ok) throw new Error(`GET /api/papers failed: ${listRes.status}`);
  const listData = await listRes.json();
  console.log(`Found ${listData.papers?.length} papers. Seeded paper present:`, 
    listData.papers?.some((p: any) => p.id === SEED_PAPER_ID));

  // 2. CREATE PAPER
  console.log("\n[2] POST /api/papers - Create new paper");
  const newPaperPayload = {
    title: "CSE 4101 — Software Engineering Final Exam",
    course: "CSE 4101",
    totalMarks: 40,
    questions: [
      { id: "1a", text: "Explain the Agile Manifesto principles.", marks: 10 },
      { id: "1b", text: "Compare Scrum and Kanban methodologies.", marks: 10 },
      { id: "2a", text: "Design a microservices architecture for an e-commerce platform.", marks: 20 },
    ],
    courseOutcomes: [
      { id: "CO1", text: "Apply agile methods to software design.", targetBloom: "Apply" },
      { id: "CO2", text: "Evaluate architectural patterns for scalable systems.", targetBloom: "Evaluate" },
    ],
  };

  const createRes = await fetch(`${BASE_URL}/api/papers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPaperPayload),
  });
  if (!createRes.ok) throw new Error(`POST /api/papers failed: ${createRes.status}`);
  const createData = await createRes.json();
  const createdId = createData.id;
  console.log(`Created paper ID: ${createdId}`);

  // 3. READ CREATED PAPER
  console.log(`\n[3] GET /api/papers/${createdId} - Read created paper`);
  const readRes = await fetch(`${BASE_URL}/api/papers/${createdId}`);
  if (!readRes.ok) throw new Error(`GET /api/papers/${createdId} failed: ${readRes.status}`);
  const readData = await readRes.json();
  console.log(`Read Title: "${readData.title}", Questions count: ${readData.paper?.questions?.length}, Outcomes count: ${readData.courseOutcomes?.length}`);

  // 4. UPDATE PAPER
  console.log(`\n[4] PATCH /api/papers/${createdId} - Update title and questions`);
  const patchPayload = {
    title: "CSE 4101 — Software Engineering Final Exam (Updated)",
    questions: [
      { id: "1a", text: "Explain the Agile Manifesto principles.", marks: 10 },
      { id: "1b", text: "Compare Scrum and Kanban methodologies.", marks: 10 },
      { id: "2a", text: "Design a microservices architecture for an e-commerce platform.", marks: 20 },
      { id: "3a", text: "Construct a CI/CD pipeline for containerised services.", marks: 15, is_suggested: 1 },
    ],
  };
  const patchRes = await fetch(`${BASE_URL}/api/papers/${createdId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchPayload),
  });
  if (!patchRes.ok) throw new Error(`PATCH /api/papers/${createdId} failed: ${patchRes.status}`);
  console.log("PATCH result: success = true");

  // 5. CONFIRM UPDATE
  console.log(`\n[5] GET /api/papers/${createdId} - Verify update applied`);
  const verifyPatchRes = await fetch(`${BASE_URL}/api/papers/${createdId}`);
  const verifyPatchData = await verifyPatchRes.json();
  console.log(`Updated Title: "${verifyPatchData.title}", Questions count: ${verifyPatchData.paper?.questions?.length}, Total marks: ${verifyPatchData.paper?.totalMarks}`);

  // 6. SAVE AUDIT
  console.log(`\n[6] POST /api/papers/${createdId}/audits - Save an audit`);
  const dummyAudit = {
    healthScore: 78,
    coverage: [],
    bloom: { Remember: 20, Understand: 20, Apply: 40, Analyze: 20, Evaluate: 0, Create: 0 },
    questionAnalysis: [],
    repeats: [],
    issues: [],
  };
  const saveAuditRes = await fetch(`${BASE_URL}/api/papers/${createdId}/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ healthScore: 78, audit: dummyAudit }),
  });
  if (!saveAuditRes.ok) throw new Error(`POST audits failed: ${saveAuditRes.status}`);
  const saveAuditData = await saveAuditRes.json();
  const auditId = saveAuditData.id;
  console.log(`Saved audit ID: ${auditId}`);

  // 7. READ AUDITS
  console.log(`\n[7] GET /api/papers/${createdId}/audits - List paper audits`);
  const getAuditsRes = await fetch(`${BASE_URL}/api/papers/${createdId}/audits`);
  const getAuditsData = await getAuditsRes.json();
  console.log(`Found ${getAuditsData.audits?.length} audit(s). Health score: ${getAuditsData.audits?.[0]?.healthScore}`);

  // 8. DELETE AUDIT
  console.log(`\n[8] DELETE /api/audits/${auditId} - Delete audit`);
  const deleteAuditRes = await fetch(`${BASE_URL}/api/audits/${auditId}`, { method: "DELETE" });
  if (!deleteAuditRes.ok) throw new Error(`DELETE audit failed: ${deleteAuditRes.status}`);
  console.log("DELETE audit result: success = true");

  // 9. DELETE PAPER
  console.log(`\n[9] DELETE /api/papers/${createdId} - Delete paper`);
  const deletePaperRes = await fetch(`${BASE_URL}/api/papers/${createdId}`, { method: "DELETE" });
  if (!deletePaperRes.ok) throw new Error(`DELETE paper failed: ${deletePaperRes.status}`);
  console.log("DELETE paper result: success = true");

  // 10. CONFIRM GONE
  console.log(`\n[10] GET /api/papers/${createdId} - Confirm paper is 404`);
  const confirmGoneRes = await fetch(`${BASE_URL}/api/papers/${createdId}`);
  console.log(`Status code: ${confirmGoneRes.status} (expected 404)`);

  // 11. RE-RUN STAGE 1 CHECK (MUST STILL BE 65)
  console.log("\n==================================================");
  console.log("RE-RUNNING STAGE 1 SCORE CHECK ON SEEDED PAPER");
  console.log("==================================================");
  const seededPaper = getPaper(SEED_PAPER_ID);
  const seededOutcomes = getOutcomes(SEED_PAPER_ID);
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: seededPaper, courseOutcomes: seededOutcomes }),
  });
  const analyzeData = await analyzeRes.json();
  console.log(`Health score: ${analyzeData.healthScore}`);
  if (analyzeData.healthScore === 65) {
    console.log("STAGE 2 VERIFICATION COMPLETE: Health score is exactly 65!");
  } else {
    throw new Error(`Expected score 65, got ${analyzeData.healthScore}`);
  }
}

verifyStage2().catch((err) => {
  console.error("STAGE 2 VERIFICATION FAILED:", err);
  process.exit(1);
});
