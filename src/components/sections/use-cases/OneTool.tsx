import { Container } from "@/components/ui/container";

export function OneTool() {
  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold leading-snug mb-3">
            One Tool for Every Social Media Workflow
          </h2>
          <p className="text-base leading-[27.2px] text-foreground/70 mb-3">
            Social media management looks different for a solo freelancer than it does for a 50-person marketing team. A creator needs fast content scheduling and cross-platform publishing. An agency needs multi-client dashboards, approval workflows, and team collaboration. A startup needs to do more with less.
          </p>
          <p className="text-base leading-[27.2px] text-foreground/70 mb-6">
            PostPlanify is a{" "}
            <strong className="font-semibold text-foreground">
              social media management platform that scales with you
            </strong>
            . Schedule posts to Instagram, Facebook, TikTok, LinkedIn, YouTube, Pinterest, X, Threads, and Bluesky from one dashboard. Generate captions with AI. Import designs from Canva. Collaborate with your team. Track what works with analytics.
          </p>

          <h3 className="text-xl font-semibold leading-snug mb-2.5 mt-6">
            Built for How You Actually Work
          </h3>
          <p className="text-base leading-[27.2px] text-foreground/70 mb-3">
            Batch-create a week of content in one sitting. Use the visual calendar to see everything at a glance. Set up approval workflows so clients or managers can review before publishing. Manage unlimited brands from a single account. PostPlanify fits into your existing workflow instead of forcing you into a new one.
          </p>

          <h3 className="text-xl font-semibold leading-snug mb-2.5 mt-6">
            Start Free, Scale When Ready
          </h3>
          <p className="text-base leading-[27.2px] text-foreground/70">
            Every plan includes a 7-day free trial with full access to all features. Whether you are managing one account or one hundred, there is a plan that fits.
          </p>
        </div>
      </Container>
    </section>
  );
}
