/**
 * /dashboard/carousels/[id]/edit
 *
 * Dedicated editor page for Carousel Studio drafts.
 * Pre-fetches the canonical CarouselDocument and workspace Brand Kits.
 */
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import { getCarouselDocument } from "@/lib/carousel-gen/document-service";
import { listBrandKits } from "@/lib/carousel-gen/brand-kits";
import { StudioContainer } from "@/components/dashboard/carousel-studio/studio-container";

export const metadata: Metadata = {
  title: "Carousel Studio — Editor",
  description: "Edit, refine, review, and export your multi-slide carousel.",
};

export default async function CarouselEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession(false);
  if (session instanceof Response) {
    redirect("/auth/login");
  }

  const { id } = await params;
  if (!id) notFound();

  const doc = await getCarouselDocument(session.workspaceId, id);
  if (!doc) notFound();

  const brandKits = await listBrandKits(session.workspaceId);

  return (
    <StudioContainer
      initialDocument={doc}
      brandKits={brandKits}
    />
  );
}
