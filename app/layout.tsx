import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project LOOP - AI Customer-Feedback Intelligence Platform",
  description: "Ingest multi-channel feedback, classify sentiment, cluster themes, and answer grounded questions with Claude AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
