import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy | PostPlanify",
  description: "How PostPlanify collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="py-16 lg:py-20">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-zinc dark:prose-invert">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: June 1, 2026</p>

            <p>
              This Privacy Policy describes how Tumunuham LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
              uses, and discloses your personal information when you use PostPlanify (the
              &ldquo;Service&rdquo;).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">1. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul>
              <li>
                <strong>Account information:</strong> Name, email address, password (hashed),
                profile photo, and company information you provide at signup.
              </li>
              <li>
                <strong>Social account credentials:</strong> OAuth tokens granted by you when
                connecting Instagram, Facebook, YouTube, TikTok, X, LinkedIn, Pinterest, Threads,
                Bluesky, or Google Business accounts.
              </li>
              <li>
                <strong>Content:</strong> Posts, captions, hashtags, images, videos, and scheduling
                data you create within the Service.
              </li>
              <li>
                <strong>Usage data:</strong> Log data, device information, IP address, browser
                type, pages visited, and feature usage to improve the Service.
              </li>
              <li>
                <strong>Billing information:</strong> Processed by Stripe. We do not store full
                payment card numbers.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-3">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send billing notifications</li>
              <li>Publish and manage content on your connected social accounts</li>
              <li>Send product updates, security alerts, and support messages</li>
              <li>Detect, prevent, and address fraud, abuse, security, or technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-3">3. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We share information only with: social
              networks you explicitly connect, payment processors (Stripe), infrastructure
              providers (hosting, email, monitoring), and legal authorities when required by law.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">4. Data Retention</h2>
            <p>
              We retain account data while your account is active. After account deletion, we
              delete personal data within 30 days, except where retention is required by law (e.g.
              tax records).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">5. Your Rights</h2>
            <p>You can access, update, export, or delete your account data at any time from Settings, or by contacting hasan@postplanify.com. EU/UK users have additional rights under GDPR.</p>

            <h2 className="text-2xl font-bold mt-8 mb-3">6. Cookies & Tracking</h2>
            <p>
              We use essential cookies for authentication and session management, plus optional
              analytics cookies (you can opt out via the cookie banner). See our Cookie Policy for
              details.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">7. Security</h2>
            <p>
              We encrypt data in transit (TLS 1.2+) and at rest (AES-256), enforce 2FA for team
              accounts, and run quarterly third-party security audits. See our Security page for
              more.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">8. International Transfers</h2>
            <p>
              Data is primarily stored in the United States. For EU/UK users, we use Standard
              Contractual Clauses to legitimize transfers.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">9. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not directed to children under 13 (or under 16 in the EU/UK). We do
              not knowingly collect data from children.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">10. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy. We will notify you of material changes via email
              and in-app notice at least 30 days before they take effect.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-3">11. Contact</h2>
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