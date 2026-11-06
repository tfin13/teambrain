import path from "node:path";
import type { NextConfig } from "next";

// Pin the project root so Next doesn't pick up a stray package-lock.json
// in a parent folder and treat that folder as the workspace root.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;
