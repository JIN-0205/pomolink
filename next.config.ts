import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  experimental: {
    allowedDevOrigins: [
      "https://intent-insect-jointly.ngrok-free.app",
      "https://www.pomolink.net",
      "*.pomolink.net",
      // "*.ngrok-free.app",

      "local-origin.dev",
      "*.local-origin.dev",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  webpack: (config, { isServer }) => {
    // クライアントサイドでのNode.jsモジュール解決問題を修正
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Google Cloud/Firebase関連の問題モジュールを無効化
        stream: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        worker_threads: false,
      };

      // Node.jsのpolyfillを無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        // Node.js内部モジュールを空のモジュールにマッピング
        stream: false,
        http: false,
        https: false,
        net: false,
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
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
          // Stripe.js読み込みのためにCOEPを無効化
          // { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;
