import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "portfolio_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "demo-admin"
  );
}

function digest(value: string) {
  return createHmac("sha256", "portfolio-admin-compare").update(value).digest();
}

export function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export function expectedLogin() {
  return process.env.ADMIN_LOGIN ?? "admin";
}

export function expectedPassword() {
  return process.env.ADMIN_PASSWORD ?? "demo-admin";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + ADMIN_COOKIE_MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    return false;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function readSessionCookie(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== ADMIN_COOKIE) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return null;
}

export function assertAdmin(request: Request) {
  if (!verifySessionToken(readSessionCookie(request))) {
    return new Response("Нужно войти", { status: 401 });
  }
  return null;
}

export async function isAdminSession() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}
