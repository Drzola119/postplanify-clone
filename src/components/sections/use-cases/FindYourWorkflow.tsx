import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";

const SOCIAL_ICONS: { name: string; color: string; path: string }[] = [
  { name: "TikTok", color: "text-black dark:text-white", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { name: "Instagram", color: "text-pink-500", path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.39C1.34 2.69.93 3.36.62 4.15c-.3.76-.5 1.64-.56 2.91C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13.67.67 1.34 1.08 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.39.67-.67 1.08-1.34 1.39-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.39-2.13C21.31 1.34 20.64.93 19.85.62c-.76-.3-1.64-.5-2.91-.56C15.67 0 15.26 0 12 0m0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84m0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8m6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88" },
  { name: "Facebook", color: "text-blue-500", path: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" },
  { name: "X", color: "text-black dark:text-white", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { name: "YouTube", color: "text-red-500", path: "M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" },
  { name: "LinkedIn", color: "text-blue-700", path: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" },
  { name: "Pinterest", color: "text-red-600", path: "M9.04 21.54c.96.29 1.93.46 2.96.46a10 10 0 0 0 10-10A10 10 0 0 0 12 2 10 10 0 0 0 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.18-2.07 0-2.96l1.15-4.94s-.29-.58-.29-1.5c0-1.38.86-2.41 1.84-2.41.86 0 1.26.63 1.26 1.44 0 .86-.57 2.09-.86 3.27-.17.98.52 1.84 1.52 1.84 1.78 0 3.16-1.9 3.16-4.58 0-2.4-1.72-4.04-4.19-4.04-2.82 0-4.48 2.1-4.48 4.31 0 .86.28 1.73.74 2.3.09.06.09.14.06.29l-.29 1.09c0 .17-.11.23-.28.11-1.28-.56-2.02-2.38-2.02-3.85 0-3.16 2.24-6.03 6.56-6.03 3.44 0 6.12 2.49 6.12 5.74 0 3.44-2.13 6.2-5.18 6.2-.97 0-1.92-.52-2.26-1.13l-.67 2.37c-.23.86-.86 2.01-1.29 2.7v-.03Z" },
  { name: "Threads", color: "text-black dark:text-white", path: "M12.18 2c5.6 0 9.78 4.16 9.78 9.78s-4.18 9.78-9.78 9.78c-4.18 0-7.62-2.55-9-6.16l1.86-.78c1.07 2.86 3.79 4.94 7.14 4.94 4.32 0 7.78-3.46 7.78-7.78s-3.46-7.78-7.78-7.78c-3.5 0-6.42 2.28-7.38 5.42l-1.86-.78c1.26-3.95 4.74-6.64 9.24-6.64m.43 4.62c2.39 0 4.43 1.45 5.07 3.66l-1.86.78c-.4-1.55-1.78-2.46-3.21-2.46-1.06 0-1.93.4-2.5 1.05l-1.39-1.16c.86-.93 2.18-1.87 3.89-1.87m-.43 9.05c-.93 0-1.78-.32-2.43-.84l1.39-1.16c.31.21.66.32 1.04.32 1.18 0 1.93-.79 1.93-2.07 0-1.27-.75-2.07-1.93-2.07-.71 0-1.31.32-1.62.74l-1.39-1.16c.59-.78 1.66-1.27 3.01-1.27 2.16 0 3.78 1.34 3.78 3.76s-1.62 3.76-3.78 3.76" },
  { name: "Bluesky", color: "text-blue-500", path: "M5.5 4c-.83 0-1.5.67-1.5 1.5 0 .83.67 1.5 1.5 1.5S7 6.33 7 5.5 6.33 4 5.5 4m13 0c-.83 0-1.5.67-1.5 1.5 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S19.33 4 18.5 4m-9 3C8.67 7 8 7.67 8 8.5S8.67 10 9.5 10h5c.83 0 1.5-.67 1.5-1.5S15.33 7 14.5 7m0 7c-2.5 0-4.5 1.34-4.5 3v2h9v-2c0-1.66-2-3-4.5-3z" },
  { name: "WordPress", color: "text-sky-700", path: "M3.42 12c0-1.24.27-2.42.74-3.49l4.06 11.13A8.46 8.46 0 0 1 3.42 12m8.18 8.93L6.6 8.06c.45-.13.95-.21 1.48-.21 1.42 0 2.55.31 3.34.94l-2.83 7.7zm.93-10.55c.83 0 1.61-.11 2.31-.31.05-.02.1-.04.15-.07.06-.02.11-.05.16-.07-.74-1.18-2.06-1.99-3.07-1.99-1.07 0-2.05.79-2.05 1.86 0 .36.18.83.49 1.42.4.78 1.45 1.31 2.01 1.16m5.27 1.61c0-1.16-.41-1.96-.77-2.59-.47-.78-.92-1.43-.92-2.21 0-.87.66-1.68 1.58-1.68h.12a8.5 8.5 0 0 0-5.46-1.97c-2.83 0-5.32 1.39-6.77 3.49h.24c.92 0 2.35-.11 2.35-.11.48-.03.51.68.05.73 0 0-.48.05-1 .08l3.18 9.47 1.91-5.74-1.36-3.73a17 17 0 0 1-1-.08c-.47-.03-.43-.76.05-.73 0 0 1.46.11 2.32.11.92 0 2.35-.11 2.35-.11.48-.03.51.68.05.73 0 0-.48.05-1 .08l3.16 9.41.87-2.92c.38-1.21.67-2.08.67-2.83m1.83 1.04-2.66 7.71a8.45 8.45 0 0 0 5.16-7.74c0-1.13-.22-2.2-.62-3.18.05.13.09.26.12.41.13.66.05 1.42 0 2.8" },
];

const FEATURE_PILLS = [
  { name: "Content Calendar", iconPath: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zm0-12H5V6h14z" },
  { name: "Full Analytics", iconPath: "M3 13h2v8H3zm4-6h2v14H7zm4-4h2v18h-2zm4 8h2v10h-2zm4-4h2v14h-2z" },
  { name: "Social Inbox", iconPath: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-2 12h-3v3h-2v-3H9v-2h3v-3h2v3h3zm-9-2H6v-2h2zm0-4H6V7h2zm4 8h-2v-2h2zm4 0h-2v-2h2z" },
];

const AVATARS = [
  { src: "/images/pricing/testimonials/frank-benton.jpeg", alt: "User profile" },
  { src: "/images/pricing/testimonials/sam-cranq.avif", alt: "User profile" },
  { src: "/images/pricing/testimonials/aleksandr-heinlaid.avif", alt: "User profile" },
  { src: "/images/pricing/testimonials/shaheer.jpg", alt: "User profile" },
  { src: "/images/pricing/testimonials/monta.jpg", alt: "User profile" },
  { src: "/images/pricing/testimonials/oguz-doruk.jpg", alt: "User profile" },
  { src: "/images/pricing/testimonials/hasan-cagli-postplanify.webp", alt: "User profile" },
];

export function FindYourWorkflow() {
  return (
    <Container>
      <div className="rounded-xl bg-card text-card-foreground shadow my-6 p-6 max-w-2xl mx-4 sm:mx-auto">
        <div className="text-center space-y-5">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/pricing/logo.png"
                alt="PostPlanify logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
              <span className="font-semibold text-foreground">PostPlanify</span>
            </div>
            <p className="text-xl font-semibold">Find Your Workflow Above</p>
            <p className="text-sm text-muted-foreground">
              Pick your role or business type and see exactly how PostPlanify fits into your social media strategy.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-2">
            {SOCIAL_ICONS.map((icon) => (
              <div
                key={icon.name}
                className={`transition-all duration-200 hover:scale-110 ${icon.color}`}
                title={icon.name}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="w-8 h-8">
                  <path d={icon.path} />
                </svg>
              </div>
            ))}
          </div>

          <CTAButton href="/signup?show_first_signup_message=true" size="xl" showArrow className="min-w-[240px] h-14 px-8 shadow-lg">
            Start 7-day Free Trial
          </CTAButton>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {FEATURE_PILLS.map((pill) => (
              <div
                key={pill.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border shadow-sm text-sm"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="w-4 h-4">
                  <path d={pill.iconPath} />
                </svg>
                <span>{pill.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="flex -space-x-3">
              {AVATARS.map((a, i) => (
                <Image
                  key={i}
                  src={a.src}
                  alt={a.alt}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full ring-2 ring-card object-cover bg-muted"
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="w-4 h-4 text-yellow-500">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="text-muted-foreground">Trusted by 2150+ businesses</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
