// Next's dev server compiles modules with eval-based source maps and drives
// Fast Refresh through eval, so without 'unsafe-eval' the client bundle never
// executes locally and nothing hydrates — every button is inert. Production
// keeps the strict policy; this widening applies to `next dev` only.
const isDev = process.env.NODE_ENV === "development";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Produces a minimal standalone server bundle for Docker deployments.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  async redirects() {
    return [
      // The working calculators moved into the authenticated app. Their public
      // URLs were indexed, so they point at the marketing page that replaced
      // them; signed-in users are taken on to the tool by the CTA there.
      { source: "/calculators/import-duty", destination: "/calculators", permanent: true },
      { source: "/calculators/shipping", destination: "/calculators", permanent: true },
      { source: "/calculators/financing", destination: "/calculators", permanent: true },
      { source: "/calculators/taxes", destination: "/calculators", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // Force HTTPS for two years, including subdomains.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content-Security-Policy. Scripts are restricted to our own origin
          // (no external script hosts) — 'unsafe-inline' is required for the
          // App Router's inline hydration payload and is compatible with our
          // static/ISR pages (a per-request nonce is not). The actual XSS vector
          // (JSON-LD) is closed at the source via safeJsonLd(), and React
          // escapes all other output. Everything else is locked down.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self' data:",
              "media-src 'self' blob: https:",
              // api.cloudinary.com: browser-side image uploads (XHR).
              "connect-src 'self' https://api.cloudinary.com",
              // Allow embedding YouTube / Vimeo players for listing videos.
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
              "form-action 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
