import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Server-to-server endpoints: PayHere and the scheduler send no browser Origin header.
// They authenticate with a signature or a secret instead.
const SKIP_ORIGIN_CHECK = ["/api/payhere/notify", "/api/cron/"];

function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client (curl, server-to-server)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function guard(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF defence in depth, on top of SameSite=Lax cookies
  if (
    pathname.startsWith("/api/") &&
    UNSAFE_METHODS.has(req.method) &&
    !SKIP_ORIGIN_CHECK.some((p) => pathname.startsWith(p)) &&
    !isSameOrigin(req)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) return NextResponse.next();

  // First layer of admin protection; handlers re-check with requireAdmin()
  const token = req.cookies.get("pp_session")?.value;
  let role: string | null = null;
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), {
        algorithms: ["HS256"],
      });
      role = payload.role as string;
    } catch {}
  }

  if (pathname.startsWith("/api/admin")) {
    if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.next();
  }

  if (role !== "ADMIN") {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };

export const proxy = guard; // Next 16 uses the name `proxy`