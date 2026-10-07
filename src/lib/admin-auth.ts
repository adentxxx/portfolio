export function assertAdmin(request: Request) {
  const expected = process.env.ADMIN_PASSWORD ?? "demo-admin";
  const provided = request.headers.get("x-admin-password");
  if (!provided || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
