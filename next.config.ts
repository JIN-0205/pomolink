import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  experimental: {
    allowedDevOrigins: [
      "https://peaceful-panda-secondly.ngrok-free.app",
      "*.ngrok-free.app",
      "https://intent-insect-jointly.ngrok-free.app",
      "https://tyler-commons-inclusive-jazz.trycloudflare.com",
      "*.trycloudflare.com",
      "local-origin.dev",
      "*.local-origin.dev",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  // クロスオリジン分離
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
