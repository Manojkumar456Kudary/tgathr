
"use client";

import { useEffect, useState } from "react";
import EventDetails from "@/components/EventDetails";

export default function EventPage() {
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSlug(params.get("slug") || "");
  }, []);

  return (
    <main className="subpage">
      <header className="nav wrap">
        <a className="brand" href="/">
          tgathr<span className="dot">.</span>
        </a>
        <a className="nav-link" href="/">
          Home
        </a>
      </header>

      {slug ? (
        <EventDetails slug={slug} />
      ) : (
        <section className="invite">
          <h1>Invitation not found</h1>
          <p>Please check the event link.</p>
        </section>
      )}
    </main>
  );
}
