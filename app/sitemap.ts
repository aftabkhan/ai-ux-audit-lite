import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    : "https://audit.aftabkhan.net";

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
