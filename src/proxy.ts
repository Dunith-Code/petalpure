import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function guard(req: NextRequest) {
  const { pathname } = req.nextUrl;
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

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

// Keep ONE of these, depending on your Next version:
export const proxy = guard;        // Next 16 -> file must be src/proxy.ts
// export const middleware = guard; // Next 15 -> file must be src/middleware.ts