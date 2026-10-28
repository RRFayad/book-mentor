import "server-only";

import {
  createSourceResponseSchema,
  getSourcesResponseSchema,
} from "@app/shared/schemas";
import axios from "axios";
import { unstable_rethrow } from "next/navigation";

import { getAuthenticatedBackendClient } from "@/lib/backend/client";
import { callBackend } from "@/lib/backend/call-backend";
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

// How many Conversations use each Source, by Source id
// (GET /sources/conversation-counts, arriving in #19). Until then: none.
export const countConversationsBySource = async (): Promise<
  Record<string, number>
> =>
  callBackend("count Conversations by Source", {}, async (backend) => {
    const { data } = await backend.get<Record<string, number>>(
      "/sources/conversation-counts",
    );

    return data;
  });

// Removes the Source from the Library. Its Conversations keep it as an
// expired Source, exactly as after its Expiry.
export const deleteSource = async (sourceId: string): Promise<boolean> => {
  try {
    const backend = await getAuthenticatedBackendClient();

    await backend.delete(`/sources/${encodeURIComponent(sourceId)}`);
  } catch (error) {
    unstable_rethrow(error);

    console.error("Failed to delete a Source in the API", error);

    return false;
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
    unstable_rethrow(error);

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
    unstable_rethrow(error);

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
    unstable_rethrow(error);

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
