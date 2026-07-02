import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

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
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}