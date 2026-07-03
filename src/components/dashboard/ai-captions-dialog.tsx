"use client";

import { useState } from "react";
import { AlertTriangle, History, Sparkles, Inbox, ImageIcon, Film, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface AICaptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (opts: {
    tone: string;
    includeHashtags: boolean;
    useEmojis: boolean;
    extra: string;
  }) => void | Promise<void>;
  /** Optional previews shown so the user knows what the model will see. */
  imageUrl?: string | null;
  /** Optional video title (e.g. filename minus extension). */
  videoTitle?: string | null;
  /** While the parent is awaiting the API. Disables the Generate button. */
  isGenerating?: boolean;
}

const TONES = [
  { id: "default", emoji: "🧠", label: "Default" },
  { id: "friendly", emoji: "😊", label: "Friendly" },
  { id: "funny", emoji: "😂", label: "Funny" },
  { id: "bold", emoji: "💥", label: "Bold" },
  { id: "professional", emoji: "💼", label: "Professional" },
  { id: "motivational", emoji: "🚀", label: "Motivational" },
];

export function AICaptionsDialog({
  open,
  onClose,
  onGenerate,
  imageUrl,
  videoTitle,
  isGenerating,
}: AICaptionsDialogProps) {
  const [tone, setTone] = useState("default");
  const [hashtags, setHashtags] = useState(true);
  const [emojis, setEmojis] = useState(true);
  const [extra, setExtra] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const hasContext = !!imageUrl || !!videoTitle;
  const mediaLabel = imageUrl ? "this image" : videoTitle ? `video “${videoTitle}”` : "your account";
  const canGenerate = hasContext && !isGenerating;

  async function handleClick() {
    if (!canGenerate) return;
    await onGenerate({ tone, includeHashtags: hashtags, useEmojis: emojis, extra });
  }

  return (
    <>
      <Modal
        open={open && !historyOpen}
        onClose={() => {
          if (!isGenerating) onClose();
        }}
        title="Generate AI Captions"
        description={
          hasContext
            ? `Drafts will be tailored to ${mediaLabel}.`
            : "Upload an image or video first so the model has context."
        }
        size="lg"
        footer={
          <button
            type="button"
            onClick={handleClick}
            disabled={!canGenerate}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-md px-4 h-10 text-sm font-medium transition-colors",
              canGenerate
                ? "bg-zinc-950 hover:bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {hasContext ? "Generate Captions" : "Upload media to generate"}
              </>
            )}
          </button>
        }
      >
        <div className="space-y-4">
          {/* Context preview */}
          {hasContext ? (
            <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50/60 p-2.5">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Reference"
                  className="size-12 rounded-md object-cover border border-zinc-200"
                />
              ) : (
                <div className="size-12 rounded-md bg-zinc-900 text-white flex items-center justify-center">
                  <Film className="size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                  {imageUrl ? (
                    <>
                      <ImageIcon className="size-3.5" />
                      Will analyze this image
                    </>
                  ) : (
                    <>
                      <Film className="size-3.5" />
                      Will caption from video title
                    </>
                  )}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {imageUrl
                    ? imageUrl.split("/").pop()?.split("?")[0] ?? "image"
                    : videoTitle}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <ImageIcon className="size-4 text-zinc-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-700">
                <span className="font-semibold">No media uploaded yet.</span>{" "}
                Upload an image (we&apos;ll describe it) or a video (we&apos;ll use the title).
              </div>
            </div>
          )}

          {/* Workspace warning */}
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-semibold">Workspace Description Required.</span>{" "}
              For optimal caption generation, please ensure your workspace&apos;s description is up to
              date.{" "}
              <button
                type="button"
                className="font-medium underline underline-offset-2 hover:text-amber-700"
              >
                Update workspace details →
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <ToggleRow
              label="Include Hashtags"
              checked={hashtags}
              onChange={setHashtags}
            />
            <ToggleRow
              label="Use Emojis"
              checked={emojis}
              onChange={setEmojis}
            />
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 h-9 text-sm font-medium transition-colors",
                    tone === t.id
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  )}
                >
                  <span aria-hidden>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional customization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Additional Customization</label>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                <History className="size-3.5" />
                History
              </button>
            </div>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Have specific preferences or context? Add them here…"
              className="w-full min-h-[80px] resize-none rounded-md border border-zinc-200 bg-white p-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>
        </div>
      </Modal>

      {/* History panel — centered modal like original */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Caption History"
        size="md"
      >
        <div className="flex flex-col items-center justify-center text-center py-12 min-h-[200px]">
          <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <Inbox className="size-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700">No history found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-[260px]">
            Previously generated captions will appear here.
          </p>
        </div>
      </Modal>
    </>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-zinc-950" : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}