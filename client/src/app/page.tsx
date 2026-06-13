import Link from "next/link";
import HeroScene from "@/components/ui/HeroScene";
import GlassCard from "@/components/ui/GlassCard";
import GlowLink from "@/components/ui/GlowLink";
import ProjectCard, { Project } from "@/components/ui/ProjectCard";
import ReviewsSlider from "@/components/ui/ReviewsSlider";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

interface AdminSettings {
  ownerName: string;
  ownerTitle: string;
  bio: string;
  profilePhotoUrl?: string;
  skills?: string[];
  linkedInUrl?: string;
  gitHubUrl?: string;
  twitterUrl?: string;
  resumeUrl?: string;
}

async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/api/projects?featuredOnly=true`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    const res = await fetch(`${API_URL}/api/settings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PublishedReview {
  id: number;
  contactName: string;
  contactCompany: string | null;
  projectTitle: string | null;
  prosContent: string;
  rating: number;
}

async function getPublishedReviews(): Promise<PublishedReview[]> {
  try {
    const res = await fetch(`${API_URL}/api/reviews`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const CORE_TRAITS = [
  {
    icon: "⚔️",
    label: "Relentless Growth",
    desc: "Every challenge is a training ground — adapt, level up, repeat.",
  },
  {
    icon: "🎯",
    label: "High Impact",
    desc: "Focused on delivering maximum value, not just shipping code.",
  },
  {
    icon: "🔧",
    label: "Full-Stack Versatility",
    desc: "Backend APIs, cloud infra, modern frontends — battle-tested across the stack.",
  },
  {
    icon: "🧠",
    label: "Systems Thinker",
    desc: "Clean architecture and scalable design baked in from day one.",
  },
];

export default async function HomePage() {
  const [projects, settings, reviews] = await Promise.all([
    getFeaturedProjects(),
    getAdminSettings(),
    getPublishedReviews(),
  ]);

  const ownerName = settings?.ownerName ?? "Philip Simpson";
  const [firstName, ...rest] = ownerName.split(" ");
  const lastName = rest.join(" ");
  const ownerTitle = settings?.ownerTitle ?? "Full-Stack Developer";
  const bio =
    settings?.bio ||
    "I build clean, scalable systems that solve real problems. Specializing in .NET, React, and modern cloud architecture — I bring the same relentless discipline to code that others bring to elite training. No shortcuts. No excuses. Just results.";
  const profilePhotoUrl = settings?.profilePhotoUrl;
  const skills = settings?.skills ?? [];

  return (
    <main className="bg-background min-h-screen">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroScene />
        <div className="absolute inset-0 bg-hero pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-10 pt-20">

          {/* Profile photo orb */}
          <div className="flex justify-center">
            <div className="relative group">
              {/* Animated glow rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-cyan/25 to-neon-purple/25 blur-2xl scale-[1.6] animate-pulse-glow" />
              <div className="absolute inset-0 rounded-full border border-neon-cyan/20 scale-[1.2] animate-float" />

              {/* Photo frame */}
              <div
                className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-neon-cyan/50 transition-all duration-500 group-hover:border-neon-cyan/80"
                style={{ boxShadow: "0 0 48px rgba(0,245,255,0.25), 0 0 96px rgba(191,0,255,0.1)" }}
              >
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt={ownerName}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-cyan/[0.15] to-neon-purple/[0.15] flex items-center justify-center">
                    <span className="text-5xl font-bold text-gradient-hero select-none">
                      {firstName[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Status dot */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/90 border border-neon-cyan/30 rounded-full px-3 py-1 backdrop-blur-sm whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                <span className="text-xs text-neon-cyan/80 font-medium tracking-wide">Available for work</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-5">
            <p className="text-neon-cyan/60 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium">
              {ownerTitle}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-none tracking-tight">
              <span className="text-white">{firstName} </span>
              <span className="text-gradient-hero">{lastName}</span>
            </h1>
            <p className="text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {bio}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap gap-4 justify-center">
              <GlowLink href="/projects" variant="cyan" size="lg">View My Work</GlowLink>
              <GlowLink href="/book" variant="outline-cyan" size="lg">Book a Consultation</GlowLink>
            </div>
            {settings?.resumeUrl && (
              <GlowLink href={settings.resumeUrl} variant="ghost" size="sm" external className="text-white/40 hover:text-white/70">
                View My Resume ↗
              </GlowLink>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-gradient-to-b from-neon-cyan/60 to-transparent" />
          <span className="text-[10px] text-white/50 uppercase tracking-widest">scroll</span>
        </div>
      </section>

      {/* ── About Me ── */}
      <section className="section-container py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Photo column */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative">
              {/* Background glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-neon-cyan/8 to-neon-purple/8 rounded-3xl blur-3xl" />

              {/* Main photo card */}
              <div
                className="relative w-64 sm:w-80 aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.08]"
                style={{ boxShadow: "0 0 60px rgba(0,245,255,0.08), 0 24px 48px rgba(0,0,0,0.5)" }}
              >
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt={ownerName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-cyan/[0.06] to-neon-purple/[0.06] flex flex-col items-center justify-center gap-4 p-8">
                    <div
                      className="w-24 h-24 rounded-full border border-neon-cyan/30 flex items-center justify-center"
                      style={{ background: "radial-gradient(circle, rgba(0,245,255,0.1), transparent)" }}
                    >
                      <span className="text-4xl font-bold text-gradient-hero">{firstName[0]}</span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-white/20 text-xs">Add a profile photo in</p>
                      <p className="text-neon-cyan/40 text-xs font-medium">Admin → Settings</p>
                    </div>
                  </div>
                )}
                {/* Subtle overlay gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
              </div>

              {/* Floating badge: availability */}
              <div className="absolute -bottom-4 -right-4 glass rounded-xl p-3 border border-neon-purple/20 shadow-glow-purple/10">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Open for</p>
                <p className="text-sm font-semibold text-neon-purple">Contract &amp; Full-Time</p>
              </div>

              {/* Floating badge: experience */}
              <div className="absolute -top-4 -left-4 glass rounded-xl p-3 border border-neon-cyan/20">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Full-Stack</p>
                <p className="text-sm font-semibold text-neon-cyan">.NET + React</p>
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-neon-cyan/60 text-xs uppercase tracking-[0.2em] font-medium">About Me</p>
                <div className="flex items-center gap-2">
                  {settings?.linkedInUrl && (
                    <a href={settings.linkedInUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                      className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/[0.08] text-white/35 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all duration-200">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {settings?.gitHubUrl && (
                    <a href={settings.gitHubUrl} target="_blank" rel="noopener noreferrer" title="GitHub"
                      className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/[0.08] text-white/35 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all duration-200">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {settings?.resumeUrl && (
                    <a href={settings.resumeUrl} target="_blank" rel="noopener noreferrer" title="View Resume"
                      className="w-8 h-8 glass rounded-full flex items-center justify-center border border-white/[0.08] text-white/35 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all duration-200">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
                Forged in <span className="text-gradient-hero">Challenge</span>.{" "}
                <span className="text-white/80">Built for Results.</span>
              </h2>
            </div>

            <p className="text-white/60 leading-relaxed text-base sm:text-lg">{bio}</p>

            {/* Core traits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CORE_TRAITS.map((trait) => (
                <div
                  key={trait.label}
                  className="glass rounded-xl p-4 border-l-2 border-neon-cyan/30 space-y-1.5 hover:border-neon-cyan/60 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{trait.icon}</span>
                    <span className="text-sm font-semibold text-white/90">{trait.label}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{trait.desc}</p>
                </div>
              ))}
            </div>

            {/* Action links */}
            <div>
              <GlowLink href="/book" variant="cyan">Work With Me</GlowLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills / Arsenal ── */}
      {skills.length > 0 && (
        <section className="section-container py-16">
          <div className="text-center space-y-3 mb-10">
            <p className="text-neon-cyan/60 text-xs uppercase tracking-[0.2em] font-medium">Arsenal</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Tech &amp; Tools</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              The weapons I reach for when building serious systems.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {skills.map((skill) => (
              <span
                key={skill}
                className="glass rounded-full px-4 py-2 text-sm font-medium text-white/65 border border-neon-cyan/10 hover:border-neon-cyan/40 hover:text-neon-cyan transition-all duration-200 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Work ── */}
      <section className="section-container py-28 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-neon-cyan/60 text-xs uppercase tracking-[0.2em] font-medium">Portfolio</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Featured Work</h2>
          <p className="text-white/40 max-w-xl mx-auto">
            A selection of projects built with intent, precision, and real-world impact.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <p className="col-span-3 text-center text-white/25 py-16 text-sm">No featured projects yet.</p>
          )}
        </div>
        <div className="text-center">
          <GlowLink href="/projects" variant="outline-cyan">View All Projects →</GlowLink>
        </div>
      </section>

      {/* ── Client Reviews ── */}
      {reviews.length > 0 && (
        <section className="section-container py-28 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-neon-cyan/60 text-xs uppercase tracking-[0.2em] font-medium">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">What Clients Say</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Real feedback from real projects.
            </p>
          </div>

          <ReviewsSlider reviews={reviews} />
        </section>
      )}

      {/* ── CTA ── */}
      <section className="section-container py-24">
        <GlassCard accent="purple" padding="lg" className="relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-cyan/5 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-6">
            <p className="text-neon-purple/70 text-xs uppercase tracking-[0.2em] font-medium">Let&apos;s Build</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Forge <span className="text-gradient-hero">Something Great?</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              Whether you need a new web application, a resilient API, or someone who will go to war for your codebase — I bring intensity, clarity, and craftsmanship to every engagement.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <GlowLink href="/book" variant="purple" size="lg">Schedule a Free Consultation</GlowLink>
              <GlowLink href="/projects" variant="ghost" size="lg">See My Work →</GlowLink>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center">
        <p className="text-white/10 text-xs tracking-widest">
          © {new Date().getFullYear()} Simpson Software. All rights reserved.
          <Link
            href="/admin/login"
            className="ml-2 px-3 py-2 text-white/[0.15] hover:text-white/50 transition-colors duration-300 select-none"
            aria-hidden="true"
            tabIndex={-1}
          >·</Link>
        </p>
      </footer>

    </main>
  );
}
