import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@app/shared/constants";
import { OpenAIEmbeddings } from "@langchain/openai";

// Ingestion and retrieval share it / Reads OPENAI_API_KEY from the environment
export const embeddingModel = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
});
