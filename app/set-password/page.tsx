
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/supabase";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Authentication service is not connected.");
      return;
    }

    let active = true;

    async function checkSession() {
      const { data, error } = await supabase!.auth.getSession();

      if (!active) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setSessionReady(!!data.session);
      
      if (!data.session) {
        setMessage(
          "Please open the latest sign-in link sent to your email."
        );
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        setSessionReady(true);
        setMessage("");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !sessionReady) return;

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

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
        <a className="nav-link" href="/">← Back home</a>
      </header>

      <section className="form-shell">
        <div className="eyebrow">SECURE YOUR ACCOUNT</div>

        <h1>Create your <em>password.</em></h1>

        <p className="form-intro">
          Your email has been confirmed. Create a password
          to make future sign-ins easier.
        </p>

        <form onSubmit={savePassword}>
          <label>
            New password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={!sessionReady}
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
              disabled={!sessionReady}
            />
          </label>

          <button
            className="primary"
            disabled={busy || !sessionReady}
          >
            {busy ? "Saving..." : "Create Password →"}
          </button>

          {message && <p className="notice">{message}</p>}
        </form>
      </section>
    </main>
  );
}
