"use client";

import { useState } from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Label {
  id: number;
  name: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

const SEED_LABELS: Label[] = [
  { id: 1, name: "HHT", bgClass: "bg-red-100", textClass: "text-red-700", dotClass: "bg-red-500" },
];

// Live site uses 8 color swatches: red, orange, yellow, green, blue, purple, pink, indigo
const COLOR_OPTIONS = [
  { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", hex: "#ef4444" },
  { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", hex: "#f97316" },
  { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", hex: "#f59e0b" },
  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", hex: "#10b981" },
  { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", hex: "#3b82f6" },
  { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", hex: "#8b5cf6" },
  { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500", hex: "#ec4899" },
  { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", hex: "#6366f1" },
];

interface LabelsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LabelsDrawer({ open, onClose }: LabelsDrawerProps) {
  const [labels, setLabels] = useState<Label[]>(SEED_LABELS);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Label | null>(null);

  function handleCreate(name: string, colorIdx: number) {
    const color = COLOR_OPTIONS[colorIdx];
    setLabels((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        bgClass: color.bg,
        textClass: color.text,
        dotClass: color.dot,
      },
    ]);
  }

  function handleEdit(id: number, name: string, colorIdx: number) {
    const color = COLOR_OPTIONS[colorIdx];
    setLabels((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, name, bgClass: color.bg, textClass: color.text, dotClass: color.dot } : l
      )
    );
  }

  function handleDelete(id: number) {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Labels"
        icon={<Tag className="w-5 h-5" />}
      >
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Label
        </button>

        <div className="mt-6 space-y-3">
          {labels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No labels yet</p>
            </div>
          ) : (
            labels.map((label) => (
              <div
                key={label.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full font-medium px-2 py-0.5 text-xs",
                      label.bgClass,
                      label.textClass
                    )}
                  >
                    <span className={cn("rounded-full w-2 h-2", label.dotClass)} />
                    {label.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(label)}
                      className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground rounded-md text-xs h-7 w-7 p-0"
                      aria-label={`Edit ${label.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent rounded-md text-xs h-7 w-7 p-0 text-destructive hover:text-destructive"
                      aria-label={`Delete ${label.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>

      <LabelFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(name, colorIdx) => {
          handleCreate(name, colorIdx);
          setCreating(false);
        }}
      />
      <LabelFormDialog
        open={!!editing}
        title="Edit Label"
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={(name, colorIdx) => {
          if (editing) handleEdit(editing.id, name, colorIdx);
          setEditing(null);
        }}
      />
    </>
  );
}

function LabelFormDialog({
  open,
  title = "Create Label",
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title?: string;
  initial?: Label | null;
  onClose: () => void;
  onSave: (name: string, colorIdx: number) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [colorIdx, setColorIdx] = useState(
    initial ? COLOR_OPTIONS.findIndex((c) => c.dot === initial.dotClass) : 4
  );

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="sm:max-w-[425px]">
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <label htmlFor="label-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="label-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Urgent, Promotion"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setColorIdx(i)}
                className={cn(
                  "size-7 rounded-full transition-all",
                  colorIdx === i ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-110"
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={`Color ${i}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-2 sm:mt-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => name.trim() && onSave(name.trim(), colorIdx)}
          disabled={!name.trim()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
        >
          {initial ? "Save changes" : "Create"}
        </button>
      </div>
    </Dialog>
  );
}
