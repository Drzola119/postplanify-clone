import Image from "next/image";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";

const TESTIMONIALS = [
  {
    quote:
      "I've tried many social media schedulers and PostPlanify is by far the best value-for-money — especially for agencies. The white-label reports and per-client workspaces save us hours every week.",
    author: "Andreas Luis",
    role: "Founder",
    company: "arcdigital.ro",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faprovaleges.jpg_w_96_q_75",
    stats: [
      { value: "20+", label: "Clients" },
      { value: "180", label: "Accounts" },
      { value: "5", label: "Countries" },
    ],
  },
  {
    quote:
      "Finally a tool that doesn't nickel-and-dime you for every feature. The AI assistant, content calendar, and inbox work exactly the way you'd expect — and the team is incredibly responsive.",
    author: "Eric Bai",
    role: "Co-founder",
    company: "shopmeagent.com",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Freddit_man_avatar.jpg_w_96_q_75",
    stats: [
      { value: "12+", label: "Clients" },
      { value: "95", label: "Accounts" },
      { value: "3", label: "Countries" },
    ],
  },
  {
    quote:
      "Switched from a much more expensive competitor and haven't looked back. Setup took 10 minutes, the UI is clean, and our engagement has noticeably improved across every platform.",
    author: "Umut Yorulmaz",
    role: "Founder",
    company: "udydigital.com",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ftintin.jpg_w_96_q_75",
    stats: [
      { value: "35+", label: "Clients" },
      { value: "240", label: "Accounts" },
      { value: "8", label: "Countries" },
    ],
  },
];

export function Testimonials() {
  return (
    <section className="py-8 bg-background">
      <Container>
        <div className="text-center mb-10">
          <h2 className="text-[36px] font-bold leading-[40px] tracking-normal">
            Loved by agencies & teams <span aria-hidden>❤️</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            Real stories from people running their social presence on PostPlanify.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.author}
              className="flex flex-col rounded-2xl border border-zinc-200/70 bg-card p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex text-yellow-500 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>

              <blockquote className="text-sm leading-relaxed text-foreground/90 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-5 flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border bg-muted shrink-0">
                  <Image src={t.avatar} alt={t.author} fill className="object-cover" sizes="44px" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{t.author}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t grid grid-cols-3 gap-2 text-center">
                {t.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-bold text-lg leading-none">{s.value}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}