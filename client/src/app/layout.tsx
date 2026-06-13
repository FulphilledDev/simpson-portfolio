import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
