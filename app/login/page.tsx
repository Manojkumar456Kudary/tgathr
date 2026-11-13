
"use client";

import { useState } from "react";
import { supabase } from "@/components/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendLoginLink(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Authentication service is not connected.");
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
      setMessage(
        "Check your email! Click the secure link to sign in and continue setting up your account."
      );
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

        <h1>Join TGathr or <em>sign in.</em></h1>

        <p className="form-intro">
          Enter your email address. We'll send you a secure
          verification link. New users can create their password
          after confirming their email.
        </p>

        <form onSubmit={sendLoginLink}>
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

          <button className="primary" disabled={busy}>
            {busy ? "Sending..." : "Continue with email →"}
          </button>

          {message && <p className="notice">{message}</p>}
        </form>
      </section>
    </main>
  );
}
