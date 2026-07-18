import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/mcp/"],
    },
    sitemap: "https://postplanify.com/sitemap.xml",
  };
}
