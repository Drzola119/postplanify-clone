import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://postplanify.com"),
  title: "PostPlanify: Social Media Management for Agencies and Teams",
  description:
    "Manage all your social media in one place. Schedule posts, track analytics, manage comments and messages, and collaborate with your team across 10 platforms.",
  openGraph: {
    title: "PostPlanify: Social Media Management for Agencies and Teams",
    description:
      "Manage all your social media in one place. Schedule posts, track analytics, manage comments and messages, and collaborate with your team across 10 platforms.",
    images: ["/seo/postplanify-og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function reloadWithCacheBuster() {
                  var lastReload = sessionStorage.getItem('last_chunk_reload');
                  var now = Date.now();
                  if (!lastReload || (now - parseInt(lastReload, 10) > 15000)) {
                    sessionStorage.setItem('last_chunk_reload', now.toString());
                    var url = new URL(window.location.href);
                    url.searchParams.set('cb', now.toString());
                    window.location.replace(url.toString());
                  }
                }

                window.addEventListener('error', function(e) {
                  var target = e.target;
                  if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
                    var url = target.src || target.href;
                    if (url && (url.indexOf('/_next/static/') !== -1 || url.indexOf('.css') !== -1 || url.indexOf('.js') !== -1)) {
                      reloadWithCacheBuster();
                    }
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  if (reason && (reason.name === 'ChunkLoadError' || /Loading chunk|Failed to fetch/i.test(reason.message || ''))) {
                    reloadWithCacheBuster();
                  }
                });

                if (typeof window !== 'undefined' && window.location.search.indexOf('cb=') !== -1) {
                  try {
                    var url = new URL(window.location.href);
                    url.searchParams.delete('cb');
                    var cleanUrl = url.pathname + url.search + url.hash;
                    window.history.replaceState({}, document.title, cleanUrl);
                  } catch (err) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
// last deploy: 2026-07-03T13:21:00Z - cdn-purge-noop

