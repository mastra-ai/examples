import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import CopyPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [
        ...config.plugins,
        new PrismaPlugin(),
        new CopyPlugin({
          patterns: [
            {
              from: "./node_modules/@mastra/core/node_modules/@prisma-app/",
              to: "./node_modules/@prisma-app/",
            },
          ],
        }),
      ];
    }

    return config;
  },
  outputFileTracingIncludes: {
    "**/*": ["./mastra/**/*"],
  },
};

export default nextConfig;
