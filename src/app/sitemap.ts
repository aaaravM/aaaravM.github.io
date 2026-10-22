import type { MetadataRoute } from "next";

import { ALL_PROJECTS } from "@/lib/content";

export const dynamic = "force-static";

const BASE = "https://aaaravm.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${BASE}/` }, ...ALL_PROJECTS.map((p) => ({ url: `${BASE}/projects/${p.slug}/` }))];
}
