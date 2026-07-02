// tools.ts — 80 tools across 11 categories, matching production /tools page.
// Each tool: slug → ToolData with category + platform for icon + brand color.

export type Platform =
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "google-business"
  | "generic";

export type ToolKind =
  | "caption"
  | "bio"
  | "username"
  | "hashtag"
  | "engagement"
  | "safe-zone"
  | "resizer"
  | "line-break"
  | "text-formatter"
  | "character-counter"
  | "utm"
  | "emoji"
  | "money"
  | "grid"
  | "carousel"
  | "handle"
  | "feed";

export type ToolData = {
  slug: string;
  name: string;
  kind: ToolKind;
  category: string;
  platform: Platform;
  description: string;
  longDescription?: string;
  benefits?: string[];
  fields?: { name: string; label: string; placeholder?: string; type?: string }[];
  formula?: string;
};

export const PLATFORM_BRAND: Record<Platform, string> = {
  instagram: "#E1306C",
  tiktok: "#000000",
  twitter: "#000000",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  pinterest: "#E60023",
  threads: "#000000",
  bluesky: "#1185FE",
  "google-business": "#4285F4",
  generic: "#6b7280",
};

// 80 tools organized by category (matches production /tools page).
export const TOOLS: ToolData[] = [
  // Caption Generators (8)
  { slug: "instagram-caption-generator", name: "Instagram Caption Generator", kind: "caption", category: "Caption Generator", platform: "instagram", description: "Generate engaging captions for your Instagram posts, Reels, and Stories." },
  { slug: "facebook-caption-generator", name: "Facebook Caption Generator", kind: "caption", category: "Caption Generator", platform: "facebook", description: "Generate engaging captions for your Facebook posts, pages, and groups." },
  { slug: "twitter-caption-generator", name: "AI Tweet Generator", kind: "caption", category: "Caption Generator", platform: "twitter", description: "Generate viral tweets for X (Twitter) within the 280-character limit." },
  { slug: "tiktok-caption-generator", name: "TikTok Caption Generator", kind: "caption", category: "Caption Generator", platform: "tiktok", description: "Generate viral, FYP-ready captions for your TikTok videos." },
  { slug: "linkedin-caption-generator", name: "LinkedIn Post Generator", kind: "caption", category: "Caption Generator", platform: "linkedin", description: "Generate professional posts for LinkedIn thought leadership." },
  { slug: "pinterest-caption-generator", name: "Pinterest Caption Generator", kind: "caption", category: "Caption Generator", platform: "pinterest", description: "Generate SEO-optimized pin descriptions that drive traffic and saves." },
  { slug: "threads-caption-generator", name: "Threads Caption Generator", kind: "caption", category: "Caption Generator", platform: "threads", description: "Generate engaging, conversation-starting posts for Meta Threads." },
  { slug: "youtube-description-generator", name: "YouTube Description Generator", kind: "caption", category: "Caption Generator", platform: "youtube", description: "Generate SEO-optimized video descriptions that rank higher and get more views." },

  // Bio Generators (8)
  { slug: "instagram-bio-generator", name: "Instagram Bio Generator", kind: "bio", category: "Bio Generator", platform: "instagram", description: "Create aesthetic, catchy bios for your Instagram profile. 150 characters." },
  { slug: "facebook-bio-generator", name: "Facebook Bio Generator", kind: "bio", category: "Bio Generator", platform: "facebook", description: "Create compelling intros for your Facebook profile or page. 101 characters." },
  { slug: "tiktok-bio-generator", name: "TikTok Bio Generator", kind: "bio", category: "Bio Generator", platform: "tiktok", description: "Create viral, trendy bios for your TikTok profile. 80 characters." },
  { slug: "twitter-bio-generator", name: "Twitter/X Bio Generator", kind: "bio", category: "Bio Generator", platform: "twitter", description: "Create witty, impactful bios for your X profile. 160 characters." },
  { slug: "linkedin-bio-generator", name: "LinkedIn Headline Generator", kind: "bio", category: "Bio Generator", platform: "linkedin", description: "Create professional headlines that get you noticed. 220 characters." },
  { slug: "youtube-bio-generator", name: "YouTube Channel Description Generator", kind: "bio", category: "Bio Generator", platform: "youtube", description: "Create channel descriptions that convert visitors to subscribers. 1000 chars." },
  { slug: "threads-bio-generator", name: "Threads Bio Generator", kind: "bio", category: "Bio Generator", platform: "threads", description: "Create conversational, on-brand bios for your Threads profile. 150 characters." },
  { slug: "pinterest-bio-generator", name: "Pinterest Bio Generator", kind: "bio", category: "Bio Generator", platform: "pinterest", description: "Create keyword-rich bios that help people discover your profile. 160 characters." },

  // Username Generators (6)
  { slug: "instagram-username-generator", name: "Instagram Username Generator", kind: "username", category: "Username Generator", platform: "instagram", description: "Generate creative, aesthetic usernames for your Instagram profile." },
  { slug: "facebook-username-generator", name: "Facebook Username Generator", kind: "username", category: "Username Generator", platform: "facebook", description: "Create memorable usernames for your Facebook profile or page." },
  { slug: "facebook-group-name-generator", name: "Facebook Group Name Generator", kind: "username", category: "Username Generator", platform: "facebook", description: "Generate catchy, searchable names for your Facebook groups." },
  { slug: "twitter-username-generator", name: "Twitter/X Username Generator", kind: "username", category: "Username Generator", platform: "twitter", description: "Generate short, punchy handles for your X profile. 15 chars max." },
  { slug: "tiktok-username-generator", name: "TikTok Username Generator", kind: "username", category: "Username Generator", platform: "tiktok", description: "Generate trendy, catchy usernames for your TikTok profile." },
  { slug: "youtube-channel-name-generator", name: "YouTube Channel Name Generator", kind: "username", category: "Username Generator", platform: "youtube", description: "Generate brandable, memorable names for your YouTube channel." },

  // Hashtag Generators (8)
  { slug: "instagram-hashtag-generator", name: "Instagram Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "instagram", description: "Generate trending, niche, and popular hashtags for your Instagram posts." },
  { slug: "facebook-hashtag-generator", name: "Facebook Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "facebook", description: "Generate effective hashtags for your Facebook posts, pages, and groups." },
  { slug: "twitter-hashtag-generator", name: "Twitter/X Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "twitter", description: "Generate trending hashtags for your tweets and threads to join conversations." },
  { slug: "youtube-hashtag-generator", name: "YouTube Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "youtube", description: "Generate SEO hashtags for your YouTube videos and Shorts." },
  { slug: "tiktok-hashtag-generator", name: "TikTok Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "tiktok", description: "Generate viral, FYP-ready hashtags for your TikTok videos." },
  { slug: "linkedin-hashtag-generator", name: "LinkedIn Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "linkedin", description: "Generate professional hashtags for your LinkedIn posts." },
  { slug: "pinterest-hashtag-generator", name: "Pinterest Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "pinterest", description: "Generate SEO-optimized hashtags for your Pinterest pins." },
  { slug: "threads-hashtag-generator", name: "Threads Hashtag Generator", kind: "hashtag", category: "Hashtag Generator", platform: "threads", description: "Generate relevant topic tags to boost reach and join conversations on Threads." },

  // Engagement Calculators (6)
  { slug: "instagram-engagement-calculator", name: "Instagram Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "instagram", description: "Calculate your Instagram engagement rate instantly. Enter likes, comments, and followers to measure your content performance." },
  { slug: "tiktok-engagement-calculator", name: "TikTok Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "tiktok", description: "Calculate your TikTok engagement rate instantly. Enter likes, comments, and followers to measure your content performance." },
  { slug: "youtube-engagement-calculator", name: "YouTube Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "youtube", description: "Calculate your YouTube engagement rate instantly. Enter likes, comments, and views to measure your content performance." },
  { slug: "linkedin-engagement-calculator", name: "LinkedIn Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "linkedin", description: "Calculate your LinkedIn engagement rate instantly. Enter reactions, comments, shares, and clicks to measure your content performance." },
  { slug: "facebook-engagement-calculator", name: "Facebook Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "facebook", description: "Calculate your Facebook engagement rate from reactions, comments, and shares by followers or reach." },
  { slug: "twitter-engagement-calculator", name: "X (Twitter) Engagement Calculator", kind: "engagement", category: "Engagement Calculator", platform: "twitter", description: "Calculate your tweet engagement rate from likes, replies, and reposts by impressions or followers." },

  // Safe Zone (3)
  { slug: "tiktok-safe-zone-checker", name: "TikTok Safe Zone Checker", kind: "safe-zone", category: "Safe Zone", platform: "tiktok", description: "Check if your content is within TikTok's safe zone." },
  { slug: "instagram-safe-zone-checker", name: "Instagram Safe Zone Checker", kind: "safe-zone", category: "Safe Zone", platform: "instagram", description: "Check if your content is within Instagram's safe zone." },
  { slug: "youtube-shorts-safe-zone-checker", name: "YouTube Shorts Safe Zone Checker", kind: "safe-zone", category: "Safe Zone", platform: "youtube", description: "Check if your content is within YouTube Shorts' safe zone." },

  // Image Resizers (4)
  { slug: "instagram-image-resizer", name: "Instagram Image Resizer", kind: "resizer", category: "Image Resizer", platform: "instagram", description: "Resize images for Instagram posts, Stories, Reels, and profile pictures." },
  { slug: "twitter-image-resizer", name: "Twitter/X Image Resizer", kind: "resizer", category: "Image Resizer", platform: "twitter", description: "Resize images for Twitter profile pictures, headers, and tweets." },
  { slug: "pinterest-image-resizer", name: "Pinterest Image Resizer", kind: "resizer", category: "Image Resizer", platform: "pinterest", description: "Resize images for Pinterest pins, profile pictures, and board covers." },
  { slug: "linkedin-image-resizer", name: "LinkedIn Image Resizer", kind: "resizer", category: "Image Resizer", platform: "linkedin", description: "Resize images for LinkedIn profile pictures, banners, and posts." },

  // Line Break Generators (9)
  { slug: "instagram-line-break-generator", name: "Instagram Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "instagram", description: "Add line breaks to Instagram captions and bios that don't disappear." },
  { slug: "tiktok-line-break-generator", name: "TikTok Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "tiktok", description: "Add line breaks to TikTok captions and bio that actually show up." },
  { slug: "twitter-line-break-generator", name: "Twitter/X Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "twitter", description: "Add line breaks to tweets and X posts with proper spacing." },
  { slug: "facebook-line-break-generator", name: "Facebook Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "facebook", description: "Add line breaks to Facebook posts and comments with proper spacing." },
  { slug: "linkedin-line-break-generator", name: "LinkedIn Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "linkedin", description: "Format LinkedIn posts with line breaks for better readability." },
  { slug: "youtube-line-break-generator", name: "YouTube Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "youtube", description: "Add line breaks to YouTube descriptions and comments." },
  { slug: "threads-line-break-generator", name: "Threads Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "threads", description: "Add line breaks to Threads posts with proper spacing." },
  { slug: "pinterest-line-break-generator", name: "Pinterest Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "pinterest", description: "Add line breaks to Pinterest pin and board descriptions." },
  { slug: "bluesky-line-break-generator", name: "Bluesky Line Break Generator", kind: "line-break", category: "Line Break Generator", platform: "bluesky", description: "Add line breaks to Bluesky posts with proper spacing." },

  // Text Formatters (9)
  { slug: "linkedin-text-formatter", name: "LinkedIn Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "linkedin", description: "Format LinkedIn posts with bold, italic, and special Unicode text styles." },
  { slug: "instagram-text-formatter", name: "Instagram Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "instagram", description: "Style Instagram captions and bio with bold, italic, and aesthetic fonts." },
  { slug: "twitter-text-formatter", name: "Twitter/X Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "twitter", description: "Format tweets with bold, italic, and special Unicode text styles." },
  { slug: "facebook-text-formatter", name: "Facebook Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "facebook", description: "Format Facebook posts with bold, italic, and special Unicode text styles." },
  { slug: "tiktok-text-formatter", name: "TikTok Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "tiktok", description: "Style TikTok captions and bio with bold, italic, and aesthetic fonts." },
  { slug: "threads-text-formatter", name: "Threads Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "threads", description: "Format Threads posts with bold, italic, and special Unicode text styles." },
  { slug: "bluesky-text-formatter", name: "Bluesky Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "bluesky", description: "Format Bluesky posts with bold, italic, and special Unicode text styles." },
  { slug: "youtube-text-formatter", name: "YouTube Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "youtube", description: "Format YouTube descriptions and comments with bold, italic, and Unicode text styles." },
  { slug: "pinterest-text-formatter", name: "Pinterest Text Formatter", kind: "text-formatter", category: "Text Formatter", platform: "pinterest", description: "Format Pin titles and descriptions with bold, italic, and Unicode text styles." },

  // Character Counters (11)
  { slug: "social-media-character-counter", name: "Social Media Character Counter", kind: "character-counter", category: "Character Counter", platform: "generic", description: "Count once and check your post against every platform limit at the same time." },
  { slug: "twitter-character-counter", name: "X (Twitter) Character Counter", kind: "character-counter", category: "Character Counter", platform: "twitter", description: "Count tweets against the 280-character limit and bios against 160." },
  { slug: "instagram-character-counter", name: "Instagram Character Counter", kind: "character-counter", category: "Character Counter", platform: "instagram", description: "Track caption (2,200), bio (150), and username length with a live truncation preview." },
  { slug: "tiktok-character-counter", name: "TikTok Character Counter", kind: "character-counter", category: "Character Counter", platform: "tiktok", description: "Count caption (4,000) and bio (80) characters so your text never gets cut off." },
  { slug: "linkedin-character-counter", name: "LinkedIn Character Counter", kind: "character-counter", category: "Character Counter", platform: "linkedin", description: "Stay within the post (3,000), headline (220), and about (2,600) limits." },
  { slug: "facebook-character-counter", name: "Facebook Character Counter", kind: "character-counter", category: "Character Counter", platform: "facebook", description: "Count post, intro, and comment length and see where 'See more' cuts your post." },
  { slug: "youtube-character-counter", name: "YouTube Character Counter", kind: "character-counter", category: "Character Counter", platform: "youtube", description: "Optimize titles (100) and descriptions (5,000) for search and the watch page." },
  { slug: "threads-character-counter", name: "Threads Character Counter", kind: "character-counter", category: "Character Counter", platform: "threads", description: "Count characters against the 500-character post and 150-character bio limits." },
  { slug: "pinterest-character-counter", name: "Pinterest Character Counter", kind: "character-counter", category: "Character Counter", platform: "pinterest", description: "Track Pin title (100), description (500), and bio (160) length for better reach." },
  { slug: "bluesky-character-counter", name: "Bluesky Character Counter", kind: "character-counter", category: "Character Counter", platform: "bluesky", description: "Count characters against the 300-character post and 256-character bio limits." },
  { slug: "google-business-character-counter", name: "Google Business Character Counter", kind: "character-counter", category: "Character Counter", platform: "google-business", description: "Stay within the description (750), post (1,500), and review-reply (4,096) limits." },

  // Other (8)
  { slug: "utm-generator", name: "UTM Generator", kind: "utm", category: "Marketing Utility", platform: "generic", description: "Create tracking URLs with UTM parameters for your marketing campaigns." },
  { slug: "emoji-translator", name: "Emoji Translator", kind: "emoji", category: "Marketing Utility", platform: "generic", description: "Convert text to emojis or decode emoji messages to text with AI." },
  { slug: "tiktok-money-calculator", name: "TikTok Money Calculator", kind: "money", category: "Marketing Utility", platform: "tiktok", description: "Estimate your TikTok earnings and income potential." },
  { slug: "instagram-grid-maker", name: "Instagram Grid Maker & Image Splitter", kind: "grid", category: "Marketing Utility", platform: "instagram", description: "Create the perfect Instagram aesthetic." },
  { slug: "instagram-carousel-splitter", name: "Instagram Carousel Splitter", kind: "carousel", category: "Marketing Utility", platform: "instagram", description: "Create perfect Instagram carousels." },
  { slug: "instagram-handle-checker", name: "Instagram Handle Checker", kind: "handle", category: "Marketing Utility", platform: "instagram", description: "Check if your desired Instagram username is available instantly." },
  { slug: "tiktok-handle-checker", name: "TikTok Username Checker", kind: "handle", category: "Marketing Utility", platform: "tiktok", description: "Check if your desired TikTok username is available instantly." },
  { slug: "instagram-feed-planner", name: "Instagram Feed Planner", kind: "feed", category: "Marketing Utility", platform: "instagram", description: "Plan and preview your Instagram grid before posting." },
];

// 11 categories as rendered on production /tools page (order matters).
export type CategoryDef = {
  key: string;            // category key in section title
  title: string;          // H2 text
  description: string;    // section subtitle
  iconBgCls: string;      // section icon container bg (bg-muted/50)
  iconColorCls: string;   // section icon color
  iconName: string;       // lucide icon name (matched below)
  kinds: ToolKind[];      // tool kinds that fall into this category
  sectionLabel: string;   // plural category title shown above the cards
};

export const CATEGORIES: CategoryDef[] = [
  { key: "caption", title: "Caption Generators", description: "Generate engaging captions for your social media posts with AI", iconBgCls: "bg-muted/50", iconColorCls: "text-pink-600", iconName: "Sparkles", kinds: ["caption"], sectionLabel: "Caption Generator" },
  { key: "bio", title: "Bio Generators", description: "Create compelling bios for your social media profiles with AI", iconBgCls: "bg-muted/50", iconColorCls: "text-emerald-600", iconName: "User", kinds: ["bio"], sectionLabel: "Bio Generator" },
  { key: "username", title: "Username Generators", description: "Generate creative usernames and handles for your social media profiles", iconBgCls: "bg-muted/50", iconColorCls: "text-cyan-600", iconName: "AtSign", kinds: ["username"], sectionLabel: "Username Generator" },
  { key: "hashtag", title: "Hashtag Generators", description: "Generate relevant hashtags to boost reach and engagement on social media", iconBgCls: "bg-muted/50", iconColorCls: "text-purple-600", iconName: "Tag", kinds: ["hashtag"], sectionLabel: "Hashtag Generator" },
  { key: "engagement", title: "Calculate Engagement Rate", description: "Measure your social media performance with our engagement calculators", iconBgCls: "bg-muted/50", iconColorCls: "text-blue-600", iconName: "Calculator", kinds: ["engagement"], sectionLabel: "Engagement Calculator" },
  { key: "safe-zone", title: "Check Safe Zone", description: "Ensure your content stays within social media safe zones", iconBgCls: "bg-muted/50", iconColorCls: "text-green-600", iconName: "CheckCircle", kinds: ["safe-zone"], sectionLabel: "Safe Zone" },
  { key: "resizer", title: "Image Resizers", description: "Resize images to perfect dimensions for each social platform", iconBgCls: "bg-muted/50", iconColorCls: "text-indigo-600", iconName: "Crop", kinds: ["resizer"], sectionLabel: "Image Resizer" },
  { key: "line-break", title: "Line Break Generators", description: "Add line breaks and spacing to your social media posts", iconBgCls: "bg-muted/50", iconColorCls: "text-orange-600", iconName: "AlignLeft", kinds: ["line-break"], sectionLabel: "Line Break Generator" },
  { key: "text-formatter", title: "Text Formatters", description: "Format your text with bold, italic, and special Unicode styles for social media", iconBgCls: "bg-muted/50", iconColorCls: "text-teal-600", iconName: "Type", kinds: ["text-formatter"], sectionLabel: "Text Formatter" },
  { key: "character-counter", title: "Character Counters", description: "Count characters in real time and check your text against every platform's limit", iconBgCls: "bg-muted/50", iconColorCls: "text-rose-600", iconName: "Hash", kinds: ["character-counter"], sectionLabel: "Character Counter" },
  { key: "other", title: "Other", description: "More useful tools for your social media workflow", iconBgCls: "bg-muted/50", iconColorCls: "text-violet-600", iconName: "Languages", kinds: ["utm", "emoji", "money", "grid", "carousel", "handle", "feed"], sectionLabel: "Marketing Utility" },
];

export function getToolsByKinds(kinds: ToolKind[]): ToolData[] {
  return TOOLS.filter((t) => kinds.includes(t.kind));
}