
"use client";

import { useState } from "react";
import { supabase } from "@/components/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Authentication service is not connected.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/create/";
    }
  }

  async function sendLoginLink() {
    if (!supabase) {
      setMessage("Authentication service is not connected.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address first.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/set-password/`,
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a secure sign-in link.");
    }
  }

  return (
    <main className="subpage">
      <header className="nav wrap">
        <a className="brand" href="/">
          tgathr<span className="dot">.</span>
        </a>
        <a className="nav-link" href="/">← Back home</a>
      </header>

      <section className="form-shell">
        <div className="eyebrow">WELCOME TO TGATHR</div>

        <h1>Welcome <em>back.</em></h1>

        <p className="form-intro">
          Sign in with your email and password, or use
          a secure email link.
        </p>

        <form onSubmit={signInWithPassword}>
          <label>
            Your email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </label>

          <button className="primary" disabled={busy}>
            {busy ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <div className="form-intro" style={{ textAlign: "center" }}>
          Or
        </div>

        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={sendLoginLink}
        >
          {busy ? "Sending..." : "Continue with email link"}
        </button>

        {message && <p className="notice">{message}</p>}
      </section>
    </main>
  );
}
