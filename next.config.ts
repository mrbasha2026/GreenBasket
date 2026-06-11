import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-00620ab8-5b25-4208-add0-264e631579ed.space-z.ai',
    '127.0.0.1',
    'localhost',
    '21.0.11.206',
    '21.0.16.176',
  ],
};

export default nextConfig;
