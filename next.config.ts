import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Moved from experimental.serverComponentsExternalPackages in Next.js 16
  serverExternalPackages: ["@prisma/client"],
  // Garantir que os arquivos do Prisma sejam incluídos no deploy
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
