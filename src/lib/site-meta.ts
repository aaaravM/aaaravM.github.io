import type { Metadata } from "next";

export const SITE_URL = "https://aaaravm.github.io";
export const SITE_TITLE = "Aarav Muttanapalli — AI / ML Engineer";
export const SITE_DESCRIPTION =
  "Aarav Muttanapalli builds intelligent systems end to end: multi-agent LLM platforms, deep-RL tutors and vision models. Founder of logrthm.ai.";

const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Aarav Muttanapalli — portfolio" };

/** Next replaces `openGraph` / `twitter` wholesale per page, so every page builds from these. */
export function socialMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Aarav Muttanapalli", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
