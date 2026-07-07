import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const ngrokHost = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  ...(ngrokHost && { allowedDevOrigins: ["ca18-2804-7f3-4a14-3eef-fc15-ffac-6543-b66a.ngrok-free.app"] }),
  serverExternalPackages: ["pdfjs-dist"],
  turbopack: {},
};

export default withSerwist(nextConfig);
