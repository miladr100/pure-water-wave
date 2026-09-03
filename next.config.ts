import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const require = createRequire(import.meta.url);

const PROMISE_WITH_RESOLVERS_POLYFILL =
  'if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}}}';

function copyPdfWorkerToPublic() {
  const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
  const legacyWorker = path.join(
    pdfjsDistPath,
    "legacy",
    "build",
    "pdf.worker.min.mjs",
  );
  const modernWorker = path.join(pdfjsDistPath, "build", "pdf.worker.min.mjs");
  const source = existsSync(legacyWorker) ? legacyWorker : modernWorker;
  const dest = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
  writeFileSync(
    dest,
    `${PROMISE_WITH_RESOLVERS_POLYFILL}\n${readFileSync(source, "utf8")}`,
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
