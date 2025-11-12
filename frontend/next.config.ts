import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path", // anything starting with /api
        destination: "http://localhost:8080/api/:path*", //your backend
      },
    ];
  },
};

export default nextConfig;
