import { AdminApp } from "@/components/portfolio/admin/admin-app";
import { LoginForm } from "@/components/portfolio/admin/login-form";
import { FloatingControls } from "@/components/portfolio/floating-controls";
import { isAdminSession } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/admin-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAdminSession();
  if (!authed) {
    return (
      <>
        <LoginForm />
        <FloatingControls />
      </>
    );
  }

  const data = await getAdminData();
  if (!data.settings) {
    return (
      <main className="min-h-screen bg-surface-page px-4 py-10">
        <p className="text-body text-text-primary">
          Нет настроек сайта. Запустите npm run db:seed.
        </p>
      </main>
    );
  }

  return (
    <>
      <AdminApp
        settings={data.settings}
        companies={data.companies}
        projects={data.projects}
      />
      <FloatingControls />
    </>
  );
}
