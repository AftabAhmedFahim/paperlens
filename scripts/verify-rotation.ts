/**
 * Verification for multi-variant question rotation and course awareness
 */
async function testRotation() {
  const baseUrl = "http://localhost:3000";
  const cse3103 = await import("../data/sample-paper.json");
  const cse1101 = await import("../data/sample-paper-cse1101.json");
  const cse2101 = await import("../data/sample-paper-cse2101.json");

  console.log("=== TEST 1: CSE 3103 CO6 Fix Rotation ===");
  const res1 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse3103.default, targetCo: "CO6" }),
  });
  const q1 = await res1.json();
  console.log("Fix 1 (CO6):", q1.id, "-", q1.text.slice(0, 70));

  const res2 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse3103.default, targetCo: "CO6", currentFixText: q1.text }),
  });
  const q2 = await res2.json();
  console.log("Fix 2 (Regenerate):", q2.id, "-", q2.text.slice(0, 70));

  if (q1.text === q2.text) throw new Error("FAIL: Fix 1 and Fix 2 are identical!");
  console.log("✓ Fix 1 and Fix 2 are distinct variants.");

  const res3 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse3103.default, targetCo: "CO6", currentFixText: q2.text }),
  });
  const q3 = await res3.json();
  console.log("Fix 3 (Regenerate 2):", q3.id, "-", q3.text.slice(0, 70));
  if (q2.text === q3.text) throw new Error("FAIL: Fix 2 and Fix 3 are identical!");
  console.log("✓ Fix 2 and Fix 3 are distinct variants.");

  console.log("\n=== TEST 2: CSE 3103 Repeat 1a Fix Rotation ===");
  const res1a_1 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse3103.default, replaceQuestionId: "1a" }),
  });
  const q1a_1 = await res1a_1.json();
  console.log("1a Fix 1:", q1a_1.id, "-", q1a_1.text.slice(0, 70));

  const res1a_2 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse3103.default, replaceQuestionId: "1a", currentFixText: q1a_1.text }),
  });
  const q1a_2 = await res1a_2.json();
  console.log("1a Fix 2 (Regenerate):", q1a_2.id, "-", q1a_2.text.slice(0, 70));
  if (q1a_1.text === q1a_2.text) throw new Error("FAIL: 1a fixes are identical!");
  console.log("✓ 1a replacement rotated to distinct question.");

  console.log("\n=== TEST 3: CSE 1101 C Programming Course Awareness and Rotation ===");
  const resC_1 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse1101.default, replaceQuestionId: "1a" }),
  });
  const qC_1 = await resC_1.json();
  console.log("CSE 1101 1a Fix 1:", qC_1.id, "-", qC_1.text.slice(0, 70));
  if (!qC_1.text.includes("storage") && !qC_1.text.includes("memory")) {
    throw new Error("FAIL: Expected C programming question!");
  }

  const resC_2 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse1101.default, replaceQuestionId: "1a", currentFixText: qC_1.text }),
  });
  const qC_2 = await resC_2.json();
  console.log("CSE 1101 1a Fix 2:", qC_2.id, "-", qC_2.text.slice(0, 70));
  if (qC_1.text === qC_2.text) throw new Error("FAIL: CSE 1101 fixes are identical!");
  console.log("✓ CSE 1101 C programming questions generated and rotated.");

  console.log("\n=== TEST 4: CSE 2101 Data Structures Course Awareness and CO5 Gap ===");
  const resDs_1 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse2101.default, targetCo: "CO5" }),
  });
  const qDs_1 = await resDs_1.json();
  console.log("CSE 2101 CO5 Fix 1:", qDs_1.id, "-", qDs_1.text.slice(0, 70));
  if (!qDs_1.text.includes("Sort") && !qDs_1.text.includes("Search") && !qDs_1.text.includes("complexity")) {
    throw new Error("FAIL: Expected Data Structures sorting/searching question!");
  }

  const resDs_2 = await fetch(baseUrl + "/api/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper: cse2101.default, targetCo: "CO5", currentFixText: qDs_1.text }),
  });
  const qDs_2 = await resDs_2.json();
  console.log("CSE 2101 CO5 Fix 2:", qDs_2.id, "-", qDs_2.text.slice(0, 70));
  if (qDs_1.text === qDs_2.text) throw new Error("FAIL: CSE 2101 fixes are identical!");
  console.log("✓ CSE 2101 Data Structures questions generated and rotated.");

  console.log("\n🎉 ALL FIX ROTATION AND COURSE-AWARENESS TESTS PASSED PERFECTLY! 🎉\n");
}

testRotation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
