"use client";

import { adminJson } from "@/components/portfolio/admin/api";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/portfolio/admin/fields";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await adminJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10">
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event);
        }}
        className="w-full max-w-[420px] space-y-4 rounded-[32px] border border-border-subtle bg-surface-card p-6"
      >
        <div className="space-y-1">
          <h1 className="text-title1 text-text-primary">Админка</h1>
          <p className="text-subheadline text-text-secondary">
            Войдите, чтобы менять сайт.
          </p>
        </div>
        <label className="block">
          <span className="text-caption1 text-text-muted">Логин</span>
          <input
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-caption1 text-text-muted">Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </label>
        {error ? (
          <p role="alert" className="text-subheadline text-accent-information">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Вхожу…" : "Войти"}
        </Button>
      </form>
    </main>
  );
}
