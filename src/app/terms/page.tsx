import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service | PostPlanify",
  description: "Terms and conditions for using PostPlanify.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="py-16 lg:py-20">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-zinc dark:prose-invert">
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: June 1, 2026</p>

            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of PostPlanify,
              operated by Tumunuham LLC (&ldquo;PostPlanify,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an
              account or using the Service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">1. Account & Eligibility</h2>
            <p>
              You must be at least 18 years old (or the age of majority in your jurisdiction) to use
              PostPlanify. You are responsible for maintaining the security of your account
              credentials and for all activity that occurs under your account.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">2. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service to publish spam, harassment, illegal content, or content that infringes third-party rights</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code</li>
              <li>Circumvent rate limits, security mechanisms, or usage caps</li>
              <li>Resell or white-label the Service without written permission (white-label plans are available — contact sales)</li>
              <li>Use the Service in any way that violates applicable laws or social network terms of service</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-3">3. Plans, Billing & Cancellation</h2>
            <p>
              PostPlanify offers monthly and annual subscription plans. Fees are billed in advance
              and are non-refundable except where required by law or as explicitly stated in our
              14-day money-back guarantee for new annual subscriptions. You can cancel anytime
              from Settings — access continues until the end of your paid period.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">4. Content Ownership</h2>
            <p>
              You retain all rights to the content you create, upload, or publish through
              PostPlanify. You grant us a limited, non-exclusive license to host, process, and
              transmit that content solely to operate the Service on your behalf (e.g., publishing
              posts to your connected social accounts).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">5. Social Network Compliance</h2>
            <p>
              You are responsible for complying with the terms of each social network you connect.
              We may suspend accounts that violate third-party platform policies or that are
              flagged for abuse.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">6. AI Features</h2>
            <p>
              AI-generated captions, images, and suggestions are provided &ldquo;as is&rdquo; and may not be
              accurate, original, or appropriate. You are responsible for reviewing all
              AI-generated content before publishing.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">7. Service Availability</h2>
            <p>
              We target 99.9% monthly uptime for the publishing pipeline. Scheduled maintenance is
              announced at least 48 hours in advance. We are not liable for downtime caused by
              third-party social network outages.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">8. Suspension & Termination</h2>
            <p>
              We may suspend or terminate your account if you breach these Terms, fail to pay
              fees, or pose a security risk. You can terminate at any time by canceling your
              subscription and closing your account.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">9. Disclaimers & Limitation of Liability</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
              extent permitted by law, our aggregate liability is limited to the fees you paid in
              the prior 12 months. We are not liable for indirect, incidental, or consequential
              damages.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms. Material changes will be notified via email at least 30
              days before they take effect. Continued use after the effective date constitutes
              acceptance.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, USA, without regard
              to conflict-of-law principles.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">12. Contact</h2>
            <p>
              Tumunuham LLC
              <br />
              8 The Green, Suite A, Dover, Delaware 19901, USA
              <br />
              Email: hasan@postplanify.com
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}