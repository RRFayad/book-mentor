# Drizzle-owned chunks table, accessed through LangChain PGVectorStore

Chunk embeddings live in a `chunks` table defined in the Drizzle schema like every other table, with real columns for its Source and owner and a foreign key that cascades on Source deletion. FastAPI reads and writes it through langchain-postgres `PGVectorStore` pointed at that existing table (custom id/content/embedding columns and `metadata_columns`), never letting LangChain create tables.

## Considered Options

- Legacy LangChain `PGVector`: deprecated, creates its own tables outside Drizzle, and stores Source and owner in a JSON blob without foreign keys.
- Hand-written SQL retriever: maximum control, but less of the standard LangChain path this project is meant to practise.
