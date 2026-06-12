import HeroScene from "@/components/ui/HeroScene";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-background min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroScene />
        <div className="absolute inset-0 bg-hero pointer-events-none" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-neon-cyan/70 text-sm uppercase tracking-widest font-medium">
              Full-Stack Developer
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Hi, I&apos;m </span>
              <span className="text-gradient-hero">Phillip</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              I build clean, scalable web applications with .NET, Angular, and React.
              Available for consulting and project work.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/projects">
              <GlowButton variant="cyan" size="lg">View Projects</GlowButton>
            </Link>
            <Link href="/book">
              <GlowButton variant="outline-cyan" size="lg">Book a Consultation</GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section-container py-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Featured Work</h2>
          <p className="text-white/50 max-w-xl mx-auto">A selection of projects I&apos;ve built recently.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} hoverable accent="cyan" className="space-y-4 animate-pulse">
              <div className="w-full aspect-video bg-white/5 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="text-center">
          <Link href="/projects"><GlowButton variant="outline-cyan">All Projects →</GlowButton></Link>
        </div>
      </section>

      {/* CTA */}
      <section className="section-container py-24">
        <GlassCard accent="purple" padding="lg" className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to build something great?</h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Whether you need a new web app, API, or want to level up an existing codebase — let&apos;s talk.
          </p>
          <Link href="/book"><GlowButton variant="purple" size="lg">Schedule a Free Consultation</GlowButton></Link>
        </GlassCard>
      </section>
    </main>
  );
}
