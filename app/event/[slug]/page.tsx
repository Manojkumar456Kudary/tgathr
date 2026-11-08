import EventDetails from "@/components/EventDetails";
export const dynamicParams = false;
export function generateStaticParams() { return [{ slug: "demo" }]; }
export default function EventPage({ params }: { params: { slug: string } }) { return <main className="subpage"><header className="nav wrap"><a className="brand" href="/">tgathr<span className="dot">.</span></a><a className="nav-link" href="/">Home</a></header><EventDetails slug={params.slug} /></main>; }
