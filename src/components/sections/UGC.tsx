import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { SectionHeading } from "@/components/ui/section-heading";

type Quote = {
  author: string;
  text: string;
  avatar: string;
};

const QUOTES: Quote[] = [
  {
    author: "Frank Benton",
    text: "It is a huge time saver. I love that I can access my Canva designs without needing to download anything.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ffrank_benton.jpeg_w_96_q_75",
  },
  {
    author: "Monta",
    text: "The customer service is absolutely awesome. I manage over 13 accounts and some of the videos reach over 500,000 views!",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fmonta.jpg_w_96_q_75",
  },
  {
    author: "AprovaLeges",
    text: "PostPlanify has transformed our social media management. The interface is intuitive, and the scheduling works with precision, allowing the AprovaLeges team to focus on what truly matters: producing quality content.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faprovaleges.jpg_w_96_q_75",
  },
  {
    author: "Shaheer",
    text: "postplanify is the best ive seen so far, has all the features i need.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fshaheer.jpg_w_96_q_75",
  },
  {
    author: "Aleksandr Heinlaid",
    text: "PostPlanify mixes AI captions, multi-platform scheduling, and Canva templates. Overall a massive time saver for agencies.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Faleksandr_heinlaid.avif_w_96_q_75",
  },
  {
    author: "Tintin",
    text: "We're loving PostPlanify. I've been using scheduling tools for years and it's by far the best one.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Ftintin.jpg_w_96_q_75",
  },
  {
    author: "Andreas",
    text: "Really helped me manage my time better and keep all my posts organized in one place.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Freddit_man_avatar.jpg_w_96_q_75",
  },
  {
    author: "Sam",
    text: "It's looking great!! Just what I needed to make my SM game up to the next level.",
    avatar: "/images/postplanify/https___postplanify.com__next_image_url__2Ftestimonials_2Fsam_cranq.avif_w_96_q_75",
  },
];

export function UGC() {
  return (
    <section className="py-12 bg-muted/5">
      <Container>
        <div className="text-center mb-10">
          <SectionHeading>More from the community.</SectionHeading>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUOTES.map((q) => (
            <Card key={q.author} hover className="p-5 flex flex-col gap-3">
              <Stars />
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">&ldquo;{q.text}&rdquo;</p>
              <div className="flex items-center gap-2.5 pt-3 border-t">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                  <Image src={q.avatar} alt={q.author} fill className="object-cover" sizes="36px" />
                </div>
                <p className="text-sm font-semibold truncate">{q.author}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
