import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the admin's Supabase session alive.
 *
 * `getAdminUser()` runs inside Server Components, which cannot set cookies, so
 * its `setAll` is necessarily a no-op. That means a refreshed access token was
 * never written back: once the original token expired (~1 hour) every admin
 * page redirected to /admin/login even though the password was correct.
 * The proxy (formerly "middleware" — renamed in Next 16) is the one place in
 * the request lifecycle that can both read the request cookies and write them
 * onto the response, so the refresh happens here and the rest of the app just
 * reads a valid cookie.
 */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return res; // not configured yet — don't block the app

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  // Touching getUser() is what triggers the refresh-and-persist.
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
