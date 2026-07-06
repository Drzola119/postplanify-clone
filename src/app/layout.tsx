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
                if (typeof window === 'undefined') return;

                var COOLDOWN_MS = 4000;
                var FLAG_KEY = '__postplanify_chunk_reload_at__';

                function triggerFullReload() {
                  var now = Date.now();
                  var last = parseInt(sessionStorage.getItem(FLAG_KEY) || '0', 10);
                  if (last && (now - last) < COOLDOWN_MS) return;
                  if (sessionStorage.getItem('__postplanify_reloading__')) return;
                  sessionStorage.setItem(FLAG_KEY, now.toString());
                  sessionStorage.setItem('__postplanify_reloading__', '1');

                  // Bypass disk/memory cache entirely: build a unique URL and reload.
                  var url = new URL(window.location.href);
                  url.searchParams.set('cb', now.toString());
                  url.searchParams.set('v', Math.random().toString(36).slice(2));
                  // location.reload() honors Cache-Control: no-cache from server.
                  window.location.replace(url.toString());
                }

                function isAssetFailure(e) {
                  var target = e && e.target;
                  if (!target) return false;
                  if (target.tagName !== 'LINK' && target.tagName !== 'SCRIPT' && target.tagName !== 'IMG') {
                    return false;
                  }
                  var src = target.src || target.href || '';
                  return src.indexOf('/_next/static/') !== -1 || /\\.css($|\\?)/.test(src) || /\\.js($|\\?)/.test(src);
                }

                window.addEventListener('error', function(e) {
                  if (isAssetFailure(e)) triggerFullReload();
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason;
                  if (!reason) return;
                  var msg = (reason.message || reason.toString() || '');
                  if (reason.name === 'ChunkLoadError' || /Loading chunk \\d+ failed|Failed to fetch|404/i.test(msg)) {
                    triggerFullReload();
                  }
                });

                // Clean up unused CSS preloads after window load to silence the
                // Chrome warning: "was preloaded using link preload but not used
                // within a few seconds from the window's load event." This is a
                // benign Next.js + Turbopack race where route prefetching preloads
                // CSS that isn't applied to the current page.
                function cleanupUnusedCssPreloads() {
                  var links = document.querySelectorAll('link[rel="preload"][href*=".css"]');
                  for (var i = 0; i < links.length; i++) {
                    var link = links[i];
                    var href = link.getAttribute('href');
                    if (!href) continue;
                    // If a stylesheet with the same href is already in the DOM,
                    // the preload was used — leave it.
                    if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) continue;
                    // Otherwise drop the preload so Chrome stops warning.
                    link.parentNode && link.parentNode.removeChild(link);
                  }
                }
                if (document.readyState === 'complete') {
                  cleanupUnusedCssPreloads();
                } else {
                  window.addEventListener('load', function() {
                    // Run on next tick so any same-page <link rel=stylesheet>
                    // insertions have a chance to register.
                    setTimeout(cleanupUnusedCssPreloads, 50);
                  });
                }

                // Clean the cb= param from the address bar after a successful reload.
                if (window.location.search.indexOf('cb=') !== -1) {
                  try {
                    var u = new URL(window.location.href);
                    u.searchParams.delete('cb');
                    u.searchParams.delete('v');
                    window.history.replaceState({}, document.title, u.pathname + u.search + u.hash);
                    sessionStorage.removeItem('__postplanify_reloading__');
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

