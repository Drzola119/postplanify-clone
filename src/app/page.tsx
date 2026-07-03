export const dynamic = "force-dynamic";

import { AnnouncementBar } from "@/components/sections/AnnouncementBar";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Testimonials } from "@/components/sections/Testimonials";
import { Stats } from "@/components/sections/Stats";
import { Integrations } from "@/components/sections/Integrations";
import { Audience } from "@/components/sections/Audience";
import { Reviews } from "@/components/sections/Reviews";
import { Pricing } from "@/components/sections/Pricing";
import { UGC } from "@/components/sections/UGC";
import { Founder } from "@/components/sections/Founder";
import { API } from "@/components/sections/Api";
import { FAQ } from "@/components/sections/FAQ";
import { Newsletter } from "@/components/sections/Newsletter";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { BottomBar } from "@/components/sections/BottomBar";

export default function Home() {
  return (
    <>
      <main className="min-h-screen pb-20">
        <AnnouncementBar />
        <Header />
        <Hero />
        <Features />
        <Testimonials />
        <Stats />
        <Integrations />
        <Audience />
        <Reviews />
        <Pricing />
        <UGC />
        <Founder />
        <API />
        <FAQ />
        <Newsletter />
        <FinalCTA />
        <Footer />
      </main>
      <BottomBar />
    </>
  );
}