
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type EventRecord = {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string | null;
  host_name: string;
  description: string | null;
  slug: string;
};

export default function EventDetails({ slug }: { slug: string }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [status, setStatus] = useState("Loading invitation…");
  const [name, setName] = useState("");
  const [choice, setChoice] = useState("yes");
  const [guestCount, setGuestCount] = useState("1");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (slug === "demo") {
      setStatus("This is a sample invitation. Create your own event to publish a live invite.");
      return;
    }

    if (!supabase) {
      setStatus("The event service is not connected yet.");
      return;
    }

    supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus("We couldn't find this event.");
        } else {
          setEvent(data as EventRecord);
          setStatus("");
        }
      });
  }, [slug]);

  async function rsvp(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !event || busy) return;

    const count = Number(guestCount);

    if (!Number.isInteger(count) || count < 1 || count > 50) {
      setStatus("Please enter a number between 1 and 50.");
      return;
    }

    setBusy(true);
    setStatus("");

    const { error } = await supabase.from("rsvps").insert({
      event_id: event.id,
      guest_name: name.trim(),
      response: choice,
      guest_count: count,
    });

    setBusy(false);

    if (error) {
      setStatus(error.message);
    } else {
      setSaved(true);
    }
  }

  return (
    <section className="invite">
      <div className="eyebrow">✳ YOU'RE INVITED</div>

      {event ? (
        <>
          <h1>{event.title}</h1>
          <p className="lead">Hosted by {event.host_name}</p>

          <div className="invite-details">
            <p>📅 {event.event_date} · {event.event_time}</p>
            {event.location && <p>📍 {event.location}</p>}
            {event.description && <p>{event.description}</p>}
          </div>

          {saved ? (
            <p className="notice">Thanks! Your RSVP is saved.</p>
          ) : (
            <form onSubmit={rsvp}>
              <label>
                Your name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Can you make it?
                <select
                  value={choice}
                  onChange={(e) => setChoice(e.target.value)}
                >
                  <option value="yes">I'm in!</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">Can't make it</option>
                </select>
              </label>

              <label>
                How many people are attending, including you?
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                />
              </label>

              <button className="primary" disabled={busy}>
                {busy ? "Sending…" : "Send RSVP"}
              </button>

              {status && <p className="notice">{status}</p>}
            </form>
          )}
        </>
      ) : (
        <h1>{status}</h1>
      )}

      <a href="/" className="secondary">← Made with TGathr</a>
    </section>
  );
}
