
"use client";

import { useState } from "react";
import { supabase } from "./supabase";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [host, setHost] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setCopied(false);

    if (!supabase) {
      setMessage("Event service is not connected. Please check your Cloudflare environment variables.");
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError || !user) {
  window.location.href = "/login/";
  return;
}

setBusy(true);

const slug = `${title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 35)}-${Math.random().toString(36).slice(2, 7)}`;

    const { error } = await supabase
      .from("events")
      .insert({
  title,
  slug,
  event_date: date,
  event_time: time,
  location,
  host_name: host,
  description,
  owner_id: user.id,
});

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const link = `${window.location.origin}/event/?slug=${encodeURIComponent(slug)}`;

    setEventLink(link);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventLink);
      setCopied(true);
    } catch {
      setMessage("Unable to copy automatically. Please select and copy the link.");
    }
  }

  if (eventLink) {
    return (
      <section className="form-shell">
        <div className="eyebrow">✳ YOUR EVENT IS READY</div>

        <h1>You're all <em>set!</em></h1>

        <p className="form-intro">
          Your event has been created successfully. Share this invitation
          link with your friends and family.
        </p>

        <label>YOUR INVITATION LINK</label>

        <input
          readOnly
          value={eventLink}
          onFocus={(e) => e.currentTarget.select()}
        />

        <button
          type="button"
          className="primary"
          onClick={copyLink}
        >
          {copied ? "✓ Link Copied!" : "Copy Invitation Link"}
        </button>

        {message && <p className="notice">{message}</p>}

        <p className="notice">
          Your guests can open this link and submit their RSVPs.
        </p>

        <a className="secondary" href="/">
          ← Back to TGathr
        </a>
      </section>
    );
  }

  return (
    <section className="form-shell">
      <div className="eyebrow">LET'S GET EVERYONE TOGETHER</div>

      <h1>Create your <em>event.</em></h1>

      <p className="form-intro">
        A few details, one shareable link, and you're all set.
      </p>

      <form onSubmit={submit}>
        <label>
          What's the occasion?
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Birthday dinner"
          />
        </label>

        <div className="two">
          <label>
            Date
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label>
            Time
            <input
              required
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>

        <label>
          Where is it?
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or venue"
          />
        </label>

        <label>
          Your name
          <input
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Host name"
          />
        </label>

        <label>
          A little more info
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should guests know?"
          />
        </label>

        <button className="primary" disabled={busy}>
          {busy ? "Creating..." : "Create event ↗"}
        </button>

        {message && <p className="notice">{message}</p>}
      </form>
    </section>
  );
}
