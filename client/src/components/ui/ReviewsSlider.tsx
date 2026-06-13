"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.95 2.878c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z";

interface Review {
  id: number;
  contactName: string;
  contactCompany: string | null;
  projectTitle: string | null;
  prosContent: string;
  rating: number;
}

function StarStrip({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => {
        const starNum = i + 1;
        const filled = rating >= starNum;
        const half = !filled && rating >= starNum - 0.5;
        return (
          <div key={i} className="relative w-3.5 h-3.5 flex-shrink-0">
            <svg className="absolute inset-0 w-full h-full text-white/10" fill="currentColor" viewBox="0 0 20 20">
              <path d={STAR_PATH} />
            </svg>
            {filled && (
              <svg className="absolute inset-0 w-full h-full text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d={STAR_PATH} />
              </svg>
            )}
            {half && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 20 20">
                <defs>
                  <clipPath id={`rs-half-${i}`}>
                    <rect x="0" y="0" width="10" height="20" />
                  </clipPath>
                </defs>
                <path fill="#fbbf24" clipPath={`url(#rs-half-${i})`} d={STAR_PATH} />
              </svg>
            )}
          </div>
        );
      })}
      <span className="ml-2 text-amber-400 text-xs font-semibold">
        {rating}<span className="text-white/25 font-normal">/10</span>
      </span>
    </div>
  );
}

export default function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = reviews.length;

  const go = useCallback(
    (next: number, dir: "left" | "right") => {
      if (animating || next === current) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(next);
        setAnimating(false);
      }, 300);
    },
    [animating, current]
  );

  const prev = useCallback(() => go((current - 1 + total) % total, "left"), [current, go, total]);
  const next = useCallback(() => go((current + 1) % total, "right"), [current, go, total]);

  // Auto-advance every 6s when multiple reviews
  useEffect(() => {
    if (total <= 1) return;
    timeoutRef.current = setTimeout(next, 6000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [current, next, total]);

  const review = reviews[current];
  const initials = review.contactName
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const slideClass = animating
    ? direction === "right"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Card */}
      <div className="w-full max-w-2xl mx-auto">
        <div
          className={`glass rounded-2xl p-8 md:p-10 flex flex-col gap-6 transition-all duration-300 ${slideClass}`}
        >
          {/* Stars */}
          <StarStrip rating={review.rating} />

          {/* Quote */}
          <blockquote className="text-white/80 text-lg md:text-xl leading-relaxed font-light italic border-l-2 border-neon-cyan/40 pl-5">
            &ldquo;{review.prosContent}&rdquo;
          </blockquote>

          {/* Reviewer */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white/70">{initials}</span>
            </div>
            <div>
              <p className="text-white font-medium">{review.contactName}</p>
              {(review.contactCompany || review.projectTitle) && (
                <p className="text-white/40 text-sm">
                  {[review.contactCompany, review.projectTitle].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {total > 1 && (
        <div className="flex items-center gap-6">
          {/* Prev */}
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full glass border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:border-neon-cyan/30 transition-colors"
            aria-label="Previous review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? "right" : "left")}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 h-2 bg-neon-cyan"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="w-10 h-10 rounded-full glass border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:border-neon-cyan/30 transition-colors"
            aria-label="Next review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
