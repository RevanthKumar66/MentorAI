import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MentorAI OS - Production-Grade AI Learning Platform",
  description: "AI-powered platform to learn skills, prepare for interviews, master DSA, and analyze datasets.",
  icons: {
    icon: [
      { url: "/mentorai-favicon-white.ico", sizes: "any" },
      { url: "/mentorai-favicon-white.svg", type: "image/svg+xml" },
    ],
    shortcut: "/mentorai-favicon-white.ico",
    apple: "/mentorai-favicon-white.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
