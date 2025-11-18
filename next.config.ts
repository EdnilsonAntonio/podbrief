import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // Garantir que os arquivos do Prisma sejam incluídos no deploy
  outputFileTracingIncludes: {
    "/api/**": ["./lib/generated/prisma/**/*"],
  },
};

export default nextConfig;
