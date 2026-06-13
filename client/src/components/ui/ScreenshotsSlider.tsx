"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const PLACEHOLDER_COUNT = 4;

interface ScreenshotsSliderProps {
  screenshots: string[];
  projectTitle: string;
}

export default function ScreenshotsSlider({
  screenshots,
  projectTitle,
}: ScreenshotsSliderProps) {
  const items =
    screenshots.length > 0
      ? screenshots
      : Array.from({ length: PLACEHOLDER_COUNT }, () => "");
  const isPlaceholder = screenshots.length === 0;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const open = (i: number) => setActiveIndex(i);
  const close = () => setActiveIndex(null);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i - 1 + items.length) % items.length : null));
  }, [items.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i + 1) % items.length : null));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, prev, next]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = activeIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  return (
    <>
      {/* ── Scrollable filmstrip ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((src, i) => (
          <button
            key={i}
            onClick={() => open(i)}
            aria-label={`View screenshot ${i + 1}`}
            className="relative flex-none w-[160px] aspect-video rounded-lg overflow-hidden border border-white/[0.08] hover:border-neon-cyan/40 transition-colors duration-200 group bg-black/30"
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`${projectTitle} screenshot ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex flex-col items-center justify-center gap-1.5">
                <svg
                  className="w-5 h-5 text-white/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                <span className="text-[10px] text-white/20">Screenshot {i + 1}</span>
              </div>
            )}
            {/* Hover tint */}
            <div className="absolute inset-0 bg-neon-cyan/[0.06] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}

        {isPlaceholder && (
          <div className="flex-none flex items-center px-2">
            <span className="text-[11px] text-white/20 whitespace-nowrap italic">
              Screenshots coming soon
            </span>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={close}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            touchStartX.current = null;
          }}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute -top-10 right-0 text-white/40 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image frame */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
              {items[activeIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={items[activeIndex]}
                  alt={`${projectTitle} screenshot ${activeIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white/30 text-sm font-medium">
                      Screenshot {activeIndex + 1}
                    </p>
                    <p className="text-white/20 text-xs mt-1">Coming soon</p>
                  </div>
                </div>
              )}

              {/* Prev / Next overlays */}
              {items.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Previous screenshot"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 hover:border-neon-cyan/40 transition-all backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next screenshot"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 hover:border-neon-cyan/40 transition-all backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Counter + dot indicators */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-white/30 text-xs">
                {activeIndex + 1} / {items.length}
              </span>
              <div className="flex gap-1.5 items-center">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to screenshot ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === activeIndex
                        ? "bg-neon-cyan w-4"
                        : "bg-white/20 hover:bg-white/40 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
