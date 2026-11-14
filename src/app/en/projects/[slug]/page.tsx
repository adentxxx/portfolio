import {
  ProjectView,
  projectMetadata,
} from "@/components/portfolio/project-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return projectMetadata(slug, "en");
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProjectView slug={slug} locale="en" />;
}
