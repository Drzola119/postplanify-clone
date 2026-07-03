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
              window.addEventListener('error', function(e) {
                var target = e.target;
                if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
                  var url = target.src || target.href;
                  if (url && (url.indexOf('/_next/static/') !== -1 || url.indexOf('.css') !== -1 || url.indexOf('.js') !== -1)) {
                    var lastReload = sessionStorage.getItem('last_chunk_reload');
                    var now = Date.now();
                    if (!lastReload || (now - parseInt(lastReload, 10) > 10000)) {
                      sessionStorage.setItem('last_chunk_reload', now.toString());
                      window.location.reload();
                    }
                  }
                }
              }, true);
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
// last deploy: 2026-07-03T12:00:15Z - cdn-purge-noop
