import path from "node:path";
import type { NextConfig } from "next";

// Pin the project root so Next doesn't pick up a stray package-lock.json
// in a parent folder and treat that folder as the workspace root.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  experimental: {
    // Server Actions default to a 1 MB body; uploads are capped at 5 MB, plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
