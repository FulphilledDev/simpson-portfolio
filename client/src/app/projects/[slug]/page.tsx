import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { Project } from "@/components/ui/ProjectCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ProjectDetail extends Project {
  longDescription?: string | null;
  gifDemoUrl?: string | null;
}

async function getProject(slug: string): Promise<ProjectDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/projects/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found | PhitDev" };
  return {
    title: `${project.title} | PhitDev`,
    description: project.shortDescription,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  const hasGif = !!project.gifDemoUrl;
  const hasThumbnail = !!project.thumbnailUrl;
  const hasLongDescription = !!project.longDescription?.trim();

  return (
    <main className="bg-background min-h-screen">
      {/* Back nav */}
      <div className="section-container pt-24 pb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-white/40 hover:text-neon-cyan transition-colors duration-200 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          All Projects
        </Link>
      </div>

      {/* Hero image / placeholder */}
      <div className="section-container pb-10">
        <div className="relative w-full rounded-2xl overflow-hidden aspect-video max-h-[520px]">
          {hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/5 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                <svg
                  className="w-9 h-9 text-white/20"
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
            </div>
          )}
          {/* bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <section className="section-container pb-16">
        <div className="max-w-3xl space-y-8">
          {/* Title row */}
          <div className="space-y-3">
            {project.isFeatured && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                Featured Project
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {project.title}
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              {project.shortDescription}
            </p>
          </div>

          {/* External links */}
          {(project.liveUrl || project.gitHubUrl) && (
            <div className="flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glow-cyan inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Live Demo
                </a>
              )}
              {project.gitHubUrl && (
                <a
                  href={project.gitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-cyan inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                  </svg>
                  View on GitHub
                </a>
              )}
            </div>
          )}

          {/* Tech stack */}
          {project.techStack.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-sm px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Long description */}
          {hasLongDescription && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
                About this project
              </h2>
              <div className="prose prose-invert max-w-none text-white/60 leading-relaxed whitespace-pre-wrap">
                {project.longDescription}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* GIF demo */}
      {hasGif && (
        <section className="section-container pb-16">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
              Demo walkthrough
            </h2>
            <div className="glass rounded-2xl overflow-hidden border-t-2 border-t-neon-purple/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.gifDemoUrl!}
                alt={`${project.title} demo`}
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-container pb-28">
        <div className="glass rounded-2xl p-8 sm:p-12 text-center space-y-5 border-t-2 border-t-neon-purple/40">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Interested in working together?
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Let&apos;s discuss your project and see how I can help you build something great.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/book" className="inline-block btn-glow-cyan text-lg px-8 py-4">
              Book a Consultation
            </Link>
            <Link href="/projects" className="inline-block btn-outline-cyan px-8 py-4">
              ← Back to Projects
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
