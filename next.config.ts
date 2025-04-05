import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      "https://peaceful-panda-secondly.ngrok-free.app",
      "*.ngrok-free.app",
    ],
  },
};

module.exports = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
};

export default nextConfig;
