import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@taskstream/shared-schemas'],
};

export default nextConfig;
