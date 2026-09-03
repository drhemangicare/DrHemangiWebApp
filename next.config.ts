import type { NextConfig } from "next";

// The app previously shipped with no security headers at all. These are the
// ones that actually matter for a site that takes card payments and stores
// medical records.
//
// CSP notes:
//  - Razorpay Checkout injects an iframe and its own scripts, so
//    checkout.razorpay.com / *.razorpay.com must be allowed in script-src,
//    frame-src and connect-src, or payment breaks.
//  - 'unsafe-inline' is still required for style-src: the design uses inline
//    style attributes throughout and Next injects inline styles of its own.
//  - frame-ancestors 'none' is the modern X-Frame-Options; both are sent
//    because some scanners and older proxies only understand the latter.
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  // Next's dev overlay needs eval; production does not.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com https://*.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://*.razorpay.com https://api.razorpay.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  // the floating dev badge sits on top of the hero's chapter strip on a phone
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Patient records and the admin dashboard must never be cached by a
      // shared proxy or left in the browser's back/forward cache.
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/:path*", headers: noStore },
      { source: "/bookings", headers: noStore },
    ];
  },
};

export default nextConfig;
