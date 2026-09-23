import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev assets/HMR when opened via the Tailscale IP
  allowedDevOrigins: ["100.99.75.85"],
};

export default nextConfig;
