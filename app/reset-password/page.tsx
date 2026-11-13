
"use client";

import { useState } from "react";
import { supabase } from "@/components/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Authentication service is not connected.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setBusy(false);
      setMessage("Your reset link may have expired. Please request a new one.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="subpage">
      <header className="nav wrap">
        <a className="brand" href="/">
          tgathr<span className="dot">.</span>
        </a>
        <a className="nav-link" href="/login/">
          ← Back to login
        </a>
      </header>

      <section className="form-shell">
        <div className="eyebrow">ACCOUNT SECURITY</div>

        <h1>Reset your <em>password.</em></h1>

        <p className="form-intro">
          Enter your new password below.
        </p>

        <form onSubmit={updatePassword}>
          <label>
            New password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
            />
          </label>

          <button className="primary" disabled={busy}>
            {busy ? "Updating..." : "Update Password →"}
          </button>

          {message && <p className="notice">{message}</p>}
        </form>
      </section>
    </main>
  );
}
