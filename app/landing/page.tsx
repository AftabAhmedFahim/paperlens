"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="landing-header">
        <div className="container">
          <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", fontWeight: 800, fontSize: "1.3rem" }}>
            <span
              style={{
                width: 36,
                height: 36,
                background: "var(--gold)",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--navy)",
                fontWeight: 900,
                fontSize: 15,
                boxShadow: "0 2px 10px rgba(201, 168, 76, 0.4)",
              }}
            >
              PL
            </span>
            PaperLens
          </Link>

          <nav>
            <ul
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                listStyle: "none",
              }}
              className="desktop-nav"
            >
              <li>
                <a href="#features" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", fontWeight: 500 }}>
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", fontWeight: 500 }}>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faculty" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", fontWeight: 500 }}>
                  For Faculty
                </a>
              </li>
              <li>
                <a href="#cta" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", fontWeight: 500 }}>
                  Get Started
                </a>
              </li>
            </ul>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" className="btn btn-outline-light btn-sm">
              Sign In
            </Link>
            <Link href="/" className="btn btn-primary btn-sm">
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="landing-hero">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 50, alignItems: "center" }}>
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--gold)",
                background: "rgba(201, 168, 76, 0.15)",
                padding: "4px 16px",
                borderRadius: 60,
                marginBottom: 16,
                border: "1px solid rgba(201, 168, 76, 0.3)",
              }}
            >
              Academic Assessment Quality Assurance
            </span>
            <h1 style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20 }}>
              Audit exam papers<br />
              <span style={{ background: "var(--gradient-gold)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                before they reach students
              </span>
            </h1>
            <p style={{ fontSize: "1.1rem", color: "rgba(255, 255, 255, 0.75)", maxWidth: 520, lineHeight: 1.8, marginBottom: 32 }}>
              PaperLens evaluates draft exams against course outcomes, checks
              cognitive level distribution, and flags repeated questions —
              so faculty can build better assessments with confidence.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/" className="btn btn-primary">
                🚀 Try PaperLens Now
              </Link>
              <a href="#features" className="btn btn-outline-light">
                Explore Features ↓
              </a>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="hero-stat-card">
              <div style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>
                94%
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.95rem", marginTop: 6, fontWeight: 500 }}>
                Average audit confidence score
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>3 Faculty</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.5)", marginTop: 2 }}>CSE Department, AUST</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>100% Local</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.5)", marginTop: 2 }}>Deterministic &amp; Secure</div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--gold-light)" }}>
                <span>✨</span> Verified 65 → 82 Demo Flow &amp; Fix Generator
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "90px 0 80px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--gold)",
                background: "var(--gold-glow)",
                padding: "4px 16px",
                borderRadius: 60,
                marginBottom: 12,
              }}
            >
              What PaperLens Does
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-1px", color: "var(--navy)", marginBottom: 12 }}>
              AI-powered audit for <span style={{ color: "var(--gold)" }}>assessment quality</span>
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
              PaperLens evaluates your draft exam against course outcomes, checks cognitive level distribution, and flags questions from past years. It audits — it does not generate.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
            {/* Feature 1 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Outcome Coverage Analysis
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                Maps every question to course outcomes (CO1–CO6) and calculates the exact mark share. Highlights missing or under-weighted outcomes instantly.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>CO Mapping</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Weight Share</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Gap Detection</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>🧠</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Bloom&apos;s Taxonomy Distribution
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                Assesses cognitive level distribution across questions. Flags low-order skew (Remember/Understand) and ensures healthy higher-order depth.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Remember</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Apply</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Evaluate</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>🔁</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Repeated Question Detection
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                Compares each question against three years of past papers (2022–2024). Flags near-duplicates with side-by-side textual diffs.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>TF-IDF + Cosine</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Past Archive</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Integrity Check</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>📊</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Health Score &amp; Issue Sorting
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                A composite 0–100 score reflecting coverage integrity, cognitive balance, and originality. Issues sorted by High, Medium, and Low severity.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>0–100 Gauge</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Severity Dot</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Health Metric</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>✨</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                AI-Powered Fix Generator
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                Generate replacement questions for missing outcomes or duplicate questions. Review proposed questions inline and accept with one click.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Targeted CO</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Inline Preview</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Re-Audit Loop</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>👥</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Multi-Faculty Isolation
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 16 }}>
                Each faculty member possesses their own paper library, audit history, and SQLite-backed persistence with cookie JWT authentication.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Faculty Switcher</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>SQLite Storage</span>
                <span className="tag" style={{ background: "var(--cream)", border: "1px solid var(--gray-light)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600 }}>Audit History</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: "90px 0", background: "var(--cream)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--gold)",
                background: "var(--gold-glow)",
                padding: "4px 16px",
                borderRadius: 60,
                marginBottom: 12,
              }}
            >
              Simple Workflow
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-1px", color: "var(--navy)", marginBottom: 12 }}>
              Audit a paper in <span style={{ color: "var(--gold)" }}>four steps</span>
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
              From initial upload to verified quality report — PaperLens makes assessment assurance effortless.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            <div className="step-card">
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--gold)", opacity: 0.5, lineHeight: 1, marginBottom: 12 }}>
                01
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Upload</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                Paste questions &amp; course outcomes as JSON or click &ldquo;Load Sample&rdquo; to start immediately.
              </p>
            </div>

            <div className="step-card">
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--gold)", opacity: 0.5, lineHeight: 1, marginBottom: 12 }}>
                02
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Audit</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                Watch the 5-step animated progress checklist map outcomes, assess Bloom levels, and scan duplicates.
              </p>
            </div>

            <div className="step-card">
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--gold)", opacity: 0.5, lineHeight: 1, marginBottom: 12 }}>
                03
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Review</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                Inspect the health gauge, coverage cards, cognitive chart, repeat comparison, and sorted issue list.
              </p>
            </div>

            <div className="step-card">
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--gold)", opacity: 0.5, lineHeight: 1, marginBottom: 12 }}>
                04
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Fix &amp; Re-run</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                Generate AI fixes directly on issue rows, accept suggestions into the paper, and verify the score jump.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FACULTY SHOWCASE
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faculty" style={{ padding: "90px 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--gold)",
                background: "var(--gold-glow)",
                padding: "4px 16px",
                borderRadius: 60,
                marginBottom: 12,
              }}
            >
              Built for Faculty
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-1px", color: "var(--navy)", marginBottom: 16 }}>
              Designed for <span style={{ color: "var(--gold)" }}>academic excellence</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: 24 }}>
              PaperLens empowers professors and examiners with data-driven insights. Each faculty member gets their own paper library, audit history, and personalized fix recommendations.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem", color: "var(--text-dark)" }}>
                <span style={{ color: "var(--gold)", fontWeight: 800 }}>✓</span> Individual SQLite paper libraries per faculty
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem", color: "var(--text-dark)" }}>
                <span style={{ color: "var(--gold)", fontWeight: 800 }}>✓</span> Audit history with 1-click report reload
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem", color: "var(--text-dark)" }}>
                <span style={{ color: "var(--gold)", fontWeight: 800 }}>✓</span> Outcome coverage tracking and gap alerts
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem", color: "var(--text-dark)" }}>
                <span style={{ color: "var(--gold)", fontWeight: 800 }}>✓</span> Inline fix generator for all issue severities
              </li>
            </ul>
            <Link href="/" className="btn btn-primary">
              Launch Faculty Dashboard
            </Link>
          </div>

          <div>
            <div style={{ background: "var(--navy)", borderRadius: "var(--radius)", padding: 32, color: "#fff", boxShadow: "var(--shadow-hover)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                Active Faculty Accounts
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", marginBottom: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                  MH
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Dr. Mahmudul Hasan</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>CSE · DBMS &amp; Software Eng</div>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gold)", background: "rgba(201, 168, 76, 0.15)", padding: "3px 10px", borderRadius: 20 }}>
                  CSE 3103
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", marginBottom: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                  NJ
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Dr. Nusrat Jahan</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>CSE · Data Structures &amp; OS</div>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gold)", background: "rgba(201, 168, 76, 0.15)", padding: "3px 10px", borderRadius: 20 }}>
                  CSE 2101
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", marginBottom: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                  TA
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Dr. Tanvir Ahmed</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>CSE · Structured Programming</div>
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gold)", background: "rgba(201, 168, 76, 0.15)", padding: "3px 10px", borderRadius: 20 }}>
                  CSE 1101
                </span>
              </div>

              <div style={{ textAlign: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                Switch faculty profiles instantly with isolated data
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="cta" style={{ padding: "80px 0 90px", background: "var(--navy)", color: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 16 }}>
            Ready to audit your next exam paper?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: 32 }}>
            Upload your draft questions and course outcomes — get an actionable audit report in seconds with one-click fix generation.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-primary" style={{ padding: "14px 36px", fontSize: "1rem" }}>
              Launch PaperLens Dashboard
            </Link>
            <Link href="/login" className="btn btn-outline-light" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              Faculty Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "var(--navy-dark)", color: "rgba(255,255,255,0.55)", padding: "40px 0 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, background: "var(--gold)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)", fontWeight: 900, fontSize: 13 }}>
              PL
            </span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>PaperLens</span>
            <span style={{ fontSize: "0.8rem", marginLeft: 8 }}>· AI-Powered Exam Paper Auditor</span>
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            &copy; 2026 PaperLens · Department of CSE, AUST
          </div>
        </div>
      </footer>
    </div>
  );
}
