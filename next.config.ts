import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        // Covers both public (/public/**) and signed (/sign/**) URLs
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
