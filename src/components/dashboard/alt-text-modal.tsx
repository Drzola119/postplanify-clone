"use client";

import { useState, useEffect } from "react";
import { FileText, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface AltTextModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  initialValue?: string;
  onSave?: (value: string) => void;
}

const MAX = 500;

export function AltTextModal({ open, onClose, imageUrl, initialValue = "", onSave }: AltTextModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  function handleSave() {
    onSave?.(value.trim());
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <FileText className="size-4" />
          Alt Text
        </span>
      }
      description="Describe this image for screen readers and search engines"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-3 h-9 text-sm font-medium"
          >
            <Check className="size-3.5" />
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {imageUrl ? (
          <div className="w-full h-48 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-sm text-zinc-500">
            No image selected
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Alt text</label>
            <span className="text-xs text-zinc-400">
              {value.length}/{MAX}
            </span>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX))}
            placeholder="e.g. A golden retriever playing fetch on a sunny beach"
            rows={3}
            className="w-full rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300 p-3 resize-none"
          />
          <p className="text-xs text-zinc-500">
            Good alt text is concise, descriptive, and conveys the meaning of the image.
          </p>
        </div>
      </div>
    </Modal>
  );
}