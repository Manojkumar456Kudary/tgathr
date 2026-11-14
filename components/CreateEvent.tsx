
"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";

type QuestionDraft = {
  id: string;
  text: string;
  type: "single_choice" | "multiple_choice";
  required: boolean;
  options: string[];
};

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [host, setHost] = useState("");
  const [description, setDescription] = useState("");

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [copied, setCopied] = useState(false);

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text: "",
        type: "single_choice",
        required: false,
        options: ["", ""],
      },
    ]);
  }

  function updateQuestion(
    id: string,
    changes: Partial<QuestionDraft>
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...changes } : question
      )
    );
  }

  function removeQuestion(id: string) {
    setQuestions((current) =>
      current.filter((question) => question.id !== id)
    );
  }

  function updateOption(
    questionId: string,
    optionIndex: number,
    value: string
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;

        const options = [...question.options];
        options[optionIndex] = value;

        return { ...question, options };
      })
    );
  }

  function addOption(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, ""] }
          : question
      )
    );
  }

  function removeOption(questionId: string, optionIndex: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        if (question.options.length <= 2) return question;

        return {
          ...question,
          options: question.options.filter(
            (_, index) => index !== optionIndex
          ),
        };
      })
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setCopied(false);

    if (!supabase) {
      setMessage(
        "Event service is not connected. Please check your Cloudflare environment variables."
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login/";
      return;
    }

    // Validate custom questions before creating the event.
    const preparedQuestions: QuestionDraft[] = [];

    for (const question of questions) {
      const questionText = question.text.trim();

      if (!questionText) {
        setMessage("Please enter text for every custom question.");
        return;
      }

      const options = question.options
        .map((option) => option.trim())
        .filter(Boolean);

      if (options.length < 2) {
        setMessage(
          `Please provide at least two options for "${questionText}".`
        );
        return;
      }

      if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
        setMessage(
          `Please remove duplicate options from "${questionText}".`
        );
        return;
      }

      preparedQuestions.push({
        ...question,
        text: questionText,
        options,
      });
    }

    setBusy(true);

    const slug = `${title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 35)}-${Math.random().toString(36).slice(2, 7)}`;

    // Create the event first.
    const { data: eventData, error: eventError } = await supabase
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
      })
      .select("id")
      .single();

    if (eventError || !eventData) {
      setBusy(false);
      setMessage(eventError?.message || "Unable to create the event.");
      return;
    }

    // Save each custom question and its options.
    for (let index = 0; index < preparedQuestions.length; index++) {
      const question = preparedQuestions[index];

      const { data: questionData, error: questionError } = await supabase
        .from("event_questions")
        .insert({
          event_id: eventData.id,
          question_text: question.text,
          question_type: question.type,
          is_required: question.required,
          position: index,
        })
        .select("id")
        .single();

      if (questionError || !questionData) {
        setBusy(false);
        setMessage(
          `Your event was created, but a custom question could not be saved: ${
            questionError?.message || "Unknown error"
          }. Please contact support before sharing the invitation.`
        );
        return;
      }

      const optionRows = question.options.map((option, optionIndex) => ({
        question_id: questionData.id,
        option_text: option,
        position: optionIndex,
      }));

      const { error: optionError } = await supabase
        .from("event_question_options")
        .insert(optionRows);

      if (optionError) {
        setBusy(false);
        setMessage(
          `Your event was created, but its answer options could not be saved: ${optionError.message}. Please contact support before sharing the invitation.`
        );
        return;
      }
    }

    const link = `${window.location.origin}/event/?slug=${encodeURIComponent(
      slug
    )}`;

    setEventLink(link);
    setBusy(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventLink);
      setCopied(true);
    } catch {
      setMessage(
        "Unable to copy automatically. Please select and copy the link."
      );
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

        <a className="primary" href="/dashboard/">
          Go to My Dashboard →
        </a>

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

        <div className="invite-details">
          <h2>Custom RSVP Questions</h2>

          <p className="form-intro">
            Ask your guests anything you need to know. Each attendee will
            answer these questions individually.
          </p>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="invite-details"
            >
              <h3>Question {index + 1}</h3>

              <label>
                Question
                <input
                  required
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      text: e.target.value,
                    })
                  }
                  placeholder="e.g. Food Preference"
                />
              </label>

              <label>
                Answer type
                <select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      type: e.target.value as QuestionDraft["type"],
                    })
                  }
                >
                  <option value="single_choice">Single choice</option>
                  <option value="multiple_choice">Multiple choice</option>
                </select>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      required: e.target.checked,
                    })
                  }
                />
                Required question
              </label>

              <p><strong>Answer options</strong></p>

              {question.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    required
                    value={option}
                    onChange={(e) =>
                      updateOption(
                        question.id,
                        optionIndex,
                        e.target.value
                      )
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                  />

                  {question.options.length > 2 && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        removeOption(question.id, optionIndex)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="secondary"
                onClick={() => addOption(question.id)}
              >
                + Add another option
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => removeQuestion(question.id)}
              >
                Remove this question
              </button>
            </div>
          ))}

          <button
            type="button"
            className="secondary"
            onClick={addQuestion}
          >
            + Add custom question
          </button>
        </div>

        <button className="primary" disabled={busy}>
          {busy ? "Creating..." : "Create event ↗"}
        </button>

        {message && <p className="notice">{message}</p>}
      </form>
    </section>
  );
}
