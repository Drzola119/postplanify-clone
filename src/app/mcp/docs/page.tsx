"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, KeyRound } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

const TOC = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "claude-code", label: "Claude Code" },
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "other-clients", label: "Other Clients" },
  { id: "tools", label: "Tools" },
];

const CLAUDE_CODE_JSON = `{
  "mcpServers": {
    "postplanify": {
      "type": "http",
      "url": "https://api.postplanify.com/api/mcp",
      "headers": {
        "Authorization": "Bearer sk_live_your_api_key_here"
      }
    }
  }
}`;

const CLAUDE_DESKTOP_JSON = `{
  "mcpServers": {
    "postplanify": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://api.postplanify.com/api/mcp",
        "--header",
        "Authorization: Bearer sk_live_your_api_key_here"
      ]
    }
  }
}`;

type ToolCategory = {
  name: string;
  count: number;
  styles: {
    border: string;
    bg: string;
    text: string;
    darkBorder: string;
    darkBg: string;
    darkText: string;
  };
  tools: Array<{ tool: string; description: string; params: string }>;
};

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: "Posts",
    count: 6,
    styles: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-700",
      darkBorder: "dark:border-blue-900",
      darkBg: "dark:bg-blue-950/20",
      darkText: "dark:text-blue-400",
    },
    tools: [
      {
        tool: "list_posts",
        description: "List posts with filters",
        params: "workspaceId, status?, platform?, from?, to?",
      },
      {
        tool: "create_post",
        description: "Create and schedule a new post",
        params: "workspaceId, socialAccountId, scheduledAt, caption?, mediaIds?, youtubeParams?, tiktokParams?, pinterestParams?, googleBusinessParams?",
      },
      { tool: "get_post", description: "Get post details", params: "postId" },
      {
        tool: "edit_post",
        description: "Update a scheduled post",
        params: "postId, caption?, scheduledAt?",
      },
      {
        tool: "cancel_post",
        description: "Cancel a scheduled post",
        params: "postId",
      },
      {
        tool: "delete_post",
        description: "Permanently delete a post",
        params: "postId",
      },
    ],
  },
  {
    name: "Media",
    count: 4,
    styles: {
      border: "border-violet-200",
      bg: "bg-violet-50",
      text: "text-violet-700",
      darkBorder: "dark:border-violet-900",
      darkBg: "dark:bg-violet-950/20",
      darkText: "dark:text-violet-400",
    },
    tools: [
      {
        tool: "upload_media_from_url",
        description: "Upload media from a public URL",
        params: "url, filename?",
      },
      {
        tool: "upload_media_from_base64",
        description: "Upload a local file via base64 (max 20MB)",
        params: "data, filename, mimeType",
      },
      {
        tool: "list_media",
        description: "List all uploaded media files",
        params: "None",
      },
      {
        tool: "delete_media",
        description: "Delete an uploaded media file",
        params: "mediaId",
      },
    ],
  },
  {
    name: "Analytics",
    count: 3,
    styles: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      darkBorder: "dark:border-emerald-900",
      darkBg: "dark:bg-emerald-950/20",
      darkText: "dark:text-emerald-400",
    },
    tools: [
      {
        tool: "get_account_analytics",
        description: "Get analytics for a social account",
        params: "workspaceId, socialAccountId",
      },
      {
        tool: "get_analytics_trends",
        description: "Get historical trends (followers, engagement)",
        params: "workspaceId, socialAccountId, days?",
      },
      {
        tool: "get_brand_overview",
        description: "Get aggregated analytics across all accounts",
        params: "workspaceId",
      },
    ],
  },
  {
    name: "Inbox",
    count: 3,
    styles: {
      border: "border-cyan-200",
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      darkBorder: "dark:border-cyan-900",
      darkBg: "dark:bg-cyan-950/20",
      darkText: "dark:text-cyan-400",
    },
    tools: [
      {
        tool: "list_comments",
        description:
          "List synced comments from Instagram, Facebook, LinkedIn, Google Business",
        params:
          "workspaceId, socialAccountId?, platform?, unreadOnly?, page?, limit?",
      },
      {
        tool: "list_comment_replies",
        description: "Fetch direct replies to a specific comment",
        params: "platformCommentId",
      },
      {
        tool: "reply_to_comment",
        description:
          "Post a public reply to a comment on its originating platform",
        params: "platformCommentId, message",
      },
    ],
  },
  {
    name: "Accounts & Workspaces",
    count: 6,
    styles: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      darkBorder: "dark:border-amber-900",
      darkBg: "dark:bg-amber-950/20",
      darkText: "dark:text-amber-400",
    },
    tools: [
      {
        tool: "get_current_user",
        description: "Get your profile info",
        params: "None",
      },
      {
        tool: "list_workspaces",
        description: "List all your workspaces",
        params: "None",
      },
      {
        tool: "get_workspace",
        description: "Get workspace details",
        params: "workspaceId",
      },
      {
        tool: "list_social_accounts",
        description: "List all connected social accounts",
        params: "None",
      },
      {
        tool: "get_social_account",
        description: "Get social account details",
        params: "accountId",
      },
      {
        tool: "list_pinterest_boards",
        description: "List Pinterest boards for an account",
        params: "accountId",
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
      aria-label="Copy code to clipboard"
    >
      <Copy style={{ width: 16, height: 16 }} />
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CodeBlock({ path, code }: { path: string; code: string }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono">{path}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto bg-muted/20">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InfoRow({
  label,
  children,
  labelMinWidth = "90px",
}: {
  label: string;
  children: React.ReactNode;
  labelMinWidth?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <span
        className="font-medium text-xs uppercase tracking-wide text-muted-foreground"
        style={{ minWidth: labelMinWidth }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default function MCPDocsPage() {
  const [activeId, setActiveId] = useState<string>("prerequisites");

  useEffect(() => {
    const sectionIds = TOC.map((item) => item.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 pb-16 sm:pt-16 sm:pb-20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href="/mcp"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to MCP
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            MCP Setup Guide
          </h1>
          <p className="text-muted-foreground mb-6">
            Connect PostPlanify to your AI assistant in under a minute.
          </p>

          <div className="mt-10 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
            <aside className="hidden lg:block">
              <nav className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  On this page
                </p>
                <ul className="space-y-0.5 border-l border-border">
                  {TOC.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={
                            "-ml-px block border-l-2 pl-3 py-1 text-sm transition-colors " +
                            (isActive
                              ? "border-primary text-foreground font-medium"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40")
                          }
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            <div className="min-w-0">
              <section
                id="prerequisites"
                className="mb-10 scroll-mt-32"
              >
                <h2 className="text-lg font-semibold mb-3">Prerequisites</h2>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">1.</span>
                    <span>
                      An active PostPlanify subscription —{" "}
                      <Link
                        href="/#pricing"
                        className="text-primary underline hover:text-primary/80"
                      >
                        see plans
                      </Link>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">2.</span>
                    <span>
                      An API key from your{" "}
                      <Link
                        href="/dashboard/api-keys"
                        className="text-primary underline hover:text-primary/80"
                      >
                        API Keys dashboard
                      </Link>
                    </span>
                  </li>
                </ul>
              </section>

              <section id="claude-code" className="mb-10 scroll-mt-32">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Claude"
                    width={22}
                    height={22}
                    src="/llm-logos/claude.svg"
                  />
                  <h2 className="text-lg font-semibold">Claude Code</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Add this to your{" "}
                  <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                    ~/.claude/settings.json
                  </code>
                  :
                </p>
                <CodeBlock
                  path="~/.claude/settings.json"
                  code={CLAUDE_CODE_JSON}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Replace{" "}
                  <code className="px-1 py-0.5 bg-muted rounded font-mono">
                    sk_live_your_api_key_here
                  </code>{" "}
                  with your actual API key.
                </p>
              </section>

              <section id="claude-desktop" className="mb-10 scroll-mt-32">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Claude"
                    width={22}
                    height={22}
                    src="/llm-logos/claude.svg"
                  />
                  <h2 className="text-lg font-semibold">Claude Desktop</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Add this to your{" "}
                  <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                    claude_desktop_config.json
                  </code>
                  :
                </p>
                <CodeBlock
                  path="claude_desktop_config.json"
                  code={CLAUDE_DESKTOP_JSON}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Requires Node.js. The{" "}
                  <code className="px-1 py-0.5 bg-muted rounded font-mono">
                    mcp-remote
                  </code>{" "}
                  package bridges HTTP to stdio transport.
                </p>
              </section>

              <section id="chatgpt" className="mb-10 scroll-mt-32">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="ChatGPT"
                    width={22}
                    height={22}
                    className="dark:invert"
                    src="/llm-logos/chatgpt.svg"
                  />
                  <h2 className="text-lg font-semibold">ChatGPT</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  In ChatGPT, open{" "}
                  <strong>Settings → Apps → Advanced settings</strong> and turn
                  on <strong>Developer mode</strong>. A{" "}
                  <strong>Create app</strong> button will appear — click it
                  and fill in:
                </p>
                <div className="border rounded-lg p-4 space-y-2.5 text-sm mb-3">
                  <InfoRow
                    label="Server URL"
                    labelMinWidth="110px"
                  >
                    <code className="px-2 py-1 bg-muted rounded font-mono text-xs break-all">
                      https://api.postplanify.com/api/mcp?api_key=sk_live_your_api_key
                    </code>
                  </InfoRow>
                  <InfoRow label="Authentication" labelMinWidth="110px">
                    <span className="text-xs">No Auth</span>
                  </InfoRow>
                </div>
                <p className="text-xs text-muted-foreground">
                  ChatGPT&apos;s connector UI only offers OAuth or No Auth, so
                  the API key is passed as a query parameter instead of a
                  header. Treat the full URL as a secret — anyone with it can
                  act on your PostPlanify account.
                </p>
              </section>

              <section id="other-clients" className="mb-10 scroll-mt-32">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex -space-x-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Gemini"
                      width={18}
                      height={18}
                      src="/llm-logos/gemini.svg"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Grok"
                      width={18}
                      height={18}
                      className="dark:invert"
                      src="/llm-logos/grok.svg"
                    />
                  </div>
                  <h2 className="text-lg font-semibold">Other MCP Clients</h2>
                </div>
                <div className="border rounded-lg p-4 space-y-2.5 text-sm">
                  <InfoRow label="Endpoint">
                    <code className="px-2 py-1 bg-muted rounded font-mono text-xs break-all">
                      https://api.postplanify.com/api/mcp
                    </code>
                  </InfoRow>
                  <InfoRow label="Auth">
                    <code className="px-2 py-1 bg-muted rounded font-mono text-xs">
                      Authorization: Bearer sk_live_your_api_key
                    </code>
                  </InfoRow>
                  <InfoRow label="Transport">
                    <span className="text-xs">HTTP (Streamable HTTP)</span>
                  </InfoRow>
                  <InfoRow label="Stdio bridge">
                    <code className="px-2 py-1 bg-muted rounded font-mono text-xs break-all">
                      npx mcp-remote https://api.postplanify.com/api/mcp
                      --header &quot;Authorization: Bearer sk_live_...&quot;
                    </code>
                  </InfoRow>
                </div>
              </section>

              <section id="tools" className="mb-10 scroll-mt-32">
                <h2 className="text-lg font-semibold mb-1">Tool Reference</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  22 tools — your AI discovers these automatically once
                  connected.
                </p>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2.5 px-3 font-semibold text-xs">
                          Tool
                        </th>
                        <th className="text-left py-2.5 px-3 font-semibold text-xs">
                          Description
                        </th>
                        <th className="text-left py-2.5 px-3 font-semibold text-xs">
                          Key Parameters
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOOL_CATEGORIES.map((category, idx) => (
                        <CategoryRows
                          key={category.name}
                          category={category}
                          isFirst={idx === 0}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="border rounded-xl p-6 text-center">
                <h2 className="text-lg font-semibold mb-1.5">
                  Need an API key?
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate one from your PostPlanify dashboard to get started.
                </p>
                <Link href="/dashboard/api-keys">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 rounded-full"
                  >
                    <KeyRound style={{ width: 16, height: 16 }} />
                    Get Your API Key
                  </button>
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CategoryRows({
  category,
  isFirst,
}: {
  category: ToolCategory;
  isFirst: boolean;
}) {
  const { border, bg, text, darkBorder, darkBg, darkText } = category.styles;
  return (
    <>
      <tr className={`${isFirst ? "" : "border-t-2"} ${border} ${darkBorder}`}>
        <td
          colSpan={3}
          className={`py-2 px-3 text-[11px] font-bold uppercase tracking-wider ${bg} ${darkBg} ${text} ${darkText}`}
        >
          {category.name}
          <span className="ml-1.5 font-normal normal-case opacity-70">
            · {category.count}
          </span>
        </td>
      </tr>
      {category.tools.map((tool) => (
        <tr key={tool.tool} className="border-b border-border/50">
          <td className="py-2 px-3">
            <code className="text-xs font-mono">{tool.tool}</code>
          </td>
          <td className="py-2 px-3 text-muted-foreground text-xs">
            {tool.description}
          </td>
          <td className="py-2 px-3 text-muted-foreground text-xs font-mono">
            {tool.params}
          </td>
        </tr>
      ))}
    </>
  );
}
