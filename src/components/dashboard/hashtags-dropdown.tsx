"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Search, Plus, X, Star, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashtagGroup {
  id: string;
  name: string;
  tags: string[];
  starred?: boolean;
}

const DEFAULT_GROUPS: HashtagGroup[] = [
  {
    id: "default",
    name: "Default",
    tags: ["#socialmedia", "#marketing", "#contentcreator", "#digitalmarketing", "#growth", "#smallbusiness"],
    starred: true,
  },
  {
    id: "brand",
    name: "Brand",
    tags: ["#yourbrand", "#brandstory", "#behindthescenes"],
  },
  {
    id: "product",
    name: "Product launch",
    tags: ["#newproduct", "#launchday", "#comingsoon"],
  },
  {
    id: "community",
    name: "Community",
    tags: ["#communityfirst", "#thankful", "#customerlove"],
  },
];

const STORAGE_KEY = "postplanify.hashtagGroups.v1";

interface HashtagsDropdownProps {
  onInsert: (tags: string[]) => void;
  /** Optional alignment hint for the dropdown panel (unused by component but accepted for API consistency) */
  align?: "left" | "right";
  /** Optional size variant hint (unused by component but accepted for API consistency) */
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HashtagsDropdown({ onInsert }: HashtagsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<HashtagGroup[]>(DEFAULT_GROUPS);
  const [activeId, setActiveId] = useState<string>(DEFAULT_GROUPS[0].id);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount; merge with defaults so newly added
  // built-in groups still appear.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const userIds = new Set(parsed.map((g: HashtagGroup) => g.id));
        const merged = [
          ...DEFAULT_GROUPS.filter((g) => !userIds.has(g.id)),
          ...parsed,
        ];
        setGroups(merged);
        if (parsed[0]?.id) setActiveId(parsed[0].id);
      }
    } catch {
      // Fall through to defaults.
    }
  }, []);

  // Persist whenever the user-visible groups change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch {
      // Quota exceeded — best-effort.
    }
  }, [groups]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = groups.find((g) => g.id === activeId) ?? groups[0];
  const filtered = active?.tags.filter((t) => t.toLowerCase().includes(query.toLowerCase())) ?? [];

  function handleInsert() {
    if (!active) return;
    onInsert(active.tags);
    setOpen(false);
  }

  function handleInsertOne(tag: string) {
    onInsert([tag]);
    setOpen(false);
  }

  function toggleStar(id: string) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, starred: !g.starred } : g)));
  }

  function commitNewGroup() {
    const name = newName.trim();
    if (!name) return;
    const tags = newTags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
    if (tags.length === 0) return;
    const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const created: HashtagGroup = { id, name, tags };
    setGroups((prev) => [...prev, created]);
    setActiveId(id);
    setCreating(false);
    setNewName("");
    setNewTags("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
      >
        <Hash className="size-3.5" />
        Hashtags
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Hashtags"
          className="absolute right-0 top-9 z-50 w-[480px] rounded-lg border border-zinc-200 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-zinc-200">
            <div>
              <h3 className="text-sm font-semibold">Hashtag groups</h3>
              <p className="text-xs text-zinc-500">Insert a saved group or browse tags.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-[160px_1fr] min-h-[260px] max-h-[400px]">
            {/* Group list */}
            <div className="border-r border-zinc-200 py-2 overflow-y-auto">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer text-sm",
                    g.id === activeId ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50"
                  )}
                  onClick={() => setActiveId(g.id)}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Folder className="size-3.5 text-zinc-400" />
                    {g.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(g.id);
                    }}
                    aria-label={g.starred ? "Unstar group" : "Star group"}
                    className="text-zinc-400 hover:text-amber-500"
                  >
                    <Star className={cn("size-3.5", g.starred && "fill-amber-400 text-amber-500")} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 w-full text-left"
              >
                <Plus className="size-3.5" />
                New group
              </button>
            </div>

            {/* Active group */}
            <div className="p-3 space-y-3 overflow-y-auto">
              {creating ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-700">New group</p>
                  <input
                    type="text"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Group name"
                    className="w-full h-8 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                  />
                  <textarea
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder={"#tag1 #tag2 #tag3"}
                    rows={3}
                    className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewName(""); setNewTags(""); }}
                      className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 h-8 text-xs font-medium hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={commitNewGroup}
                      disabled={!newName.trim() || !newTags.trim()}
                      className="inline-flex items-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-3 h-8 text-xs font-medium disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search tags…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-8 pr-3 h-9 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <p className="text-xs text-zinc-500 px-1 py-2">No tags match.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {filtered.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleInsertOne(t)}
                          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 h-7 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span>{active?.tags.length ?? 0} tags in {active?.name}</span>
                    <button
                      type="button"
                      onClick={handleInsert}
                      disabled={!active}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-3 h-8 text-xs font-medium disabled:opacity-50"
                    >
                      Insert all
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
