// Per-platform advanced publishing options.
//
// Field-spec-driven UI: each platform has a list of FieldSpec objects
// describing what controls to render (segmented/select/text/number/switch/
// multiselect). The renderer (advanced-options-panel.tsx) reads this map
// and produces Trustiify's standard form controls.
//
// Naming note: Adsify uses `x_*` for Twitter fields. Trustiify uses
// `twitter_*` to match our existing PlatformId = "twitter" convention.
// Keys in the flat `PlatformAdvancedOptions` map carry the platform
// prefix so the publish route can route each field to the correct
// strategy without ambiguity.
//
// Client-safe: pure data + types, no server-only imports. Consumed by:
//   - advanced-options-panel.tsx (renderer)
//   - the requirements checker (Feature 2)
//   - the publish payload builder

import type { PlatformId } from "@/lib/platforms";
import type { MediaKind } from "@/lib/publishing/capability-matrix";

export type FieldKind =
  | "segmented"
  | "select"
  | "text"
  | "number"
  | "switch"
  | "multiselect"
  | "list";

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldSpec {
  /** Key in PlatformAdvancedOptions. Must be unique per platform. */
  key: string;
  label: string;
  help?: string;
  kind: FieldKind;
  /** For segmented/select: the available choices. */
  options?: FieldOption[];
  /** For text: input placeholder. */
  placeholder?: string;
  /** Default value (must match the option `value` shape). */
  default?: string | number | boolean;
  /** Max length for text fields. */
  maxLength?: number;
  /** Min/max for number fields. */
  min?: number;
  max?: number;
  /** Hide the field unless these conditions are met. */
  showWhen?: {
    /** Only show when the post has this media kind. */
    mediaKind?: MediaKind;
    /** Only show when the field with this key equals this value. */
    fieldEquals?: { key: string; value: string | number | boolean };
  };
  /** For advanced-only fields: hide under a "Show advanced" toggle. */
  advanced?: boolean;
}

export type PlatformAdvancedOptions = Record<string, string | number | boolean | string[] | undefined>;

export const FIELD_SPECS: Record<PlatformId, FieldSpec[]> = {
  // ─────────────────────────────────────────────────────────────
  instagram: [
    {
      key: "instagram_media_type",
      label: "Media type",
      kind: "segmented",
      options: [
        { value: "FEED", label: "Feed" },
        { value: "REELS", label: "Reels" },
        { value: "STORIES", label: "Stories" },
      ],
      default: "FEED",
      help: "Where the post appears on Instagram.",
    },
    {
      key: "instagram_share_mode",
      label: "Reels share mode",
      kind: "select",
      options: [
        { value: "CUSTOM", label: "Custom" },
        { value: "TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED", label: "Trial Reels (share if liked)" },
        { value: "TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS", label: "Trial Reels (don't share)" },
      ],
      default: "CUSTOM",
      help: "Trial Reels hide the post until enough followers react.",
      advanced: true,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_cover_url",
      label: "Cover image URL",
      kind: "text",
      placeholder: "https://…/cover.jpg",
      help: "Custom thumbnail for Reels.",
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_audio_name",
      label: "Audio name",
      kind: "text",
      placeholder: "Original audio name",
      maxLength: 80,
      help: "Renames the embedded original audio. Cannot pick trending music.",
      advanced: true,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_user_tags",
      label: "Tagged users",
      kind: "list",
      placeholder: "username (without @)",
      help: "Instagram users to tag. Comma-separated.",
      advanced: true,
    },
    {
      key: "instagram_location_id",
      label: "Location ID",
      kind: "text",
      placeholder: "Facebook place ID",
      help: "A Facebook/Instagram place ID from Graph API.",
      advanced: true,
    },
    {
      key: "instagram_thumbnail_offset_ms",
      label: "Cover frame offset (ms)",
      kind: "number",
      min: 0,
      help: "Pick a specific frame as the Reels cover. Ignored on Feed video.",
      advanced: true,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_share_to_feed",
      label: "Also share Reels to feed",
      kind: "switch",
      default: false,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_trial_reels_enabled",
      label: "Publish as a Trial Reel",
      kind: "switch",
      default: false,
      advanced: true,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
      help: "Trial Reels are hidden from non-followers until enough engagement is reached.",
    },
    {
      key: "instagram_trial_reels_audience",
      label: "Trial Reel eligible audience",
      kind: "select",
      options: [
        { value: "FOLLOWERS", label: "Followers only" },
        { value: "FOLLOWERS_AND_NON_FOLLOWERS", label: "Followers and non-followers" },
        { value: "PUBLIC", label: "Public" },
      ],
      default: "FOLLOWERS_AND_NON_FOLLOWERS",
      advanced: true,
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
      help: "Who can see the reel during the trial phase.",
    },
    {
      key: "instagram_shop_tag",
      label: "Shop product tag",
      kind: "text",
      placeholder: "Product ID from Meta Commerce catalog",
      advanced: true,
      help: "Tag a product from your Instagram Shop. The reel will show a shopping sticker.",
      showWhen: { fieldEquals: { key: "instagram_media_type", value: "REELS" } },
    },
    {
      key: "instagram_partners_paid",
      label: "Paid partnership (Partnership Ad)",
      kind: "switch",
      default: false,
      advanced: true,
      help: "Disclose a paid partnership — required by Meta for boosted creator content.",
    },
    {
      key: "instagram_collab_username",
      label: "Collab poster",
      kind: "text",
      placeholder: "Instagram username (without @)",
      advanced: true,
      help: "Co-author the post with another Instagram account. Both profiles get the post.",
    },
    {
      key: "instagram_trial_content_tag",
      label: "Trial content tag",
      kind: "switch",
      default: false,
      advanced: true,
      help: "Mark this post as a Trial — for creator experiments that aren't permanent on your grid.",
    },
  ],

  // ─────────────────────────────────────────────────────────────
  tiktok: [
    {
      key: "tiktok_post_mode",
      label: "Post mode",
      kind: "segmented",
      options: [
        { value: "DIRECT_POST", label: "Direct post" },
        { value: "MEDIA_UPLOAD", label: "Draft upload" },
      ],
      default: "DIRECT_POST",
      help: "Draft mode lets you edit title/privacy in the TikTok app.",
    },
    {
      key: "tiktok_privacy_level",
      label: "Privacy",
      kind: "select",
      options: [
        { value: "PUBLIC_TO_EVERYONE", label: "Public" },
        { value: "MUTUAL_FOLLOW_FRIENDS", label: "Friends" },
        { value: "FOLLOWER_OF_CREATOR", label: "Followers" },
        { value: "SELF_ONLY", label: "Only me" },
      ],
      default: "PUBLIC_TO_EVERYONE",
    },
    {
      key: "tiktok_auto_add_music",
      label: "Auto-add recommended music",
      kind: "switch",
      default: true,
      help: "Ignored when post mode is Draft upload.",
    },
    {
      key: "tiktok_disable_comment",
      label: "Disable comments",
      kind: "switch",
      default: false,
    },
    {
      key: "tiktok_disable_duet",
      label: "Disable duet",
      kind: "switch",
      default: false,
    },
    {
      key: "tiktok_disable_stitch",
      label: "Disable stitch",
      kind: "switch",
      default: false,
    },
    {
      key: "tiktok_brand_content_toggle",
      label: "Promote your own content",
      kind: "switch",
      default: false,
      advanced: true,
    },
    {
      key: "tiktok_brand_organic_toggle",
      label: "Branded content",
      kind: "switch",
      default: false,
      advanced: true,
    },
    {
      key: "tiktok_ai_generated_content",
      label: "AI-generated content",
      kind: "switch",
      default: false,
      help: "Required by TikTok disclosure rules for AI content.",
    },
    {
      key: "tiktok_photo_cover_index",
      label: "Slideshow cover index",
      kind: "number",
      min: 0,
      help: "Which image to use as the cover for a photo slideshow.",
      advanced: true,
    },
    {
      key: "tiktok_commercial_content",
      label: "Commercial content (your own brand)",
      kind: "switch",
      default: false,
      advanced: true,
      help: "Disclose that the post promotes your own product or service.",
    },
    {
      key: "tiktok_promotional_paid",
      label: "Promotional content (paid)",
      kind: "switch",
      default: false,
      advanced: true,
      help: "Disclose paid promotion — separate from branded content.",
    },
    {
      key: "tiktok_tiktok_shop_brand",
      label: "TikTok Shop brand/product",
      kind: "text",
      placeholder: "Brand username (without @)",
      advanced: true,
      help: "Tag a TikTok Shop brand to drive traffic to their store.",
    },
    {
      key: "tiktok_branding_license",
      label: "Content licensing",
      kind: "select",
      options: [
        { value: "NONE", label: "None" },
        { value: "YOUR_BRAND", label: "Your brand only" },
        { value: "PARTNERS", label: "Partners (organic)" },
        { value: "MUSIC", label: "Music label" },
      ],
      default: "NONE",
      advanced: true,
      help: "Choose which TikTok commercial library this content is licensed for.",
    },
    {
      key: "tiktok_spotify_link",
      label: "Spotify track link",
      kind: "text",
      placeholder: "https://open.spotify.com/track/…",
      advanced: true,
      help: "Attach a Spotify song so listeners can save it from your video.",
    },
  ],

  // ─────────────────────────────────────────────────────────────
  youtube: [
    {
      key: "youtube_privacy",
      label: "Privacy",
      kind: "segmented",
      options: [
        { value: "public", label: "Public" },
        { value: "unlisted", label: "Unlisted" },
        { value: "private", label: "Private" },
      ],
      default: "unlisted",
    },
    {
      key: "youtube_category_id",
      label: "Category",
      kind: "select",
      options: [
        { value: "1", label: "Film & Animation" },
        { value: "2", label: "Autos & Vehicles" },
        { value: "10", label: "Music" },
        { value: "15", label: "Pets & Animals" },
        { value: "17", label: "Sports" },
        { value: "20", label: "Gaming" },
        { value: "22", label: "People & Blogs" },
        { value: "23", label: "Comedy" },
        { value: "24", label: "Entertainment" },
        { value: "25", label: "News & Politics" },
        { value: "26", label: "Howto & Style" },
        { value: "27", label: "Education" },
        { value: "28", label: "Science & Technology" },
        { value: "29", label: "Nonprofits & Activism" },
      ],
      default: "22",
    },
    {
      key: "youtube_made_for_kids",
      label: "Made for kids",
      kind: "switch",
      default: false,
    },
    {
      key: "youtube_synthetic_media",
      label: "Contains synthetic media",
      kind: "switch",
      default: false,
      help: "Required by YouTube disclosure for AI-generated content.",
    },
    {
      key: "youtube_paid_product_placement",
      label: "Paid product placement",
      kind: "switch",
      default: false,
    },
    {
      key: "youtube_thumbnail_url",
      label: "Thumbnail URL",
      kind: "text",
      placeholder: "https://…/thumb.jpg",
      advanced: true,
    },
    {
      key: "youtube_subtitle_file",
      label: "Subtitle file URL",
      kind: "text",
      placeholder: "https://…/subs.srt",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  pinterest: [
    {
      key: "pinterest_board_id",
      label: "Board",
      kind: "text",
      placeholder: "Board ID",
      help: "Required. Find it in your Pinterest board URL.",
    },
    {
      key: "pinterest_content_type",
      label: "Content type",
      kind: "select",
      options: [
        { value: "STANDARD", label: "Standard pin" },
        { value: "IDEA", label: "Idea pin" },
        { value: "VIDEO_STANDARD", label: "Video standard pin" },
      ],
      default: "STANDARD",
      help: "Idea pins and Video standard pins offer better reach on Pinterest.",
    },
    {
      key: "pinterest_alt_text",
      label: "Alt text",
      kind: "text",
      placeholder: "Describe the image",
      maxLength: 500,
      advanced: true,
    },
    {
      key: "pinterest_link",
      label: "Destination link",
      kind: "text",
      placeholder: "https://…",
      advanced: true,
    },
    {
      key: "pinterest_description",
      label: "Description (overrides global)",
      kind: "text",
      placeholder: "Per-Pinterest description",
      maxLength: 500,
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  twitter: [
    {
      key: "twitter_long_text_as_post",
      label: "Long text as post",
      kind: "switch",
      default: true,
      help: "When on, captions longer than 280 chars post as a long tweet.",
    },
    {
      key: "twitter_reply_settings",
      label: "Reply settings",
      kind: "select",
      options: [
        { value: "everyone", label: "Everyone" },
        { value: "following", label: "People you follow" },
        { value: "mentionedUsers", label: "Only mentioned" },
      ],
      default: "everyone",
    },
    {
      key: "twitter_community",
      label: "Post to community",
      kind: "text",
      placeholder: "Community ID",
      help: "Leave empty to post to your timeline.",
      advanced: true,
    },
    {
      key: "twitter_geo_place_id",
      label: "Location",
      kind: "text",
      placeholder: "Place ID",
      advanced: true,
    },
    {
      key: "twitter_nullcast",
      label: "Nullcast (don't broadcast)",
      kind: "switch",
      default: false,
      advanced: true,
    },
    {
      key: "twitter_tagged_user_ids",
      label: "Tagged users",
      kind: "list",
      placeholder: "User ID",
      help: "Comma-separated Twitter user IDs.",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  linkedin: [
    {
      key: "linkedin_page_id",
      label: "Page",
      kind: "text",
      placeholder: "LinkedIn organization ID",
      help: "Leave empty to post on your personal profile.",
      advanced: true,
    },
    {
      key: "linkedin_visibility",
      label: "Visibility",
      kind: "segmented",
      options: [
        { value: "PUBLIC", label: "Public" },
        { value: "CONNECTIONS", label: "Connections only" },
      ],
      default: "PUBLIC",
    },
  ],

  // ─────────────────────────────────────────────────────────────
  threads: [
    {
      key: "threads_topic_tag",
      label: "Topic tag",
      kind: "text",
      placeholder: "topic-name",
      maxLength: 50,
      help: "Single topic that categorises the post on Threads.",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  facebook: [
    {
      key: "facebook_page_id",
      label: "Page",
      kind: "text",
      placeholder: "Page ID",
      help: "Required. Find it in your Facebook page's About section.",
    },
    {
      key: "facebook_media_type",
      label: "Media type",
      kind: "segmented",
      options: [
        { value: "FEED", label: "Feed" },
        { value: "REELS", label: "Reels" },
        { value: "STORIES", label: "Stories" },
        { value: "VIDEO", label: "Long-form video" },
      ],
      default: "FEED",
    },
    {
      key: "facebook_thumbnail_url",
      label: "Thumbnail URL",
      kind: "text",
      placeholder: "https://…/thumb.jpg",
      help: "Custom thumbnail for long-form videos.",
      advanced: true,
      showWhen: { fieldEquals: { key: "facebook_media_type", value: "VIDEO" } },
    },
    {
      key: "facebook_album_id",
      label: "Page album ID",
      kind: "text",
      placeholder: "Album ID",
      advanced: true,
      help: "Add this post to an existing Facebook Page album. Leave empty to post without an album.",
    },
    {
      key: "facebook_form_type",
      label: "Page form type",
      kind: "select",
      options: [
        { value: "NONE", label: "None" },
        { value: "LEAD_GEN", label: "Lead generation form" },
      ],
      default: "NONE",
      advanced: true,
      help: "Attach a lead-gen form to collect emails from the post (requires Page form).",
    },
    {
      key: "facebook_description",
      label: "Description (overrides global)",
      kind: "text",
      placeholder: "Per-Facebook description",
      maxLength: 5000,
      advanced: true,
      help: "Use a Facebook-specific description instead of the global caption.",
    },
  ],

  // ─────────────────────────────────────────────────────────────
  bluesky: [
    {
      key: "bluesky_link_url",
      label: "Embed link",
      kind: "text",
      placeholder: "https://…",
      help: "Adds a link card to the post.",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  x: [
    {
      key: "x_reply_settings",
      label: "Reply settings",
      kind: "select",
      options: [
        { value: "everyone", label: "Everyone" },
        { value: "following", label: "People you follow" },
        { value: "mentionedUsers", label: "Only mentioned" },
      ],
      default: "everyone",
    },
    {
      key: "x_community_id",
      label: "Community ID",
      kind: "text",
      placeholder: "Community ID",
      advanced: true,
    },
    {
      key: "x_geo_place_id",
      label: "Location",
      kind: "text",
      placeholder: "Place ID",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  discord: [
    {
      key: "discord_channel_id",
      label: "Channel ID",
      kind: "text",
      placeholder: "Channel ID",
      help: "Required. The Discord channel to post to.",
    },
    {
      key: "discord_mention_role",
      label: "Role to mention",
      kind: "text",
      placeholder: "@role name",
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  telegram: [
    {
      key: "telegram_chat_id",
      label: "Chat ID",
      kind: "text",
      placeholder: "Chat ID",
      help: "Required. The Telegram chat or channel ID.",
    },
    {
      key: "telegram_disable_web_preview",
      label: "Disable web preview",
      kind: "switch",
      default: false,
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  reddit: [
    {
      key: "reddit_subreddit",
      label: "Subreddit",
      kind: "text",
      placeholder: "subreddit name (without r/)",
      help: "Required. The subreddit to post to.",
    },
    {
      key: "reddit_flair_id",
      label: "Post flair ID",
      kind: "text",
      placeholder: "Flair ID",
      advanced: true,
    },
    {
      key: "reddit_spoiler",
      label: "Mark as spoiler",
      kind: "switch",
      default: false,
      advanced: true,
    },
    {
      key: "reddit_nsfw",
      label: "Mark as NSFW",
      kind: "switch",
      default: false,
      advanced: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────
  google_business: [
    {
      key: "google_business_location_id",
      label: "Location ID",
      kind: "text",
      placeholder: "Location ID",
      help: "Required. Your Google Business location ID.",
    },
    {
      key: "google_business_post_type",
      label: "Post type",
      kind: "select",
      options: [
        { value: "STANDARD", label: "Standard" },
        { value: "EVENT", label: "Event" },
        { value: "OFFER", label: "Offer" },
      ],
      default: "STANDARD",
    },
  ],
};

export function getFieldSpecs(platform: PlatformId, mediaKind: MediaKind): FieldSpec[] {
  const all = FIELD_SPECS[platform] ?? [];
  return all.filter((spec) => {
    const sw = spec.showWhen;
    if (!sw) return true;
    if (sw.mediaKind && sw.mediaKind !== mediaKind) return false;
    return true;
  });
}

export function getDefaultOptions(platform: PlatformId): PlatformAdvancedOptions {
  const out: PlatformAdvancedOptions = {};
  for (const spec of FIELD_SPECS[platform] ?? []) {
    if (spec.default !== undefined) {
      out[spec.key] = spec.default;
    }
  }
  return out;
}

export function getFieldSpec(platform: PlatformId, key: string): FieldSpec | undefined {
  return (FIELD_SPECS[platform] ?? []).find((s) => s.key === key);
}

export function getVisibleSpecs(
  platform: PlatformId,
  mediaKind: MediaKind,
  current: PlatformAdvancedOptions,
  includeAdvanced = true
): FieldSpec[] {
  return getFieldSpecs(platform, mediaKind).filter((spec) => {
    if (!includeAdvanced && spec.advanced) return false;
    const sw = spec.showWhen;
    if (!sw) return true;
    if (sw.mediaKind && sw.mediaKind !== mediaKind) return false;
    if (sw.fieldEquals && current[sw.fieldEquals.key] !== sw.fieldEquals.value) return false;
    return true;
  });
}