import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

const AUTH_ROUTES = ["/dang-nhap", "/dang-ky"];
const APP_ROUTES = ["/tong-quan", "/phan-tich", "/giao-dich", "/tai-khoan", "/ca-nhan"];

export async function proxy(request: NextRequest) {
  // Zero-config behavior: without Supabase env vars, the app works exactly
  // as it always has, with no login gate at all.
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  const isAppRoute = APP_ROUTES.some((p) => pathname.startsWith(p));

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL("/dang-nhap", request.url));
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/tong-quan", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)"],
};
