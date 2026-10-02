# Browser extracts PDF text and drives batched ingestion

FastAPI stays on Vercel's free tier, whose Functions cap request bodies at 4.5 MB and run time at 300 s — too small for a book PDF uploaded and embedded in one request. So the browser extracts text page by page (pdf.js) and drives ingestion as a series of small requests: create the Source, send page batches that FastAPI chunks, embeds and stores synchronously, then mark it complete. The original PDF is never uploaded or stored.

## Considered Options

- Long-running container host (Render, Railway, Fly): removes both limits, but the free tiers sleep or cost money, and the project should stay on Vercel for free.
- Direct-to-storage upload plus a queue: correct, but adds two services for a two-week v1.

## Consequences

- If the user closes the tab mid-ingestion, the Source never completes; it is removed automatically and must be re-added (no resume in v1).
- Citations can show Chunk text and page numbers, but cannot open the original PDF.
