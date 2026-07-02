import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/data/use-cases";

export function BrowseByCategory() {
  return (
    <section className="py-12 bg-secondary/30">
      <Container>
        <div className="text-center mb-6">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-tight">
            Browse by Category
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`#${cat.id}`}
              className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {cat.title}
              <span className="text-muted-foreground"> ({cat.cases.length})</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
