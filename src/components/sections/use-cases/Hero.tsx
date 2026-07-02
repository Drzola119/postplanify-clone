import Link from "next/link";
import { Container } from "@/components/ui/container";

export function UseCasesHero() {
  return (
    <section className="bg-gradient-to-b from-background to-background/95 py-12 md:py-20">
      <Container>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border shadow-sm mb-2">
            <span className="text-xs font-normal text-foreground">114+ Use Cases</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
            Social Media Management for Every Role
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Whether you are a solo creator scheduling your first posts or an agency managing dozens of client accounts — PostPlanify adapts to your workflow. Find your role below and see how it works for you.
          </p>
        </div>
      </Container>
    </section>
  );
}
