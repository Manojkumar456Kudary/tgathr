
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/components/supabase";

const examples = [
  { emoji: "🥂", type: "DINNER PARTY", title: "Friday night, good people", date: "FRI · 7:00 PM", color: "peach" },
  { emoji: "🎂", type: "BIRTHDAY", title: "Another trip around the sun", date: "SAT · 6:30 PM", color: "lavender" },
  { emoji: "🎲", type: "GAME NIGHT", title: "Cards, snacks & chaos", date: "SUN · 5:00 PM", color: "mint" }
];

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    async function checkSession() {
      const { data } = await supabase!.auth.getSession();
      setLoggedIn(!!data.session);
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main>
      <nav className="nav wrap">
        <Link className="brand" href="/">
          t<span>g</span>athr<span className="dot">.</span>
        </Link>

        <a className="nav-link" href="#how">How it works</a>

        {!checkingSession && loggedIn && (
          <Link className="nav-link" href="/dashboard/">
            My Dashboard
          </Link>
        )}

        {!checkingSession && !loggedIn && (
          <Link className="nav-link" href="/login/">
            Sign In
          </Link>
        )}

        <Link className="nav-cta" href="/create/">
          Create an event <span>↗</span>
        </Link>
      </nav>

      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="spark">✳</span> GOOD THINGS HAPPEN TOGETHER
          </div>

          <h1>
            Make plans.<br />
            <em>Make memories.</em>
          </h1>

          <p className="lead">
            The easiest way to bring your favorite people together.
            Create an invite, share the link, and let the good times happen.
          </p>

          <div className="hero-actions">
            <Link className="primary" href="/create/">
              Create your event <span>↗</span>
            </Link>

            {loggedIn ? (
              <Link className="secondary" href="/dashboard/">
                My Dashboard →
              </Link>
            ) : (
              <a className="secondary" href="#how">
                See how it works ↓
              </a>
            )}
          </div>

          <div className="social-proof">
            <div className="avatars">
              <i>J</i><i>M</i><i>A</i><i>+</i>
            </div>
            <span>Less group chat. More get-togethers.</span>
          </div>
        </div>

        <div className="hero-art">
          <div className="sun"></div>
          <div className="note note-back">
            <small>YOU'RE INVITED</small>
            <strong>Good times<br />ahead ✨</strong>
            <span>Save the date</span>
          </div>
          <div className="note note-front">
            <div className="note-top">
              <span>✳ TGATHR</span>
              <span>№ 001</span>
            </div>
            <div className="note-emoji">🍊</div>
            <small>LET'S GET TOGETHER</small>
            <h2>
              A little<br />something<br /><em>special.</em>
            </h2>
            <div className="note-bottom">
              <span>GOOD PEOPLE · GOOD VIBES</span>
              <span>↗</span>
            </div>
          </div>
          <div className="scribble">
            the more<br />the merrier!
          </div>
        </div>
      </section>

      <section className="examples wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">A REASON TO GET TOGETHER</div>
            <h2>Whatever the occasion.</h2>
          </div>
          <p>
            Big milestones, little moments,<br />
            and everything in between.
          </p>
        </div>

        <div className="event-grid">
          {examples.map((e) => (
            <article className={`event-card ${e.color}`} key={e.title}>
              <div className="event-emoji">{e.emoji}</div>
              <div className="event-type">{e.type}</div>
              <h3>{e.title}</h3>
              <div className="event-date">{e.date}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="how wrap" id="how">
        <div className="eyebrow">THREE LITTLE STEPS</div>
        <h2>Plans made <em>simple.</em></h2>

        <div className="steps">
          <div>
            <b>01</b>
            <h3>Create</h3>
            <p>Add the details and give your gathering a little personality.</p>
          </div>
          <div>
            <b>02</b>
            <h3>Share</h3>
            <p>Send one link to your group chat. No app download needed.</p>
          </div>
          <div>
            <b>03</b>
            <h3>Celebrate</h3>
            <p>See who's coming and spend less time coordinating.</p>
          </div>
        </div>

        <Link className="primary" href="/create/">
          Let's make a plan <span>↗</span>
        </Link>
      </section>

      <footer className="footer wrap">
        <Link className="brand" href="/">
          tgathr<span className="dot">.</span>
        </Link>
        <span>Bring your people together.</span>
        <span>Made for getting together ♥</span>
      </footer>
    </main>
  );
}
