import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Windows dev environments can hit a sharp/WebP native-binary failure
    // that causes /_next/image to 400 on certain files. Bypassing the
    // optimizer in development sidesteps that entirely. Production (Linux,
    // e.g. Render) doesn't hit this, so keep real optimization there —
    // responsive resizing and format conversion are worth having for real
    // traffic, not just a local convenience to give up permanently.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source:
          "/.well-known/apple-developer-merchantid-domain-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/text",
          },
        ],
      },
    ];
  },
};

export default nextConfig;