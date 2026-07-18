"use client";

import { useEffect, useState } from "react";
import { BioRenderer } from "@/components/dashboard/link-in-bio/bio-renderer";
import {
  Bio,
  getBio,
  trackView,
  trackLinkClick,
  getCurrentUsername,
  newLinkId,
} from "@/lib/link-in-bio/store";

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
    platform: (platform as Bio["socialLinks"][number]["platform"]),
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

type Props = {
  username: string;
};

export default function LinkInBioPublicClient({ username }: Props) {
  const [bio, setBio] = useState<Bio | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/link-in-bio/by-username/${username}`);
        if (res.ok) {
          const data = (await res.json()) as { bio?: ApiLinkInBio };
          if (cancelled) return;
          if (data.bio) {
            setBio(apiBioToLocal(username, data.bio));
            trackView(username);
            setIsOwner(getCurrentUsername() === username);
            setHydrated(true);
            return;
          }
        }
      } catch {
        // fall through to localStorage
      }
      if (cancelled) return;
      const b = getBio(username);
      if (!b) {
        setNotFound(true);
      } else {
        setBio(b);
        trackView(username);
      }
      setIsOwner(getCurrentUsername() === username);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [username]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse size-12 rounded-full bg-zinc-200" />
      </div>
    );
  }

  if (notFound || !bio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="size-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          <span className="text-white text-xl font-bold">?</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">@{username} is available</h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-md text-center">
          This username isn&apos;t claimed yet on PostPlanify. Want to claim it for your own bio page?
        </p>
        <a
          href="/dashboard/link-in-bio"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-4 h-10 text-sm font-semibold"
        >
          Create your bio page
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <main className="flex-1 w-full">
        <LinkInterceptor username={username} bio={bio} />
      </main>
      <footer className="w-full py-6 text-center text-xs text-zinc-500">
        <a
          href="https://postplanify.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Powered by PostPlanify
        </a>
      </footer>
      {isOwner && (
        <div className="fixed top-3 right-3 z-50">
          <a
            href="/dashboard/link-in-bio"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/90 backdrop-blur px-3 h-8 text-xs font-medium text-white shadow-lg hover:bg-zinc-900"
          >
            Edit profile
          </a>
        </div>
      )}
    </div>
  );
}

function LinkInterceptor({
  bio,
}: {
  username: string;
  bio: Bio;
}) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a[data-link-id]") as HTMLAnchorElement | null;
      if (!target) return;
      const linkId = target.getAttribute("data-link-id");
      if (linkId) trackLinkClick(bio.username, linkId);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [bio.username]);

  return <BioRenderer bio={bio} interactive={true} />;
}