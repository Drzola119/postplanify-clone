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

                // Clean up unused CSS preloads to silence the Chrome warning:
                // "was preloaded using link preload but not used within a few
                // seconds from the window's load event."
                //
                // Next.js + Turbopack route prefetching injects <link rel=preload
                // href=*.css> tags dynamically when the user hovers a Link. If
                // the user never visits that route, Chrome logs the warning.
                // Removing the tag AFTER Chrome has already fired the preload
                // request does NOT undo the warning, so we have to:
                //   1. Run cleanup at multiple times (DOM ready, load, +100ms,
                //      +500ms, +1s, +2s).
                //   2. Watch for newly-added preloads with MutationObserver
                //      and remove them as soon as they appear, before Chrome
                //      can request the resource.
                function hasMatchingStylesheet(href) {
                  if (!href) return false;
                  var sheets = document.querySelectorAll('link[rel="stylesheet"]');
                  for (var i = 0; i < sheets.length; i++) {
                    if (sheets[i].getAttribute('href') === href) return true;
                  }
                  return false;
                }

                function cleanupUnusedCssPreloads() {
                  var links = document.querySelectorAll('link[rel="preload"][href*=".css"]');
                  for (var i = 0; i < links.length; i++) {
                    var link = links[i];
                    var href = link.getAttribute('href');
                    if (!href) continue;
                    if (hasMatchingStylesheet(href)) continue;
                    // Drop the preload immediately so Chrome does not fetch it.
                    link.parentNode && link.parentNode.removeChild(link);
                  }
                }

                function scheduleCleanup() {
                  cleanupUnusedCssPreloads();
                  setTimeout(cleanupUnusedCssPreloads, 100);
                  setTimeout(cleanupUnusedCssPreloads, 500);
                  setTimeout(cleanupUnusedCssPreloads, 1000);
                  setTimeout(cleanupUnusedCssPreloads, 2000);
                }

                if (document.readyState === 'complete') {
                  scheduleCleanup();
                } else {
                  window.addEventListener('load', scheduleCleanup);
                }

                // Catch future preloads injected by route prefetch and remove
                // them before Chrome can fire the preload request.
                if (typeof MutationObserver !== 'undefined') {
                  var observer = new MutationObserver(function(mutations) {
                    for (var m = 0; m < mutations.length; m++) {
                      var added = mutations[m].addedNodes;
                      for (var k = 0; k < added.length; k++) {
                        var n = added[k];
                        if (!n || n.tagName !== 'LINK') continue;
                        if (n.rel !== 'preload') continue;
                        var href = n.getAttribute('href') || '';
                        if (href.indexOf('.css') === -1) continue;
                        // Defer one tick so we don't interfere with whatever
                        // immediately converts this preload into a stylesheet.
                        (function(node, h) {
                          setTimeout(function() {
                            if (!hasMatchingStylesheet(h) && node.parentNode) {
                              node.parentNode.removeChild(node);
                            }
                          }, 0);
                        })(n, href);
                      }
                    }
                  });
                  observer.observe(document.head, { childList: true, subtree: true });
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

