
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

      const user = session.user;

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
      .filter(Boolean);
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
          <p>People attending: <strong>{attendingPeople}</strong></p>
          <p>Yes responses: <strong>{totalYes}</strong></p>
          <p>Maybe responses: <strong>{totalMaybe}</strong></p>
          <p>No responses: <strong>{totalNo}</strong></p>
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

            const eventQuestions = questions.filter(
              (question) => question.event_id === event.id
            );

            const invitationLink =
              `${window.location.origin}/event/?slug=${encodeURIComponent(event.slug)}`;

            const yesRsvpIds = new Set(yes.map((rsvp) => rsvp.id));

            const attendingAttendees = attendees.filter((attendee) =>
              yesRsvpIds.has(attendee.rsvp_id)
            );

            return (
              <div className="invite-details" key={event.id}>
                <h2>{event.title}</h2>

                <p>📅 {event.event_date} · {event.event_time}</p>

                {event.location && <p>📍 {event.location}</p>}

                <div className="invite-details">
                  <p>
                    <strong>People attending</strong>
                  </p>
                  <h2>{people}</h2>

                  <p>
                    Yes: <strong>{yes.length}</strong>
                    {" · "}
                    Maybe: <strong>{maybe.length}</strong>
                    {" · "}
                    No: <strong>{no.length}</strong>
                  </p>
                </div>

                <label>Invitation link</label>
                <input
                  readOnly
                  value={invitationLink}
                  onFocus={(e) => e.currentTarget.select()}
                />

                <h3>Attending guests</h3>

                {yes.length === 0 ? (
                  <p>No confirmed attendees yet.</p>
                ) : (
                  yes.map((rsvp) => {
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
                      <div key={rsvp.id}>
                        <p>
                          <strong>{rsvp.guest_name}</strong>
                          {extraCount > 0 && (
                            <strong> +{extraCount}</strong>
                          )}
                        </p>

                        {additionalNames.length > 0 && (
                          <p>
                            Also attending:{" "}
                            {additionalNames
                              .map((attendee) => attendee.attendee_name)
                              .join(", ")}
                          </p>
                        )}

                        {group.length === 0 && extraCount > 0 && (
                          <p>
                            <em>
                              Individual guest names are not available for
                              this older RSVP.
                            </em>
                          </p>
                        )}
                      </div>
                    );
                  })
                )}

                <details className="detailed-report">
                  <summary>
                    <strong>View detailed report</strong>
                  </summary>

                  <div>
                    <h3>RSVP summary</h3>

                    <p>
                      Yes: <strong>{yes.length}</strong>
                    </p>
                    <p>
                      Maybe: <strong>{maybe.length}</strong>
                    </p>
                    <p>
                      No: <strong>{no.length}</strong>
                    </p>
                    <p>
                      Total confirmed attendees: <strong>{people}</strong>
                    </p>

                    <h3>Individual attendee answers</h3>

                    {attendingAttendees.length === 0 ? (
                      <p>
                        Individual attendee details are not available for
                        these responses.
                      </p>
                    ) : (
                      attendingAttendees.map((attendee) => {
                        const attendeeRsvp = yes.find(
                          (rsvp) => rsvp.id === attendee.rsvp_id
                        );

                        return (
                          <div key={attendee.id}>
                            <h4>{attendee.attendee_name}</h4>

                            {eventQuestions.length === 0 ? (
                              <p>No custom questions for this event.</p>
                            ) : (
                              eventQuestions.map((question) => {
                                const attendeeAnswers = getAttendeeAnswers(
                                  attendee.id,
                                  question.id
                                );

                                return (
                                  <p key={question.id}>
                                    {question.question_text}:{" "}
                                    <strong>
                                      {attendeeAnswers.length > 0
                                        ? attendeeAnswers.join(", ")
                                        : "No answer"}
                                    </strong>
                                  </p>
                                );
                              })
                            )}

                            {attendeeRsvp && (
                              <p>
                                <em>
                                  RSVP submitted by {attendeeRsvp.guest_name}
                                </em>
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}

                    {eventQuestions.length > 0 && (
                      <>
                        <h3>Custom question totals</h3>

                        {eventQuestions.map((question) => {
                          const questionOptions = options.filter(
                            (option) => option.question_id === question.id
                          );

                          const attendingIds = new Set(
                            attendingAttendees.map((attendee) => attendee.id)
                          );

                          return (
                            <div key={question.id}>
                              <h4>{question.question_text}</h4>

                              <p>
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

                                return (
                                  <p key={option.id}>
                                    {option.option_text}:{" "}
                                    <strong>{count}</strong>
                                  </p>
                                );
                              })}

                              <p>
                                <em>
                                  Counts include confirmed attendees who
                                  selected each option.
                                  For multiple-choice questions, one person
                                  can contribute to more than one option.
                                </em>
                              </p>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </details>
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
