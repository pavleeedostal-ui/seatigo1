import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Outbound redirect endpoint — nothing to index, and crawling it would
      // just spend crawl budget hitting third-party seller sites.
      disallow: "/go/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
