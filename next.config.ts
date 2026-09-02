import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const require = createRequire(import.meta.url);

function copyPdfWorkerToPublic() {
  const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
  copyFileSync(
    path.join(pdfjsDistPath, "build", "pdf.worker.min.mjs"),
    path.join(process.cwd(), "public", "pdf.worker.min.mjs"),
  );
}

copyPdfWorkerToPublic();

const ngrokHost = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  ...(ngrokHost && { allowedDevOrigins: ["ca18-2804-7f3-4a14-3eef-fc15-ffac-6543-b66a.ngrok-free.app"] }),
  serverExternalPackages: ["pdfjs-dist"],
  turbopack: {},
  async headers() {
    return [
      {
        source: "/pdf.worker.min.mjs",
        headers: [
          {
            key: "Content-Type",
            value: "text/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
