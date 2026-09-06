/**
 * Verification test for generating fixes on all issue types & severities
 */

async function testAllFixes() {
  console.log("=== VERIFYING ALL FIXES (HIGH, MEDIUM, LOW) ===");
  const baseUrl = "http://localhost:3000";

  const samplePaper = await import("../data/sample-paper.json");
  const sampleCos = await import("../data/sample-cos.json");

  // 1. Initial audit to get all issues
  const auditRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: samplePaper.default, courseOutcomes: sampleCos.default }),
  });
  const audit = await auditRes.json();
  console.log(`✓ Initial audit generated ${audit.issues.length} issues.`);

  for (const issue of audit.issues) {
    const repeatMatch = issue.message.match(/^(\w+)\s+(is a near-duplicate|resembles)/);
    const targetQId = repeatMatch ? repeatMatch[1] : undefined;
    const targetCo = issue.targetCo || (targetQId ? "CO1" : "CO6");

    console.log(`\nTesting fix for [${issue.severity.toUpperCase()}]: "${issue.message.slice(0, 60)}..."`);
    const fixRes = await fetch(`${baseUrl}/api/fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper: samplePaper.default,
        courseOutcomes: sampleCos.default,
        targetCo,
        targetBloom: "Apply",
        replaceQuestionId: targetQId,
        issueMessage: issue.message,
      }),
    });

    if (!fixRes.ok) throw new Error(`Fix API failed for issue: ${fixRes.status}`);
    const fixQuestion = await fixRes.json();
    if (fixQuestion.error) throw new Error(`Fix API returned error: ${fixQuestion.error}`);
    console.log(`  ✓ Generated Question ID: ${fixQuestion.id}, Marks: ${fixQuestion.marks}`);
    console.log(`  ✓ Snippet: ${fixQuestion.text.slice(0, 80)}...`);
  }

  console.log("\n🎉 ALL ISSUES (HIGH, MEDIUM, LOW) SUCCESSFULLY GENERATE FIXES! 🎉\n");
}

testAllFixes().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
