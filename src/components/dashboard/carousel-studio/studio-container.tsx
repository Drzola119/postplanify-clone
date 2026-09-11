"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RevisionHistory } from "./revision-history";
import { StudioToolbar } from "./studio-toolbar";
import { SlideNavigator } from "./slide-navigator";
import { SlideCanvas } from "./slide-canvas";
import { SlideInspector } from "./slide-inspector";
import { DeckInspector } from "./deck-inspector";
import { PreflightModal } from "./preflight-modal";
import { ExportModal } from "./export-modal";
import { runPreflightChecks } from "@/lib/carousel-gen/preflight";
import { useDraftSave, editableDocument } from "./use-draft-save";
import type {
  CarouselDocument,
  CarouselSlideItem,
  BrandKit,
} from "@/lib/carousel-gen/types";
import { Sliders, Layout } from "lucide-react";

interface StudioContainerProps {
  initialDocument: CarouselDocument;
  brandKits?: BrandKit[];
}

export function StudioContainer({
  initialDocument,
  brandKits = [],
}: StudioContainerProps) {
  const router = useRouter();

  // Document State
  const [deck, setDeck] = useState<CarouselDocument>(initialDocument);
  const latestDeck = useRef(deck);
  latestDeck.current = deck;
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"slide" | "deck">("slide");
  const [showSafeZones, setShowSafeZones] = useState(false);

  const saving = useDraftSave(deck);
  const saveStatus = saving.status;
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState<Partial<CarouselDocument> | null>(
    null,
  );
  useEffect(() => {
    try {
      const raw = localStorage.getItem(saving.key);
      if (raw) setRecovery(JSON.parse(raw).document);
    } catch {}
  }, [saving.key]);
  // In-session Undo / Redo History
  const [history, setHistory] = useState<CarouselDocument[]>([initialDocument]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef=useRef(0);
  useEffect(()=>{setActiveSlideIndex(index=>Math.min(index,deck.slides.length-1));},[deck.slides.length]);

  // Modals
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [reviewToken, setReviewToken] = useState<string | null>(
    initialDocument.activeReviewToken || null,
  );

  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  // Helper to push changes to undo history
  const pushHistory = useCallback(
    (nextDeck: CarouselDocument) => {
      const nextIndex=historyIndexRef.current+1;
      historyIndexRef.current=nextIndex;
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, nextIndex);
        return [...upToCurrent, nextDeck];
      });
      setHistoryIndex(nextIndex);
    },
    [],
  );

  // Slide CRUD & Updates
  function updateSlide(updates: Partial<CarouselSlideItem>) {
    if (activeSlide.isLocked) return;
    const nextSlides = [...deck.slides];
    nextSlides[activeSlideIndex] = {
      ...nextSlides[activeSlideIndex],
      ...updates,
    };
    const nextDeck = { ...deck, slides: nextSlides };
    setDeck(nextDeck);

    pushHistory(nextDeck);
  }

  function updateDeck(updates: Partial<CarouselDocument>) {
    const nextDeck = { ...deck, ...updates };
    setDeck(nextDeck);

    pushHistory(nextDeck);
  }

  function handleAddSlide() {
    if (deck.slides.length >= 30) return;
    const newSlide: CarouselSlideItem = {
      id: "sld_" + crypto.randomUUID(),
      index: deck.slides.length,
      type: "value",
      headline: "New Key Point",
      body: "Add your supporting explanation here.",
      textAlign: "left",
      backgroundOpacity: 0,
      isLocked: false,
    };
    const nextDeck = {
      ...deck,
      slides: [...deck.slides, newSlide],
      slideCount: deck.slides.length + 1,
    };
    setDeck(nextDeck);
    setActiveSlideIndex(deck.slides.length);

    pushHistory(nextDeck);
  }

  function handleDuplicateSlide(index: number) {
    if (deck.slides.length >= 30) return;
    const target = deck.slides[index];
    const duplicated: CarouselSlideItem = {
      ...target,
      id: "sld_" + crypto.randomUUID(),
      headline: `${target.headline} (Copy)`,
      index: index + 1,
    };
    const nextSlides = [...deck.slides];
    nextSlides.splice(index + 1, 0, duplicated);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = {
      ...deck,
      slides: reindexed,
      slideCount: reindexed.length,
    };
    setDeck(nextDeck);
    setActiveSlideIndex(index + 1);

    pushHistory(nextDeck);
  }

  function handleDeleteSlide(index: number) {
    if (deck.slides.length <= 1 || deck.slides[index].isLocked) return;
    const nextSlides = deck.slides.filter((_, idx) => idx !== index);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = {
      ...deck,
      slides: reindexed,
      slideCount: reindexed.length,
    };
    setDeck(nextDeck);
    setActiveSlideIndex(Math.max(0, index - 1));

    pushHistory(nextDeck);
  }

  function handleMoveSlide(fromIndex: number, toIndex: number) {
    if (
      toIndex < 0 ||
      toIndex >= deck.slides.length ||
      deck.slides[fromIndex].isLocked ||
      deck.slides[toIndex].isLocked
    )
      return;
    const nextSlides = [...deck.slides];
    const [moved] = nextSlides.splice(fromIndex, 1);
    nextSlides.splice(toIndex, 0, moved);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = { ...deck, slides: reindexed };
    setDeck(nextDeck);
    setActiveSlideIndex(toIndex);

    pushHistory(nextDeck);
  }

  function handleToggleLock(index: number) {
    const nextSlides = [...deck.slides];
    nextSlides[index] = {
      ...nextSlides[index],
      isLocked: !nextSlides[index].isLocked,
    };
    const nextDeck = { ...deck, slides: nextSlides };
    setDeck(nextDeck);
    pushHistory(nextDeck);
  }

  async function handleApplyAIAction(
    action: "rewrite" | "shorten" | "punch_up" | "translate" | "cta",
    targetLanguage?: "ar" | "fr",
  ) {
    if (busy || activeSlide.isLocked) return;
    setBusy(true);
    setActionError("");
    const original = activeSlide;
    try {
      const response = await fetch("/api/carousels/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: original, action, targetLanguage }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error?.message || "AI action failed");
      const current = latestDeck.current;
      const index = current.slides.findIndex((s) => s.id === original.id);
      if (
        index < 0 ||
        JSON.stringify(current.slides[index]) !== JSON.stringify(original)
      )
        throw Error(
          "This slide changed while AI was working. Run the action again to preserve your edits.",
        );
      const next = {
        ...current,
        slides: current.slides.map((s, i) =>
          i === index ? { ...s, ...result.slide, id: s.id, index: i } : s,
        ),
      };
      setDeck(next);
      pushHistory(next);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "AI action failed");
    } finally {
      setBusy(false);
    }
  }

  // Undo / Redo
  function handleUndo() {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      historyIndexRef.current=prevIndex;
      setHistoryIndex(prevIndex);
      setDeck(history[prevIndex]);
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      historyIndexRef.current=nextIndex;
      setHistoryIndex(nextIndex);
      setDeck(history[nextIndex]);
    }
  }

  async function generateCaption() {
    if (busy) return;
    setBusy(true);
    setActionError("");
    const before = latestDeck.current.caption;
    try {
      const saved = await saving.flush();
      const response = await fetch("/api/carousels/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carouselId: deck.id,
          revisionId: saved.currentRevisionId,
          language: /[\u0600-\u06ff]/.test(deck.slides[0]?.headline || "")
            ? "ar"
            : "en",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error?.message || "Caption generation failed");
      if (latestDeck.current.caption !== before)
        throw Error("Your caption changed while AI was working. Try again.");
      const next = { ...latestDeck.current, caption: result.caption };
      setDeck(next);
      pushHistory(next);
      setActiveTab("deck");
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Caption generation failed",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenReview() {
    setActionError("");
    try {
      const saved = await saving.flush();
      const response = await fetch("/api/carousels/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_token",
          carouselId: deck.id,
          revisionId: saved.currentRevisionId,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error?.message || "Could not share review");
      setReviewToken(result.activeReviewToken);
      await navigator.clipboard.writeText(
        `${window.location.origin}/review/carousel/${result.activeReviewToken}`,
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Sharing failed");
    }
  }
  async function handleScheduleHandoff() {
    setBusy(true);
    setActionError("");
    try {
      const saved = await saving.flush();
      const response = await fetch("/api/carousels/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carouselId: deck.id,
          revisionId: saved.currentRevisionId,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error?.message || "Could not prepare slides");
      router.push(
        `/dashboard/posts/create?carouselHandoff=${encodeURIComponent(result.handoffId)}`,
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Scheduling failed");
    } finally {
      setBusy(false);
    }
  }
  async function renderSlideToDataUrl(slideIndex: number): Promise<string> {
    const response = await fetch("/api/carousels/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deck: { ...editableDocument(deck), brandSnapshot: deck.brandSnapshot },
        index: slideIndex,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error?.message || "Rendering failed");
    if (result.issues?.length) throw Error(result.issues.join(" "));
    return result.dataUrl;
  }

  const preflightReport = runPreflightChecks(deck);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-100">
      {/* Persistent Top Toolbar */}
      <StudioToolbar
        title={deck.title}
        onTitleChange={(title) => updateDeck({ title })}
        saveStatus={saveStatus}
        onRetrySave={() => void saving.flush().catch(() => {})}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPreflight={() => setIsPreflightOpen(true)}
        onOpenReview={handleOpenReview}
        onOpenExport={() => setIsExportOpen(true)}
        onSchedule={handleScheduleHandoff}
      />

      <RevisionHistory carouselId={deck.id} flush={saving.flush} />
      <button
        disabled={busy}
        onClick={() => void generateCaption()}
        className="text-sm p-3 text-left"
      >
        Generate caption with AI
      </button>
      {(saving.error || actionError) && (
        <p role="alert" className="p-4 bg-red-950 text-red-100">
          {saving.error || actionError}
        </p>
      )}
      {busy && (
        <p role="status" className="p-3">
          Preparing your carousel…
        </p>
      )}
      {recovery && (
        <div className="p-3 bg-amber-950">
          Unsaved changes from an earlier session are available.{" "}
          <button
            onClick={() => {
              updateDeck(recovery);
              setRecovery(null);
            }}
          >
            Restore local changes
          </button>{" "}
          <button
            onClick={() => {
              localStorage.removeItem(saving.key);
              setRecovery(null);
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {reviewToken && (
        <div className="p-3 flex gap-4">
          <a
            target="_blank"
            rel="noreferrer"
            href={`/review/carousel/${reviewToken}`}
          >
            Open review link (expires in 7 days)
          </a>
          <button
            onClick={async () => {
              const r = await fetch("/api/carousels/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "revoke_token",
                  carouselId: deck.id,
                }),
              });
              if (r.ok) setReviewToken(null);
              else setActionError("Could not revoke link");
            }}
          >
            Revoke link
          </button>
        </div>
      )}
      {deck.scheduling?.postId && (
        <p className="p-3 text-sm">
          A revision of this deck is linked to a post. Editing this draft does
          not replace assets already scheduled or published.{" "}
          <Link className="underline" href="/dashboard/posts">
            View posts
          </Link>
        </p>
      )}
      {/* 3-Column Responsive Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Slide Strip / Navigator */}
        <aside className="w-full lg:w-64 max-h-64 lg:max-h-none shrink-0 overflow-auto">
          <SlideNavigator
            slides={deck.slides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={(idx) => setActiveSlideIndex(idx)}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
            onToggleLock={handleToggleLock}
          />
        </aside>

        {/* Center Column: Slide Canvas & Zoom Preview */}
        <main className="flex-1 bg-zinc-900/30 flex flex-col items-center justify-center p-6 overflow-y-auto relative">
          <SlideCanvas
            deck={deck}
            slide={activeSlide}
            onEdit={(updates) => updateSlide(updates)}
            slideIndex={activeSlideIndex}
            totalSlides={deck.slides.length}
            showSafeZones={showSafeZones}
            brandKit={brandKits.find((k) => k.id === deck.brandKitId)}
          />

          {/* Quick Mobile Navigation Bar */}
          <div className="md:hidden flex items-center gap-2 mt-4">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() =>
                setActiveSlideIndex((prev) => Math.max(0, prev - 1))
              }
              className="px-3 py-1 bg-zinc-800 rounded text-xs font-semibold"
            >
              Prev
            </button>
            <span className="text-xs text-zinc-400">
              {activeSlideIndex + 1} / {deck.slides.length}
            </span>
            <button
              type="button"
              disabled={activeSlideIndex === deck.slides.length - 1}
              onClick={() =>
                setActiveSlideIndex((prev) =>
                  Math.min(deck.slides.length - 1, prev + 1),
                )
              }
              className="px-3 py-1 bg-zinc-800 rounded text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </main>

        {/* Right Column: Contextual Inspector Panels */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("slide")}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "slide"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Slide Controls
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deck")}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "deck"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Deck Settings
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "slide" ? (
              <SlideInspector
                slide={activeSlide}
                slideIndex={activeSlideIndex}
                onUpdateSlide={updateSlide}
                onApplyAIAction={handleApplyAIAction}
              />
            ) : (
              <DeckInspector
                deck={deck}
                brandKits={brandKits}
                showSafeZones={showSafeZones}
                onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
                onUpdateDeck={updateDeck}
                onSelectBrandKit={(kitId) => {
                  const kit = brandKits.find((k) => k.id === kitId);
                  updateDeck({
                    brandKitId: kitId || null,
                    brandSnapshot: kit || null,
                  });
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Preflight Modal */}
      <PreflightModal
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
        report={preflightReport}
        onSelectSlide={(idx) => setActiveSlideIndex(idx)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        deck={deck}
        activeSlideIndex={activeSlideIndex}
        renderSlideToDataUrl={renderSlideToDataUrl}
      />
    </div>
  );
}
