import type { NextConfig } from "next";

const ngrokHost = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  ...(ngrokHost && { allowedDevOrigins: ["e4d0-187-59-103-98.ngrok-free.app"] }),
};

export default nextConfig;
