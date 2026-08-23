import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    : "https://audit.aftabkhan.net";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
