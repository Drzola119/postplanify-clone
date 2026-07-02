import { Mail, Heart, Send } from "lucide-react";
import { Container } from "@/components/ui/container";

export function Newsletter() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(125deg,#1e56d6_0%,#1d4ed8_50%,#1a47c4_100%)] py-24">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-blue-300/20 blur-3xl" />

      <Container>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: illustration / decoration */}
          <div className="flex flex-col items-start gap-5">
            <div className="relative">
              {/* Mail icon with badge */}
              <div className="relative size-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Mail className="size-10 text-white" />
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center size-7 rounded-full bg-red-500 text-white text-xs font-bold ring-4 ring-[#1e56d6]">
                  1
                </span>
              </div>
              <div className="absolute -bottom-3 -right-3 size-8 rounded-full bg-pink-500 flex items-center justify-center ring-4 ring-[#1e56d6]">
                <Heart className="size-4 text-white fill-white" />
              </div>
            </div>
            <div>
              {/* Original: 36/800/45/-0.9, color rgb(23,37,84) dark navy on blue bg */}
              <h2 className="text-[36px] font-extrabold leading-[45px] tracking-[-0.9px] text-[#172554]">
                Subscribe to our Newsletter!
              </h2>
              <p className="mt-3 text-blue-100 text-base md:text-lg max-w-md">
                Get social media tips, product updates, and the occasional behind-the-scenes from the team — once a week, no spam.
              </p>
            </div>
          </div>

          {/* Right: form card */}
          <div className="rounded-2xl bg-white p-6 text-foreground shadow-2xl">
            <p className="text-sm font-medium text-muted-foreground mb-1">Join 8,000+ readers</p>
            <h3 className="text-xl font-bold mb-4">Drop your email below</h3>
            <form className="space-y-3">
              <div className="flex items-center rounded-lg border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                <Mail className="size-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  aria-label="Email address"
                />
              </div>
              {/* Original: 53.33h / 12r / blue bg */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 h-[53px] px-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                <Send className="size-4" />
                Subscribe
              </button>
              <p className="text-xs text-muted-foreground text-center">
                By subscribing you agree to our{" "}
                <a href="/privacy-policy" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
