"use client";

import { useState } from "react";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  {
    name: "Dr. Mahmudul Hasan",
    dept: "CSE · DBMS",
    email: "hasan@aust.edu",
    password: "hasan123",
  },
  {
    name: "Dr. Nusrat Jahan",
    dept: "CSE · OS & DS",
    email: "jahan@aust.edu",
    password: "nusrat123",
  },
  {
    name: "Dr. Tanvir Ahmed",
    dept: "CSE · Programming",
    email: "ahmed@aust.edu",
    password: "tanvir123",
  },
];

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSignup) {
      // Demo signup notice
      setError("Registration is restricted during the evaluation period. Please use a seeded demo account below.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Hard navigation ensures server cookies and server state refresh cleanly
      window.location.href = "/dashboard";
    } catch {
      setError("Could not reach authentication service. Please try again.");
      setLoading(false);
    }
  }

  function fillDemoAccount(demoEmail: string, demoPw: string) {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError(null);
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        <Link
          href="/"
          style={{
            position: "absolute",
            top: 20,
            left: 24,
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to Home
        </Link>

        <div style={{ textAlign: "center", marginBottom: 28, marginTop: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "var(--navy)",
              borderRadius: 12,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 4px 16px rgba(11, 26, 51, 0.2)",
              marginBottom: 12,
            }}
          >
            PL
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
            {isSignup ? "Create Faculty Account" : "Welcome back"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
            {isSignup
              ? "Join PaperLens to audit exams against course outcomes"
              : "Sign in to your PaperLens faculty account"}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.84rem",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            role="alert"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isSignup && (
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--gray-light)",
                  fontSize: "0.92rem",
                  outline: "none",
                  background: "var(--cream)",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hasan@aust.edu"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--gray-light)",
                fontSize: "0.92rem",
                outline: "none",
                background: "var(--cream)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--gray-light)",
                fontSize: "0.92rem",
                outline: "none",
                background: "var(--cream)",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8, padding: "12px" }}
            disabled={loading}
          >
            {loading ? "Signing in…" : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 16 }}>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#856404",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </div>

        {/* Demo Accounts Panel */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1.5px solid var(--gray-light)",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", marginBottom: 10, textAlign: "center" }}>
            1-Click Demo Accounts (Judges &amp; Evaluators)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemoAccount(acc.email, acc.password)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--gray-light)",
                  background: "var(--cream)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold)";
                  e.currentTarget.style.background = "var(--gold-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--gray-light)";
                  e.currentTarget.style.background = "var(--cream)";
                }}
              >
                <div>
                  <strong style={{ color: "var(--navy)" }}>{acc.name}</strong>
                  <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>({acc.dept})</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#856404", fontWeight: 700 }}>
                  Autofill →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
