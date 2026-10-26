"use client";

export class AdminHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminHttpError";
    this.status = status;
  }
}

async function readError(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // The route answered with plain text.
  }
  return text || "Не удалось выполнить запрос";
}

export async function adminJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new AdminHttpError(response.status, await readError(response));
  }
  return (await response.json()) as T;
}

export function isUnauthorized(error: unknown) {
  return error instanceof AdminHttpError && error.status === 401;
}

export async function uploadAdminFile(file: File, kind?: "image" | "video") {
  const body = new FormData();
  body.set("file", file);
  const url = kind ? `/api/admin/upload?kind=${kind}` : "/api/admin/upload";
  const response = await fetch(url, { method: "POST", body });
  if (!response.ok) {
    throw new AdminHttpError(response.status, await readError(response));
  }
  const data = (await response.json()) as { src: string };
  return data.src;
}
