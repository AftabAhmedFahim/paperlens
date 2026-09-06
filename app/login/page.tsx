"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    name: "Dr. Mahmudul Hasan",
    dept: "CSE · AUST",
    email: "hasan@aust.edu",
    password: "hasan123",
    note: "DBMS & Software Engineering",
  },
  {
    name: "Dr. Nusrat Jahan",
    dept: "CSE · AUST",
    email: "jahan@aust.edu",
    password: "nusrat123",
    note: "Data Structures & OS",
  },
  {
    name: "Dr. Tanvir Ahmed",
    dept: "CSE · AUST",
    email: "ahmed@aust.edu",
    password: "tanvir123",
    note: "Structured Programming & DBMS",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      window.location.href = "/";
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
    <div className="pl-login-page">
      <div className="pl-login-card">
        <div className="pl-login-brand">
          <span className="pl-nav-logo-mark">PL</span>
          PaperLens
          <span className="pl-nav-tag" style={{ marginLeft: "auto" }}>
            Faculty Portal
          </span>
        </div>

        <h1 className="pl-login-title">Faculty Sign In</h1>
        <p className="pl-login-sub">
          Sign in with your university credentials to audit question papers against
          course outcomes.
        </p>

        {error && (
          <div className="pl-login-error" role="alert">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4.5zm0 8a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="pl-login-form" onSubmit={handleSubmit}>
          <div className="pl-login-field">
            <label className="pl-login-label" htmlFor="email-input">
              University Email
            </label>
            <input
              id="email-input"
              className="pl-login-input"
              type="email"
              placeholder="e.g. hasan@aust.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="pl-login-field">
            <label className="pl-login-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              className="pl-login-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="pl-login-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="pl-demo-accounts">
          <div className="pl-demo-accounts-title">Demo Accounts (Click to auto-fill)</div>
          <div className="pl-demo-accounts-list">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="pl-demo-account-btn"
                onClick={() => fillDemoAccount(acc.email, acc.password)}
              >
                <div className="pl-demo-account-name">{acc.name}</div>
                <div className="pl-demo-account-meta">
                  <span>{acc.email}</span>
                  <span>·</span>
                  <span className="pl-demo-code-tag">{acc.password}</span>
                  <span>·</span>
                  <span>{acc.note}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
