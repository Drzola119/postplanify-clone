"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CHANGELOG } from "@/data/changelog";

export default function Changelog() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <nav aria-label="breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
                <li className="inline-flex items-center gap-1.5">
                  <a className="transition-colors hover:text-foreground" href="/">Home</a>
                </li>
                <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-foreground">Changelog</span>
                </li>
              </ol>
            </nav>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Changelog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest features, improvements, and fixes we&apos;ve made to PostPlanify.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-10">
              {CHANGELOG.map((entry, idx) => (
                <div key={idx} className="relative pl-10 md:pl-12 transition-all duration-700" style={visible ? { opacity: 1, transform: "translateY(0)" } : { opacity: 0, transform: "translateY(24px)" }}>
                  <div className="absolute left-1.5 md:left-2.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-background z-10"></div>
                  <time dateTime={entry.iso} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                    <Calendar style={{ width: 14, height: 14 }} />
                    {entry.dateStr}
                  </time>
                  <article className="rounded-lg border bg-card p-5 mt-1.5">
                    <h2 className="text-xl font-semibold text-foreground mb-3">{entry.title}</h2>
                    <div className="text-sm text-muted-foreground">
                      <ul className="list-disc pl-5 my-2.5 marker:text-muted-foreground/50">
                        {entry.lis.map((li, liIdx) => (
                          <li key={liIdx} className="my-1">{li}</li>
                        ))}
                      </ul>
                      {entry.ps.map((p, pIdx) => (
                        <p key={pIdx} className="mt-2">{p}</p>
                      ))}
                    </div>
                    {entry.imgSrc && (
                      <div className="mt-4 rounded-md overflow-hidden border-2 border-border cursor-pointer" style={{ maxWidth: 448 }}>
                        <img src={entry.imgSrc} alt={entry.imgAlt || entry.title} className="w-full h-auto" />
                      </div>
                    )}
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
