import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { Project } from "@/components/ui/ProjectCard";
import { resolveAssetUrl } from "@/lib/api";
import ScreenshotsSlider from "@/components/ui/ScreenshotsSlider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

interface ProjectDetail extends Project {
  longDescription?: string | null;
  gifDemoUrl?: string | null;
  screenshots: string[];
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0];
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".ogg")
  );
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
  if (!project) return { title: "Project Not Found | Simpson Software" };
  return {
    title: `${project.title} | Simpson Software`,
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

  const resolvedThumbnail = resolveAssetUrl(project.thumbnailUrl);
  const resolvedGif = resolveAssetUrl(project.gifDemoUrl);
  const resolvedScreenshots = project.screenshots?.map(resolveAssetUrl) ?? [];
  const gifIsVideo = hasGif && isVideoUrl(resolvedGif);

  return (
    <main className="bg-background min-h-screen">
      {/* Back nav */}
      <div className="section-container pt-24 pb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-white/40 hover:text-neon-cyan transition-colors duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          All Projects
        </Link>
      </div>

      {/* ── DESKTOP LAYOUT (md+): Steam-style two-column ── */}
      <div className="hidden md:block section-container pb-16">
        {/* Title */}
        <div className="mb-6 space-y-2">
          {project.isFeatured && (
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
              Featured Project
            </span>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            {project.title}
          </h1>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4 items-start">

          {/* Left: Trailer / main media */}
          <div className="space-y-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/[0.06]">
              {hasGif ? (
                gifIsVideo ? (
                  /* eslint-disable-next-line jsx-a11y/media-has-caption */
                  <video
                    src={resolvedGif}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedGif}
                    alt={`${project.title} demo`}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                  <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-white/30 text-sm font-medium">No demo available yet</p>
                    <p className="text-white/20 text-xs leading-relaxed">
                      A walkthrough video or GIF<br />will be added soon
                    </p>
                  </div>
                </div>
              )}
            </div>
            <ScreenshotsSlider screenshots={resolvedScreenshots} projectTitle={project.title} />
          </div>

          {/* Right: Info panel — capsule art + short desc + tags + links */}
          <div className="glass rounded-xl overflow-hidden border border-white/[0.08]">
            {/* Capsule art (thumbnail) */}
            <div className="relative aspect-video overflow-hidden bg-black/40">
              {hasThumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedThumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/5" />
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Short description */}
              <p className="text-white/60 text-sm leading-relaxed">{project.shortDescription}</p>

              {/* External links */}
              {(project.liveUrl || project.gitHubUrl) && (
                <div className="flex flex-col gap-2">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-glow-cyan inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm w-full"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Visit Live Site
                    </a>
                  )}
                  {project.gitHubUrl && (
                    <a
                      href={project.gitHubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-cyan inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm w-full"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                      </svg>
                      View on GitHub
                    </a>
                  )}
                </div>
              )}

              {/* Divider */}
              {project.techStack.length > 0 && (
                <div className="border-t border-white/[0.06]" />
              )}

              {/* Tags / Tech stack */}
              {project.techStack.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                    Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Long description — full width below the grid */}
        {hasLongDescription && (
          <div className="mt-6 glass rounded-xl p-6 border border-white/[0.06] space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
              About this project
            </h2>
            <div className="prose prose-invert max-w-none text-white/60 leading-relaxed whitespace-pre-wrap">
              {project.longDescription}
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE LAYOUT (< md): original stacked layout ── */}
      <div className="md:hidden">
        {/* Hero image / placeholder */}
        <div className="section-container pb-10">
          <div className="relative w-full rounded-2xl overflow-hidden aspect-video max-h-[520px]">
            {hasThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedThumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/5 flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <svg className="w-9 h-9 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        <section className="section-container pb-16">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-3">
              {project.isFeatured && (
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                  Featured Project
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {project.title}
              </h1>
              <p className="text-white/55 text-lg leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

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
                    Visit Live Site
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
                {gifIsVideo ? (
                  /* eslint-disable-next-line jsx-a11y/media-has-caption */
                  <video
                    src={resolvedGif}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedGif}
                    alt={`${project.title} demo`}
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Screenshots */}
        <section className="section-container pb-10">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
              Screenshots
            </h2>
            <ScreenshotsSlider screenshots={resolvedScreenshots} projectTitle={project.title} />
          </div>
        </section>
      </div>

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
