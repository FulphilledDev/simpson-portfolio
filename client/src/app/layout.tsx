import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Philip Simpson — Software Engineer",
  description:
    "Portfolio of Philip Simpson, a software engineer specializing in .NET, Angular, and React. Available for consulting and project work.",
  keywords: ["full-stack developer", "software engineer", "Angular", ".NET", "React", "freelance", "Philip Simpson"],
  openGraph: {
    title: "Philip Simpson — Software Engineer",
    description: "Software engineer specializing in .NET, Angular, and React.",
    url: "https://simpsonsoftware.site",
    siteName: "Philip Simpson Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Philip Simpson — Software Engineer",
    description: "Software engineer specializing in .NET, Angular, and React.",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json() as Promise<{ companyName: string; companyLogoUrl?: string | null }>;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Navbar
          companyName={settings?.companyName ?? "Simpson Software"}
          companyLogoUrl={settings?.companyLogoUrl}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
