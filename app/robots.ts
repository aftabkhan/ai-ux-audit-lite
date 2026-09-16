import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const protectedMode = process.env.PRODUCT_LAB_PROTECTED === "true";
  const siteUrl = process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    : "https://audit.aftabkhan.net";

  if (protectedMode) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
