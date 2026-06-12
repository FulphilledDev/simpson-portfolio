import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "Philip Simpson — Full-Stack Developer",
  description:
    "Portfolio of Philip Simpson, a full-stack developer specializing in .NET, Angular, and React. Available for consulting and project work.",
  keywords: ["full-stack developer", "Angular", ".NET", "React", "freelance", "Philip Simpson"],
  openGraph: {
    title: "Philip Simpson — Full-Stack Developer",
    description: "Full-stack developer specializing in .NET, Angular, and React.",
    url: "https://phitdev.vercel.app",
    siteName: "PhitDev Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Philip Simpson — Full-Stack Developer",
    description: "Full-stack developer specializing in .NET, Angular, and React.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
