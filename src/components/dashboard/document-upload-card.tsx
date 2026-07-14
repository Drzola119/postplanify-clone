"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepCircle } from "@/components/dashboard/step-circle";

const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
};

const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_TYPES).flat();
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type === "application/pdf") return "📄";
  if (type.includes("presentation") || type.includes("powerpoint")) return "📊";
  if (type.includes("word")) return "📝";
  return "📃";
}

export interface DocumentFile {
  file: File;
  cdnUrl?: string;
  uploadStatus: "pending" | "uploading" | "ready" | "error";
  uploadProgress?: number;
}

interface DocumentUploadCardProps {
  docFile: DocumentFile | null;
  docTitle: string;
  onDocFile: (file: File) => void;
  onRemoveDoc: () => void;
  onTitleChange: (title: string) => void;
}

export function DocumentUploadCard({
  docFile,
  docTitle,
  onDocFile,
  onRemoveDoc,
  onTitleChange,
}: DocumentUploadCardProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: File[]) => {
      setSizeError(null);
      const file = files[0];
      if (!file) return;
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setSizeError("Invalid file type. Accepted: PDF, DOC, DOCX, PPT, PPTX, TXT");
        return;
      }
      if (file.size > MAX_SIZE) {
        setSizeError("File too large. Maximum size is 50 MB.");
        return;
      }
      onDocFile(file);
    },
    [onDocFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      handleFiles(Array.from(e.dataTransfer.files ?? []));
    },
    [handleFiles]
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StepCircle n={1} />
            <h3 className="text-lg font-semibold leading-none">Media</h3>
            <span className="text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <FileText className="size-3" /> Document · LinkedIn Only
            </span>
          </div>
        </div>

        {/* Dropzone or file info */}
        {!docFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingOver(true);
            }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              draggingOver
                ? "border-blue-400 bg-blue-50/40"
                : "border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="size-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Drop your document here</p>
              <p className="text-xs text-zinc-400">PDF, DOC, DOCX, PPT, PPTX · Max 50 MB</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
              >
                Browse Document
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            {/* File info row */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                {getFileIcon(docFile.file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{docFile.file.name}</p>
                <p className="text-xs text-zinc-500">{formatBytes(docFile.file.size)}</p>
              </div>
              <button
                type="button"
                onClick={onRemoveDoc}
                className="size-7 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex-shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Upload progress */}
            {docFile.uploadStatus === "uploading" && (
              <div className="space-y-1">
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${docFile.uploadProgress ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{docFile.uploadProgress ?? 0}% uploading…</p>
              </div>
            )}

            {/* Ready status */}
            {docFile.uploadStatus === "ready" && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                ✅ Uploaded successfully
              </p>
            )}

            {/* Error status */}
            {docFile.uploadStatus === "error" && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="size-3" /> Upload failed — please try again
              </p>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {/* Size / type error */}
        {sizeError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="size-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{sizeError}</p>
          </div>
        )}

        {/* Document Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
            Document Title
            <span className="text-red-500">*</span>
            <span className="text-xs text-zinc-400 font-normal">(required by LinkedIn)</span>
          </label>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder='e.g. "10 Growth Tips for 2025"'
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950/30 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
