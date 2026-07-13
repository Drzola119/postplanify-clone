"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { ClaimScreen } from "@/components/dashboard/link-in-bio/claim-screen";
import { BioRenderer } from "@/components/dashboard/link-in-bio/bio-renderer";
import {
  PageSettingsSection,
  LinksEditorSection,
  SocialLinksEditorSection,
  ThemePickerSection,
  AnalyticsSection,
  BioHeaderBar,
} from "@/components/dashboard/link-in-bio/sections";
import {
  Bio,
  getCurrentUsername,
  getBio,
  saveBio,
  getAnalytics,
  deleteBio,
  clearCurrentUsername,
  newLinkId,
} from "@/lib/link-in-bio/store";
import { Modal } from "@/components/ui/modal";

type Range = "7d" | "14d" | "30d" | "90d";

interface ApiLinkInBio {
  username?: string;
  bio?: string;
  blocks?: { type: string; data?: Record<string, unknown> }[];
  theme?: string;
  socials?: Record<string, string>;
  avatarUrl?: string;
  updatedAt?: string;
}

function apiBioToLocal(username: string, api: ApiLinkInBio): Bio {
  const linkBlocks = (api.blocks ?? []).filter((b) => b.type === "link");
  const links = linkBlocks.map((b) => {
    const data = (b.data ?? {}) as { title?: string; url?: string; enabled?: boolean };
    return {
      id: newLinkId(),
      title: data.title ?? "Untitled",
      url: data.url ?? "",
      enabled: data.enabled ?? true,
      clicks: 0,
    };
  });
  const socialLinks = Object.entries(api.socials ?? {}).map(([platform, url]) => ({
    id: `soc_${Date.now().toString(36)}_${platform}`,
    platform: (platform as
      | "instagram"
      | "twitter"
      | "tiktok"
      | "youtube"
      | "linkedin"
      | "facebook"
      | "github"
      | "email"),
    url,
  }));
  const now = Date.now();
  return {
    username,
    displayName: username,
    bio: api.bio ?? "",
    links,
    socialLinks,
    themeId: (api.theme as Bio["themeId"]) ?? "minimal-light",
    style: "rounded" as const,
    customColors: null,
    createdAt: now,
    updatedAt: api.updatedAt ? new Date(api.updatedAt).getTime() : now,
  };
}

export default function LinkInBioPage() {
  const [hydrated, setHydrated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [savedBio, setSavedBio] = useState<Bio | null>(null);
  const [analytics, setAnalytics] = useState(getAnalytics(""));
  const [range, setRange] = useState<Range>("7d");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Hydrate: prefer API, fall back to localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/link-in-bio", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { bio?: ApiLinkInBio };
          if (cancelled) return;
          if (data.bio?.username) {
            const mapped = apiBioToLocal(data.bio.username, data.bio);
            setUsername(mapped.username);
            setBio(mapped);
            setSavedBio(mapped);
            setAnalytics(getAnalytics(mapped.username));
            setHydrated(true);
            return;
          }
        }
      } catch {
        // fall through to localStorage
      }
      if (cancelled) return;
      const u = getCurrentUsername();
      if (u) {
        const b = getBio(u);
        if (b) {
          setUsername(u);
          setBio(b);
          setSavedBio(b);
          setAnalytics(getAnalytics(u));
        }
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreated = (u: string) => {
    setUsername(u);
    const b = getBio(u);
    if (b) {
      setBio(b);
      setSavedBio(b);
    }
  };

  const handleBioChange = useCallback((patch: Partial<Bio>) => {
    setBio((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSave = async () => {
    if (!bio) return;
    // Always save locally as cache; try API first.
    saveBio(bio);
    setSavedBio(bio);
    setAnalytics(getAnalytics(bio.username));
    try {
      await fetch("/api/link-in-bio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: bio.username,
          bio: bio.bio,
          blocks: bio.links.map((l) => ({
            type: "link",
            data: { title: l.title, url: l.url, enabled: l.enabled },
          })),
          theme: bio.themeId,
          socials: Object.fromEntries(bio.socialLinks.map((s) => [s.platform, s.url])),
        }),
      });
    } catch {
      // localStorage already saved; offline OK
    }
  };

  const handleDelete = async () => {
    if (!bio) return;
    deleteBio(bio.username);
    setBio(null);
    setSavedBio(null);
    setUsername(null);
    clearCurrentUsername();
    setDeleteOpen(false);
    try {
      await fetch(`/api/link-in-bio/by-username/${encodeURIComponent(bio.username)}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      // localStorage already cleared; offline OK
    }
  };

  if (!hydrated) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-48 bg-zinc-200 rounded" />
      </div>
    );
  }

  // STATE 1: Claim screen
  if (!bio || !username) {
    return <ClaimScreen onCreated={handleCreated} />;
  }

  // STATE 2: Editor dashboard
  const isDirty = JSON.stringify(bio) !== JSON.stringify(savedBio);
  const totalLinkClicks = Object.values(analytics.linkClicks).reduce(
    (sum, n) => sum + n,
    0
  );
  const linkTitleMap = bio.links.reduce<Record<string, string>>((acc, l) => {
    acc[l.id] = l.title;
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Link in Bio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create a customizable landing page for your social media profiles
          </p>
        </div>
        <BioHeaderBar
          username={bio.username}
          isDirty={isDirty}
          onSave={handleSave}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <PageSettingsSection bio={bio} onChange={handleBioChange} />
          <LinksEditorSection bio={bio} onChange={handleBioChange} />
          <SocialLinksEditorSection bio={bio} onChange={handleBioChange} />
          <ThemePickerSection bio={bio} onChange={handleBioChange} />
          <AnalyticsSection
            username={bio.username}
            totalViews={analytics.views}
            totalClicks={totalLinkClicks}
            perLinkClicks={analytics.linkClicks}
            linkTitles={linkTitleMap}
            range={range}
            onRangeChange={setRange}
          />

          {/* Delete section */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-900">
                Delete Bio Page
              </h2>
              <p className="text-xs text-red-700 mt-0.5">
                Permanently remove your bio page and all analytics data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 h-8 text-xs font-semibold"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6">
            <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
              Preview
            </p>
            <div className="mx-auto max-w-[300px] rounded-[2.5rem] bg-white shadow-xl overflow-hidden border-[10px] border-zinc-900 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 rounded-b-2xl z-10" />
              <div className="overflow-hidden max-h-[560px] overflow-y-auto">
                <BioRenderer bio={bio} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Bio Page?"
        description="This will permanently remove your bio page and all analytics data."
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="px-3 h-8 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 h-8 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Bio Page
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Your bio page at <span className="font-mono font-semibold">postplanify.com/@{bio.username}</span> will be deleted. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}