import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Compiler",
  description: "AI Compiler for Software Generation MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
