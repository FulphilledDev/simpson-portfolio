"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface ReviewDto {
  id: number;
  reviewerName: string;
  reviewerTitle: string | null;
  reviewerCompany: string | null;
  content: string;
  rating: number;
  requestedAt: string;
  submittedAt: string | null;
  isApproved: boolean;
  isPublished: boolean;
  sortOrder: number;
}

interface RequestReviewForm {
  reviewerEmail: string;
  reviewerName: string;
  reviewerTitle: string;
  reviewerCompany: string;
}

const EMPTY_REQUEST: RequestReviewForm = {
  reviewerEmail: "",
  reviewerName: "",
  reviewerTitle: "",
  reviewerCompany: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400" : "text-white/15"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.95 2.878c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewStatusBadge({ review }: { review: ReviewDto }) {
  if (!review.submittedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-white/5 text-white/40 border-white/10">
        Awaiting Submission
      </span>
    );
  }
  if (review.isPublished) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20">
        Published
      </span>
    );
  }
  if (review.isApproved) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-purple-500/15 text-purple-400 border-purple-500/25">
        Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-500/15 text-amber-400 border-amber-500/25">
      Needs Review
    </span>
  );
}

// ── Request Modal ──────────────────────────────────────────────────────────

function RequestModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<RequestReviewForm>(EMPTY_REQUEST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof RequestReviewForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reviewerEmail.trim() || !form.reviewerName.trim()) {
      setError("Email and name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/reviews/request", {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({
          reviewerEmail: form.reviewerEmail.trim(),
          reviewerName: form.reviewerName.trim(),
          reviewerTitle: form.reviewerTitle.trim() || null,
          reviewerCompany: form.reviewerCompany.trim() || null,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/20 focus:outline-none focus:border-neon-cyan/40 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Request a Review</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Email <span className="text-neon-cyan">*</span>
            </label>
            <input
              type="email"
              value={form.reviewerEmail}
              onChange={(e) => set("reviewerEmail", e.target.value)}
              placeholder="client@example.com"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Name <span className="text-neon-cyan">*</span>
            </label>
            <input
              type="text"
              value={form.reviewerName}
              onChange={(e) => set("reviewerName", e.target.value)}
              placeholder="Jane Smith"
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Title
              </label>
              <input
                type="text"
                value={form.reviewerTitle}
                onChange={(e) => set("reviewerTitle", e.target.value)}
                placeholder="CEO"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Company
              </label>
              <input
                type="text"
                value={form.reviewerCompany}
                onChange={(e) => set("reviewerCompany", e.target.value)}
                placeholder="Acme Inc."
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <GlowButton variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </GlowButton>
            <GlowButton variant="cyan" size="sm" type="submit" loading={saving}>
              Send Request
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Review Detail Modal ────────────────────────────────────────────────────

function ReviewDetailModal({
  review,
  onClose,
  onApprove,
  onTogglePublish,
  onDelete,
}: {
  review: ReviewDto;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onTogglePublish: (review: ReviewDto) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [acting, setActing] = useState(false);

  async function handleApprove() {
    setActing(true);
    await onApprove(review.id);
    setActing(false);
  }

  async function handleTogglePublish() {
    setActing(true);
    await onTogglePublish(review);
    setActing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete review from ${review.reviewerName}? This cannot be undone.`)) return;
    setActing(true);
    await onDelete(review.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg glass rounded-2xl overflow-hidden">
        {/* Close button positioned inside header below */}

        {/* Header */}
        <div className="sticky top-0 z-10 glass flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white/70">
                {review.reviewerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{review.reviewerName}</p>
              {(review.reviewerTitle || review.reviewerCompany) && (
                <p className="text-white/40 text-xs truncate">
                  {[review.reviewerTitle, review.reviewerCompany].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <ReviewStatusBadge review={review} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">

        {/* Rating */}
        {review.submittedAt && (
          <div className="mb-4">
            <StarRating rating={review.rating} />
          </div>
        )}

        {/* Content */}
        {review.submittedAt ? (
          <blockquote className="text-white/70 text-sm leading-relaxed italic border-l-2 border-neon-cyan/30 pl-4 mb-5">
            &ldquo;{review.content}&rdquo;
          </blockquote>
        ) : (
          <p className="text-white/30 text-sm italic mb-5">Awaiting client submission…</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs text-white/40 mb-5">
          <div>
            <span className="uppercase tracking-wider">Requested</span>
            <p className="text-white/60 mt-0.5">{formatDate(review.requestedAt)}</p>
          </div>
          {review.submittedAt && (
            <div>
              <span className="uppercase tracking-wider">Submitted</span>
              <p className="text-white/60 mt-0.5">{formatDate(review.submittedAt)}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
          {review.submittedAt && !review.isApproved && (
            <GlowButton
              variant="cyan"
              size="sm"
              loading={acting}
              onClick={handleApprove}
            >
              Approve
            </GlowButton>
          )}
          {review.isApproved && (
            <GlowButton
              variant={review.isPublished ? "ghost" : "purple"}
              size="sm"
              loading={acting}
              onClick={handleTogglePublish}
            >
              {review.isPublished ? "Unpublish" : "Publish"}
            </GlowButton>
          )}
          <GlowButton
            variant="ghost"
            size="sm"
            loading={acting}
            onClick={handleDelete}
            className="ml-auto text-red-400 hover:text-red-300 hover:border-red-500/30"
          >
            Delete
          </GlowButton>
        </div>
        </div>{/* end p-6 */}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewDto | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const loadReviews = useCallback(async () => {
    try {
      const data = await apiFetch<ReviewDto[]>("/api/reviews/admin", {
        authenticated: true,
      });
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleApprove(id: number) {
    try {
      const updated = await apiFetch<ReviewDto>(`/api/reviews/${id}/approve`, {
        method: "PUT",
        authenticated: true,
      });
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReview?.id === id) setSelectedReview(updated);
      showToast("Review approved.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve.");
    }
  }

  async function handleTogglePublish(review: ReviewDto) {
    try {
      // Toggle isPublished via the update endpoint
      const updated = await apiFetch<ReviewDto>(`/api/reviews/${review.id}`, {
        method: "PUT",
        authenticated: true,
        body: JSON.stringify({ ...review, isPublished: !review.isPublished }),
      });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
      if (selectedReview?.id === review.id) setSelectedReview(updated);
      showToast(updated.isPublished ? "Review published." : "Review unpublished.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/api/reviews/${id}`, {
        method: "DELETE",
        authenticated: true,
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Review deleted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  // Summary counts
  const pending = reviews.filter((r) => r.submittedAt && !r.isApproved).length;
  const published = reviews.filter((r) => r.isPublished).length;
  const awaitingSubmission = reviews.filter((r) => !r.submittedAt).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-white/40 text-sm mt-1">
            {reviews.length} total · {published} published · {pending} awaiting approval
          </p>
        </div>
        <GlowButton variant="cyan" size="sm" onClick={() => setShowRequestModal(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Review
        </GlowButton>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Awaiting Submission", value: awaitingSubmission, color: "text-white/50" },
          { label: "Needs Approval", value: pending, color: "text-amber-400" },
          { label: "Published", value: published, color: "text-neon-cyan" },
        ].map(({ label, value, color }) => (
          <GlassCard key={label} padding="md">
            <p className={`text-2xl font-bold ${color}`}>{loading ? "—" : value}</p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Table */}
      <GlassCard padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/30 text-sm">
            Loading reviews…
          </div>
        ) : error ? (
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={loadReviews} className="text-xs text-red-400/70 hover:text-red-400 underline flex-shrink-0">
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-white/30 text-sm">No reviews yet. Request one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedReview(review)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan/15 to-purple-500/15 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-white/60">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{review.reviewerName}</p>
                          {(review.reviewerTitle || review.reviewerCompany) && (
                            <p className="text-white/35 text-xs truncate">
                              {[review.reviewerTitle, review.reviewerCompany]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {review.submittedAt ? (
                        <StarRating rating={review.rating} />
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">
                      {formatDate(review.requestedAt)}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">
                      {review.submittedAt ? formatDate(review.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ReviewStatusBadge review={review} />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {review.submittedAt && !review.isApproved && (
                          <button
                            title="Approve"
                            onClick={() => handleApprove(review.id)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {review.isApproved && (
                          <button
                            title={review.isPublished ? "Unpublish" : "Publish"}
                            onClick={() => handleTogglePublish(review)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              review.isPublished
                                ? "text-purple-400 hover:bg-purple-500/10"
                                : "text-white/40 hover:text-purple-400 hover:bg-purple-500/10"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={review.isPublished
                                  ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          title="Delete"
                          onClick={async () => {
                            if (!confirm(`Delete review from ${review.reviewerName}?`)) return;
                            await handleDelete(review.id);
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Request modal */}
      {showRequestModal && (
        <RequestModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            showToast("Review request sent!");
            loadReviews();
          }}
        />
      )}

      {/* Detail modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onApprove={handleApprove}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#0d0d14] border border-white/[0.1] text-white/80 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
