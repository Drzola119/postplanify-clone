"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StudioToolbar } from "./studio-toolbar";
import { SlideNavigator } from "./slide-navigator";
import { SlideCanvas } from "./slide-canvas";
import { SlideInspector } from "./slide-inspector";
import { DeckInspector } from "./deck-inspector";
import { PreflightModal } from "./preflight-modal";
import { ExportModal } from "./export-modal";
import { runPreflightChecks } from "@/lib/carousel-gen/preflight";
import { applySurgicalRefinement } from "@/lib/carousel-gen/repurpose";
import type {
  CarouselDocument,
  CarouselSlideItem,
  BrandKit,
} from "@/lib/carousel-gen/types";
import { Sliders, Layout, Eye, Layers } from "lucide-react";

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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"slide" | "deck">("slide");
  const [showSafeZones, setShowSafeZones] = useState(false);

  // Autosave State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "failed">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // In-session Undo / Redo History
  const [history, setHistory] = useState<CarouselDocument[]>([initialDocument]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [reviewToken, setReviewToken] = useState<string | null>(initialDocument.activeReviewToken || null);

  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  // Helper to push changes to undo history
  const pushHistory = useCallback((nextDeck: CarouselDocument) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, nextDeck];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (saveStatus === "saving" || saveStatus === "saved") return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const res = await fetch(`/api/carousels/${deck.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: deck.title,
            description: deck.description,
            aspectRatio: deck.aspectRatio,
            brandKitId: deck.brandKitId,
            campaignId: deck.campaignId,
            folderId: deck.folderId,
            tags: deck.tags,
            slides: deck.slides,
            style: deck.style,
            caption: deck.caption,
            reviewStatus: deck.reviewStatus,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("failed");
        }
      } catch (err) {
        setSaveStatus("failed");
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [deck, saveStatus]);

  // Slide CRUD & Updates
  function updateSlide(updates: Partial<CarouselSlideItem>) {
    const nextSlides = [...deck.slides];
    nextSlides[activeSlideIndex] = {
      ...nextSlides[activeSlideIndex],
      ...updates,
    };
    const nextDeck = { ...deck, slides: nextSlides };
    setDeck(nextDeck);
    setSaveStatus("unsaved");
    pushHistory(nextDeck);
  }

  function updateDeck(updates: Partial<CarouselDocument>) {
    const nextDeck = { ...deck, ...updates };
    setDeck(nextDeck);
    setSaveStatus("unsaved");
    pushHistory(nextDeck);
  }

  function handleAddSlide() {
    const newSlide: CarouselSlideItem = {
      id: "sld_" + Math.random().toString(36).substring(2, 9),
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
    setSaveStatus("unsaved");
    pushHistory(nextDeck);
  }

  function handleDuplicateSlide(index: number) {
    const target = deck.slides[index];
    const duplicated: CarouselSlideItem = {
      ...target,
      id: "sld_" + Math.random().toString(36).substring(2, 9),
      headline: `${target.headline} (Copy)`,
      index: index + 1,
    };
    const nextSlides = [...deck.slides];
    nextSlides.splice(index + 1, 0, duplicated);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = { ...deck, slides: reindexed, slideCount: reindexed.length };
    setDeck(nextDeck);
    setActiveSlideIndex(index + 1);
    setSaveStatus("unsaved");
    pushHistory(nextDeck);
  }

  function handleDeleteSlide(index: number) {
    if (deck.slides.length <= 2) return;
    const nextSlides = deck.slides.filter((_, idx) => idx !== index);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = { ...deck, slides: reindexed, slideCount: reindexed.length };
    setDeck(nextDeck);
    setActiveSlideIndex(Math.max(0, index - 1));
    setSaveStatus("unsaved");
    pushHistory(nextDeck);
  }

  function handleMoveSlide(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= deck.slides.length) return;
    const nextSlides = [...deck.slides];
    const [moved] = nextSlides.splice(fromIndex, 1);
    nextSlides.splice(toIndex, 0, moved);
    const reindexed = nextSlides.map((s, idx) => ({ ...s, index: idx }));
    const nextDeck = { ...deck, slides: reindexed };
    setDeck(nextDeck);
    setActiveSlideIndex(toIndex);
    setSaveStatus("unsaved");
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
    setSaveStatus("unsaved");
  }

  function handleApplyAIAction(
    action: "shorten" | "punch_up" | "translate",
    targetLanguage?: "ar" | "fr"
  ) {
    const refined = applySurgicalRefinement({
      slide: activeSlide,
      action,
      targetLanguage,
    });
    updateSlide(refined);
  }

  // Undo / Redo
  function handleUndo() {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setDeck(history[prevIndex]);
      setSaveStatus("unsaved");
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDeck(history[nextIndex]);
      setSaveStatus("unsaved");
    }
  }

  // Generate / View Review Link
  async function handleOpenReview() {
    if (!reviewToken) {
      try {
        const res = await fetch("/api/carousels/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate_token",
            carouselId: deck.id,
          }),
        });
        const json = await res.json();
        if (json.data?.activeReviewToken) {
          setReviewToken(json.data.activeReviewToken);
          navigator.clipboard.writeText(
            `${window.location.origin}/review/carousel/${json.data.activeReviewToken}`
          );
          alert("Review link copied to clipboard!");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/review/carousel/${reviewToken}`
      );
      alert("Review link copied to clipboard!");
    }
  }

  // Scheduling Handoff to /dashboard/posts/create
  function handleScheduleHandoff() {
    // Pass carousel deck details and media URLs
    const params = new URLSearchParams({
      carouselId: deck.id,
      title: deck.title,
      caption: deck.caption || "",
      slideCount: String(deck.slides.length),
      aspectRatio: deck.aspectRatio,
    });
    router.push(`/dashboard/posts/create?${params.toString()}`);
  }

  // Fake slide render for export modal
  async function renderSlideToDataUrl(slideIndex: number): Promise<string> {
    // Generate a clean dummy PNG canvas representation
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = deck.aspectRatio === "1:1" ? 1080 : deck.aspectRatio === "4:5" ? 1350 : 1920;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = deck.style.colors.background || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = deck.style.colors.primary || "#0f172a";
      ctx.font = "bold 60px sans-serif";
      ctx.fillText(deck.slides[slideIndex]?.headline || "Slide", 100, 300);
      ctx.font = "32px sans-serif";
      ctx.fillText(deck.slides[slideIndex]?.body || "", 100, 450);
    }
    return canvas.toDataURL("image/png");
  }

  const preflightReport = runPreflightChecks(deck);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-100">
      {/* Persistent Top Toolbar */}
      <StudioToolbar
        title={deck.title}
        onTitleChange={(title) => updateDeck({ title })}
        saveStatus={saveStatus}
        onRetrySave={() => setSaveStatus("unsaved")}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPreflight={() => setIsPreflightOpen(true)}
        onOpenReview={handleOpenReview}
        onOpenExport={() => setIsExportOpen(true)}
        onSchedule={handleScheduleHandoff}
      />

      {/* 3-Column Responsive Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Slide Strip / Navigator */}
        <aside className="w-64 shrink-0 hidden md:block">
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
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
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
              onClick={() => setActiveSlideIndex((prev) => Math.min(deck.slides.length - 1, prev + 1))}
              className="px-3 py-1 bg-zinc-800 rounded text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </main>

        {/* Right Column: Contextual Inspector Panels */}
        <aside className="w-80 shrink-0 hidden lg:flex flex-col">
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
                onSelectBrandKit={(kitId) => updateDeck({ brandKitId: kitId || null })}
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
        renderSlideToDataUrl={renderSlideToDataUrl}
      />
    </div>
  );
}
