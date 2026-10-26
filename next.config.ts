import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // README opens the dev server on 127.0.0.1. Next blocks dev assets from
  // that host unless it is listed, and the admin form then cannot sign in.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Cloned request bodies default to 10MB. Project videos are allowed up to 80MB.
    proxyClientMaxBodySize: "84mb",
  },
};

export default nextConfig;
