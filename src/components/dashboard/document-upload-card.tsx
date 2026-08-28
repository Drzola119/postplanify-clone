"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, AlertCircle, Info, ChevronDown, ChevronUp, BookOpen, Layers } from "lucide-react";
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
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB (LinkedIn official maximum)
const MAX_PAGES = 300; // LinkedIn official hard limit

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

async function detectPdfPages(file: File): Promise<number | null> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return null;
  }
  try {
    const chunk = file.slice(0, Math.min(file.size, 10 * 1024 * 1024));
    const buffer = await chunk.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);
    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) return pageMatches.length;
    const countMatch = text.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) return parseInt(countMatch[1], 10);
    return null;
  } catch {
    return null;
  }
}

export interface DocumentFile {
  file: File;
  pageCount?: number | null;
  cdnUrl?: string;
  uploadStatus: "pending" | "uploading" | "ready" | "error";
  uploadProgress?: number;
}

interface DocumentUploadCardProps {
  docFile: DocumentFile | null;
  docTitle: string;
  onDocFile: (file: File, pageCount?: number | null) => void;
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
  const [pageWarning, setPageWarning] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setSizeError(null);
      setPageWarning(null);
      const file = files[0];
      if (!file) return;
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setSizeError("Invalid file type. Accepted: PDF, DOC, DOCX, PPT, PPTX, TXT");
        return;
      }
      if (file.size > MAX_SIZE) {
        setSizeError("File exceeds LinkedIn's 100 MB limit. Please compress or optimize your document.");
        return;
      }

      const detectedPages = await detectPdfPages(file);
      if (detectedPages && detectedPages > MAX_PAGES) {
        setPageWarning(
          `Your document has ~${detectedPages} pages. LinkedIn rejects documents exceeding ${MAX_PAGES} pages. Please split your document into chapters or upload a sample preview.`
        );
      }
      onDocFile(file, detectedPages);
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
          <button
            type="button"
            onClick={() => setShowGuidelines((prev) => !prev)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Info className="size-3.5" />
            <span>Specifications & Limits</span>
            {showGuidelines ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
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
              <p className="text-xs text-zinc-400">PDF, DOC, DOCX, PPT, PPTX · Max 100 MB · Up to 300 pages</p>
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
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{formatBytes(docFile.file.size)}</span>
                  {docFile.pageCount ? (
                    <>
                      <span>•</span>
                      <span className={cn(docFile.pageCount > MAX_PAGES ? "text-amber-600 font-semibold" : "")}>
                        {docFile.pageCount} pages {docFile.pageCount > MAX_PAGES ? "(Exceeds 300 limit)" : ""}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPageWarning(null);
                  onRemoveDoc();
                }}
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

        {/* Page Limit Warning */}
        {pageWarning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Document exceeds LinkedIn 300-page limit</p>
              <p>{pageWarning}</p>
            </div>
          </div>
        )}

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

        {/* Collapsible Guidelines Box */}
        {showGuidelines && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 space-y-3 text-xs text-zinc-700">
            <div className="flex items-center gap-2 font-semibold text-blue-900">
              <BookOpen className="size-4 text-blue-600" />
              <span>LinkedIn Document Specifications & Limits</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 border border-blue-100 p-2.5 rounded">
                <span className="font-semibold text-zinc-800">📄 Page Count:</span>
                <p className="text-zinc-600">Hard limit: <strong className="text-red-700">300 pages max</strong>. (Recommended: 5–15 pages for peak reader retention).</p>
              </div>
              <div className="bg-white/80 border border-blue-100 p-2.5 rounded">
                <span className="font-semibold text-zinc-800">💾 File Size:</span>
                <p className="text-zinc-600">Hard limit: <strong className="text-zinc-900">100 MB max</strong>. (Recommended: &lt;15 MB for faster mobile feeds).</p>
              </div>
              <div className="bg-white/80 border border-blue-100 p-2.5 rounded">
                <span className="font-semibold text-zinc-800">📁 Supported Formats:</span>
                <p className="text-zinc-600">PDF (<code className="text-blue-700">.pdf</code>), PowerPoint (<code className="text-blue-700">.ppt, .pptx</code>), Word (<code className="text-blue-700">.doc, .docx</code>).</p>
              </div>
              <div className="bg-white/80 border border-blue-100 p-2.5 rounded">
                <span className="font-semibold text-zinc-800">📐 Recommended Dimensions:</span>
                <p className="text-zinc-600">Portrait 4:5 (1080×1350px) or Square 1:1 for seamless mobile carousel swipe.</p>
              </div>
            </div>

            <div className="border-t border-blue-200/60 pt-2 space-y-1">
              <span className="font-semibold text-blue-900 flex items-center gap-1">
                <Layers className="size-3.5" /> Best Strategies for Large Books / Guides (300+ Pages):
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-600 pl-1">
                <li><strong>Share a Preview Carousel:</strong> Extract a 5–15 page teaser (Cover, Table of Contents, 1 Sample Story).</li>
                <li><strong>Link to Full Book:</strong> Host the full 300+ page PDF on Google Drive or your site, and add the download link in the caption.</li>
                <li><strong>Serialize by Chapters:</strong> Split the book into a series (e.g. Chapter 1, Chapter 2) across episodic posts.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
