import ProjectCard, { type Project } from "@/components/ui/ProjectCard";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/api/projects`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Projects | Simpson Software",
  description:
    "Full-stack web applications and APIs built by Philip Simpson.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  const featuredCount = projects.filter((p) => p.isFeatured).length;

  return (
    <main className="bg-background min-h-screen">
      {/* Page header */}
      <section className="pt-28 pb-14 section-container">
        <div className="space-y-4 max-w-2xl">
          <p className="text-neon-cyan/70 text-sm uppercase tracking-widest font-medium">
            Portfolio
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            My{" "}
            <span className="text-gradient-hero">Projects</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            A collection of web applications, APIs, and tools I&apos;ve built.
            {featuredCount > 0 && (
              <span className="block mt-1 text-base text-white/35">
                {featuredCount} featured &middot; {projects.length} total
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="section-container pb-28">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="section-container pb-28">
        <div className="glass rounded-2xl p-8 sm:p-12 text-center space-y-5 border-t-2 border-t-neon-purple/40">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to build something great?
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Whether you need a new web app, API, or want to level up an
            existing codebase &mdash; let&apos;s talk.
          </p>
          <Link
            href="/book"
            className="inline-block btn-glow-cyan text-lg px-8 py-4"
          >
            Book a Free Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-2">
        <svg
          className="w-7 h-7 text-white/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
          />
        </svg>
      </div>
      <p className="text-white/40 text-lg font-medium">No projects yet</p>
      <p className="text-white/25 text-sm">Check back soon.</p>
    </div>
  );
}
