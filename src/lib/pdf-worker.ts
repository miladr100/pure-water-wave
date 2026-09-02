"use client";

import { pdfjs } from "react-pdf";

// Same-origin worker: iOS Safari blocks cross-origin ESM module workers (unpkg).
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;
