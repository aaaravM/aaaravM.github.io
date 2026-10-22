import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectView } from "@/components/project/project-view";
import { ALL_PROJECTS, getProject } from "@/lib/content";
import { socialMeta } from "@/lib/site-meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    ...socialMeta({ title: `${p.name} — Aarav Muttanapalli`, description: p.summary, path: `/projects/${slug}/` }),
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return <ProjectView slug={slug} />;
}
