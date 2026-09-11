"use client";

import { useEffect, useState, use } from "react";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  Lock,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import type { CarouselDocument, CarouselComment, CarouselSlideItem } from "@/lib/carousel-gen/types";

export default function CarouselReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carousel, setCarousel] = useState<CarouselDocument | null>(null);
  const [comments, setComments] = useState<CarouselComment[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<"approved" | "changes_requested" | null>(null);

  useEffect(() => {
    async function fetchReview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/carousels/review?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.data) {
          setError(json.error?.message || "This review link is invalid or has expired.");
          return;
        }
        setCarousel(json.data.carousel);
        setComments(json.data.comments || []);
      } catch (err) {
        setError("Failed to load review. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, [token]);

  const activeSlide: CarouselSlideItem | undefined = carousel?.slides[activeSlideIndex];
  const slideComments = comments.filter(
    (c) => c.slideId === activeSlide?.id || (!c.slideId && activeSlideIndex === 0)
  );

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !carousel) return;

    try {
      setSubmittingComment(true);
      const res = await fetch("/api/carousels/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_comment",
          carouselId: carousel.id,
          token,
          slideId: activeSlide?.id || null,
          content: commentText.trim(),
          guestName: guestName.trim() || "Reviewer",
          guestEmail: guestEmail.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setComments((prev) => [
          ...prev,
          {
            id: json.data?.commentId || `c_${Date.now()}`,
            slideId: activeSlide?.id || null,
            revisionId: carousel.currentRevisionId,
            author: { name: guestName.trim() || "Reviewer", isGuest: true },
            content: commentText.trim(),
            resolved: false,
            createdAt: Date.now(),
          },
        ]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDecision(action: "approve" | "request_changes") {
    if (!carousel) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/carousels/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          carouselId: carousel.id,
          token,
          guestName: guestName.trim() || "Reviewer",
          guestEmail: guestEmail.trim() || undefined,
        }),
      });
      if (res.ok) {
        setReviewSubmitted(action === "approve" ? "approved" : "changes_requested");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm text-zinc-400">Loading Carousel for Review...</p>
      </div>
    );
  }

  if (error || !carousel) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold mb-2">Review Link Unavailable</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Review Bar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                {carousel.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Revision: {carousel.currentRevisionId}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Slide {activeSlideIndex + 1} of {carousel.slides.length} • Aspect {carousel.aspectRatio}
            </p>
          </div>
        </div>

        {/* Approval CTAs */}
        <div className="flex items-center gap-3">
          {reviewSubmitted ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              {reviewSubmitted === "approved" ? "Approved Revision" : "Changes Requested"}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleDecision("request_changes")}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg border border-red-800/80 bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold transition"
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => handleDecision("approve")}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve Revision
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Review Canvas and Side Comments Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center: Slide Previewer */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900/30 relative">
          <div className="relative max-w-md w-full aspect-[4/5] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between p-8 text-left transition-all">
            {activeSlide?.backgroundImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${activeSlide.backgroundImageUrl})`,
                  opacity: (activeSlide.backgroundOpacity ?? 20) / 100,
                }}
              />
            )}
            <div className="relative z-10">
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400">
                {activeSlide?.type || "Slide"} {activeSlideIndex + 1}
              </span>
              <h2 className="text-2xl font-black mt-3 leading-snug text-white">
                {activeSlide?.headline}
              </h2>
              {activeSlide?.subheadline && (
                <p className="text-sm font-medium text-zinc-300 mt-2">
                  {activeSlide.subheadline}
                </p>
              )}
            </div>

            <div className="relative z-10">
              {activeSlide?.body && (
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/60 backdrop-blur">
                  {activeSlide.body}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 pt-4 border-t border-zinc-800/60">
                <span>PostPlanify Review</span>
                <span>{activeSlideIndex + 1} / {carousel.slides.length}</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
              className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {carousel.slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === activeSlideIndex
                      ? "bg-amber-400 w-6"
                      : "bg-zinc-700 hover:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={activeSlideIndex === carousel.slides.length - 1}
              onClick={() => setActiveSlideIndex((prev) => Math.min(carousel.slides.length - 1, prev + 1))}
              className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </main>

        {/* Right: Slide Comments Drawer */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/90 flex flex-col h-[500px] lg:h-auto">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Slide {activeSlideIndex + 1} Comments
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {slideComments.length}
            </span>
          </div>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slideComments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No feedback on this slide yet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">Leave a comment below to pin feedback.</p>
              </div>
            ) : (
              slideComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-left text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-200">
                      {comment.author.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="p-4 border-t border-zinc-800 bg-zinc-950/60 space-y-2">
            {!guestName && (
              <input
                type="text"
                placeholder="Your name..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Comment on Slide ${activeSlideIndex + 1}...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-lg text-xs transition flex items-center justify-center"
              >
                {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
