# Drizzle-owned chunks table, searched exactly per book

> History: FastAPI + LangChain `PGVectorStore` → Alembic (ADR 0005) → back to Drizzle with Fastify (ADR 0006). Updated 2026-11-13 to match the code.

- **The table:** `chunks` in the Drizzle schema, like every table.
  - `source_id` → sources, `ON DELETE CASCADE`.
  - A real `page` column, `content`, and a pgvector `embedding` (1536, `text-embedding-3-small`).
  - `notes` is built the same way.
- **Access:** Drizzle, directly.
  - Ingestion: `@langchain/openai` embeds; the API inserts, replacing a batch in one transaction.
  - Retrieval: a book's chunks ordered by `cosineDistance(embedding, query)`.
- **No vector index:** each search covers one book (~400–1,500 chunks), compared exactly via the `source_id` index.
  - HNSW was dropped (migration 0014): it ranks every book's chunks first and filters by book after → a book can get few or no passages.

## Considered Options

- **LangChain `PGVectorStore`:** the standard path, but a layer over a few lines of Drizzle, on a schema that's ours anyway.
- **Legacy LangChain `PGVector`:** creates its own tables; the Source sits in JSON, with no foreign key.
- **HNSW + iterative scans** (pgvector 0.8+): keeps the index, still approximate; worth it only at hundreds of thousands of vectors per search.

## Consequences

- Deleting a Source deletes its chunks and Notes. Expiry's daily job deletes them too, and keeps the Source row.
- A search across many books at once would need an index again, with iterative scans.
