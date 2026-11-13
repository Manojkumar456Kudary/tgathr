
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/supabase";

type EventRecord = {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  location: string | null;
  owner_id: string;
};

type RSVPRecord = {
  id: string;
  event_id: string;
  guest_name: string;
  response: "yes" | "maybe" | "no";
  guest_count: number;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      if (!supabase) {
        setMessage("The event service is not connected.");
        setLoading(false);
        return;
      }

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        window.location.href = "/login/";
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (eventError) {
        setMessage(eventError.message);
        setLoading(false);
        return;
      }

      const myEvents = (eventData || []) as EventRecord[];
      setEvents(myEvents);

      if (myEvents.length > 0) {
        const eventIds = myEvents.map((event) => event.id);

        const { data: rsvpData, error: rsvpError } = await supabase
          .from("rsvps")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false });

        if (rsvpError) {
          setMessage(rsvpError.message);
        } else {
          setRsvps((rsvpData || []) as RSVPRecord[]);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function logout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    window.location.href = "/login/";
  }

  if (loading) {
    return (
      <main className="subpage">
        <section className="form-shell">
          <h1>Loading your dashboard...</h1>
        </section>
      </main>
    );
  }

  const totalYes = rsvps.filter((r) => r.response === "yes").length;
  const totalMaybe = rsvps.filter((r) => r.response === "maybe").length;
  const totalNo = rsvps.filter((r) => r.response === "no").length;

  const attendingPeople = rsvps
    .filter((r) => r.response === "yes")
    .reduce((sum, r) => sum + Number(r.guest_count || 1), 0);

  return (
    <main className="subpage">
      <header className="nav wrap">
        <a className="brand" href="/">
          tgathr<span className="dot">.</span>
        </a>
        <button className="secondary" onClick={logout}>
          Sign out
        </button>
      </header>

      <section className="form-shell">
        <div className="eyebrow">YOUR PRIVATE EVENT SPACE</div>
        <h1>Your <em>dashboard.</em></h1>
        <p className="form-intro">
          Track responses from guests invited to your events.
        </p>

        {message && <p className="notice">{message}</p>}

        <div className="invite-details">
          <p>Events created: <strong>{events.length}</strong></p>
          <p>Yes: <strong>{totalYes}</strong></p>
          <p>Maybe: <strong>{totalMaybe}</strong></p>
          <p>No: <strong>{totalNo}</strong></p>
          <p>Expected attendees: <strong>{attendingPeople}</strong></p>
        </div>

        {events.length === 0 ? (
          <div>
            <p>You haven't created any events yet.</p>
            <a className="primary" href="/create/">
              Create an event →
            </a>
          </div>
        ) : (
          events.map((event) => {
            const eventRsvps = rsvps.filter(
              (rsvp) => rsvp.event_id === event.id
            );

            const yes = eventRsvps.filter(
              (rsvp) => rsvp.response === "yes"
            );

            const maybe = eventRsvps.filter(
              (rsvp) => rsvp.response === "maybe"
            );

            const no = eventRsvps.filter(
              (rsvp) => rsvp.response === "no"
            );

            const people = yes.reduce(
              (sum, rsvp) => sum + Number(rsvp.guest_count || 1),
              0
            );

            const invitationLink =
              `${window.location.origin}/event/?slug=${encodeURIComponent(event.slug)}`;

            return (
              <div className="invite-details" key={event.id}>
                <h2>{event.title}</h2>
                <p>📅 {event.event_date} · {event.event_time}</p>
                {event.location && <p>📍 {event.location}</p>}

                <p>
                  Yes: <strong>{yes.length}</strong> ·
                  Maybe: <strong>{maybe.length}</strong> ·
                  No: <strong>{no.length}</strong>
                </p>
                <p>People attending: <strong>{people}</strong></p>

                <label>Invitation link</label>
                <input readOnly value={invitationLink} />

                <h3>Guest responses</h3>

                {eventRsvps.length === 0 ? (
                  <p>No one has responded yet.</p>
                ) : (
                  eventRsvps.map((rsvp) => (
                    <p key={rsvp.id}>
                      <strong>{rsvp.guest_name}</strong>
                      {" — "}
                      {rsvp.response.toUpperCase()}
                      {" — "}
                      {rsvp.guest_count} {rsvp.guest_count === 1 ? "person" : "people"}
                    </p>
                  ))
                )}
              </div>
            );
          })
        )}

        <a className="secondary" href="/create/">
          + Create another event
        </a>
      </section>
    </main>
  );
}
