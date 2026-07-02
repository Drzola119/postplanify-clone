import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { MarketingPageTemplate } from "@/components/marketing/MarketingPageTemplate";
import { mediaLibrary } from "@/data/marketing-pages";

export const metadata = {
  title: "Media Library for Social Media | PostPlanify",
  description:
    "One library for every brand asset. Canva, Google Drive, and Dropbox integrations. Search, tag, and reuse in one click.",
};

export default function MediaLibraryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-20">
        <MarketingPageTemplate data={mediaLibrary} />
      </main>
      <Footer />
    </>
  );
}