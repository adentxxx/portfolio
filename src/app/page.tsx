import { HomeView, homeMetadata } from "@/components/portfolio/home-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = homeMetadata("ru");

export default function HomePage() {
  return <HomeView locale="ru" />;
}
