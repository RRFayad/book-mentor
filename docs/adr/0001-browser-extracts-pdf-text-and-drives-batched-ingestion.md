# Browser extracts PDF text and drives batched ingestion

> Written for the FastAPI backend; holds unchanged for the Fastify API (ADR 0006).

- **Why:** the API is on Vercel's free tier: 4.5 MB request bodies, 300 s per call. Too small to upload and embed a book in one request.
- **Decision:** the browser reads the PDF (pdf.js) and drives ingestion in small requests:
  1. create the Source;
  2. send batches of 25 pages (3 at a time) → the API chunks, embeds, stores them, and writes their Notes;
  3. mark it complete → the API writes the One Page.
- The PDF itself is never uploaded or stored.

## Considered Options

- **A container host** (Render, Railway, Fly): no limits, but free tiers sleep or cost money.
- **Direct upload to storage + a queue:** correct, but two more services for a two-week v1.

## Consequences

- Closing the tab mid-ingestion → the Source never completes; re-add it (no resume).
  - Plan: removed automatically. v1: stays Ingesting until deleted or expired.
- Citations show the passage text and page, but can't open the original PDF.
