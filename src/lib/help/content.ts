// Help article block model — typed representation of the live reference article structure.
// Each article is a list of ordered blocks. The renderer (LearnDrawer) walks the blocks
// in order so the visible drawer matches the reference byte-for-byte.

import type { ReactNode } from "react";

export type HelpBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; spans: InlineSpan[] }
  | { kind: "list"; ordered: boolean; items: InlineSpan[][] }
  | { kind: "image"; src: string; alt: string }
  | { kind: "callout"; tone: "tip" | "note"; spans: InlineSpan[] };

export type InlineSpan =
  | { text: string }
  | { text: string; bold?: true }
  | { text: string; link: { href: string; external?: boolean } };

export interface HelpTopic {
  id: string;
  label: string;
  blocks: HelpBlock[];
}

export interface HelpTrigger {
  label: string;
  topics: HelpTopic[];
}

export interface PageHelpConfig {
  pageId: string;
  triggers: HelpTrigger[];
}

const HASAN_AVATAR = "/hasan-cagli-profile-picture.png";
const POSTPLANIFY_LOGO = "/logo.png";

export function helpHeader(): { avatar: string; logo: string; author: string; role: string } {
  return {
    avatar: HASAN_AVATAR,
    logo: POSTPLANIFY_LOGO,
    author: "Hasan Cagli",
    role: "Founder of PostPlanify",
  };
}

// ---------------- /dashboard/posts/create ----------------

const createPostGuide: HelpTopic[] = [
  {
    id: "media-captions",
    label: "Media & Captions",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Upload images or videos from your device, Canva, or Google Drive." },
      ] },
      { kind: "paragraph", spans: [
        { text: "You can also create text-only posts for platforms like X, Threads, and Bluesky." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Each platform can have different captions, text, and hashtags." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Click the platform icons at the top to preview how your post will look on each platform before publishing." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Video Posts:", bold: true },
        { text: " Upload custom thumbnail images to use as video covers." },
      ] },
      { kind: "image", src: "/content/guidance/images/create-new-post.png", alt: "create new post" },
      { kind: "image", src: "/content/guidance/images/create-new-post.png", alt: "create new post" },
    ],
  },
  {
    id: "publishing",
    label: "Publishing & Platform Features",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Publish Now", bold: true },
        { text: " - Post immediately to selected platforms." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Schedule for Later", bold: true },
        { text: " - Choose a specific date and time." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Important:", bold: true },
        { text: " Keep your browser open while publishing - the process takes a few moments." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Platform-Specific Options:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "X (Twitter)", bold: true }, { text: " - Add first comments for CTAs/links, or post to communities instead of your profile" }],
        [{ text: "Instagram & Facebook", bold: true }, { text: " - Schedule story posts" }],
        [{ text: "YouTube", bold: true }, { text: " - Add custom titles and descriptions" }],
        [{ text: "Pinterest", bold: true }, { text: " - Select which board to post to" }],
      ] },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting Failed Posts",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Posts can fail due to expired tokens, changed credentials, or unsupported content." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Solution:", bold: true },
        { text: " Go to the " },
        { text: "Accounts page", link: { href: "/dashboard/accounts" } },
        { text: " and click " },
        { text: "Refresh", bold: true },
        { text: " to reconnect your social accounts." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Still having issues? Contact " },
        { text: "hasan@postplanify.com", link: { href: "mailto:hasan@postplanify.com" } },
      ] },
    ],
  },
];

// ---------------- /dashboard/posts/bulk-schedule ----------------

const bulkScheduleGuide: HelpTopic[] = [
  {
    id: "bulk-scheduling",
    label: "Bulk Scheduling",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Upload multiple images and videos at once and schedule them all together. Perfect for planning content in advance." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Steps:", bold: true },
      ] },
      { kind: "list", ordered: true, items: [
        [{ text: "Select your workspace" }],
        [{ text: "Pick social accounts (applies to all posts by default)" }],
        [{ text: "Upload media - drag and drop multiple images and videos" }],
        [{ text: "Customize each post - write captions, adjust platforms, or change timing" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "Date Scheduler Tool (Top Right):", bold: true },
        { text: " Set start date/time for your first post, choose intervals between posts (minutes, hours, or days), then click \"Apply to All\" to automatically assign a schedule date to all posts. You can still adjust individual post times after applying." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Keep your browser open during scheduling.", bold: true },
      ] },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting Failed Posts",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Posts can fail due to expired tokens, changed credentials, or unsupported content." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Solution:", bold: true },
        { text: " Go to the " },
        { text: "Accounts page", link: { href: "/dashboard/accounts" } },
        { text: " and click " },
        { text: "Refresh", bold: true },
        { text: " to reconnect your social accounts." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Still having issues? Contact " },
        { text: "hasan@postplanify.com", link: { href: "mailto:hasan@postplanify.com" } },
      ] },
    ],
  },
];

// ---------------- /dashboard/posts (calendar) ----------------

const calendarGuide: HelpTopic[] = [
  {
    id: "what-is-the-posts-calendar",
    label: "What is the Posts Calendar?",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Your central hub for scheduling, managing, and tracking all your social media posts across platforms. Switch between weekly and monthly views." },
      ] },
      { kind: "image", src: "/content/guidance/images/dashboard.png", alt: "Dashboard" },
    ],
  },
  {
    id: "creating-posts-from-calendar",
    label: "Creating Posts from Calendar",
    blocks: [
      { kind: "list", ordered: false, items: [
        [{ text: "Hover over empty time slots - Click \"Create Post\" button" }],
        [{ text: "Hover over existing posts - Click the \"+\" button to add more posts" }],
        [{ text: "Posts automatically inherit the selected date and time" }],
      ] },
    ],
  },
  {
    id: "managing-your-posts",
    label: "Managing Your Posts",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Basic Actions:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Drag & Drop", bold: true }, { text: " - Move posts to reschedule them" }],
        [{ text: "Click on posts", bold: true }, { text: " - View full details" }],
        [{ text: "Right-click", bold: true }, { text: " - Quick access to edit and cancel options" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "Status Colors:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Blue = Scheduled" }],
        [{ text: "Green = Published" }],
        [{ text: "Red = Cancelled" }],
      ] },
    ],
  },
  {
    id: "calendar-views",
    label: "Calendar Views",
    blocks: [
      { kind: "list", ordered: false, items: [
        [{ text: "Weekly View", bold: true }, { text: " - Hour-by-hour scheduling with current time indicator" }],
        [{ text: "Monthly View", bold: true }, { text: " - Full month overview with post counts per day" }],
        [{ text: "Timezones", bold: true }, { text: " - All times are displayed in your selected timezone" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "All times display in your selected timezone. Past time slots are grayed out." },
      ] },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting Failed Posts",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Posts can fail for several reasons:" },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Expired or invalid tokens" }],
        [{ text: "Changed account credentials" }],
        [{ text: "Platform profile updates" }],
        [{ text: "Unsupported content type" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "Fix:", bold: true },
        { text: " Go to the " },
        { text: "Accounts page", link: { href: "/dashboard/accounts" } },
        { text: " and click " },
        { text: "Refresh", bold: true },
        { text: " to reconnect your social accounts." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Still having issues? Contact " },
        { text: "hasan@postplanify.com", link: { href: "mailto:hasan@postplanify.com" } },
      ] },
    ],
  },
];

// ---------------- /dashboard/brands ----------------

const brandsGuide: HelpTopic[] = [
  {
    id: "workspaces-explained",
    label: "\"Workspaces\" explained",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "A workspace is a container for your social media accounts. Each workspace can have multiple social accounts from different platforms, and you can create posts specific to that workspace." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Common use cases:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Separate personal and business accounts" }],
        [{ text: "Manage multiple clients (for agencies)" }],
        [{ text: "Organize different brands or projects" }],
      ] },
      { kind: "image", src: "/content/guidance/images/workspaces.png", alt: "Workspaces" },
    ],
  },
  {
    id: "creating-a-workspace",
    label: "Creating a Workspace",
    blocks: [
      { kind: "list", ordered: true, items: [
        [{ text: "Click \"Create Workspace\"" }],
        [{ text: "Enter a Workspace Name (required)" }],
        [{ text: "Add your Domain (optional) - your website URL" }],
        [{ text: "Upload a Logo (optional) - helps identify the workspace visually" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "AI-Powered Setup", bold: true },
      ] },
      { kind: "paragraph", spans: [
        { text: "If you add a domain, you can click the generate icon to automatically fill in:" },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Description", bold: true }, { text: " - what your brand does, mission, and value proposition" }],
        [{ text: "Target Audience", bold: true }, { text: " - customer demographics and interests" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "These fields help PostPlanify's AI features understand your brand better for content generation." },
      ] },
      { kind: "image", src: "/content/guidance/images/workspaces-create.png", alt: "Workspaces" },
    ],
  },
  {
    id: "adding-social-accounts",
    label: "Adding Social Accounts",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "After creating a workspace, connect your social media accounts:" },
      ] },
      { kind: "list", ordered: true, items: [
        [{ text: "Go to Accounts page." }],
        [{ text: "Select workspace" }],
        [{ text: "Connect platforms: Instagram, TikTok, Facebook, LinkedIn, X, YouTube, Threads, Bluesky, Pinterest" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "You can connect accounts immediately or add them later." },
      ] },
      { kind: "image", src: "/content/guidance/images/accounts.png", alt: "Accounts" },
    ],
  },
  {
    id: "switching-between-workspaces",
    label: "Switching Between Workspaces",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Use the workspace selector in the pages to switch between different workspaces. Each workspace maintains its own:" },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Connected social accounts" }],
        [{ text: "Posts and drafts" }],
        [{ text: "Media library" }],
        [{ text: "Posting queue" }],
      ] },
      { kind: "callout", tone: "tip", spans: [
        { text: "Tips", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Start with one workspace and add more as needed" }],
        [{ text: "Use clear, descriptive names for easy identification" }],
        [{ text: "The domain field helps with AI features - add it if you plan to use AI captions or content generation" }],
      ] },
    ],
  },
];

// ---------------- /dashboard/accounts ----------------

const accountsGuide: HelpTopic[] = [
  {
    id: "connect-facebook",
    label: "Connect a Facebook account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Requirements:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Must be a Facebook Page (not a personal profile)" }],
        [{ text: "Requires Admin or Full Control access to the page" }],
      ] },
    ],
  },
  {
    id: "connect-instagram",
    label: "Connect a Instagram account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "You have 2 connection options:" },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Instagram Direct" }],
        [{ text: "Facebook Page Linked" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "Requirements:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Requires a Professional or Business account" }],
        [{ text: "Switch: Settings → Account → Switch to Professional Account" }],
      ] },
    ],
  },
  {
    id: "connect-x",
    label: "Connect a X (Twitter) account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect a X (Twitter) account to PostPlanify to schedule tweets, threads, and replies." },
      ] },
    ],
  },
  {
    id: "connect-youtube",
    label: "Connect a YouTube account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Requirements:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Phone verification required for custom thumbnails" }],
        [{ text: "Enable at: Studio → Settings → Channel → Feature Eligibility" }],
      ] },
    ],
  },
  {
    id: "connect-tiktok",
    label: "Connect a TikTok account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect a TikTok account to PostPlanify to schedule short-form videos." },
      ] },
    ],
  },
  {
    id: "connect-linkedin",
    label: "Connect a LinkedIn account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "You can connect both LinkedIn company pages and personal profiles." },
      ] },
      { kind: "paragraph", spans: [
        { text: "Requirements:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Requires Super Admin role for company pages" }],
        [{ text: "Personal profiles connect without restrictions" }],
      ] },
    ],
  },
  {
    id: "connect-threads",
    label: "Connect a Threads account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Requirements:", bold: true },
      ] },
      { kind: "list", ordered: false, items: [
        [{ text: "Log into Threads in your browser first, then connect here" }],
      ] },
    ],
  },
  {
    id: "connect-pinterest",
    label: "Connect a Pinterest account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect a Pinterest account to PostPlanify to schedule pins to your boards." },
      ] },
    ],
  },
  {
    id: "connect-bluesky",
    label: "Connect a Bluesky account",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect a Bluesky account to PostPlanify to schedule posts." },
      ] },
      { kind: "callout", tone: "note", spans: [
        { text: "Note:", bold: true },
        { text: " Bluesky connections cannot be refreshed. If you need to reconnect, you'll need to disconnect and connect again." },
      ] },
    ],
  },
];

// ---------------- /dashboard/settings (Canva) ----------------

const canvaGuide: HelpTopic[] = [
  {
    id: "what-is-canva-integration",
    label: "What is Canva Integration?",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect your Canva account to access your designs directly when creating posts. No need to download and re-upload your graphics and videos." },
      ] },
    ],
  },
  {
    id: "how-to-use",
    label: "How to Use",
    blocks: [
      { kind: "list", ordered: true, items: [
        [{ text: "Go to the Create Post page" }],
        [{ text: "Click the Canva import option" }],
        [{ text: "Browse and select your designs" }],
        [{ text: "Designs are automatically imported as images or videos" }],
      ] },
      { kind: "image", src: "/content/guidance/images/canva-import.png", alt: "Canva Integration" },
    ],
  },
  {
    id: "managing-your-connection",
    label: "Managing Your Connection",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "You can disconnect and reconnect your Canva account anytime from the Accounts page. This won't affect your existing posts, but you'll need to reconnect to access new designs." },
      ] },
      { kind: "callout", tone: "tip", spans: [
        { text: "Tip:", bold: true },
        { text: " Keep your frequently-used designs organized in Canva for quick access when creating posts." },
      ] },
      { kind: "image", src: "/content/guidance/images/canva-connection.png", alt: "Canva Connection" },
    ],
  },
];

// ---------------- /dashboard/settings (Google Drive) ----------------

const googleDriveGuide: HelpTopic[] = [
  {
    id: "what-is-google-drive-integration",
    label: "What is Google Drive Integration?",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "Connect your Google Drive account to access your files directly when creating posts. Upload and manage your media without leaving PostPlanify." },
      ] },
    ],
  },
  {
    id: "how-to-use",
    label: "How to Use",
    blocks: [
      { kind: "list", ordered: true, items: [
        [{ text: "Go to the Create Post page" }],
        [{ text: "Click the Google Drive import option" }],
        [{ text: "Browse and select files from your folders" }],
        [{ text: "Files are added directly to your post" }],
      ] },
      { kind: "paragraph", spans: [
        { text: "Supported file types:", bold: true },
        { text: " Images, videos, and other media files" },
      ] },
      { kind: "image", src: "/content/guidance/images/google-drive-import.png", alt: "Google Drive Integration" },
    ],
  },
  {
    id: "managing-your-connection",
    label: "Managing Your Connection",
    blocks: [
      { kind: "paragraph", spans: [
        { text: "You can disconnect and reconnect your Google Drive account anytime from the Accounts page. This won't affect your existing posts." },
      ] },
      { kind: "callout", tone: "tip", spans: [
        { text: "Tip:", bold: true },
        { text: " Organize your media files in Google Drive folders for easier access when creating posts." },
      ] },
      { kind: "image", src: "/content/guidance/images/google-drive-connection.png", alt: "Google Drive Connection" },
    ],
  },
];

// ---------------- registry ----------------

export const HELP_CONFIG: Record<string, PageHelpConfig> = {
  "posts/create": {
    pageId: "posts/create",
    triggers: [
      {
        label: "Page guide",
        topics: createPostGuide,
      },
    ],
  },
  "posts/bulk-schedule": {
    pageId: "posts/bulk-schedule",
    triggers: [
      {
        label: "Page guide",
        topics: bulkScheduleGuide,
      },
    ],
  },
  "posts": {
    pageId: "posts",
    triggers: [
      {
        label: "Page guide",
        topics: calendarGuide,
      },
    ],
  },
  "brands": {
    pageId: "brands",
    triggers: [
      {
        label: "Page guide",
        topics: brandsGuide,
      },
    ],
  },
  "accounts": {
    pageId: "accounts",
    triggers: [
      {
        label: "Page guide",
        topics: accountsGuide,
      },
    ],
  },
  "settings/canva": {
    pageId: "settings",
    triggers: [
      {
        label: "Canva Integration",
        topics: canvaGuide,
      },
    ],
  },
  "settings/google-drive": {
    pageId: "settings",
    triggers: [
      {
        label: "Google Drive Integration",
        topics: googleDriveGuide,
      },
    ],
  },
};

export function hasHelpConfig(pageId: string): boolean {
  return Object.prototype.hasOwnProperty.call(HELP_CONFIG, pageId);
}

export function getHelpConfig(pageId: string): PageHelpConfig | undefined {
  return HELP_CONFIG[pageId];
}