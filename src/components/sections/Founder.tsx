import Image from "next/image";
import { Sparkles, MessageCircle, Rocket, Wrench, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const POINTS = [
  { icon: MessageCircle, color: "text-emerald-500", text: "Message me on WhatsApp — I'm the founder, and I reply 💬" },
  { icon: Rocket, color: "text-blue-500", text: "Request a feature — it ships in days, not quarters 🚀" },
  { icon: Wrench, color: "text-amber-500", text: "Report a bug — it gets fixed the same day 🛠️" },
  { icon: Check, color: "text-violet-500", text: "Add your whole team — no per-seat fees, ever" },
];

const GUARANTEES = [
  { title: "7-day free trial", description: "Test everything before you commit" },
  { title: "Cancel anytime", description: "No long-term commitments required" },
  { title: "14-day money back guarantee", description: "Refunds available within 14 days" },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function Founder() {
  return (
    <section id="trust" className="relative pt-0 pb-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
      <div className="absolute top-0 right-0 -z-10 size-[600px] bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 -z-10 size-[500px] bg-gradient-to-tr from-blue-300/20 to-emerald-300/20 rounded-full blur-3xl opacity-60" />

      <Container>
        <div className="text-center mb-12">
          <SectionHeading>
            You Talk to the Founder. Not a Chatbot.
          </SectionHeading>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Image side */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative size-44 md:size-56 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-4 ring-indigo-100">
              <Image
                src="/images/postplanify/https___postplanify.com__next_image_url__2Fhasan_cagli_postplanify.webp_w_3840_q_75"
                alt="Hasan Cagli PostPlanify headshot"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 224px, 176px"
              />
            </div>
            <h3 className="mt-6 text-lg font-bold leading-[28px]">Hasan Cagli</h3>
            <p className="text-muted-foreground">Founder @ PostPlanify</p>
            <p className="mt-1 text-sm text-indigo-600 font-semibold">10.1K+ Followers</p>
          </div>

          {/* Content side */}
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              If you&apos;ve ever used an enterprise social media tool, you know how it goes.
            </p>

            <ul className="space-y-2 text-base text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-red-500">💰</span><span>$249+/user/month</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500">⏳</span><span>Support tickets that take days</span></li>
              <li className="flex items-start gap-2"><span className="text-zinc-500">📉</span><span>Feature requests that go nowhere</span></li>
            </ul>

            <p className="text-xl font-semibold">
              I built PostPlanify because that model is broken.
            </p>
            <p className="text-lg font-medium">Here&apos;s what you get instead:</p>

            <ul className="space-y-3">
              {POINTS.map((p) => (
                <li key={p.text} className="flex items-start gap-3">
                  <span className={`shrink-0 ${p.color}`}>
                    <p.icon className="size-5" />
                  </span>
                  <span className="text-base">{p.text}</span>
                </li>
              ))}
            </ul>

            <Card className="bg-white/60 backdrop-blur p-5 mt-6">
              <p className="text-base font-medium">
                We&apos;re a small team. That&apos;s not a limitation.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                It&apos;s why we move faster and care more about your workflow than any enterprise tool ever will.
              </p>
            </Card>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {GUARANTEES.map((g) => (
                <Card key={g.title} className="bg-white/70 p-4">
                  <Check className="size-4 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold leading-tight">{g.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <CTAButton variant="pill" Icon={Sparkles} size="lg" href="/signup" className="min-w-[200px]">
                Try for Free
              </CTAButton>
              <CTAButton variant="pill" size="lg" href="/signup" className="min-w-[200px]">
                <GoogleIcon className="size-4" />
                Sign up with Google
              </CTAButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
