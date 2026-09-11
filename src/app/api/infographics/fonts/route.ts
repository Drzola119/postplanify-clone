import { studioFonts } from "@/lib/infographic-studio/fonts";
export const runtime = "nodejs";
export async function GET() {
  const { css } = await studioFonts();
  return new Response(css, {
    headers: {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
