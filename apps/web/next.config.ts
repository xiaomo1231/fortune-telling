import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moxing/engine", "@moxing/reading", "@moxing/card-art"],
  serverExternalPackages: ["@prisma/client"],
  poweredByHeader: false,
  output: "standalone",
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
