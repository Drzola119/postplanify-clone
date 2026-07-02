"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, FileVideo, X } from "lucide-react";

interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles?: (files: File[]) => void;
  className?: string;
  hint?: React.ReactNode;
}

export function Dropzone({ accept = "image/*,video/*", multiple = true, maxSizeMB = 25, onFiles, className, hint }: DropzoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = [...(e.dataTransfer.files ?? [])];
    addFiles(dropped);
  };

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    const next = multiple ? [...files, ...valid] : valid.slice(0, 1);
    setFiles(next);
    onFiles?.(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-blue-500 bg-blue-50/30" : "border-zinc-200 hover:bg-zinc-50"
        )}
      >
        <div className="flex items-center justify-center gap-3 mb-2 text-zinc-400">
          <ImageIcon className="size-6" />
          <FileVideo className="size-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-900">Drop images or videos here</p>
        <p className="text-xs text-zinc-500 mt-1">
          {hint ?? `or click to browse — JPG, PNG, MP4 up to ${maxSizeMB}MB`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => addFiles([...(e.target.files ?? [])])}
        />
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/");
            const url = URL.createObjectURL(f);
            return (
              <li key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                {isImage ? (
                  <img src={url} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <FileVideo className="size-8" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiles((curr) => curr.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 size-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Remove file"
                >
                  <X className="size-3" />
                </button>
                <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/60 rounded px-1.5 py-0.5 truncate">
                  {f.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}