import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-00620ab8-5b25-4208-add0-264e631579ed.space-z.ai',
  ],
};

export default nextConfig;
