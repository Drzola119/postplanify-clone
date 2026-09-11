"use client";
import { useEffect, useState } from "react";
import { studioApi } from "./client-api";
import type { HandoffAsset } from "../infographic-studio/composer-handoff";
export type CarouselHandoff = {
  id: string;
  carouselId: string;
  revisionId: string;
  title: string;
  caption: string;
  platformOverrides: Record<string, { caption?: string }>;
  assets: HandoffAsset[];
};
export function CarouselComposerHandoff({
  onAdd,
  hasContent,
}: {
  onAdd: (handoff: CarouselHandoff) => void;
  hasContent: boolean;
}) {
  const [id, setId] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(
    () =>
      setId(
        new URLSearchParams(window.location.search).get("carouselHandoff") ||
          "",
      ),
    [],
  );
  if (!id) return null;
  return (
    <section className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Your carousel is ready</h2>
      <p>
        {hasContent
          ? "Adding the carousel replaces media and caption in this composer. Save existing work first if needed."
          : "Add the complete ordered deck and caption, then choose accounts and a publishing time."}
      </p>
      <button
        disabled={busy}
        className="bg-zinc-900 text-white rounded-lg p-3"
        onClick={async () => {
          if (
            hasContent &&
            !confirm(
              "Replace this composer’s media and caption with the carousel?",
            )
          )
            return;
          setBusy(true);
          try {
            const { handoff } = await studioApi<{ handoff: CarouselHandoff }>(
              `/api/carousels/handoff?id=${id}`,
            );
            onAdd(handoff);
            setId("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load slides");
          } finally {
            setBusy(false);
          }
        }}
      >
        Add complete carousel
      </button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
