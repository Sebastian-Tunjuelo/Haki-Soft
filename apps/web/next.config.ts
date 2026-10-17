import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@taskstream/shared-schemas'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        buffer: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
