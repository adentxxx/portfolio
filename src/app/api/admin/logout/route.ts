import { ADMIN_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    ...sessionCookieOptions(request),
    maxAge: 0,
  });
  return response;
}
