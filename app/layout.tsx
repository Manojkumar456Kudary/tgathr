import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGathr — Bring your people together",
  description: "Create events, invite your people, and celebrate together."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
