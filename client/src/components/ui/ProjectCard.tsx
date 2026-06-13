"use client";

import Link from "next/link";
import GlassCard from "./GlassCard";
import { resolveAssetUrl } from "@/lib/api";

export interface Project {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  techStack: string[];
  thumbnailUrl: string;
  liveUrl?: string | null;
  gitHubUrl?: string | null;
  screenshots: string[];
  isFeatured: boolean;
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block group h-full">
      <GlassCard
        hoverable
        accent={project.isFeatured ? "cyan" : "none"}
        padding="none"
        className="overflow-hidden h-full flex flex-col"
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveAssetUrl(project.thumbnailUrl)}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/5 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white/30"
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

          {project.isFeatured && (
            <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan backdrop-blur-sm">
              Featured
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="text-white font-semibold text-lg leading-snug group-hover:text-neon-cyan transition-colors duration-200">
              {project.title}
            </h3>
            <p className="text-white/50 text-sm mt-1.5 line-clamp-2 leading-relaxed">
              {project.shortDescription}
            </p>
          </div>

          {/* Tech stack badges */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {project.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 4 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40">
                  +{project.techStack.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-medium text-neon-cyan/60 group-hover:text-neon-cyan transition-colors duration-200">
              View Details →
            </span>

            {/* External links — stop propagation so the card link isn't followed */}
            <div
              className="flex items-center gap-3"
              onClick={(e) => e.preventDefault()}
            >
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Live Demo"
                  className="text-white/30 hover:text-white/70 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              )}
              {project.gitHubUrl && (
                <a
                  href={project.gitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                  className="text-white/30 hover:text-white/70 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
