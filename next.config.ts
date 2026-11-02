import type { NextConfig } from "next";

// CDN asset prefix used only when Next.js is served through a legacy-domain\n// Vercel rewrite. Keep the Vercel-native release unchanged.\nconst bridgeAssetOrigin = process.env.THIESTO_PUBLIC_ASSET_ORIGIN?.trim() || undefined;\n\nconst nextConfig: NextConfig = {\n  assetPrefix: bridgeAssetOrigin,
  images: {\n    // Image optimization URLs are not affected by assetPrefix. During the\n    // temporary bridge, render image URLs directly to avoid collisions with\n    // legacy Vercel /_next/image handlers.\n    unoptimized: Boolean(bridgeAssetOrigin),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/r/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex",
          },
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
