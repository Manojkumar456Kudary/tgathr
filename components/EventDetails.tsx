
"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type QuestionOption = {
  id: string;
  option_text: string;
};

type EventQuestion = {
  id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice";
  is_required: boolean;
  options: QuestionOption[];
};

type Attendee = {
  id: string;
  name: string;
};

export default function EventDetails({ slug }: { slug: string }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: "attendee-1", name: "" },
  ]);
  const [answers, setAnswers] = useState<
    Record<string, Record<string, string[]>>
  >({});
  const [choice, setChoice] = useState("yes");
  const [status, setStatus] = useState("Loading invitation…");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (slug === "demo") {
        setStatus(
          "This is a sample invitation. Create your own event to publish a live invite."
        );
        return;
      }

      if (!supabase) {
        setStatus("The event service is not connected yet.");
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (eventError || !eventData) {
        setStatus("We couldn't find this event.");
        return;
      }

      setEvent(eventData as EventRecord);

      const { data: questionData, error: questionError } = await supabase
        .from("event_questions")
        .select("id, question_text, question_type, is_required, position")
        .eq("event_id", eventData.id)
        .order("position");

      if (questionError) {
        setStatus("Unable to load this event's RSVP questions.");
        return;
      }

      if (questionData && questionData.length > 0) {
        const questionIds = questionData.map((q) => q.id);

        const { data: optionData, error: optionError } = await supabase
          .from("event_question_options")
          .select("id, question_id, option_text, position")
          .in("question_id", questionIds)
          .order("position");

        if (optionError) {
          setStatus("Unable to load the RSVP answer options.");
          return;
        }

        const formattedQuestions: EventQuestion[] = questionData.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          options: (optionData || [])
            .filter((option) => option.question_id === q.id)
            .map((option) => ({
              id: option.id,
              option_text: option.option_text,
            })),
        }));

        setQuestions(formattedQuestions);
      }

      setStatus("");
    }

    loadEvent();
  }, [slug]);

  function updateAttendeeName(id: string, value: string) {
    setAttendees((current) =>
      current.map((attendee) =>
        attendee.id === id ? { ...attendee, name: value } : attendee
      )
    );
  }

  function addAttendee() {
    if (attendees.length >= 50) {
      setStatus("You can add up to 50 attendees.");
      return;
    }

    setStatus("");
    setAttendees((current) => [
      ...current,
      { id: crypto.randomUUID(), name: "" },
    ]);
  }

  function removeAttendee(id: string) {
    if (attendees.length <= 1) return;

    setAttendees((current) =>
      current.filter((attendee) => attendee.id !== id)
    );

    setAnswers((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  }

  function updateAnswer(
    attendeeId: string,
    questionId: string,
    optionId: string,
    multiple: boolean,
    checked: boolean
  ) {
    setAnswers((current) => {
      const attendeeAnswers = { ...(current[attendeeId] || {}) };
      const selected = attendeeAnswers[questionId] || [];

      if (multiple) {
        attendeeAnswers[questionId] = checked
          ? [...selected, optionId]
          : selected.filter((id) => id !== optionId);
      } else {
        attendeeAnswers[questionId] = [optionId];
      }

      return {
        ...current,
        [attendeeId]: attendeeAnswers,
      };
    });
  }

  async function rsvp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase || !event || busy) return;

    if (attendees.some((attendee) => !attendee.name.trim())) {
      setStatus("Please enter the name of every attendee.");
      return;
    }

    if (
      new Set(attendees.map((a) => a.name.trim().toLowerCase())).size !==
      attendees.length
    ) {
      setStatus("Please enter a unique name for each attendee.");
      return;
    }

    if (choice !== "no") {
      for (const attendee of attendees) {
        for (const question of questions) {
          const selected = answers[attendee.id]?.[question.id] || [];

          if (question.is_required && selected.length === 0) {
            setStatus(
              `Please answer "${question.question_text}" for ${attendee.name}.`
            );
            return;
          }

          if (
            question.question_type === "single_choice" &&
            selected.length > 1
          ) {
            setStatus(
              `Please select only one answer for "${question.question_text}".`
            );
            return;
          }
        }
      }
    }

    setBusy(true);
    setStatus("");

    // Prepare each attendee and their individual answers.
    const attendeePayload = attendees.map((attendee) => ({
      name: attendee.name.trim(),
      answers:
        choice === "no"
          ? []
          : questions.map((question) => ({
              question_id: question.id,
              option_ids: answers[attendee.id]?.[question.id] || [],
            })),
    }));

    // Submit the entire RSVP through the secure database function.
    const { error } = await supabase.rpc("submit_event_rsvp", {
      p_event_id: event.id,
      p_guest_name: attendees[0].name.trim(),
      p_response: choice,
      p_attendees: attendeePayload,
    });

    setBusy(false);

    if (error) {
      setStatus(error.message || "Unable to save your RSVP. Please try again.");
      return;
    }

    setSaved(true);
    setStatus("");
  }

  return (
    <section className="invite">
      <div className="eyebrow">✳ YOU'RE INVITED</div>

      {event ? (
        <>
          <h1>{event.title}</h1>
          <p className="lead">Hosted by {event.host_name}</p>

          <div className="invite-details">
            <p>
              📅 {event.event_date} · {event.event_time}
            </p>
            {event.location && <p>📍 {event.location}</p>}
            {event.description && <p>{event.description}</p>}
          </div>

          {saved ? (
            <p className="notice">Thanks! Your RSVP is saved.</p>
          ) : (
            <form onSubmit={rsvp}>
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

              {choice !== "no" && (
                <div>
                  <h2>Who's attending?</h2>
                  <p className="lead">
                    Add everyone in your group. Each person can provide their
                    own answers below.
                  </p>

                  {attendees.map((attendee, index) => (
                    <div key={attendee.id} className="invite-details">
                      <label>
                        Attendee {index + 1} name
                        <input
                          required
                          value={attendee.name}
                          onChange={(e) =>
                            updateAttendeeName(attendee.id, e.target.value)
                          }
                          placeholder="Enter attendee name"
                        />
                      </label>

                      {questions.map((question) => (
                        <div key={question.id}>
                          <p>
                            <strong>{question.question_text}</strong>
                            {question.is_required ? " *" : " (Optional)"}
                          </p>

                          {question.options.map((option) => {
                            const selected =
                              answers[attendee.id]?.[question.id] || [];
                            const isChecked = selected.includes(option.id);
                            const multiple =
                              question.question_type === "multiple_choice";

                            return (
                              <label
                                key={option.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "8px",
                                }}
                              >
                                <input
                                  type={multiple ? "checkbox" : "radio"}
                                  name={`${attendee.id}-${question.id}`}
                                  checked={isChecked}
                                  onChange={(e) =>
                                    updateAnswer(
                                      attendee.id,
                                      question.id,
                                      option.id,
                                      multiple,
                                      e.target.checked
                                    )
                                  }
                                />
                                {option.option_text}
                              </label>
                            );
                          })}
                        </div>
                      ))}

                      {attendees.length > 1 && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeAttendee(attendee.id)}
                        >
                          Remove attendee
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="secondary"
                    onClick={addAttendee}
                  >
                    + Add another attendee
                  </button>
                </div>
              )}

              {choice === "no" && (
                <label>
                  Your name
                  <input
                    required
                    value={attendees[0].name}
                    onChange={(e) =>
                      updateAttendeeName(attendees[0].id, e.target.value)
                    }
                    placeholder="Enter your name"
                  />
                </label>
              )}

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

      <a href="/" className="secondary">
        ← Made with TGathr
      </a>
    </section>
  );
}
