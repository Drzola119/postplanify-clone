import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Category } from "@/data/use-cases";

type Props = { category: Category };

export function CategorySection({ category }: Props) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <Container>
        <div className="max-w-3xl mb-6">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-tight">
            {category.title}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">{category.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {category.cases.map((item) => (
            <Link
              key={item.slug}
              href={`/social-media-management-for-${item.slug}`}
              className="group block rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:border-primary/50 hover:shadow-md"
            >
              <h3 className="text-base font-semibold leading-6">{item.title}</h3>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
