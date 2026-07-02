import type { Metadata } from "next";
import { Cookie } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CTAButton } from "@/components/ui/cta-button";

export const metadata: Metadata = {
  title: "Cookie Policy | PostPlanify",
  description: "What cookies and similar technologies PostPlanify uses, and why.",
};

const CATEGORIES = [
  {
    title: "Essential cookies",
    required: true,
    items: [
      { name: "pp_session", purpose: "Authentication session token", expiry: "Session" },
      { name: "pp_csrf", purpose: "CSRF protection", expiry: "Session" },
      { name: "pp_pref", purpose: "Theme, language, dashboard preferences", expiry: "1 year" },
    ],
  },
  {
    title: "Analytics cookies",
    required: false,
    items: [
      { name: "_pp_analytics", purpose: "Anonymous usage statistics (self-hosted, page views only)", expiry: "90 days" },
    ],
  },
  {
    title: "Marketing cookies",
    required: false,
    items: [
      { name: "_pp_attribution", purpose: "First-touch attribution for affiliate links", expiry: "30 days" },
    ],
  },
];

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="py-16 lg:py-20">
        <Container>
          <article className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Cookie className="size-10 text-primary mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-3">Cookie Policy</h1>
              <p className="text-lg text-muted-foreground">
                What cookies and similar technologies PostPlanify uses, and why.
              </p>
              <p className="text-sm text-muted-foreground mt-4">Last updated: June 1, 2026</p>
            </div>

            <p className="mb-8">
              This Cookie Policy explains how Tumunuham LLC (&ldquo;we,&rdquo; &ldquo;us&rdquo;) uses cookies and similar
              technologies when you visit postplanify.com or use the PostPlanify application. You
              can manage your cookie preferences at any time from the cookie banner or your
              browser settings.
            </p>

            {CATEGORIES.map((cat, i) => (
              <div key={i} className="mb-8">
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  {cat.title}
                  {cat.required ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                      Optional
                    </span>
                  )}
                </h2>
                <Card className="p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">Cookie</th>
                        <th className="text-left py-2 px-4 font-medium">Purpose</th>
                        <th className="text-left py-2 px-4 font-medium">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.items.map((item, j) => (
                        <tr key={j} className="border-t">
                          <td className="py-2 px-4 font-mono text-xs">{item.name}</td>
                          <td className="py-2 px-4 text-muted-foreground">{item.purpose}</td>
                          <td className="py-2 px-4 text-muted-foreground">{item.expiry}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            ))}

            <h2 className="text-2xl font-bold mt-10 mb-3">Managing cookies</h2>
            <p className="mb-4">
              You can opt out of non-essential cookies via our cookie banner. You can also clear
              cookies and adjust browser-level controls at any time. Note that disabling essential
              cookies will prevent you from logging in to PostPlanify.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-3">Third-party cookies</h2>
            <p className="mb-4">
              We minimize third-party cookies. The only third-party cookies we set are from
              payment processors (Stripe) when you visit a billing page. These are essential and
              short-lived.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-3">Do Not Track</h2>
            <p className="mb-8">
              PostPlanify honors browser DNT signals. When DNT is enabled, we do not set analytics
              cookies.
            </p>

            <div className="text-center mt-12">
              <h2 className="text-2xl font-bold mb-3">Questions?</h2>
              <p className="text-muted-foreground mb-6">
                Email us with any questions about cookies or privacy.
              </p>
              <CTAButton href="mailto:hasan@postplanify.com?subject=Cookie%20question">
                Email Privacy Team
              </CTAButton>
            </div>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}