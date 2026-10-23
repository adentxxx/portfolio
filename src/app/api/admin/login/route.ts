import {
  createSessionToken,
  expectedLogin,
  expectedPassword,
  safeEqual,
  sessionCookieOptions,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    login?: unknown;
    password?: unknown;
  } | null;
  const login = typeof body?.login === "string" ? body.login : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const loginOk = safeEqual(login, expectedLogin());
  const passwordOk = safeEqual(password, expectedPassword());
  if (!loginOk || !passwordOk) {
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_COOKIE,
    createSessionToken(),
    sessionCookieOptions(request),
  );
  return response;
}
