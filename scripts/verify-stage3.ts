/**
 * Stage 3 Automated Verification Script
 * Validates Paper Library, Audit History, and Fix-It Loop persistence in SQLite
 */

async function runStage3Verification() {
  console.log("=== STAGE 3 VERIFICATION START ===");
  const baseUrl = "http://localhost:3000";

  // 1. Fetch papers for faculty (Paper Library)
  console.log("\n1. Testing GET /api/papers?facultyId=fac-01...");
  const libRes = await fetch(`${baseUrl}/api/papers?facultyId=fac-01`);
  if (!libRes.ok) throw new Error(`GET /api/papers failed: ${libRes.status}`);
  const { papers } = await libRes.json();
  console.log(`✓ Found ${papers.length} paper(s) in library for fac-01.`);
  const sampleMeta = papers.find((p: any) => p.id === "paper-cse3103-sample");
  if (!sampleMeta) throw new Error("Seed paper paper-cse3103-sample not found in library!");
  console.log(`✓ Seed paper in library: ${sampleMeta.title} (${sampleMeta.questionCount} questions, ${sampleMeta.totalMarks} marks)`);

  // Reset sample paper questions to clean 8 questions
  const samplePaperJson = await import("../data/sample-paper.json");
  const sampleCosJson = await import("../data/sample-cos.json");
  await fetch(`${baseUrl}/api/papers/paper-cse3103-sample`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions: samplePaperJson.default.questions }),
  });

  // 2. Fetch paper-cse3103-sample
  console.log("\n2. Testing GET /api/papers/paper-cse3103-sample...");
  const paperRes = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample`);
  if (!paperRes.ok) throw new Error(`GET paper failed: ${paperRes.status}`);
  const paperData = await paperRes.json();
  const paper = paperData.paper;
  const courseOutcomes = paperData.courseOutcomes;
  console.log(`✓ Loaded paper: ${paper.course}, questions: ${paper.questions.length}, totalMarks: ${paper.totalMarks}`);

  // 3. Run initial audit (must be 65)
  console.log("\n3. Testing initial audit on seed paper via POST /api/analyze...");
  const auditRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper, courseOutcomes }),
  });
  if (!auditRes.ok) throw new Error(`POST /api/analyze failed: ${auditRes.status}`);
  const audit65 = await auditRes.json();
  console.log(`✓ Initial healthScore: ${audit65.healthScore} (Expected: 65)`);
  if (audit65.healthScore !== 65) {
    throw new Error(`CRITICAL FAILURE: Expected initial healthScore 65, got ${audit65.healthScore}`);
  }
  console.log(`✓ Repeats count: ${audit65.repeats.length} (Expected: 5)`);
  if (audit65.repeats.length !== 5) {
    throw new Error(`CRITICAL FAILURE: Expected 5 repeats, got ${audit65.repeats.length}`);
  }

  // 4. Save audit 65 to SQLite
  console.log("\n4. Saving audit 65 via POST /api/papers/paper-cse3103-sample/audits...");
  const save65Res = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      healthScore: audit65.healthScore,
      audit: audit65,
      facultyId: "fac-01",
    }),
  });
  if (!save65Res.ok) throw new Error(`Save audit 65 failed: ${save65Res.status}`);
  const { id: audit65Id } = await save65Res.json();
  console.log(`✓ Saved audit 65 with ID: ${audit65Id}`);

  // 5. Generate fix on CO6
  console.log("\n5. Generating fix for CO6 via POST /api/fix...");
  const fixRes = await fetch(`${baseUrl}/api/fix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paper,
      courseOutcomes,
      targetCo: "CO6",
      targetBloom: "Evaluate",
    }),
  });
  if (!fixRes.ok) throw new Error(`POST /api/fix failed: ${fixRes.status}`);
  const fixQuestion = await fixRes.json();
  console.log(`✓ Generated fix question: ${fixQuestion.id} (${fixQuestion.marks} marks) - ${fixQuestion.text.slice(0, 60)}...`);

  // 6. Append fix question with is_suggested: 1 and PATCH paper
  console.log("\n6. Appending fix question and patching paper via PATCH /api/papers/paper-cse3103-sample...");
  const updatedQuestions = [
    ...paper.questions.map((q: any) => ({ ...q, is_suggested: 0 })),
    { ...fixQuestion, is_suggested: 1 },
  ];
  const patchRes = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions: updatedQuestions }),
  });
  if (!patchRes.ok) throw new Error(`PATCH paper failed: ${patchRes.status}`);
  console.log("✓ Paper patched in SQLite with suggested question.");

  // Verify reload of paper from DB has 9 questions, 68 marks, and is_suggested: 1
  const reloadedPaperRes = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample`);
  const reloadedData = await reloadedPaperRes.json();
  const reloadedPaper = reloadedData.paper;
  console.log(`✓ Reloaded paper from DB: questions: ${reloadedPaper.questions.length}, totalMarks: ${reloadedPaper.totalMarks}`);
  if (reloadedPaper.questions.length !== 9 || reloadedPaper.totalMarks !== 68) {
    throw new Error(`CRITICAL FAILURE: Expected 9 questions and 68 marks, got ${reloadedPaper.questions.length} questions and ${reloadedPaper.totalMarks} marks`);
  }
  const lastQ = reloadedPaper.questions[reloadedPaper.questions.length - 1];
  console.log(`✓ Last question is_suggested flag: ${lastQ.is_suggested} (Expected: 1)`);
  if (!lastQ.is_suggested) {
    throw new Error("CRITICAL FAILURE: is_suggested flag not preserved in SQLite!");
  }

  // 7. Re-run audit with patched paper (must be 82)
  console.log("\n7. Re-running audit on patched paper via POST /api/analyze...");
  const rerunRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: reloadedPaper, courseOutcomes }),
  });
  if (!rerunRes.ok) throw new Error(`Re-run analyze failed: ${rerunRes.status}`);
  const audit82 = await rerunRes.json();
  console.log(`✓ Re-run healthScore: ${audit82.healthScore} (Expected: 82)`);
  if (audit82.healthScore !== 82) {
    throw new Error(`CRITICAL FAILURE: Expected re-run healthScore 82, got ${audit82.healthScore}`);
  }

  // Check CO6 coverage and Evaluate Bloom marks
  const co6Coverage = audit82.coverage.find((c: any) => c.co === "CO6");
  console.log(`✓ CO6 status: ${co6Coverage?.status} (marks: ${co6Coverage?.marks}, share: ${co6Coverage?.sharePct}%)`);
  if (co6Coverage?.status !== "ok") {
    throw new Error(`CRITICAL FAILURE: CO6 status expected 'ok', got ${co6Coverage?.status}`);
  }
  const evaluateBloom = audit82.bloom["Evaluate"];
  console.log(`✓ Evaluate Bloom level: ${evaluateBloom}%`);
  if (!evaluateBloom || evaluateBloom <= 0) {
    throw new Error("CRITICAL FAILURE: Evaluate Bloom level expected > 0");
  }

  // 8. Save audit 82 to SQLite
  console.log("\n8. Saving audit 82 via POST /api/papers/paper-cse3103-sample/audits...");
  const save82Res = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      healthScore: audit82.healthScore,
      audit: audit82,
      facultyId: "fac-01",
    }),
  });
  if (!save82Res.ok) throw new Error(`Save audit 82 failed: ${save82Res.status}`);
  const { id: audit82Id } = await save82Res.json();
  console.log(`✓ Saved audit 82 with ID: ${audit82Id}`);

  // 9. Fetch audit history from SQLite
  console.log("\n9. Fetching audit history via GET /api/papers/paper-cse3103-sample/audits...");
  const auditsListRes = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample/audits`);
  const { audits } = await auditsListRes.json();
  console.log(`✓ Total audits in history: ${audits.length}`);
  const scores = audits.map((a: any) => a.healthScore);
  console.log(`✓ Audit scores in history (newest first): ${scores.join(", ")}`);
  if (!scores.includes(82) || !scores.includes(65)) {
    throw new Error("CRITICAL FAILURE: History does not contain both 82 and 65 audits!");
  }

  // 10. Delete audit 82
  console.log(`\n10. Deleting audit 82 (${audit82Id}) via DELETE /api/audits/${audit82Id}...`);
  const delAuditRes = await fetch(`${baseUrl}/api/audits/${audit82Id}`, { method: "DELETE" });
  if (!delAuditRes.ok) throw new Error(`DELETE audit failed: ${delAuditRes.status}`);
  console.log("✓ Audit 82 deleted successfully.");

  // Check audits list again
  const auditsAfterDelRes = await fetch(`${baseUrl}/api/papers/paper-cse3103-sample/audits`);
  const { audits: auditsAfterDel } = await auditsAfterDelRes.json();
  console.log(`✓ Audits remaining in history: ${auditsAfterDel.length}`);
  if (auditsAfterDel.some((a: any) => a.id === audit82Id)) {
    throw new Error("CRITICAL FAILURE: Audit 82 still exists after deletion!");
  }

  // 11. Clean up: reset paper back to clean 8 questions for subsequent runs
  console.log("\n11. Resetting paper questions back to 8 clean questions...");
  await fetch(`${baseUrl}/api/papers/paper-cse3103-sample`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions: samplePaperJson.default.questions }),
  });
  console.log("✓ Paper questions reset to clean sample paper.");

  console.log("\n🎉 ALL STAGE 3 VERIFICATION CHECKS PASSED PERFECTLY! 🎉\n");
}

runStage3Verification().catch((err) => {
  console.error("\n❌ Stage 3 Verification Failed:", err);
  process.exit(1);
});
