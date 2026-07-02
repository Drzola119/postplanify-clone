"use client";

import { useState } from "react";
import { Plus, Hash, Pencil, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";

interface HashtagSet {
  id: number;
  name: string;
  tags: string[];
}

interface HashtagsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function HashtagsDrawer({ open, onClose }: HashtagsDrawerProps) {
  const [sets, setSets] = useState<HashtagSet[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<HashtagSet | null>(null);

  function handleCreate(name: string, tags: string[]) {
    setSets((prev) => [...prev, { id: Date.now(), name, tags }]);
  }

  function handleEdit(id: number, name: string, tags: string[]) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, name, tags } : s)));
  }

  function handleDelete(id: number) {
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Hashtag Sets"
        icon={<Hash className="w-5 h-5" />}
      >
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Set
        </button>

        <div className="mt-6 space-y-3">
          {sets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hash className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hashtag sets yet</p>
            </div>
          ) : (
            sets.map((set) => (
              <div
                key={set.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{set.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{set.tags.length} tags</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(set)}
                      className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground rounded-md text-xs h-7 w-7 p-0"
                      aria-label={`Edit ${set.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(set.id)}
                      className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent rounded-md text-xs h-7 w-7 p-0 text-destructive hover:text-destructive"
                      aria-label={`Delete ${set.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {set.tags.slice(0, 5).map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
                    >
                      {t.startsWith("#") ? t : `#${t}`}
                    </span>
                  ))}
                  {set.tags.length > 5 ? (
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5">
                      +{set.tags.length - 5} more
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>

      <HashtagSetDialog
        open={creating}
        title="Create Hashtag Set"
        onClose={() => setCreating(false)}
        onSave={(name, tags) => {
          handleCreate(name, tags);
          setCreating(false);
        }}
      />
      <HashtagSetDialog
        open={!!editing}
        title="Edit Hashtag Set"
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={(name, tags) => {
          if (editing) handleEdit(editing.id, name, tags);
          setEditing(null);
        }}
      />
    </>
  );
}

function HashtagSetDialog({
  open,
  title = "Create Hashtag Set",
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title?: string;
  initial?: HashtagSet | null;
  onClose: () => void;
  onSave: (name: string, tags: string[]) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tagsText, setTagsText] = useState(
    (initial?.tags ?? []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")
  );

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="sm:max-w-[500px]">
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <label htmlFor="set-name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="set-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Marketing Hashtags"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="set-tags" className="text-sm font-medium">
            Hashtags
          </label>
          <textarea
            id="set-tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="#marketing #socialmedia #content"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Separate hashtags with spaces
          </p>
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
          onClick={() => {
            const trimmedName = name.trim();
            if (!trimmedName) return;
            const tags = tagsText
              .split(/\s+/)
              .map((t) => t.trim())
              .filter((t) => t.length > 0);
            onSave(trimmedName, tags);
          }}
          disabled={!name.trim()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
        >
          {initial ? "Save changes" : "Create"}
        </button>
      </div>
    </Dialog>
  );
}
