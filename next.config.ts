import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/terms",
        destination: "/help#full-terms",
        permanent: false,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: false,
      },
      {
        source: "/account",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
