
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

  function updateQuestion(id: string, changes: Partial<QuestionDraft>) {
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

      if (
        new Set(options.map((option) => option.toLowerCase())).size !==
        options.length
      ) {
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

        <button type="button" className="primary" onClick={copyLink}>
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

        <div className="question-builder">
          <div className="question-builder-header">
            <span className="eyebrow">MAKE IT PERSONAL</span>
            <h2>Guest questionnaire</h2>
            <p>
              Collect the details you need from your guests when they RSVP.
              Each attendee answers individually.
            </p>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-card-top">
                <span className="question-number">
                  QUESTION {String(index + 1).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  className="question-remove-icon"
                  onClick={() => removeQuestion(question.id)}
                  aria-label="Remove question"
                  title="Remove question"
                >
                  ×
                </button>
              </div>

              <label className="question-field-label">
                Your question
                <input
                  required
                  className="question-text-input"
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      text: e.target.value,
                    })
                  }
                  placeholder="e.g. What food do you prefer?"
                />
              </label>

              <div className="question-settings">
                <label className="question-field-label">
                  Answer format
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

                <div className="question-field-label">
                  Guest response
                  <div className="requirement-pills">
                    <button
                      type="button"
                      className={`requirement-pill ${
                        question.required ? "active" : ""
                      }`}
                      aria-pressed={question.required}
                      onClick={() =>
                        updateQuestion(question.id, { required: true })
                      }
                    >
                      Required
                    </button>

                    <button
                      type="button"
                      className={`requirement-pill ${
                        !question.required ? "active" : ""
                      }`}
                      aria-pressed={!question.required}
                      onClick={() =>
                        updateQuestion(question.id, { required: false })
                      }
                    >
                      Optional
                    </button>
                  </div>
                </div>
              </div>

              <div className="question-options-section">
                <div className="question-options-heading">
                  <span>Answer options</span>
                  <span>{question.options.length} options</span>
                </div>

                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="question-option-row">
                    <span className="question-option-dot" />

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
                        className="question-option-remove"
                        onClick={() =>
                          removeOption(question.id, optionIndex)
                        }
                        aria-label={`Remove option ${optionIndex + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="question-add-option"
                  onClick={() => addOption(question.id)}
                >
                  + Add another option
                </button>
              </div>

              <div className="question-card-footer">
                <span>
                  {question.required
                    ? "Guests must answer this question"
                    : "Guests can skip this question"}
                </span>

                <button
                  type="button"
                  className="question-remove-text"
                  onClick={() => removeQuestion(question.id)}
                >
                  Remove question
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="question-add-main"
            onClick={addQuestion}
          >
            <span className="question-add-symbol">+</span>
            <span>
              <strong>Add a question</strong>
              <small>Create another question for your guests</small>
            </span>
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
