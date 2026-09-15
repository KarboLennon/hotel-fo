import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `next build` re-runs ESLint and tsc by default, which costs ~50s on the 1-vCPU server for
  // checks the pipeline already ran (`npm run lint` and `npx tsc --noEmit` in the test job, and
  // `npm run typecheck` locally). Skipping them here removes the duplicate work, not the check.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
