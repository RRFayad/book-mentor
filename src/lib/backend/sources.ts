import "server-only";

import {
  createSourceResponseSchema,
  getSourcesResponseSchema,
} from "@app/shared/schemas";
import axios from "axios";

import { getAuthenticatedBackendClient } from "@/lib/backend/client";
import { getMockStore } from "@/lib/backend/mock/store";
import type {
  AddSourceResult,
  NewSource,
  PageBatch,
  Source,
} from "@/lib/backend/types";

// Parsing with the shared schema turns the JSON dates back into Date objects.
export const listSources = async (): Promise<Source[]> => {
  const backend = await getAuthenticatedBackendClient();
  const { data } = await backend.get("/sources");

  return getSourcesResponseSchema.parse(data);
};

// How many Conversations use each Source, by Source id. Still from the mock
// Conversations until they have an API (#19).
export const countConversationsBySource = async (): Promise<
  Record<string, number>
> => {
  const counts: Record<string, number> = {};

  for (const conversation of getMockStore().conversations) {
    for (const source of conversation.sources) {
      counts[source.id] = (counts[source.id] ?? 0) + 1;
    }
  }

  return counts;
};

// Removes the Source from the Library. Its Conversations keep it as an
// expired Source, exactly as after its Expiry.
export const deleteSource = async (sourceId: string): Promise<boolean> => {
  try {
    const backend = await getAuthenticatedBackendClient();

    await backend.delete(`/sources/${encodeURIComponent(sourceId)}`);
  } catch (error) {
    console.error("Failed to delete a Source in the API", error);

    return false;
  }

  // Until Conversations have an API (#19), the mock ones mark it expired.
  for (const conversation of getMockStore().conversations) {
    for (const source of conversation.sources) {
      if (source.id === sourceId) {
        source.expired = true;
      }
    }
  }

  return true;
};

// Sends one batch of a book's pages (POST /sources/{id}/pages, ADR 0001).
export const sendPageBatch = async (
  sourceId: string,
  batch: PageBatch,
): Promise<boolean> => {
  try {
    const backend = await getAuthenticatedBackendClient();

    await backend.post(`/sources/${encodeURIComponent(sourceId)}/pages`, batch);

    return true;
  } catch (error) {
    console.error("Failed to send a page batch to the API", error);

    return false;
  }
};

// Marks a book Ready once all its pages were sent (POST /sources/{id}/complete).
export const completeSource = async (sourceId: string): Promise<boolean> => {
  try {
    const backend = await getAuthenticatedBackendClient();

    await backend.post(`/sources/${encodeURIComponent(sourceId)}/complete`);

    return true;
  } catch (error) {
    console.error("Failed to complete a Source in the API", error);

    return false;
  }
};

// Creates a Source in the API (POST /sources, docs/api-contract.md). The file
// name stays in the browser; only what the contract lists is sent.
export const createSource = async (
  input: NewSource,
): Promise<AddSourceResult> => {
  const body =
    input.kind === "book"
      ? {
          kind: input.kind,
          title: input.title,
          author: input.author,
          pageCount: input.pageCount,
        }
      : {
          kind: input.kind,
          address: input.address,
          title: input.title,
          author: input.author,
        };

  try {
    const backend = await getAuthenticatedBackendClient();
    const { data } = await backend.post("/sources", body);

    return createSourceResponseSchema.parse(data);
  } catch (error) {
    const detail = axios.isAxiosError(error) && error.response?.data?.detail;

    if (detail === "too-large") {
      return { status: "rejected", reason: "too-large" };
    }

    if (detail === "limit-reached") {
      return { status: "limit-reached" };
    }

    console.error("Failed to create a Source in the API", error);

    return { status: "failed" };
  }
};
