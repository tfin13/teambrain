import path from "node:path";
import type { NextConfig } from "next";

// Pin the project root so Next doesn't pick up a stray package-lock.json
// in a parent folder and treat that folder as the workspace root.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  // unpdf ships a prebuilt pdf.js that uses bare `import.meta`; load it from node_modules
  // at runtime instead of bundling it (avoids a "Critical dependency" build warning).
  serverExternalPackages: ["unpdf"],
  experimental: {
    // Server Actions default to a 1 MB body; uploads are capped at 5 MB, plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
    // shadcn's Button imports the `radix-ui` barrel; without this, using Button in a
    // server component ships every Radix client component to the browser.
    optimizePackageImports: ["radix-ui"],
  },
};

export default nextConfig;
