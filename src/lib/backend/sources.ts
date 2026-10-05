import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { Source } from "@/lib/backend/types";

export const listSources = async (): Promise<Source[]> =>
  getMockStore().sources.map((source) => ({ ...source }));
