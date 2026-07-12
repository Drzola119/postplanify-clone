import { ThemeId } from "./themes";

export type BioLink = {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  clicks: number;
};

export type SocialPlatform =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "github"
  | "email";

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
};

export type StyleOption = "rounded" | "square" | "pill";

export type CustomColors = {
  background: string;
  text: string;
  button: string;
  buttonText: string;
};

export type Bio = {
  username: string;
  displayName: string;
  bio: string;
  links: BioLink[];
  socialLinks: SocialLink[];
  themeId: ThemeId;
  style: StyleOption;
  customColors: CustomColors | null;
  createdAt: number;
  updatedAt: number;
};

export type BioAnalytics = {
  username: string;
  views: number;
  linkClicks: Record<string, number>;
};

const STORAGE_KEY = "postplanify.bio.v1";
const ANALYTICS_KEY = "postplanify.bio.analytics.v1";
const USERNAME_INDEX_KEY = "postplanify.bio.usernames.v1";

const DEFAULT_COLORS: CustomColors = {
  background: "#ffffff",
  text: "#000000",
  button: "#000000",
  buttonText: "#ffffff",
};

function emptyBio(username: string): Bio {
  const now = Date.now();
  return {
    username,
    displayName: "",
    bio: "",
    links: [],
    socialLinks: [],
    themeId: "minimal-light",
    style: "rounded",
    customColors: null,
    createdAt: now,
    updatedAt: now,
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getCurrentUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("postplanify.bio.currentUsername");
}

export function setCurrentUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("postplanify.bio.currentUsername", username);
}

export function clearCurrentUsername(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("postplanify.bio.currentUsername");
}

export function getBio(username: string): Bio | null {
  const all = readJson<Record<string, Bio>>(STORAGE_KEY, {});
  return all[username] ?? null;
}

export function saveBio(bio: Bio): void {
  const all = readJson<Record<string, Bio>>(STORAGE_KEY, {});
  all[bio.username] = { ...bio, updatedAt: Date.now() };
  writeJson(STORAGE_KEY, all);
  const index = readJson<string[]>(USERNAME_INDEX_KEY, []);
  if (!index.includes(bio.username)) {
    index.push(bio.username);
    writeJson(USERNAME_INDEX_KEY, index);
  }
}

export function createBio(username: string, displayName = ""): Bio {
  const bio = emptyBio(username);
  bio.displayName = displayName || username;
  saveBio(bio);
  setCurrentUsername(username);
  return bio;
}

export function deleteBio(username: string): void {
  const all = readJson<Record<string, Bio>>(STORAGE_KEY, {});
  delete all[username];
  writeJson(STORAGE_KEY, all);
  const index = readJson<string[]>(USERNAME_INDEX_KEY, []);
  writeJson(
    USERNAME_INDEX_KEY,
    index.filter((u) => u !== username)
  );
  const a = readJson<Record<string, BioAnalytics>>(ANALYTICS_KEY, {});
  delete a[username];
  writeJson(ANALYTICS_KEY, a);
  if (getCurrentUsername() === username) clearCurrentUsername();
}

export function listBios(): Bio[] {
  const all = readJson<Record<string, Bio>>(STORAGE_KEY, {});
  return Object.values(all);
}

export function isUsernameTaken(username: string): boolean {
  const index = readJson<string[]>(USERNAME_INDEX_KEY, []);
  return index.includes(username.toLowerCase());
}

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "dashboard",
  "settings",
  "auth",
  "login",
  "signup",
  "postplanify",
  "root",
  "www",
  "app",
  "help",
  "support",
  "blog",
  "about",
  "pricing",
  "features",
]);

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

export function validateUsername(
  raw: string
): { ok: true; username: string } | { ok: false; reason: string } {
  const u = raw.trim().toLowerCase();
  if (!u) return { ok: false, reason: "Username is required" };
  if (u.length < 3) return { ok: false, reason: "Must be at least 3 characters" };
  if (u.length > 30) return { ok: false, reason: "Must be 30 characters or fewer" };
  if (!USERNAME_REGEX.test(u))
    return {
      ok: false,
      reason:
        "Use lowercase letters, numbers, underscores, or hyphens. Cannot start or end with a separator.",
    };
  if (RESERVED_USERNAMES.has(u))
    return { ok: false, reason: "This username is reserved" };
  if (isUsernameTaken(u))
    return { ok: false, reason: "This username is already taken" };
  return { ok: true, username: u };
}

export function getAnalytics(username: string): BioAnalytics {
  const all = readJson<Record<string, BioAnalytics>>(ANALYTICS_KEY, {});
  return all[username] ?? { username, views: 0, linkClicks: {} };
}

export function trackView(username: string): void {
  const all = readJson<Record<string, BioAnalytics>>(ANALYTICS_KEY, {});
  const current = all[username] ?? { username, views: 0, linkClicks: {} };
  current.views += 1;
  all[username] = current;
  writeJson(ANALYTICS_KEY, all);
}

export function trackLinkClick(username: string, linkId: string): void {
  const all = readJson<Record<string, BioAnalytics>>(ANALYTICS_KEY, {});
  const current = all[username] ?? { username, views: 0, linkClicks: {} };
  current.linkClicks[linkId] = (current.linkClicks[linkId] ?? 0) + 1;
  all[username] = current;
  writeJson(ANALYTICS_KEY, all);
}

export function newLinkId(): string {
  return `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newSocialId(): string {
  return `soc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_CUSTOM_COLORS = DEFAULT_COLORS;