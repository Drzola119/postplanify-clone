"use client";
import { useEffect, useState } from "react";
import { api, button, primary } from "./shared";
export type HandoffAsset = {
  id: string;
  url: string;
  storedPath: string;
  mime: string;
  width: number;
  height: number;
  size: number;
};
export function InfographicHandoff({
  onAdd,
  onSeparate,
  hasContent,
}: {
  onAdd: (asset: HandoffAsset, schedule: boolean) => void;
  onSeparate: (asset: HandoffAsset, schedule: boolean) => Promise<void>;
  hasContent: boolean;
}) {
  const [id, setId] = useState(""),
    [schedule, setSchedule] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get("infographicAsset") ?? "");
    setSchedule(params.get("infographicIntent") === "schedule");
  }, []);
  function dismiss() {
    setId("");
    const url = new URL(window.location.href);
    url.searchParams.delete("infographicAsset");
    url.searchParams.delete("infographicIntent");
    window.history.replaceState(null, "", url);
  }
  async function add(separate: boolean) {
    setBusy(true);
    setError("");
    try {
      const { asset } = await api<{ asset: HandoffAsset }>(
        `/api/infographics/assets/${encodeURIComponent(id)}`,
      );
      if (separate) await onSeparate(asset, schedule);
      else onAdd(asset, schedule);
      dismiss();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!id) return null;
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h2 className="font-semibold">Your infographic is ready</h2>
      <p className="my-2 text-sm">
        {hasContent
          ? "Add it to this draft, or save your current work and start a separate draft."
          : "Add the verified workspace image to this post."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className={primary}
          disabled={busy}
          onClick={() => void add(false)}
        >
          Add to this post
        </button>
        {hasContent && (
          <button
            className={button}
            disabled={busy}
            onClick={() => void add(true)}
          >
            Save current & start separate draft
          </button>
        )}
        <button className={button} disabled={busy} onClick={dismiss}>
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
