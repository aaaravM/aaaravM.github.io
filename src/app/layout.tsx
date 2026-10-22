import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelCircle,
  GeistPixelGrid,
  GeistPixelLine,
  GeistPixelSquare,
  GeistPixelTriangle,
} from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";

import { SiteShell } from "@/components/chrome/site-shell";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, socialMeta } from "@/lib/site-meta";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s — Aarav Muttanapalli" },
  description: SITE_DESCRIPTION,
  ...socialMeta({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" }),
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const fonts = [
  GeistSans.variable,
  GeistMono.variable,
  GeistPixelSquare.variable,
  GeistPixelGrid.variable,
  GeistPixelCircle.variable,
  GeistPixelTriangle.variable,
  GeistPixelLine.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${fonts}`} suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
