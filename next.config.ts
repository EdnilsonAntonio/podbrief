import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

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

export default withNextIntl(nextConfig);
