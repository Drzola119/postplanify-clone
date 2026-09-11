"use client";
import { useState } from "react";
import type { CarouselDocument } from "@/lib/carousel-gen/types";
import { studioApi } from "./client-api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
type Revision = {
  id: string;
  number: number;
  label: string;
  createdAt: number;
  slideCount: number;
  reviewStatus: string;
};
export function RevisionHistory({
  carouselId,
  flush,
}: {
  carouselId: string;
  flush: () => Promise<CarouselDocument>;
}) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Revision[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);
  async function load(more = false) {
    setBusy(true);
    setError("");
    try {
      await flush();
      const r = await studioApi<{
        items: Revision[];
        nextCursor: string | null;
      }>(
        `/api/carousels/revisions?carouselId=${carouselId}${more && cursor ? `&cursor=${cursor}` : ""}`,
      );
      setItems((old) => (more ? [...old, ...r.items] : r.items));
      setCursor(r.nextCursor);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "History unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function restore(revisionId: string) {
    setBusy(true);
    setError("");
    try {
      const saved = await flush();
      await studioApi("/api/carousels/revisions", {
        carouselId,
        revisionId,
        expectedRevisionId: saved.currentRevisionId,
      });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
      setBusy(false);
    }
  }
  return (
    <div className="border-b border-zinc-800 p-3 text-sm">
      <div className="flex gap-4">
        <button
          disabled={busy}
          onClick={() => (open ? setOpen(false) : void load())}
        >
          Revision history
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await flush();
              await studioApi("/api/carousels/templates", {
                action: "save",
                carouselId,
              });
              setNotice("Saved to workspace templates.");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not save template",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Save as template
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {open && (
        <div className="max-h-64 overflow-auto mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 border-t border-zinc-800 py-2"
            >
              <span>
                Revision {item.number} · {item.label} · {item.slideCount} slides
                · {new Date(item.createdAt).toLocaleString()}
              </span>
              <button disabled={busy} onClick={() => setPendingRestore(item.id)}>
                Restore
              </button>
            </div>
          ))}
          {cursor && (
            <button disabled={busy} onClick={() => void load(true)}>
              Load older revisions
            </button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        onConfirm={() => {
          const revisionId = pendingRestore;
          setPendingRestore(null);
          if (revisionId) void restore(revisionId);
        }}
        title="Restore this revision?"
        description="Your current work will remain in revision history."
        confirmLabel="Restore revision"
      />
    </div>
  );
}
