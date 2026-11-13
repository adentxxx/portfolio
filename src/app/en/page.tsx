import { HomeView, homeMetadata } from "@/components/portfolio/home-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = homeMetadata("en");

export default function HomePage() {
  return <HomeView locale="en" />;
}
