"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────────────────

interface ReviewSubmitFormDto {
  reviewerName: string;
  reviewerTitle: string | null;
  reviewerCompany: string | null;
  isTokenValid: boolean;
}

interface SubmitReviewDto {
  reviewerName: string;
  reviewerTitle: string | null;
  reviewerCompany: string | null;
  content: string;
  rating: number;
}

type PageState = "loading" | "expired" | "not-found" | "error" | "ready" | "submitted";

// ── Star picker ────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <svg
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value) ? "text-amber-400" : "text-white/15"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.95 2.878c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-white/40">
          {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReviewSubmitPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [formData, setFormData] = useState<ReviewSubmitFormDto | null>(null);

  // Editable fields (pre-filled from API but user can change name/title/company)
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerTitle, setReviewerTitle] = useState("");
  const [reviewerCompany, setReviewerCompany] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`${API_URL}/api/reviews/submit/${token}`);
        if (res.status === 410) {
          setPageState("expired");
          return;
        }
        if (res.status === 404) {
          setPageState("not-found");
          return;
        }
        if (!res.ok) {
          setPageState("error");
          return;
        }
        const data: ReviewSubmitFormDto = await res.json();
        if (!data.isTokenValid) {
          setPageState("expired");
          return;
        }
        setFormData(data);
        setReviewerName(data.reviewerName ?? "");
        setReviewerTitle(data.reviewerTitle ?? "");
        setReviewerCompany(data.reviewerCompany ?? "");
        setPageState("ready");
      } catch {
        setPageState("error");
      }
    }
    loadForm();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!content.trim()) {
      setError("Please write your review.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const body: SubmitReviewDto = {
      reviewerName: reviewerName.trim(),
      reviewerTitle: reviewerTitle.trim() || null,
      reviewerCompany: reviewerCompany.trim() || null,
      content: content.trim(),
      rating,
    };

    try {
      const res = await fetch(`${API_URL}/api/reviews/submit/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 410) {
        setPageState("expired");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "Submission failed.");
        setError(text || "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setPageState("submitted");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  // ── States ───────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-white/30">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm">Loading your review form…</p>
        </div>
      </main>
    );
  }

  if (pageState === "expired") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Link Already Used</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            This review link has already been submitted or has expired. Each link can only be used once.
          </p>
          <p className="text-white/30 text-xs">
            If you believe this is an error, please contact{" "}
            <Link href="/" className="text-neon-cyan hover:underline">Philip Simpson</Link>.
          </p>
        </div>
      </main>
    );
  }

  if (pageState === "not-found" || pageState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            {pageState === "not-found" ? "Link Not Found" : "Something Went Wrong"}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            {pageState === "not-found"
              ? "This review link doesn't exist. Double-check the URL in your email."
              : "We couldn't load your review form. Please try refreshing the page."}
          </p>
        </div>
      </main>
    );
  }

  if (pageState === "submitted") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Thank You{reviewerName ? `, ${reviewerName.split(" ")[0]}` : ""}!</h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              Your review has been submitted and will be visible on the site once approved.
            </p>
          </div>
          <div className="flex justify-center gap-1 py-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`w-6 h-6 ${i < rating ? "text-amber-400" : "text-white/10"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.95 2.878c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
              </svg>
            ))}
          </div>
          <Link href="/" className="inline-block text-neon-cyan text-sm hover:underline">
            ← Back to Simpson Software
          </Link>
        </div>
      </main>
    );
  }

  // ── Ready: show form ──────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-4">
            <span className="text-gradient-hero text-xl font-bold tracking-wide">Simpson Software</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Leave a Review</h1>
          <p className="text-white/40 text-sm">
            Share your experience working with Philip Simpson.
          </p>
        </div>

        {/* Reviewer identity */}
        <GlassCard padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white/70">
                {reviewerName.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {reviewerName || formData?.reviewerName || "Reviewer"}
              </p>
              {(reviewerTitle || reviewerCompany) && (
                <p className="text-white/40 text-xs">
                  {[reviewerTitle, reviewerCompany].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Form */}
        <GlassCard padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Reviewer name */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
            </div>

            {/* Title + Company */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={reviewerTitle}
                  onChange={(e) => setReviewerTitle(e.target.value)}
                  placeholder="CEO"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Company
                </label>
                <input
                  type="text"
                  value={reviewerCompany}
                  onChange={(e) => setReviewerCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                />
              </div>
            </div>

            {/* Star rating */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                Rating <span className="text-red-400">*</span>
              </label>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            {/* Review content */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Your Review <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                maxLength={1000}
                placeholder="Share what it was like working together — the project, communication, results…"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-cyan/50 transition-colors resize-none"
              />
              <p className="text-right text-xs text-white/25 mt-1">
                {content.length} / 1000
              </p>
            </div>

            <GlowButton
              variant="cyan"
              size="md"
              type="submit"
              loading={submitting}
              className="w-full justify-center"
            >
              Submit Review
            </GlowButton>
          </form>
        </GlassCard>

        <p className="text-center text-xs text-white/20">
          Your review will be visible after it&apos;s approved. This link can only be used once.
        </p>
      </div>
    </main>
  );
}
