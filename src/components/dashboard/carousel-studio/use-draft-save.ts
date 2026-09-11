"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselDocument } from "@/lib/carousel-gen/types";
export function editableDocument(deck: CarouselDocument) {
  const {
    title,
    description,
    slides,
    style,
    aspectRatio,
    brandKitId,
    campaignId,
    folderId,
    tags,
    caption,
    platformOverrides,
    showSlideNumbers,
  } = deck;
  return {
    title,
    description,
    slides,
    style,
    aspectRatio,
    brandKitId,
    campaignId,
    folderId,
    tags,
    caption,
    platformOverrides,
    showSlideNumbers,
  };
}
export function useDraftSave(deck: CarouselDocument) {
  const latest = useRef(deck);
  latest.current = deck;
  const saved = useRef(JSON.stringify(editableDocument(deck)));
  const revision = useRef(deck.currentRevisionId);
  const persisted = useRef(deck);
  const inFlight = useRef<Promise<CarouselDocument> | null>(null);
  const [status, setStatus] = useState<
    "saved" | "saving" | "unsaved" | "failed"
  >("saved");
  const [error, setError] = useState("");
  const key = `carousel-draft:${deck.workspaceId}:${deck.id}`;
  const flush = useCallback(async (): Promise<CarouselDocument> => {
    if (inFlight.current) return inFlight.current;
    if (JSON.stringify(editableDocument(latest.current)) === saved.current)
      return persisted.current;
    const run = async () => {
      setError("");
      try {
        while (
          JSON.stringify(editableDocument(latest.current)) !== saved.current
        ) {
          const snapshot = JSON.stringify(editableDocument(latest.current));
          setStatus("saving");
          const response = await fetch(`/api/carousels/${latest.current.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...JSON.parse(snapshot),
              expectedRevisionId: revision.current,
            }),
          });
          const result = await response.json();
          if (!response.ok)
            throw Error(
              response.status === 409
                ? "Another editor saved a newer version. Copy your changes or download recovery data, then reload."
                : result.error?.message || "Save failed",
            );
          saved.current = snapshot;
          revision.current = result.carousel.currentRevisionId;
          persisted.current = result.carousel;
        }
        setStatus("saved");
        try {
          localStorage.removeItem(key);
        } catch {
          /* Server save already succeeded. */
        }
        return persisted.current;
      } catch (e) {
        setStatus("failed");
        setError(e instanceof Error ? e.message : "Save failed");
        throw e;
      }
    };
    inFlight.current = run().finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [key]);
  const digest = JSON.stringify(editableDocument(deck));
  useEffect(() => {
    if (digest === saved.current) return;
    setStatus("unsaved");
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          expectedRevisionId: revision.current,
          document: editableDocument(latest.current),
        }),
      );
    } catch {
      /* Server saves remain available if local storage is full. */
    }
    const timer = setTimeout(() => void flush().catch(() => {}), 900);
    return () => clearTimeout(timer);
  }, [digest, key, flush]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(editableDocument(latest.current)) !== saved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  return { status, error, flush, key };
}
