import { Container } from "@/components/ui/container";
import { CTAButton } from "@/components/ui/cta-button";
import { ArrowRight } from "lucide-react";

export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_6px_rgba(0,0,0,0.08)]">
      <Container className="py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-foreground/90 text-center sm:text-left">
          <span aria-hidden className="mr-1">🎉</span>
          Try PostPlanify free for 7 days - $0 today, cancel anytime.
        </p>
        <CTAButton href="/signup" Icon={ArrowRight} showArrow size="md" className="shrink-0 h-11">
          Start Free Trial
        </CTAButton>
      </Container>
    </div>
  );
}
