"use client";

import "@/lib/promise-with-resolvers-polyfill";
import { pdfjs } from "react-pdf";

// Legacy worker + polyfill: modern pdf.worker.mjs needs Safari 17.4+.
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;
