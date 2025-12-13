import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    domains: ["via.placeholder.com", "res.cloudinary.com"], // Add more if needed
  },

  async rewrites() {
    return [
      {
        source: "/api/:path",
        destination: "http://localhost:8080/api/:path*", 
      },
    ];
  },
};

export default nextConfig;
