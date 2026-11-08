"use client";
import { useState } from "react";
import { supabase } from "./supabase";

export default function CreateEvent() {
  const [title,setTitle]=useState(""); const [date,setDate]=useState(""); const [time,setTime]=useState("18:00"); const [location,setLocation]=useState(""); const [host,setHost]=useState(""); const [description,setDescription]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMessage("");
    if (!supabase) { setMessage("Connect your Supabase project first by adding the two NEXT_PUBLIC_SUPABASE environment variables in Cloudflare."); return; }
    setBusy(true);
    const slug = `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,35)}-${Math.random().toString(36).slice(2,7)}`;
    const { error } = await supabase.from("events").insert({ title, slug, event_date: date, event_time: time, location, host_name: host, description }).select().single();
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage(`Event created! Share this link: ${window.location.origin}/event/?slug=${encodeURIComponent(slug)}`);
  }
  return <section className="form-shell"><div className="eyebrow">LET'S GET EVERYONE TOGETHER</div><h1>Create your <em>event.</em></h1><p className="form-intro">A few details, one shareable link, and you're all set.</p><form onSubmit={submit}>
    <label>What's the occasion?<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Birthday dinner"/></label>
    <div className="two"><label>Date<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time<input required type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div>
    <label>Where is it?<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address or venue"/></label>
    <label>Your name<input required value={host} onChange={e=>setHost(e.target.value)} placeholder="Host name"/></label>
    <label>A little more info<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should guests know?"/></label>
    <button className="primary" disabled={busy}>{busy?"Creating…":"Create event ↗"}</button>
    {message && <p className="notice">{message}</p>}
  </form></section>;
}
