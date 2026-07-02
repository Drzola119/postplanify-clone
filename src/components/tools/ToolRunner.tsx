"use client";

import { useState } from "react";
import { Calculator, Copy, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  kind: "engagement" | "caption" | "hashtag" | "bio" | "username" | "money" | "utm" | "handle";
  fields: { name: string; label: string; placeholder?: string; type?: string }[];
};

// Curated sample outputs so the generators feel real without a backend
const CAPTION_TEMPLATES = (topic: string, tone: string) =>
  [
    `${topic} — but make it ${tone || "casual"}. ✨`,
    `POV: you're obsessed with ${topic} 💫`,
    `${tone === "professional" ? "Insight:" : "Hot take:"} ${topic} hits different.`,
    `Saving this for the next time someone asks about ${topic}. 🔖`,
    `If you know, you know. ${topic} edition.`,
  ];

const HASHTAG_SETS = (topic: string) => {
  const base = topic.toLowerCase().replace(/\s+/g, "");
  return [
    `#${base}`,
    `#${base}daily`,
    `#${base}life`,
    `#${base}lover`,
    `#${base}gram`,
    `#${base}community`,
    `#${base}inspo`,
    `#${base}goals`,
    `#${base}tips`,
    `#${base}oftheday`,
    `#${base}time`,
    `#${base}2026`,
    `#${base}trend`,
    `#${base}vibes`,
    `#${base}share`,
    `#${base}fam`,
    `#${base}crew`,
    `#${base}squad`,
    `#${base}official`,
    `#${base}original`,
    `#${base}story`,
    `#${base}post`,
    `#${base}feed`,
    `#${base}reels`,
    `#${base}explore`,
    `#${base}foryou`,
    `#${base}fyp`,
    `#${base}viral`,
    `#${base}trending`,
    `#${base}love`,
  ];
};

const BIO_TEMPLATES = (name: string, niche: string, audience: string) => [
  `${name}\n${niche} for ${audience}\n↓ free resources ↓`,
  `${niche} ✦\nhelping ${audience} do their best work\n📩 DM to collab`,
  `${name} | ${niche}\nFor ${audience}\n🎯 Tips · Tools · Wins`,
  `Building things · ${niche}\n${name} speaks to ${audience}\nLink ↓`,
  `${niche}\nMade for ${audience}\n— ${name}`,
];

const USERNAME_VARIATIONS = (topic: string, vibe: string) => {
  const clean = topic.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const adjectives = vibe ? vibe.toLowerCase().split(/[,\s]+/).filter(Boolean) : ["daily", "official", "real", "its", "the"];
  const out = new Set<string>();
  out.add(clean);
  out.add(`${clean}app`);
  out.add(`${clean}.co`);
  out.add(`get${clean}`);
  out.add(`try${clean}`);
  out.add(`my${clean}`);
  out.add(`${clean}hq`);
  out.add(`${clean}lab`);
  out.add(`${clean}studio`);
  out.add(`${clean}pro`);
  out.add(`${clean}.io`);
  out.add(`${clean}daily`);
  out.add(`${clean}world`);
  out.add(`the${clean}`);
  out.add(`its${clean}`);
  out.add(`hey${clean}`);
  out.add(`${clean}.life`);
  out.add(`${clean}vibes`);
  out.add(`${clean}gram`);
  out.add(`real${clean}`);
  for (const adj of adjectives) out.add(`${adj}${clean}`);
  return [...out].filter((s) => s.length <= 30).slice(0, 24);
};

function benchmark(rate: number) {
  if (rate < 1) return { label: "Low", color: "text-red-600 dark:text-red-400" };
  if (rate < 3) return { label: "Below average", color: "text-amber-600 dark:text-amber-400" };
  if (rate < 6) return { label: "Average", color: "text-blue-600 dark:text-blue-400" };
  if (rate < 10) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  return { label: "Excellent", color: "text-emerald-700 dark:text-emerald-300" };
}

function calcEngagement(values: Record<string, string>) {
  const f = parseFloat(values.followers || "0");
  const l = parseFloat(values.likes || "0");
  const c = parseFloat(values.comments || "0");
  const s = parseFloat(values.shares || "0");
  if (!f) return null;
  const total = l + c + s;
  return (total / f) * 100;
}

function calcTikTokMoney(values: Record<string, string>) {
  const followers = parseFloat(values.followers || "0");
  const views = parseFloat(values.views || "0");
  const engagement = parseFloat(values.engagement || "0");
  // Rough estimate: Creator Fund ~ $0.50 per 1000 views, brand deals ~ $10 per 1000 followers
  const creatorFund = (views / 1000) * 0.5;
  const brandDeal = (followers / 1000) * 10 * (engagement / 5);
  return { creatorFund: Math.round(creatorFund), brandDeal: Math.round(brandDeal) };
}

function buildUTM(values: Record<string, string>) {
  const base = values.url || "https://example.com";
  const params = new URLSearchParams();
  if (values.source) params.set("utm_source", values.source);
  if (values.medium) params.set("utm_medium", values.medium);
  if (values.campaign) params.set("utm_campaign", values.campaign);
  const sep = base.includes("?") ? "&" : "?";
  return params.toString() ? `${base}${sep}${params.toString()}` : base;
}

export function ToolRunner({ kind, fields }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }));

  const copy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(id);
        setTimeout(() => setCopied(null), 1500);
      });
    }
  };

  // ENGAGEMENT CALCULATORS (Instagram, TikTok, YouTube, LinkedIn)
  if (kind === "engagement") {
    const rate = calcEngagement(values);
    const bm = rate !== null ? benchmark(rate) : null;
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type={f.type || "text"}
                inputMode="numeric"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg bg-muted/40">
          {rate === null ? (
            <p className="text-sm text-muted-foreground">Enter followers and engagement numbers above.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Engagement rate</p>
              <p className="text-3xl font-bold">{rate.toFixed(2)}%</p>
              <p className={`text-sm font-medium mt-1 ${bm?.color}`}>{bm?.label}</p>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>• &lt; 1% — Low</p>
                <p>• 1-3% — Below average</p>
                <p>• 3-6% — Average</p>
                <p>• 6-10% — Good</p>
                <p>• &gt; 10% — Excellent</p>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  // CAPTION / HASHTAG / BIO / USERNAME generators
  if (kind === "caption") {
    const topic = values.topic || "your topic";
    const tone = values.tone || "casual";
    const outputs = CAPTION_TEMPLATES(topic, tone);
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Caption ideas</p>
          {outputs.map((c, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-md border bg-card">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{c}</p>
              <Button size="sm" variant="ghost" onClick={() => copy(c, `c-${i}`)}>
                {copied === `c-${i}` ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (kind === "hashtag") {
    const tags = HASHTAG_SETS(values.topic || "your topic");
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Suggested hashtags (copy and paste)</p>
          <div className="p-4 rounded-md border bg-card text-sm leading-relaxed">
            {tags.join(" ")}
          </div>
          <Button className="mt-3" size="sm" onClick={() => copy(tags.join(" "), "tags")}>
            {copied === "tags" ? <><Check className="size-3.5 mr-1" />Copied</> : <><Copy className="size-3.5 mr-1" />Copy all</>}
          </Button>
        </div>
      </Card>
    );
  }

  if (kind === "bio") {
    const bios = BIO_TEMPLATES(
      values.name || "Your Name",
      values.niche || "your niche",
      values.audience || "your audience",
    );
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Bio ideas (under 150 characters each)</p>
          {bios.map((b, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-md border bg-card">
              <p className="text-sm flex-1 whitespace-pre-line">{b}</p>
              <Button size="sm" variant="ghost" onClick={() => copy(b, `b-${i}`)}>
                {copied === `b-${i}` ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (kind === "username") {
    const names = USERNAME_VARIATIONS(values.topic || "yourbrand", values.vibe || "");
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Username ideas (under 30 characters)</p>
          <div className="flex flex-wrap gap-2">
            {names.map((n, i) => (
              <button
                key={i}
                onClick={() => copy(n, `n-${i}`)}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors"
              >
                {n}
                {copied === `n-${i}` ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // TIKTOK MONEY CALCULATOR
  if (kind === "money") {
    const result = calcTikTokMoney(values);
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type={f.type || "text"}
                inputMode="numeric"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/40">
            <p className="text-sm text-muted-foreground">Creator Fund (per video, est.)</p>
            <p className="text-3xl font-bold">${result.creatorFund.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on $0.50 / 1k views</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40">
            <p className="text-sm text-muted-foreground">Brand deal rate (est.)</p>
            <p className="text-3xl font-bold">${result.brandDeal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on followers + engagement</p>
          </div>
        </div>
      </Card>
    );
  }

  // UTM GENERATOR
  if (kind === "utm") {
    const url = buildUTM(values);
    return (
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-sm font-medium">{f.label}</span>
              <input
                type="text"
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Tagged URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 rounded-md border bg-card text-xs break-all">{url}</code>
            <Button size="sm" onClick={() => copy(url, "url")}>
              {copied === "url" ? <><Check className="size-3.5 mr-1" />Copied</> : <><Copy className="size-3.5 mr-1" />Copy</>}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // HANDLE CHECKER (front-end only — note real availability requires API)
  if (kind === "handle") {
    const handle = (values.handle || "").replace(/^@/, "").toLowerCase();
    const valid = /^[a-z0-9._]{1,30}$/.test(handle);
    return (
      <Card className="p-6">
        <label className="block">
          <span className="text-sm font-medium">{fields[0].label}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <input
              type="text"
              value={values.handle || ""}
              onChange={(e) => set("handle", e.target.value)}
              placeholder={fields[0].placeholder}
              className="flex-1 h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </label>
        <div className="mt-6 p-4 rounded-lg bg-muted/40">
          {!handle ? (
            <p className="text-sm text-muted-foreground">Type a username above to check format and length.</p>
          ) : !valid ? (
            <>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Format looks invalid</p>
              <p className="text-xs text-muted-foreground mt-1">
                Instagram usernames: 1-30 chars, only letters, numbers, underscores, and periods.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Format looks valid</p>
              <p className="text-xs text-muted-foreground mt-1">
                Visit instagram.com/{handle} to confirm availability — this tool only checks format.
              </p>
              <Button className="mt-3" size="sm" onClick={() => copy(`@${handle}`, "h")}>
                {copied === "h" ? <><Check className="size-3.5 mr-1" />Copied</> : <><Copy className="size-3.5 mr-1" />Copy @{handle}</>}
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }

  return null;
}

// Static info card for tools that are visual/reference-only (no calculation)
export function ToolInfoCard({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Card className="p-6">
      <Calculator className="size-6 text-primary mb-3" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2 text-sm">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-4">
        Want a built-in version? PostPlanify includes grid planning, image resizing, and
        safe-zone preview directly in the composer.
      </p>
    </Card>
  );
}