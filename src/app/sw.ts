/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Safari iOS corrupts Range requests that go through a service worker.
// Let the browser fetch library PDFs natively.
self.addEventListener(
  "fetch",
  (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith("/api/biblioteca/pdf/")) {
      event.stopImmediatePropagation();
    }
  },
  { capture: true },
);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/api/biblioteca/") &&
        !url.pathname.startsWith("/api/biblioteca/pdf/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
