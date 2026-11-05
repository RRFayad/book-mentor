import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@app/shared/constants";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// Both read OPENAI_API_KEY from the environment.

// Ingestion and retrieval share it: question and chunk vectors are only
// comparable when embedded the same way.
export const embeddingModel = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
});

export const chatModel = new ChatOpenAI({
  model: "gpt-6-luna",
});
