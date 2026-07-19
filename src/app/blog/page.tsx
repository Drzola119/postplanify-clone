import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Calendar, Mail, Heart, MessageCircle } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { BlogNewsletterForm } from "@/components/sections/BlogNewsletterForm";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Blog Posts | PostPlanify",
  description: "Read our latest blog posts about social media management and scheduling.",
  alternates: { canonical: "/blog" },
};

const POSTS = [
  {
    slug: "best-social-media-management-tools",
    date: "June 05, 2026",
    dateTime: "2026-06-05",
    title: "10 Best Social Media Management Tools in 2026 (Ranked & Compared)",
    excerpt:
      "Compare the 10 best social media management tools of 2026 on pricing, features, and real G2 ratings — and find the right platform for your team.",
  },
  {
    slug: "how-to-post-a-story-on-facebook",
    date: "June 02, 2026",
    dateTime: "2026-06-02",
    title: "How to Post a Story on Facebook: 2026 Guide for All Devices",
    excerpt:
      "How to post a Story on Facebook from your phone, desktop, or a business Page — plus specs, creative tips, scheduling, and fixes for when it won't post.",
  },
  {
    slug: "ai-assisted-content-creation",
    date: "June 01, 2026",
    dateTime: "2026-06-01",
    title: "AI Assisted Content Creation: Full Guide (2026)",
    excerpt:
      "A practical 2026 guide to AI-assisted content creation: workflows, prompts, tools, and quality controls for agencies and creators who want speed without losing quality.",
  },
  {
    slug: "how-do-you-share-someones-post-on-instagram",
    date: "May 30, 2026",
    dateTime: "2026-05-30",
    title: "How Do You Share Someone's Post on Instagram? 2026 Guide",
    excerpt:
      "How do you share someone's post on Instagram? Step-by-step methods for Stories, DMs, copy link, and reposting to your feed (with permission) in 2026.",
  },
  {
    slug: "lead-generation-social-media",
    date: "May 29, 2026",
    dateTime: "2026-05-29",
    title: "Lead Generation Social Media: The 2026 Playbook",
    excerpt:
      "The 2026 lead generation social media playbook — ICP, offers, funnel, platform tactics, capture, and attribution. Built for B2B and agency teams.",
  },
  {
    slug: "uploading-to-instagram",
    date: "May 28, 2026",
    dateTime: "2026-05-28",
    title: "Uploading to Instagram in 2026: Reels, Stories & More",
    excerpt:
      "Master uploading to Instagram in 2026 — specs, fixes, and step-by-step uploads for Reels, Stories, carousels & feed posts from mobile or desktop.",
  },
  {
    slug: "how-to-make-a-facebook-photo-collage",
    date: "May 27, 2026",
    dateTime: "2026-05-27",
    title: "How to Make a Facebook Photo Collage in 2026 (All Methods)",
    excerpt:
      "Make a Facebook photo collage in 2026: mobile auto-layouts, desktop posts, Stories, and third-party tools — sizes, fixes, and FAQs included.",
  },
  {
    slug: "best-threads-scheduling-tools",
    date: "May 27, 2026",
    dateTime: "2026-05-27",
    title: "8 Best Threads Scheduling Tools for 2026 (Free + Paid)",
    excerpt:
      "The 8 best Threads schedulers that natively publish via Meta's API — with reply chains, analytics, and a real inbox. No reminder workarounds.",
  },
  {
    slug: "visual-content-creation",
    date: "May 26, 2026",
    dateTime: "2026-05-26",
    title: "Visual Content Creation: A 6-Stage Workflow for Teams (2026)",
    excerpt:
      "A practical 6-stage visual content creation workflow for teams in 2026: brief, plan, produce, edit, format per platform, then measure and repurpose.",
  },
];

export default function BlogPage() {
  return (
    <>
      <Header />
      <main>
        {/* Blog posts grid */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-[85rem] mx-auto">
            {/* Breadcrumb */}
            <div className="flex justify-center mb-6">
              <nav aria-label="breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
                  <li className="inline-flex items-center gap-1.5">
                    <Link href="/" className="transition-colors hover:text-foreground">
                      Home
                    </Link>
                  </li>
                  <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
                    <ChevronRight />
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-foreground">
                      Blog
                    </span>
                  </li>
                </ol>
              </nav>
            </div>

            {/* Page title */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold sm:text-4xl mb-4">Our Blog Posts 📚</h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Actionable insights and real strategies for creators, marketers, and solo teams looking to grow
                faster, post better, and stay consistent without the overwhelm. Learn how to use PostPlanify to
                automate your social media and grow your business as a content creator.
              </p>
            </div>

            {/* Posts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {POSTS.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
                  <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden group hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={`/images/blog/${post.slug}.png`}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover p-1 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-6 h-6 shrink-0" />
                        <time dateTime={post.dateTime}>{post.date}</time>
                      </div>
                      <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
                      <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center p-4 pt-0">
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">
                        Read More
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled
                aria-label="Previous page"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <Link
                  key={p}
                  href={`/blog?page=${p}`}
                  aria-current={p === 1 ? "page" : undefined}
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 w-9 ${
                    p === 1
                      ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                      : "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {p}
                </Link>
              ))}
              <span className="px-2">...</span>
              <Link
                href="/blog?page=30"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                30
              </Link>
              <Link
                href="/blog?page=2"
                aria-label="Next page"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <div className="my-6">
          <section
            className="relative isolate overflow-hidden bg-[linear-gradient(125deg,#1e56d6_0%,#1d4ed8_50%,#1a47c4_100%)] py-16 sm:py-24"
            aria-labelledby="newsletter-heading"
          >
            {/* Decorative blobs + grid */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl" />
              <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-white shadow-2xl shadow-blue-950/40 ring-1 ring-white/10 md:grid-cols-[0.85fr_1.15fr]">
                {/* Left decorative panel */}
                <div className="relative hidden items-center justify-center overflow-hidden bg-[linear-gradient(150deg,#ecfdf5_0%,#d1fae5_100%)] p-8 md:flex">
                  {/* Dot grid */}
                  <div aria-hidden="true" className="absolute left-6 top-6 grid grid-cols-5 gap-2 opacity-50">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"
                      />
                    ))}
                  </div>

                  {/* Mail + heart + message decorations */}
                  <div className="relative" aria-hidden="true">
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] bg-white shadow-md ring-1 ring-inset ring-emerald-100">
                      <Mail className="h-20 w-20 text-blue-600" />
                      <span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white shadow-lg ring-2 ring-white">
                        1
                      </span>
                    </div>
                    <div className="absolute -left-10 -top-8 flex h-14 w-14 rotate-[-8deg] items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-emerald-100">
                      <Heart className="h-7 w-7 fill-rose-500 text-rose-500" />
                    </div>
                    <div className="absolute -bottom-9 -right-9 flex h-14 w-14 rotate-[10deg] items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-emerald-100">
                      <MessageCircle className="h-7 w-7 fill-sky-500 text-sky-500" />
                    </div>
                  </div>
                </div>

                {/* Right form */}
                <div className="p-8 sm:p-10 lg:p-12">
                  <h2
                    id="newsletter-heading"
                    className="text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl lg:text-[2.25rem] lg:leading-tight"
                  >
                    Subscribe to our Newsletter!
                  </h2>
                  <p className="mt-3 max-w-xl text-base text-gray-600">
                    Practical social media tips, platform updates, and growth tactics — straight to your inbox.
                    Free, and we promise not to spam you.
                  </p>
                   <BlogNewsletterForm />
                  <p className="mt-3.5 text-sm text-gray-400">No spam. Unsubscribe anytime.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
