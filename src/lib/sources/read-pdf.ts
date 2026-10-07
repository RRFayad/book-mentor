import type { PageText } from "@/lib/backend/types";
import { pageTextFromItems } from "@/lib/sources/pdf-pages";

// pdf.js runs its parsing in a web worker. The worker file is copied into
// public/ on install (scripts/copy-pdf-worker.mjs).
const PDF_WORKER_URL = "/pdf.worker.min.mjs";

export type PdfBook = {
  pageCount: number;
  // From the PDF's details, when it has them.
  title: string;
  author: string;
  pages: PageText[];
};

const metadataText = (info: unknown, key: "Title" | "Author"): string => {
  const value = (info as Record<string, unknown> | null)?.[key];

  return typeof value === "string" ? value.trim() : "";
};

// Reads a PDF in the browser, page by page. The file never leaves the
// browser (ADR 0001). `onPage` reports progress while reading.
export const readPdf = async (
  file: File,
  onPage?: (page: number, pageCount: number) => void,
): Promise<PdfBook> => {
  // Loaded only when a PDF is chosen, and only in the browser.
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const document = await loadingTask.promise;

  try {
    const { info } = await document.getMetadata();
    const pages: PageText[] = [];

    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const pieces = content.items.flatMap((item) =>
        "str" in item ? [{ str: item.str, hasEOL: item.hasEOL }] : [],
      );

      pages.push({ page: number, text: pageTextFromItems(pieces) });
      page.cleanup();
      onPage?.(number, document.numPages);
    }

    return {
      pageCount: document.numPages,
      title: metadataText(info, "Title"),
      author: metadataText(info, "Author"),
      pages,
    };
  } finally {
    // Frees the worker's memory for this file.
    await loadingTask.destroy();
  }
};
