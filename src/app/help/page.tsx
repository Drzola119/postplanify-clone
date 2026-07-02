import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search, Globe, ChevronDown, Menu } from "lucide-react";

export const metadata: Metadata = {
  title: "Home | PostPlanify Help Center",
  description: "PostPlanify Help Center",
  alternates: { canonical: "/help" },
};

const COLLECTIONS = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Everything you need to get going.",
    icon: "/images/help/icon-getting-started.svg",
    href: "/help/collections/getting-started",
    author: "Hasan",
    articleCount: 5,
  },
  {
    id: "publishing",
    name: "Publishing",
    description: "Creating & scheduling posts on PostPlanify",
    icon: "/images/help/icon-publishing.svg",
    href: "/help/collections/publishing",
    author: "Hasan",
    articleCount: 1,
  },
  {
    id: "team-collaboration",
    name: "Team Collaboration",
    description: "Collaborate with your team + clients seamlessly.",
    icon: "/images/help/icon-team-collab.svg",
    href: "/help/collections/team-collaboration",
    author: "Hasan",
    articleCount: 2,
  },
  {
    id: "reports",
    name: "Reports",
    description: "Branded reports your clients will actually read.",
    icon: "/images/help/icon-reports.svg",
    href: "/help/collections/reports",
    author: "Hasan",
    articleCount: 1,
  },
  {
    id: "billing",
    name: "Billing",
    description: "Manage payments and subscriptions.",
    icon: "/images/help/icon-billing.svg",
    href: "/help/collections/billing",
    author: "Hasan",
    articleCount: 5,
  },
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    description: "Quick fixes for common issues — connecting accounts, publishing, scheduling, and more.",
    icon: "/images/help/icon-troubleshooting.svg",
    href: "/help/collections/troubleshooting",
    author: "Hasan",
    articleCount: 2,
  },
];

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/postplanify",
    icon: "/images/help/icon-linkedin.svg",
  },
  {
    label: "X (Twitter)",
    href: "https://www.twitter.com/PostPlanify",
    icon: "/images/help/icon-twitter.svg",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@PostPlanify",
    icon: "/images/help/icon-youtube.svg",
  },
];

export default function HelpPage() {
  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      }}
    >
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>

      <main>
        {/* Header — blue bg with logo + welcome + search */}
        <header className="flex flex-col text-white">
          <div
            className="relative flex grow flex-col -mb-36 pb-48 sm:min-h-[423px]"
            style={{
              backgroundColor: "#0026FF",
              backgroundImage:
                "radial-gradient(333.38% 100% at 50% 0%, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.008) 11.67%, rgba(255, 255, 255, 0.035) 21.17%, rgba(255, 255, 255, 0.07) 28.85%, rgba(255, 255, 255, 0.12) 35.34%, rgba(255, 255, 255, 0.18) 41.34%, rgba(255, 255, 255, 0.25) 46.83%, rgba(255, 255, 255, 0.32) 51.83%, rgba(255, 255, 255, 0.4) 56.34%, rgba(255, 255, 255, 0.49) 60.34%, rgba(255, 255, 255, 0.58) 63.84%, rgba(255, 255, 255, 0.68) 66.83%, rgba(255, 255, 255, 0.78) 69.33%, rgba(255, 255, 255, 0.87) 71.33%, rgba(255, 255, 255, 0.94) 72.83%, rgba(255, 255, 255, 1) 73.83%)",
            }}
          >
            <div className="flex h-full flex-col items-center">
              {/* Subheader: logo + lang picker */}
              <section className="relative flex w-full flex-col mb-6 pb-6">
                <div className="flex justify-center px-5 pt-6 leading-none sm:px-10">
                  <div className="flex items-center w-full max-w-[960px]">
                    {/* Logo */}
                    <Link href="/help" className="block">
                      <Image
                        src="/images/help/help-logo.png"
                        alt="PostPlanify Help Center"
                        width={35}
                        height={35}
                        priority
                      />
                    </Link>

                    {/* Right side: language picker on desktop, hamburger on mobile */}
                    <div className="ml-auto flex items-center font-semibold">
                      {/* Mobile hamburger */}
                      <button
                        className="md:hidden flex items-center border-none bg-transparent px-1.5"
                        aria-label="Open menu"
                      >
                        <Menu className="size-6" />
                      </button>
                      {/* Desktop language picker */}
                      <div className="hidden md:flex items-center gap-1 ml-3">
                        <Globe className="size-4 shrink-0" />
                        <span>English</span>
                        <ChevronDown className="size-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Welcome message + search */}
              <section className="relative mx-5 flex h-full w-full flex-col items-center px-5 sm:px-10">
                <div className="flex h-full max-w-full flex-col w-[960px] justify-center">
                  <h1 className="text-[28px] font-bold text-center leading-[1.25] mb-6">
                    Welcome, how can we help?
                  </h1>
                  <div className="relative w-full">
                    <form action="/help" autoComplete="off">
                      <div className="flex w-full flex-col items-center">
                        <div className="relative flex w-full sm:w-[640px]">
                          <label htmlFor="search-input" className="sr-only">
                            Search for articles...
                          </label>
                          <input
                            id="search-input"
                            type="text"
                            autoComplete="off"
                            placeholder="Search for articles..."
                            name="q"
                            aria-label="Search for articles..."
                            className="peer w-full rounded-full border border-black/10 bg-white/20 p-4 ps-12 text-lg text-white shadow outline-none transition ease-linear placeholder:text-white hover:bg-white/30 hover:shadow-md focus:border-transparent focus:bg-white focus:text-gray-900 focus:shadow-lg placeholder:focus:text-gray-500"
                          />
                          <div className="absolute inset-y-0 start-0 flex items-center fill-white peer-focus-visible:fill-gray-500 pointer-events-none ps-5">
                            <Search className="size-[22px]" />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </header>

        {/* Main content — collections grid */}
        <div className="z-1 flex shrink-0 grow basis-auto justify-center px-5 sm:px-10">
          <section className="max-w-full w-[960px]" id="main-content">
            <section>
              <div className="flex flex-col gap-12">
                <div
                  className="grid auto-rows-auto gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6 md:grid-cols-2"
                  role="list"
                >
                  {COLLECTIONS.map((c) => (
                    <Link
                      key={c.id}
                      href={c.href}
                      data-testid="collection-card-classic"
                      className="group flex grow overflow-hidden border border-solid border-[#e6e6e6] bg-white no-underline shadow-sm transition ease-linear rounded-lg hover:border-blue-500/60 flex-col"
                    >
                      <div className="flex grow flex-col gap-4 p-5 sm:p-6" id={c.id}>
                        {/* Icon box */}
                        <div className="flex items-center rounded-md bg-cover bg-center h-10 w-10 justify-center bg-[#f5f5f5]">
                          <div className="h-6 w-6">
                            <Image
                              src={c.icon}
                              alt=""
                              width={24}
                              height={24}
                              className="w-full h-full"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Title + description + author */}
                        <div className="flex w-full flex-1 flex-col justify-between">
                          <div>
                            <div
                              data-testid="collection-name"
                              className="-mt-1 mb-0.5 line-clamp-1 text-base font-semibold leading-normal text-gray-900 transition ease-linear group-hover:text-blue-600"
                            >
                              {c.name}
                            </div>
                            <p className="mb-0 mt-0 line-clamp-3 sm:line-clamp-2 text-base text-gray-900 leading-[1.6]">
                              {c.description}
                            </p>
                          </div>
                          <div className="mt-4">
                            <div className="flex gap-2">
                              <div className="flex flex-row" aria-hidden="true">
                                <div className="flex shrink-0 flex-col items-center justify-center rounded-full sm:flex-row">
                                  <span
                                    aria-hidden="true"
                                    className="inline-flex items-center justify-center rounded-full bg-cover bg-center h-6 w-6 shadow-md"
                                    style={{
                                      backgroundImage: "url('/images/help/hasan-avatar.png')",
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="line-clamp-1 flex flex-wrap items-center text-sm text-[#737373] leading-[1.6]">
                                <span className="hidden sm:inline">By {c.author}</span>
                                <span className="inline sm:hidden">1 author</span>
                                <span className="mx-2 inline-block size-1 rounded-full bg-current" aria-hidden="true" />
                                {c.articleCount} article{c.articleCount === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </section>
        </div>

        {/* Footer */}
        <footer
          id="footer"
          className="mt-24 shrink-0 bg-white px-0 py-12 text-left text-base"
          style={{ color: "#929ba5" }}
        >
          <div className="shrink-0 grow basis-auto px-5 sm:px-10">
            <div className="mx-auto max-w-[960px] sm:w-auto">
              <div className="text-center">
                <div className="align-middle text-lg" style={{ color: "#929ba5" }}>
                  <Link href="/help" className="no-underline">
                    <span>PostPlanify Help Center</span>
                  </Link>
                </div>
                <div className="mt-3 text-base">
                  Social media management for agencies, teams and businesses.
                </div>

                {/* Social links */}
                <ul className="flex flex-wrap items-center gap-4 p-0 justify-center mt-10">
                  {SOCIAL_LINKS.map((s) => (
                    <li key={s.label} className="list-none align-middle">
                      <a
                        href={s.href}
                        target="_blank"
                        rel="nofollow noreferrer noopener"
                        className="no-underline"
                        aria-label={s.href}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.icon}
                          alt=""
                          width={16}
                          height={16}
                          loading="lazy"
                        />
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Powered by Intercom */}
                <div className="mt-12 flex justify-center">
                  <a
                    href="https://www.intercom.com/intercom-link?company=PostPlanify&solution=customer-support&utm_campaign=intercom-link&utm_content=We+run+on+Intercom&utm_medium=help-center&utm_referrer=https%3A%2F%2Fhelp.postplanify.com%2Fen&utm_source=desktop-web"
                    target="_blank"
                    rel="nofollow noreferrer noopener"
                    className="no-underline flex items-center gap-2 text-sm hover:opacity-80"
                  >
                    <span className="font-semibold tracking-wide">Intercom</span>
                    <span className="opacity-80">We run on Intercom</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
