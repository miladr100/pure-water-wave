import type { NextConfig } from "next";

const ngrokHost = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  ...(ngrokHost && { allowedDevOrigins: ["8821-179-177-143-156.ngrok-free.app"] }),
};

export default nextConfig;
