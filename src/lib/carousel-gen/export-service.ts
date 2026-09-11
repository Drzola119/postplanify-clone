/**
 * Export Service for Carousel Studio
 *
 * Provides client/server export pipelines:
 * - Multi-page PDF with exact aspect ratio dimensions (1:1, 4:5, 9:16)
 * - PNG ZIP archive with structured zero-padded filenames (01-hook.png, etc.)
 * - Slide-by-slide image rendering
 */


import {
  type CarouselDocument,
  ASPECT_RATIO_DIMENSIONS,
} from "@/lib/carousel-gen/types";

export async function exportCarouselToZip(
  deck: CarouselDocument,
  slideDataUrls: string[]
): Promise<Blob> {
  validateAssets(deck,slideDataUrls);
  const {default:JSZip}=await import("jszip");
  const zip = new JSZip();
  const folder = zip.folder(deck.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "carousel");

  slideDataUrls.forEach((dataUrl, idx) => {
    const slide = deck.slides[idx];
    const role = slide?.type || `slide-${idx + 1}`;
    const filename = `${String(idx + 1).padStart(2, "0")}-${role}.png`;
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    folder?.file(filename, base64Data, { base64: true });
  });

  // Also include a metadata.txt with title and caption
  const metaContent = `Title: ${deck.title}\nAspect Ratio: ${deck.aspectRatio}\nSlides: ${deck.slides.length}\n\nCaption:\n${deck.caption}\n`;
  folder?.file("post-caption.txt", metaContent);

  return await zip.generateAsync({ type: "blob" });
}

export async function exportCarouselToPdf(
  deck: CarouselDocument,
  slideDataUrls: string[]
): Promise<Blob> {
  validateAssets(deck,slideDataUrls);
  const {default:jsPDF}=await import("jspdf");
  const dims = ASPECT_RATIO_DIMENSIONS[deck.aspectRatio];
  const isLandscape = dims.width > dims.height;

  // Create jsPDF document in points matching the pixel ratio
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "px",
    format: [dims.width, dims.height],
    hotfixes: ["px_scaling"],
  });

  slideDataUrls.forEach((dataUrl, idx) => {
    if (idx > 0) {
      pdf.addPage([dims.width, dims.height], isLandscape ? "landscape" : "portrait");
    }
    pdf.addImage(dataUrl, "PNG", 0, 0, dims.width, dims.height, undefined, "FAST");
  });

  return pdf.output("blob");
}

function validateAssets(deck:CarouselDocument,urls:string[]){
 if(urls.length!==deck.slides.length || !urls.length)throw Error('Export requires every slide in order');
 if(urls.some(url=>!url.startsWith('data:image/png;base64,')))throw Error('Export requires PNG assets');
}
