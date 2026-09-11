"use client";
import { useModalFocus } from "./use-modal-focus";

import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";
import type { PreflightReport } from "@/lib/carousel-gen/preflight";

interface PreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PreflightReport;
  onSelectSlide: (index: number) => void;
}

export function PreflightModal({
  isOpen,
  onClose,
  report,
  onSelectSlide,
}: PreflightModalProps) {
  const modalRef = useModalFocus(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Carousel quality checks"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                report.passed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {report.passed ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Preflight Quality Check
              </h3>
              <p className="text-[11px] text-zinc-400">
                Score: {report.score}/100 • {report.errorsCount} blocking
                errors, {report.warningsCount} warnings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {report.issues.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white">Deck is Pristine!</p>
              <p className="text-xs text-zinc-400 mt-1">
                Passed contrast, readability, and mobile safe-zone validations.
              </p>
            </div>
          ) : (
            report.issues.map((issue) => {
              const isError = issue.type === "error";
              const isWarning = issue.type === "warning";

              return (
                <div
                  key={issue.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-left ${
                    isError
                      ? "bg-red-950/30 border-red-900/60"
                      : isWarning
                        ? "bg-amber-950/30 border-amber-900/60"
                        : "bg-blue-950/30 border-blue-900/60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {issue.title}
                      </span>
                      <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  {issue.slideIndex !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSlide(issue.slideIndex!);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 shrink-0"
                    >
                      Jump to Slide
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
