import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./audit-progress.css";
import "./audit-report.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["italic"],
  display: "swap",
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "AI UX Audit Lite",
    template: "%s | AI UX Audit Lite",
  },
  description: "Upload an interface screenshot and receive a structured AI-assisted UX review.",
  applicationName: "AI UX Audit Lite",
  authors: [{ name: "Aftab Khan" }],
  creator: "Aftab Khan",
  keywords: ["UX audit", "AI UX review", "accessibility", "frontend engineering", "product design"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "AI UX Audit Lite",
    description: "A focused AI-assisted UX review tool for interface screenshots.",
    siteName: "AI UX Audit Lite",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI UX Audit Lite",
    description: "A focused AI-assisted UX review tool for interface screenshots.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
