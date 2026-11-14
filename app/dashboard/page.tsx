
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

type QuestionRecord = {
  id: string;
  event_id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice";
  is_required: boolean;
};

type OptionRecord = {
  id: string;
  question_id: string;
  option_text: string;
};

type AttendeeRecord = {
  id: string;
  rsvp_id: string;
  attendee_name: string;
};

type AnswerRecord = {
  id: string;
  attendee_id: string;
  question_id: string;
  option_id: string;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [options, setOptions] = useState<OptionRecord[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      if (!supabase) {
        setMessage("The event service is not connected.");
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session?.user) {
        window.location.href = "/login/";
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });

      if (eventError) {
        setMessage(eventError.message);
        setLoading(false);
        return;
      }

      const myEvents = (eventData || []) as EventRecord[];
      setEvents(myEvents);

      if (myEvents.length === 0) {
        setLoading(false);
        return;
      }

      const eventIds = myEvents.map((event) => event.id);

      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      if (rsvpError) {
        setMessage(rsvpError.message);
        setLoading(false);
        return;
      }

      const myRsvps = (rsvpData || []) as RSVPRecord[];
      setRsvps(myRsvps);

      const { data: questionData, error: questionError } = await supabase
        .from("event_questions")
        .select("*")
        .in("event_id", eventIds)
        .order("position");

      if (questionError) {
        setMessage(questionError.message);
        setLoading(false);
        return;
      }

      const myQuestions = (questionData || []) as QuestionRecord[];
      setQuestions(myQuestions);

      const questionIds = myQuestions.map((question) => question.id);

      if (questionIds.length > 0) {
        const { data: optionData, error: optionError } = await supabase
          .from("event_question_options")
          .select("*")
          .in("question_id", questionIds)
          .order("position");

        if (optionError) {
          setMessage(optionError.message);
          setLoading(false);
          return;
        }

        setOptions((optionData || []) as OptionRecord[]);
      }

      const rsvpIds = myRsvps.map((rsvp) => rsvp.id);

      if (rsvpIds.length > 0) {
        const { data: attendeeData, error: attendeeError } = await supabase
          .from("rsvp_attendees")
          .select("*")
          .in("rsvp_id", rsvpIds)
          .order("created_at");

        if (attendeeError) {
          setMessage(attendeeError.message);
          setLoading(false);
          return;
        }

        const myAttendees = (attendeeData || []) as AttendeeRecord[];
        setAttendees(myAttendees);

        const attendeeIds = myAttendees.map((attendee) => attendee.id);

        if (attendeeIds.length > 0) {
          const { data: answerData, error: answerError } = await supabase
            .from("rsvp_answers")
            .select("*")
            .in("attendee_id", attendeeIds);

          if (answerError) {
            setMessage(answerError.message);
            setLoading(false);
            return;
          }

          setAnswers((answerData || []) as AnswerRecord[]);
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

  function getAttendeeAnswers(attendeeId: string, questionId: string) {
    return answers
      .filter(
        (answer) =>
          answer.attendee_id === attendeeId &&
          answer.question_id === questionId
      )
      .map((answer) =>
        options.find((option) => option.id === answer.option_id)?.option_text
      )
      .filter(Boolean) as string[];
  }

  function getPeopleCount(list: RSVPRecord[]) {
    return list.reduce(
      (sum, rsvp) => sum + Math.max(Number(rsvp.guest_count || 1), 1),
      0
    );
  }

  if (loading) {
    return (
      <main className="subpage dashboard-page">
        <section className="dashboard-shell">
          <p className="dashboard-loading">Loading your dashboard...</p>
        </section>
      </main>
    );
  }

  const totalAttending = getPeopleCount(
    rsvps.filter((rsvp) => rsvp.response === "yes")
  );

  return (
    <main className="subpage dashboard-page">
      <header className="nav wrap">
        <a className="brand" href="/">
          tgathr<span className="dot">.</span>
        </a>

        <button className="secondary" onClick={logout}>
          Sign out
        </button>
      </header>

      <section className="dashboard-shell">
        <div className="dashboard-header">
          <div className="eyebrow">YOUR PRIVATE EVENT SPACE</div>
          <h1>
            Your <em>dashboard.</em>
          </h1>
          <p className="form-intro">
            Everything happening with your events, all in one place.
          </p>
        </div>

        {message && <p className="notice">{message}</p>}

        <div className="dashboard-overview">
          <div className="dashboard-overview-card">
            <span className="dashboard-stat-label">Events created</span>
            <strong>{events.length}</strong>
          </div>

          <div className="dashboard-overview-card dashboard-overview-highlight">
            <span className="dashboard-stat-label">People attending</span>
            <strong>{totalAttending}</strong>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="dashboard-empty">
            <h2>Your next gathering starts here.</h2>
            <p>You haven't created any events yet.</p>
            <a className="primary" href="/create/">
              Create your first event →
            </a>
          </div>
        ) : (
          <div className="dashboard-event-list">
            {events.map((event) => {
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

              const yesPeople = getPeopleCount(yes);
              const maybePeople = getPeopleCount(maybe);
              const noPeople = getPeopleCount(no);

              const eventQuestions = questions.filter(
                (question) => question.event_id === event.id
              );

              const invitationLink =
                `${window.location.origin}/event/?slug=${encodeURIComponent(event.slug)}`;

              const yesRsvpIds = new Set(yes.map((rsvp) => rsvp.id));

              const attendingAttendees = attendees.filter((attendee) =>
                yesRsvpIds.has(attendee.rsvp_id)
              );

              const totalResponses = eventRsvps.length;

              return (
                <article className="dashboard-event-card" key={event.id}>
                  <div className="dashboard-event-top">
                    <div>
                      <span className="dashboard-event-label">
                        YOUR EVENT
                      </span>
                      <h2>{event.title}</h2>

                      <div className="dashboard-event-meta">
                        <span>📅 {event.event_date}</span>
                        <span>🕒 {event.event_time}</span>
                        {event.location && (
                          <span>📍 {event.location}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-event-stats">
                    <div className="dashboard-event-stat dashboard-event-stat-primary">
                      <span>People attending</span>
                      <strong>{yesPeople}</strong>
                    </div>

                    <div className="dashboard-event-stat">
                      <span>RSVP responses</span>
                      <strong>{totalResponses}</strong>
                    </div>
                  </div>

                  <div className="dashboard-response-section">
                    <h3>Response breakdown</h3>

                    <div className="dashboard-response-grid">
                      <div className="dashboard-response-item">
                        <span className="dashboard-response-dot yes-dot" />
                        <div>
                          <strong>{yesPeople}</strong>
                          <span>Yes</span>
                        </div>
                      </div>

                      <div className="dashboard-response-item">
                        <span className="dashboard-response-dot maybe-dot" />
                        <div>
                          <strong>{maybePeople}</strong>
                          <span>Maybe</span>
                        </div>
                      </div>

                      <div className="dashboard-response-item">
                        <span className="dashboard-response-dot no-dot" />
                        <div>
                          <strong>{noPeople}</strong>
                          <span>No</span>
                        </div>
                      </div>
                    </div>

                    <p className="dashboard-small-note">
                      Counts represent people, including additional guests.
                    </p>
                  </div>

                  <div className="dashboard-invitation">
                    <label>Invitation link</label>
                    <input
                      readOnly
                      value={invitationLink}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </div>

                  <div className="dashboard-attending-section">
                    <div className="dashboard-section-heading">
                      <div>
                        <h3>Who's attending</h3>
                        <p>
                          {yesPeople} confirmed{" "}
                          {yesPeople === 1 ? "person" : "people"}
                        </p>
                      </div>
                    </div>

                    {yes.length === 0 ? (
                      <div className="dashboard-no-attendees">
                        No confirmed attendees yet. Share your invitation to
                        get started.
                      </div>
                    ) : (
                      <div className="dashboard-attendee-list">
                        {yes.map((rsvp) => {
                          const group = attendees.filter(
                            (attendee) => attendee.rsvp_id === rsvp.id
                          );

                          const extraCount = Math.max(
                            Number(rsvp.guest_count || 1) - 1,
                            0
                          );

                          const additionalNames = group.filter(
                            (attendee) =>
                              attendee.attendee_name.trim().toLowerCase() !==
                              rsvp.guest_name.trim().toLowerCase()
                          );

                          return (
                            <div
                              className="dashboard-attendee-row"
                              key={rsvp.id}
                            >
                              <div className="dashboard-attendee-avatar">
                                {rsvp.guest_name.charAt(0).toUpperCase()}
                              </div>

                              <div className="dashboard-attendee-info">
                                <strong>{rsvp.guest_name}</strong>

                                {additionalNames.length > 0 && (
                                  <span>
                                    Also:{" "}
                                    {additionalNames
                                      .map((attendee) => attendee.attendee_name)
                                      .join(", ")}
                                  </span>
                                )}
                              </div>

                              {extraCount > 0 && (
                                <span className="dashboard-guest-count">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <details className="dashboard-report">
                    <summary>
                      <span>View detailed report</span>
                      <span className="dashboard-report-arrow">＋</span>
                    </summary>

                    <div className="dashboard-report-content">
                      <section className="dashboard-report-section">
                        <h3>RSVP summary</h3>

                        <div className="dashboard-report-summary">
                          <div>
                            <span>Yes</span>
                            <strong>{yesPeople} people</strong>
                            <small>{yes.length} responses</small>
                          </div>

                          <div>
                            <span>Maybe</span>
                            <strong>{maybePeople} people</strong>
                            <small>{maybe.length} responses</small>
                          </div>

                          <div>
                            <span>No</span>
                            <strong>{noPeople} people</strong>
                            <small>{no.length} responses</small>
                          </div>
                        </div>
                      </section>

                      <section className="dashboard-report-section">
                        <h3>Custom question totals</h3>

                        {eventQuestions.length === 0 ? (
                          <p>No custom questions were added to this event.</p>
                        ) : (
                          eventQuestions.map((question) => {
                            const questionOptions = options.filter(
                              (option) => option.question_id === question.id
                            );

                            const attendingIds = new Set(
                              attendingAttendees.map((attendee) => attendee.id)
                            );

                            const totalSelections = answers.filter(
                              (answer) =>
                                answer.question_id === question.id &&
                                attendingIds.has(answer.attendee_id)
                            ).length;

                            return (
                              <div
                                className="dashboard-question-result"
                                key={question.id}
                              >
                                <h4>{question.question_text}</h4>

                                <p className="dashboard-question-type">
                                  {question.question_type === "multiple_choice"
                                    ? "Multiple choice"
                                    : "Single choice"}
                                </p>

                                {questionOptions.map((option) => {
                                  const count = answers.filter(
                                    (answer) =>
                                      answer.question_id === question.id &&
                                      answer.option_id === option.id &&
                                      attendingIds.has(answer.attendee_id)
                                  ).length;

                                  const percentage =
                                    totalSelections > 0
                                      ? (count / totalSelections) * 100
                                      : 0;

                                  return (
                                    <div
                                      className="dashboard-option-result"
                                      key={option.id}
                                    >
                                      <div className="dashboard-option-label">
                                        <span>{option.option_text}</span>
                                        <strong>{count}</strong>
                                      </div>

                                      <div className="dashboard-option-track">
                                        <div
                                          className="dashboard-option-fill"
                                          style={{
                                            width: `${percentage}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}

                                <p className="dashboard-small-note">
                                  Counts include confirmed attendees who
                                  selected each option. For multiple-choice
                                  questions, one person can select more than
                                  one option.
                                </p>
                              </div>
                            );
                          })
                        )}
                      </section>

                      <section className="dashboard-report-section">
                        <h3>Individual attendee answers</h3>

                        {attendingAttendees.length === 0 ? (
                          <p>
                            Individual attendee details are not available for
                            these responses.
                          </p>
                        ) : (
                          <div className="dashboard-individual-list">
                            {attendingAttendees.map((attendee) => {
                              const attendeeRsvp = yes.find(
                                (rsvp) => rsvp.id === attendee.rsvp_id
                              );

                              return (
                                <div
                                  className="dashboard-individual-card"
                                  key={attendee.id}
                                >
                                  <h4>{attendee.attendee_name}</h4>

                                  {eventQuestions.length === 0 ? (
                                    <p>No custom questions for this event.</p>
                                  ) : (
                                    eventQuestions.map((question) => {
                                      const attendeeAnswers =
                                        getAttendeeAnswers(
                                          attendee.id,
                                          question.id
                                        );

                                      return (
                                        <div
                                          className="dashboard-answer-row"
                                          key={question.id}
                                        >
                                          <span>{question.question_text}</span>
                                          <strong>
                                            {attendeeAnswers.length > 0
                                              ? attendeeAnswers.join(", ")
                                              : "No answer"}
                                          </strong>
                                        </div>
                                      );
                                    })
                                  )}

                                  {attendeeRsvp && (
                                    <p className="dashboard-submitted-by">
                                      RSVP submitted by{" "}
                                      {attendeeRsvp.guest_name}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}

        <div className="dashboard-create-another">
          <a className="secondary" href="/create/">
            + Create another event
          </a>
        </div>
      </section>
    </main>
  );
}
