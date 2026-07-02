/* Page-specific data extracted from production on 2026-06-28.
   Each constant replaces the generic FEATURE_CARDS / HOW_IT_WORKS_3 / USE_CASES_3 arrays
   so each feature page renders the exact features/steps/use-cases/why-choose blocks
   that production shows for that page.

   Production uses MUI Material icons rendered inside colored rounded containers
   (w-9 h-9 rounded-lg bg-{color}-100, with 20px SVG inside). We map those to
   Lucide equivalents for the clone. iconBg/iconText drive the container colors. */

import {
  Calendar, LayoutGrid, Eye, MessageCircle, Tag, ListOrdered,
  Smartphone, TrendingUp, Clock, Trophy, BarChart3, LayoutDashboard,
  Inbox, Reply, Sparkles, Smile, Bookmark, UserPlus, EyeOff,
  Users, AtSign, Shield, CheckCircle, Bell, Lock,
  TextCursor, SlidersHorizontal, Image as ImageIcon, Video, Palette, Paintbrush,
  FileText, ArrowLeftRight, Network, UploadCloud, FolderOpen, Wand2,
  Infinity as InfinityIcon, Link as LinkIcon, Briefcase,
  MousePointerClick as TouchAppIcon, HelpCircle as HelpIcon, Settings as SettingsIcon,
} from "lucide-react";

/* ============================ FEATURES GRID CARDS ============================ */

export const FG_CARDS_CONTENT_CALENDAR = [
  { icon: Calendar, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Monthly, weekly, and list views", description: "See the big picture or zoom into a single week. Filter by platform, status, or label." },
  { icon: LayoutGrid, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Bulk schedule up to 20 posts", description: "Upload media, customize each post, auto-assign dates, and schedule everything in one batch." },
  { icon: Eye, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Platform-specific previews", description: "See exactly how your post will look on each platform before it goes live. Real-time character counts included." },
  { icon: MessageCircle, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "First comments and threads", description: "Schedule a first comment to publish right after your post. Create threaded replies on X, Threads, and LinkedIn." },
  { icon: Tag, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "Hashtag manager", description: "Save hashtag sets and insert them into captions with one click. No more copying and pasting." },
  { icon: ListOrdered, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Post queue with time slots", description: "Set up recurring time slots and add posts to your queue. They go out automatically at the next available slot." },
];

export const FG_CARDS_ANALYTICS = [
  { icon: Smartphone, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "10 platforms in one dashboard", description: "Instagram, TikTok, X, YouTube, Facebook, LinkedIn, Pinterest, Threads, Bluesky, and Google Business. All in one place." },
  { icon: TrendingUp, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Historical trends", description: "Daily snapshots track your growth over 7, 14, 30, or 90 days. See how your metrics change over time." },
  { icon: Clock, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Best times to post", description: "A heatmap shows when your audience engages most so you can post at the right time." },
  { icon: Trophy, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Top performing posts", description: "See which posts are growing fastest. Ranked by recent engagement, not just lifetime numbers." },
  { icon: BarChart3, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "Per-post metrics", description: "Views, likes, comments, shares, and engagement rate for every post you publish." },
  { icon: LayoutDashboard, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Brand overview", description: "One view across all connected accounts. Total followers, views, engagement, and platform breakdown." },
];

export const FG_CARDS_SOCIAL_INBOX = [
  { icon: Inbox, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Comments and DMs, one feed", description: "Every comment and direct message across your connected accounts in a single view. No more app switching." },
  { icon: Reply, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Reply instantly", description: "Respond directly from your dashboard. Your reply goes live on the platform right away." },
  { icon: Sparkles, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Brand-tone AI replies", description: "One click drafts a reply in your brand's voice — review, tweak, and send." },
  { icon: Smile, iconBg: "bg-pink-100", iconText: "text-pink-600", tag: undefined, title: "Sentiment at a glance", description: "Every comment is auto-tagged positive, neutral, or negative — so you can read the room and triage fast." },
  { icon: Bookmark, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Labels and filters", description: "Organize comments with custom labels. Filter to find what needs attention." },
  { icon: UserPlus, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "Assign to teammates", description: "Route comments to the right person. They get notified instantly." },
  { icon: Bookmark, iconBg: "bg-teal-100", iconText: "text-teal-600", tag: undefined, title: "Saved replies", description: "Create reusable reply templates. Pick from your library and respond in seconds." },
  { icon: EyeOff, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Hide and delete", description: "Moderate comments without leaving your dashboard." },
];

export const FG_CARDS_TEAM_COLLABORATION = [
  { icon: Users, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Team members included", description: "Up to 3 members on Growth, 6 on Premium, 12 on Scale, or unlimited on Enterprise. No per-seat fees." },
  { icon: MessageCircle, iconBg: "bg-indigo-100", iconText: "text-indigo-600", tag: undefined, title: "Team comments on posts", description: "Discuss drafts in-context with threaded replies. Edit, delete, and full history kept for audit trails." },
  { icon: AtSign, iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-600", tag: undefined, title: "@mentions of teammates", description: "Tag a teammate by name and they get pinged in-app and via email. No more lost feedback in Slack." },
  { icon: Shield, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "5 roles with granular permissions", description: "Owner, Admin, Editor, Viewer, and Client. Control who can create, edit, approve, and publish." },
  { icon: CheckCircle, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Multi-approver workflows", description: "Designate specific people to approve each post. Nothing publishes until everyone signs off." },
  { icon: Calendar, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Shared content calendar", description: "Your whole team sees the same calendar. No more spreadsheets or back-and-forth messages." },
  { icon: Bell, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "Automatic notifications", description: "Approvers get notified when a post needs their review. Creators get notified when it's approved or rejected." },
  { icon: Lock, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "No password sharing", description: "Social accounts are connected through official APIs. Team members never see your login credentials." },
];

export const FG_CARDS_AI_ASSISTANT = [
  { icon: Eye, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Vision-powered captions", description: "Upload images or videos. The AI sees what's in them and writes captions that match the content, your brand, and your audience." },
  { icon: TextCursor, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Platform-optimized output", description: "Each platform gets its own caption. Instagram gets storytelling, LinkedIn gets professional tone, X stays under 280 characters." },
  { icon: SlidersHorizontal, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "7 text refinement tools", description: "Fix grammar, make concise, expand, rephrase, improve structure, simplify, or polish. Select text and pick an option." },
  { icon: Sparkles, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "6 writing tones", description: "Default, friendly, funny, bold, professional, and motivational. Each tone changes the style, not just a few words." },
  { icon: ImageIcon, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "AI image generation", description: "7 models from fast to photorealistic. Generate images in 5 aspect ratios and use them directly in your posts." },
  { icon: Video, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Video and audio analysis", description: "Videos are analyzed frame by frame. Audio is transcribed automatically. Both feed into caption generation for accurate results." },
];

export const FG_CARDS_REPORTING = [
  { icon: Sparkles, iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-600", tag: undefined, title: "AI summary on every report", description: "Each report opens with an AI-written recap — a plain-English summary of what changed plus the key highlights, generated from your real numbers." },
  { icon: Palette, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Truly white-label on Scale", description: "Remove every PostPlanify logo and footer mention. Replace the footer with your own line of text. Your agency, end to end." },
  { icon: Paintbrush, iconBg: "bg-pink-100", iconText: "text-pink-600", tag: undefined, title: "Your logo and accent color", description: "Reports pick up your brand logo and a custom hex accent color you set once. Every chart, table, and section header uses it." },
  { icon: FileText, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "3-page PDF, web view, or share link", description: "Overview, trends, and top posts in one PDF. Or share a browser-friendly link — responsive, dark-mode ready, no login." },
  { icon: ArrowLeftRight, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Compare any period you want", description: "Compare against the previous period, the same period last year, week over week, or a custom range. Every metric shows the change — green up, red down." },
  { icon: Trophy, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Top 10 posts by growth", description: "Ranked by views gained during the period, not lifetime totals. Thumbnail, caption, platform, and full metrics on every row." },
  { icon: Network, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "10 platforms aggregated", description: "Instagram, TikTok, X, YouTube, Facebook, LinkedIn, Pinterest, Threads, Bluesky, and Google Business — all in one report." },
  { icon: Clock, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Send on autopilot", description: "Schedule weekly or monthly delivery to your team and clients. Set it up once and forget about it. Pause or edit anytime." },
];

export const FG_CARDS_MEDIA_LIBRARY = [
  { icon: UploadCloud, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Upload anything", description: "Images (JPEG, PNG, GIF, WebP, HEIC), videos (MP4, MOV), and PDFs. Up to 4GB per file. HEIC auto-converts to JPEG." },
  { icon: Palette, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Import from Canva", description: "Pull designs directly from your Canva account into your media library. No downloading and re-uploading." },
  { icon: FolderOpen, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Import from Google Drive", description: "Connect Google Drive and import files with one click. Keep your assets in sync." },
  { icon: Tag, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Folders and color-coded tags", description: "Organize media into folders and tag files with 8 color options. Filter by type, folder, or tag to find anything instantly." },
  { icon: LayoutGrid, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "Grid and list views", description: "Switch between a visual grid and a detailed list. Sort by date, size, or name." },
  { icon: Wand2, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Auto-optimized uploads", description: "Images are automatically optimized and downscaled. Video covers are generated automatically. HEIC files convert on upload." },
];

export const FG_CARDS_LINK_IN_BIO = [
  { icon: InfinityIcon, iconBg: "bg-blue-100", iconText: "text-blue-600", tag: undefined, title: "Unlimited links", description: "Add as many links as you want. No caps, no upgrades needed." },
  { icon: Palette, iconBg: "bg-violet-100", iconText: "text-violet-600", tag: undefined, title: "Pre-built themes", description: "Pick a theme and your page looks good instantly. No design skills required." },
  { icon: BarChart3, iconBg: "bg-emerald-100", iconText: "text-emerald-600", tag: undefined, title: "Click analytics", description: "See page views and which links get clicked. Know what your audience cares about." },
  { icon: LinkIcon, iconBg: "bg-amber-100", iconText: "text-amber-600", tag: undefined, title: "Custom URL", description: "Your page lives at postplanify.com/@yourname. Clean and easy to remember." },
  { icon: Briefcase, iconBg: "bg-rose-100", iconText: "text-rose-600", tag: undefined, title: "One page per brand", description: "Manage multiple clients or brands. Each one gets its own separate bio page." },
  { icon: Smartphone, iconBg: "bg-cyan-100", iconText: "text-cyan-600", tag: undefined, title: "Mobile-optimized", description: "Pages load fast and look right on every screen size." },
];

/* ============================ HOW IT WORKS STEPS ============================ */

export const HIW_CONTENT_CALENDAR = [
  { title: "Connect your accounts", description: "Link all your social accounts in minutes." },
  { title: "Create and schedule", description: "Write, add media, pick a time. Or bulk schedule up to 20 posts at once." },
  { title: "Publish automatically", description: "Posts go live on time. Track it all from your calendar." },
];

export const HIW_ANALYTICS = [
  { title: "Connect your accounts", description: "Link your social accounts to PostPlanify." },
  { title: "Data syncs on its own", description: "Metrics update automatically in the background — no manual refresh." },
  { title: "See what's working", description: "Open one dashboard and track growth across every platform." },
];

export const HIW_SOCIAL_INBOX = [
  { title: "Connect your accounts", description: "Link your social accounts to PostPlanify." },
  { title: "Conversations sync on their own", description: "New comments and DMs land in your inbox as they happen." },
  { title: "Reply, label, or assign", description: "Handle it all from one place. Use AI to reply faster." },
];

export const HIW_TEAM_COLLABORATION = [
  { title: "Invite your team", description: "Send an email invite with a role. They join in one click." },
  { title: "Create and assign", description: "Members draft posts and pick approvers when needed." },
  { title: "Approve and publish", description: "Approvers sign off. Posts publish on schedule." },
];

export const HIW_AI_ASSISTANT = [
  { title: "Upload your media", description: "Add your images or video. The AI reads the visuals and audio." },
  { title: "Pick tone and platforms", description: "Choose a tone and where you're posting." },
  { title: "Generate and refine", description: "Get a caption for each platform in seconds. Tweak with one click." },
];

export const HIW_REPORTING = [
  { title: "Pick your scope", description: "Choose a date range and accounts. Defaults to all accounts, last 30 days." },
  { title: "Generate the PDF", description: "PostPlanify pulls the data, builds the charts, and brands a 3-page PDF." },
  { title: "Send it", description: "Download it, or share a link clients open in any browser — no login." },
];

export const HIW_MEDIA_LIBRARY = [
  { title: "Upload or import", description: "Drag in files, or import from Canva and Google Drive." },
  { title: "Organize", description: "Sort into folders and add color tags so everything's easy to find." },
  { title: "Use in posts", description: "Pull any file straight into a post. No re-uploading." },
];

export const HIW_LINK_IN_BIO = [
  { title: "Pick your slug", description: "Choose a name for your page like @yourname." },
  { title: "Add your links", description: "Drop in as many links as you need and pick a theme." },
  { title: "Share it", description: "Paste the URL in your bio. Done." },
];

/* ============================ USE CASES ITEMS ============================ */

export const UC_CONTENT_CALENDAR = [
  { title: "Creators", description: "Batch a week of content in one sitting. Schedule across platforms and move on to creating." },
  { title: "Small businesses", description: "Plan campaigns ahead of time. See everything scheduled at a glance without switching tools." },
  { title: "Agencies", description: "Manage multiple brands from one calendar. Team members create, clients approve, posts go live on time." },
];

export const UC_ANALYTICS = [
  { title: "Creators", description: "See which posts drive followers and engagement. Double down on what works." },
  { title: "Small Businesses", description: "Track what content brings clicks and attention. Stop guessing, start measuring." },
  { title: "Agencies", description: "Monitor all client accounts from one dashboard. Spot trends across brands." },
];

export const UC_SOCIAL_INBOX = [
  { title: "Creators", description: "Reply faster and build community without opening multiple apps." },
  { title: "Small Businesses", description: "Never miss a customer question or complaint. Respond quickly and keep conversations organized." },
  { title: "Agencies", description: "Assign comments per client, label, and filter. Everything stays organized across brands." },
];

export const UC_TEAM_COLLABORATION = [
  { title: "Creators with a team", description: "Let your editor or VA schedule posts while you focus on creating content. Approve before anything goes live." },
  { title: "Small businesses", description: "Give your marketing person access to post without sharing passwords. Keep control with approval workflows." },
  { title: "Agencies", description: "Manage multiple brands with different team members. Let clients approve their own content before publishing." },
];

export const UC_AI_ASSISTANT = [
  { title: "Creators", description: "Write captions faster so you can focus on creating content. Let AI match your tone across platforms." },
  { title: "Small businesses", description: "Generate product captions from photos. No copywriter needed." },
  { title: "Agencies", description: "Generate captions in bulk across brands. Refine each one to match the client voice." },
];

export const UC_REPORTING = [
  { title: "Agencies", description: "Generate branded reports for every client. Share via link or download the PDF. Your brand front and center." },
  { title: "Small Businesses", description: "Show stakeholders exactly how social media is performing. Clear numbers, no spreadsheets required." },
  { title: "Freelancers", description: "Send professional reports to retainer clients. Prove your value with real data every month." },
];

export const UC_MEDIA_LIBRARY = [
  { title: "Creators", description: "Keep photos, videos, and designs organized. Find the right asset in seconds when scheduling." },
  { title: "Small Businesses", description: "Store product photos, brand assets, and campaign media in one shared library." },
  { title: "Agencies", description: "Separate media by brand. Each client gets their own library, folders, and tags." },
];

export const UC_LINK_IN_BIO = [
  { title: "Creators", description: "One link in your bio to share your latest content, merch, collabs, and socials." },
  { title: "Small Businesses", description: "Send customers to your shop, booking page, menu, or reviews. All from one link." },
  { title: "Agencies", description: "Create and manage a separate bio page for each client brand from one dashboard." },
];

/* ============================ WHY CHOOSE BLOCKS ============================ */

export const WC_CONTENT_CALENDAR = [
  { title: "Why you need a social media content calendar", description: "Posting when you remember to isn't a strategy. A content calendar lets you plan ahead, stay consistent, and see gaps before they happen. When all your posts across every platform are in one place, you know exactly what's going out, when, and where. No more logging into 10 different apps to check what you've scheduled." },
  { title: "Schedule posts to 10 platforms at once", description: "PostPlanify lets you write one post and schedule it to Instagram, TikTok, X, YouTube, Facebook, LinkedIn, Pinterest, Threads, Bluesky, and Google Business at the same time. Each platform gets its own caption with the right character limits and content format. Select your accounts, pick a date, and everything goes live on schedule." },
  { title: "Bulk scheduling for content batching", description: "If you create content in batches, bulk scheduling saves hours. Upload up to 20 media files, customize captions and accounts for each one, then auto-assign dates based on how many posts per day you want. The system spreads them out across your chosen time slots. One session, an entire week or month of content scheduled." },
  { title: "Preview posts before they go live", description: "Every platform displays posts differently. Instagram crops images, X truncates text at 280 characters, LinkedIn shows link previews. PostPlanify shows you a real-time preview for every platform so you can catch formatting issues before they go live. What you see in the preview is what your audience sees." },
  { title: "First comments, threads, and hashtag management", description: "Schedule a first comment to publish right after your post for extra hashtags or context without cluttering the caption. Create threaded replies on X, Threads, and LinkedIn for longer narratives. Save your most-used hashtag sets and insert them into any caption with one click." },
  { title: "Built for teams and agencies", description: "The content calendar is shared across your team. Editors create posts, clients approve them, and everything publishes on time. Filter by brand, platform, status, or label to find what you need. Use the approval workflow to make sure nothing goes live without sign-off. Every post tracks who created it and who approved it." },
];

export const WC_ANALYTICS = [
  { title: "Why track social media analytics?", description: "Posting content without looking at the numbers means you're guessing. Analytics show you what your audience responds to, which platforms bring the most engagement, and whether your following is growing or stagnating. Without that data, you can't make informed decisions about what to post next." },
  { title: "The problem with platform-native analytics", description: "Every social platform has its own analytics section, but they're all different. Instagram shows reach, TikTok shows views, X shows impressions. Switching between 5 or 6 dashboards to understand your overall performance wastes time and makes it hard to compare. A unified dashboard puts everything in one place with consistent metrics." },
  { title: "How PostPlanify analytics work", description: "When you connect your social accounts to PostPlanify, analytics sync automatically. You get a brand overview that aggregates followers, views, and engagement across all accounts. Drill into any account to see per-post metrics, historical trend charts, and a heatmap of your best posting times. Daily snapshots track your growth over time so you can measure what actually changed over the last week, month, or quarter." },
  { title: "Instagram analytics and reporting", description: "PostPlanify tracks your Instagram followers, reach, views, saves, shares, and engagement rate in one place. See how your Reels perform compared to Stories and Carousels. Track profile visits, new follows, and Reels watch time. If you manage multiple Instagram accounts, you can compare them side by side without switching between the Instagram app's built-in insights." },
  { title: "TikTok analytics for creators and brands", description: "Track views, likes, comments, shares, and engagement rate for every TikTok video you post. PostPlanify takes daily snapshots of your TikTok follower count and total likes so you can see exactly how your account is growing over time. Use the best time to post heatmap to find when your TikTok audience is most active." },
  { title: "YouTube analytics in your dashboard", description: "Monitor subscriber growth, video views, likes, and comments for your YouTube channel. PostPlanify tracks performance for both regular videos and Shorts, so you can compare formats and focus on what drives the most engagement. Historical trend charts show how your channel metrics change week over week." },
  { title: "Multi-platform social media reporting", description: "Managing accounts on Instagram, TikTok, X, YouTube, Facebook, LinkedIn, Pinterest, Threads, Bluesky, and Google Business means dealing with 10 different analytics dashboards. PostPlanify combines all of them into one brand overview with total followers, total views, engagement breakdowns by platform, and a single top-performing posts list. For agencies managing multiple brands, each brand gets its own analytics view." },
  { title: "Track your best time to post", description: "PostPlanify analyzes your post history across every connected platform and generates a heatmap showing when your audience engages the most. Instead of guessing whether to post at 9am or 7pm, you can look at real data and schedule your content for the times that consistently get better results." },
];

export const WC_SOCIAL_INBOX = [
  { title: "Why you need a social media inbox", description: "Keeping up with comments and DMs across multiple platforms means logging into each app separately. Messages get missed, response times slow down, and conversations fall through the cracks. A unified inbox pulls everything into one feed so you can respond and stay organized without switching tools." },
  { title: "How the social inbox works", description: "Connect your social accounts. Comments and DMs sync into a single inbox automatically. Each conversation shows who wrote it, what it's connected to, and a link to the original. Reply directly from the inbox and your response goes live on the platform instantly. Use labels, filters, and read/unread tracking to stay on top of everything." },
  { title: "Brand-tone AI replies", description: "Replying to every comment takes time. The AI reply feature reads the original comment and drafts a short, natural response in your brand's voice. Set a brand voice once, and replies also draw on your brand details and most-used saved replies to stay on-brand — each brand you manage gets its own tone. Click generate, review, edit if needed, and send." },
  { title: "Know how people feel", description: "Every incoming comment is automatically analyzed and tagged as positive, neutral, or negative. See the mood of your audience at a glance, and filter the inbox by sentiment to jump straight to the comments that need a response — like negative feedback you don't want to leave waiting." },
  { title: "Built for teams", description: "Assign comments to specific team members with one click. They get notified and can filter to see only their assignments. Combined with custom labels, teams can build workflows to keep comment management organized across multiple brands." },
  { title: "Saved replies for faster responses", description: "Create a library of saved reply templates for the messages you send most often. Thank-you responses, pricing answers, support follow-ups — save them once and reuse with one click. Search your replies from the composer, pick the right one, and edit before sending. Usage tracking shows which replies your team reaches for most." },
  { title: "Comment moderation", description: "Hide or delete comments directly from the inbox. Keep your comment sections clean without opening each platform's native tools. Read/unread tracking makes sure nothing slips through." },
];

export const WC_TEAM_COLLABORATION = [
  { title: "Why social media teams need a shared workspace", description: "When multiple people manage social media for a brand, things get messy fast. Screenshots in group chats, spreadsheets for content calendars, and shared passwords for social accounts. A shared workspace gives everyone access to the same calendar, the same posts, and the same accounts without the chaos." },
  { title: "Roles and permissions for social media teams", description: "Not everyone on your team should have the same access. An editor needs to create and schedule posts but shouldn't be able to delete social accounts. A client needs to approve content but doesn't need to edit it. PostPlanify has five roles: Owner, Admin, Editor, Viewer, and Client. Each role has specific permissions so you stay in control of who can do what." },
  { title: "How post approval workflows keep your brand safe", description: "One wrong post can damage your brand. Approval workflows make sure nothing goes live without the right people reviewing it first. When creating a post in PostPlanify, you can designate specific team members as approvers. The post stays in a pending state until every approver has signed off. If someone rejects it, the creator gets notified with the reason so they can fix it." },
  { title: "No per-seat pricing", description: "Most social media tools charge per team member. That adds up fast when you have editors, designers, account managers, and clients who all need access. PostPlanify includes team members on every paid plan: Growth (3 members), Premium (6 members), Scale (12 members), and Enterprise (unlimited). Add your team without per-seat fees." },
  { title: "Team collaboration for agencies", description: "Agencies manage content for multiple brands, each with different teams and clients. PostPlanify lets you create separate workspaces for each brand, invite different team members to each one, and assign roles per workspace. A team member can be an Editor on one brand and a Viewer on another. Clients can approve their own content without seeing other brands." },
];

export const WC_AI_ASSISTANT = [
  { title: "AI caption generator that sees your content", description: "Most AI caption tools ask you to describe what you want to write about. PostPlanify is different. Upload your images or videos and the AI analyzes them directly. It sees the product, the setting, the mood, and writes captions based on what's actually in the content. Combined with your brand description and target audience, it produces captions that are relevant and on-brand without you having to explain the context." },
  { title: "Platform-specific captions in one click", description: "A caption that works on Instagram won't work on LinkedIn or X. Each platform has different character limits, audience expectations, and content styles. PostPlanify generates a separate caption for each platform you select. Instagram gets visual storytelling with line breaks. LinkedIn gets professional, insight-driven copy. X stays concise and punchy under 280 characters. TikTok gets trendy and informal. You get all of them from one generation." },
  { title: "Refine any caption with 7 AI tools", description: "Generated captions aren't always perfect on the first try. Instead of rewriting from scratch, select any text in your caption and pick from 7 refinement options: fix grammar without changing your voice, make it more concise, expand with more detail, rephrase with different words, improve the structure and readability, simplify complex language, or polish with minimal subtle tweaks. Each option preserves your original tone and personality." },
  { title: "AI image generation for social media", description: "Create images directly inside PostPlanify with 7 AI models. Flux Schnell for fast drafts, Flux Pro for balanced quality, Google Imagen for photorealistic results, Ideogram for text and logos, and Recraft for design work. Choose from 5 aspect ratios including square, portrait, and landscape. Generated images can be used in your posts immediately." },
  { title: "Built for speed and volume", description: "PostPlanify supports bulk caption generation. If you have 10 posts ready to go, generate captions for all of them in parallel. Each post gets captions tailored to its specific images and target platforms. Video processing happens in your browser so your files stay private. Audio transcription runs automatically. The whole workflow is designed to help you batch content without slowing down." },
];

export const WC_REPORTING = [
  { title: "An AI summary that writes the recap for you", description: "Numbers tell clients what happened, but they still have to interpret them. Every PostPlanify report opens with an AI-written executive summary — a short, plain-English recap of how the period went, plus the key highlights, generated from the report's real figures. It only references numbers that are actually in the data, so it stays accurate, and the headline figures are highlighted for quick scanning. It saves you writing the monthly commentary by hand, and gives clients the takeaway before the charts." },
  { title: "Why social media reporting matters", description: "Posting content is only half the job. The other half is understanding what worked. Social media reports turn raw numbers into a clear picture of performance — followers gained, views earned, engagement trends, and which posts resonated with your audience. Without regular reporting, you are making decisions based on gut feeling instead of data." },
  { title: "The problem with manual reporting", description: "Building social media reports manually means logging into each platform, screenshotting metrics, pasting them into a slide deck, and doing math to calculate growth percentages. For agencies managing 5, 10, or 20 clients, this process eats hours every month. And the result is often inconsistent — different formats, missing metrics, stale data." },
  { title: "White-label reports, not watermarked reports", description: "Most tools that call themselves white-label still slip their logo into the footer or the share page. PostPlanify lets you remove every trace of PostPlanify branding on Scale and Enterprise — and replace it with your own footer line. Set your brand logo, pick a hex accent color, and the entire PDF plus the web share view adopts your identity. Clients see your agency, not ours." },
  { title: "Custom accent color across the whole report", description: "Reports aren't just your logo pasted in the corner. Your accent color flows through summary chips, chart strokes, section headers, and the top-posts ranking. Set it once on your brand and every future report uses it. Match your brand deck exactly, without opening a PDF editor." },
  { title: "Multi-platform reporting across 10 channels", description: "PostPlanify aggregates analytics from Instagram, TikTok, X, YouTube, Facebook, LinkedIn, Pinterest, Threads, Bluesky, and Google Business — including search impressions and customer actions from Google Business Profile. The platform breakdown table shows per-account metrics side by side, so a single report replaces logging into 10 dashboards." },
  { title: "Compare against any period", description: "Choose exactly what each report compares against: the previous period of the same length, the same period last year, week over week, or a fully custom range — or turn comparison off entirely. Follower change, view growth, engagement shifts, and engagement rate trends are all shown as percentage deltas, green for growth and red for decline, with a clear label of what the comparison is. A year-end review can show year-over-year while a monthly recap shows month-over-month, all from the same report." },
  { title: "Share links that your clients will actually open", description: "Every report gets a unique public URL. Clients open it in a browser, see a responsive version of the same data with dark-mode support, and need zero account access. Links stay live for 90 days, then expire. Prefer email? Download the PDF directly from the dashboard at any time — it's stored on S3, so you can re-send the same file months later." },
  { title: "Per-account filtering for agencies", description: "Managing several client sub-accounts inside one brand? Pick exactly which connected accounts appear in a report before you generate it. Send a focused Instagram and TikTok report to one stakeholder and a full multi-platform report to another — from the same brand, same dataset." },
  { title: "Scheduled delivery on autopilot", description: "Stop generating and sending reports by hand. Set up a weekly or monthly schedule per client, pick the day and time in their timezone, and PostPlanify delivers the report automatically — to your team members and to external client emails. Each delivery includes a clickable link to the live report and the rendered PDF. Pause, edit, or delete schedules anytime from the dashboard." },
];

export const WC_MEDIA_LIBRARY = [
  { title: "Why you need a media library for social media", description: "Most teams store their social media assets across multiple places — phone galleries, shared drives, Slack threads, and download folders. When it's time to post, you spend minutes hunting for the right file instead of creating content. PostPlanify's media library gives you a single source of truth for all your brand media. Every image, video, and design lives in one place, organized and ready to use the moment you need it." },
  { title: "Import designs from Canva without leaving your scheduler", description: "Connect your Canva account to PostPlanify and browse your designs without switching tabs. Pick the design you want, import it, and it's ready to attach to a post. No more exporting from Canva, downloading to your computer, and re-uploading to your scheduler. The integration saves time on every single post, especially if you create most of your visuals in Canva." },
  { title: "Google Drive integration for your brand assets", description: "If your team stores brand assets in Google Drive, you can connect your account and import files directly into your media library. Browse your Drive folders, select the files you need, and import them with one click. It's a straightforward way to get your existing assets into your scheduling workflow without manual downloads." },
  { title: "Organize with folders and color-coded tags", description: "Create folders to group media by campaign, content type, or anything else that makes sense for your workflow. Add color-coded tags — 8 colors available — to label files across folders. Filter your entire library by file type, folder, or tag to find what you need instantly. Move files between folders individually or in bulk. The goal is simple: never lose track of a brand asset again." },
  { title: "Upload and optimize media automatically", description: "Drag and drop files up to 4GB each. PostPlanify accepts JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, and PDF files. Images are automatically optimized and downscaled for fast loading. HEIC files from iPhones are converted to JPEG on upload so they work everywhere. Video uploads get automatic cover images generated. If you need original images instead of uploads, PostPlanify also includes AI image generation that you can use directly in your posts." },
];

export const WC_LINK_IN_BIO = [
  { title: "What is a link in bio page?", description: "Most social media platforms only let you add one clickable link to your profile. A link in bio page solves that by giving you a single URL that leads to a page with all your important links. You share one link, and your audience can find everything from there: your website, shop, latest post, booking page, other social profiles, or anything else you want to point them to.", icon: TouchAppIcon, iconBg: "bg-blue-100", iconText: "text-blue-600" },
  { title: "Why do you need one?", description: "If you're active on Instagram, TikTok, X, or any platform with a single bio link, you're constantly choosing which link to show. A bio page removes that tradeoff. Instead of swapping links every time you launch something new, you keep one permanent URL in your bio and update the page behind it whenever you want. Your audience always has access to everything.", icon: HelpIcon, iconBg: "bg-violet-100", iconText: "text-violet-600" },
  { title: "How PostPlanify's link in bio works", description: "When you create a brand in PostPlanify, you can set up a bio page at postplanify.com/@yourname. Add as many links as you need, reorder them, and pick a theme that matches your brand. Every page view and link click is tracked so you can see what gets attention. If you manage multiple brands or clients, each one gets its own separate bio page. The bio page is included in every plan and works alongside the rest of PostPlanify: your content calendar, post scheduling, AI captions, and analytics. If you're looking for a Linktree alternative that does more than just a bio page, PostPlanify covers both in one tool.", icon: SettingsIcon, iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
];

/* ============================ SCHEDULER TILES ============================
   All 10 platform schedulers (Instagram, Facebook, YouTube, TikTok, X,
   LinkedIn, Threads, Pinterest, Bluesky, Google Business) share the same
   8-card "Everything you need to manage social media" tile grid. Each card
   is a colored tile with eyebrow tag, title, description, and product image. */

export const SCHED_TILES = [
  {
    tag: "Content Calendar",
    title: "One calendar. All your posts.",
    description: "Plan, edit, and reschedule across all your platforms from one drag-and-drop calendar.",
    href: "/features/content-calendar",
    image: "/images/postplanify/postplanify-dashboard.png",
    tileBg: "bg-blue-950",
    tileBorder: "border-blue-900/40",
    tileRing: "ring-blue-800/30",
    tileTagBg: "bg-blue-800/50",
    tileTagText: "text-blue-100",
    tileBodyText: "text-blue-100/80",
    colSpan: "lg:col-span-7",
  },
  {
    tag: "ADVANCED ANALYTICS",
    title: "See what actually works",
    description: "Track performance, engagement, and growth across all 10 platforms. Historical trends included.",
    href: "/features/analytics",
    image: "/images/postplanify/features__analytics.webp",
    tileBg: "bg-violet-950",
    tileBorder: "border-violet-900/40",
    tileRing: "ring-violet-800/30",
    tileTagBg: "bg-violet-800/50",
    tileTagText: "text-violet-100",
    tileBodyText: "text-violet-100/80",
    colSpan: "lg:col-span-5",
  },
  {
    tag: "SOCIAL INBOX",
    title: "Never miss a comment or DM again",
    description: "All your comments + DMs in one place. Reply, label, assign to teammates, and let AI help you respond faster.",
    href: "/features/social-inbox",
    image: "/images/postplanify/features__social-inbox.png",
    tileBg: "bg-fuchsia-950",
    tileBorder: "border-fuchsia-900/40",
    tileRing: "ring-fuchsia-800/30",
    tileTagBg: "bg-fuchsia-800/50",
    tileTagText: "text-fuchsia-100",
    tileBodyText: "text-fuchsia-100/80",
    colSpan: "lg:col-span-12",
    horizontal: true,
  },
  {
    tag: "TEAM COLLABORATION",
    title: "No per-seat pricing",
    description: "Invite team members and clients into one workspace. Shared calendar, approval workflows, post comments + @mentions and role-based permissions — flat pricing.",
    href: "/features/team-collaboration",
    image: "/images/postplanify/features__team-collaboration.webp",
    tileBg: "bg-emerald-950",
    tileBorder: "border-emerald-900/40",
    tileRing: "ring-emerald-800/30",
    tileTagBg: "bg-emerald-800/50",
    tileTagText: "text-emerald-100",
    tileBodyText: "text-emerald-100/80",
    colSpan: "lg:col-span-7",
  },
  {
    tag: "ARTIFICIAL INTELLIGENCE",
    title: "Create posts faster with AI",
    description: "Generate captions, create images, and improve your content - all with built-in AI assistant.",
    href: "/features/ai-assistant",
    image: "/images/postplanify/features__ai-features.webp",
    tileBg: "bg-amber-950",
    tileBorder: "border-amber-900/40",
    tileRing: "ring-amber-800/30",
    tileTagBg: "bg-amber-800/50",
    tileTagText: "text-amber-100",
    tileBodyText: "text-amber-100/80",
    colSpan: "lg:col-span-5",
  },
  {
    tag: "WHITE-LABEL REPORTS",
    title: "Reports your clients will actually read",
    description: "Every report carries your brand — logo, accent color, custom footer. Trend charts from all 10 platforms baked in. Download or share a link.",
    href: "/features/reporting",
    image: "/images/postplanify/features__reporting-overviews-2.png",
    tileBg: "bg-slate-950",
    tileBorder: "border-slate-800/40",
    tileRing: "ring-slate-700/30",
    tileTagBg: "bg-slate-800/50",
    tileTagText: "text-slate-100",
    tileBodyText: "text-slate-100/80",
    colSpan: "lg:col-span-12",
    horizontal: true,
  },
  {
    tag: "MEDIA LIBRARY",
    title: "All your media, organized",
    description: "Store, organize and reuse your brand assets in one shared library. Import from Canva, Google Drive or Dropbox when needed.",
    href: "/features/media-library",
    image: "/images/postplanify/features__media-library.png",
    tileBg: "bg-rose-950",
    tileBorder: "border-rose-900/40",
    tileRing: "ring-rose-800/30",
    tileTagBg: "bg-rose-800/50",
    tileTagText: "text-rose-100",
    tileBodyText: "text-rose-100/80",
    colSpan: "lg:col-span-7",
  },
  {
    tag: "LINK IN BIO",
    title: "One link for everything",
    description: "One page. All your links. Styled to match your brand.",
    href: "/features/link-in-bio",
    image: "/images/postplanify/features__link-in-bio.png",
    tileBg: "bg-cyan-950",
    tileBorder: "border-cyan-900/40",
    tileRing: "ring-cyan-800/30",
    tileTagBg: "bg-cyan-800/50",
    tileTagText: "text-cyan-100",
    tileBodyText: "text-cyan-100/80",
    colSpan: "lg:col-span-5",
  },
];
