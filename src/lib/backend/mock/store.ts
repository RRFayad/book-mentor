import "server-only";

import {
  createMockData,
  mockScenarios,
  type MockData,
  type MockScenario,
} from "@/lib/backend/mock/data";
import { getEnvVar } from "@/lib/utils";

// In-memory mock store for the frontend phase (issue #14). Only functions in
// the backend module read or change it. Restarting the dev server resets it.

const readScenario = (): MockScenario => {
  const value = getEnvVar("MOCK_SCENARIO", false) ?? "default";

  if (!mockScenarios.includes(value as MockScenario)) {
    throw new Error(
      `MOCK_SCENARIO must be one of: ${mockScenarios.join(", ")}`,
    );
  }

  return value as MockScenario;
};

// Kept on globalThis so dev hot reloads do not reset the store.
const globalForMockStore = globalThis as { bookMentorMockStore?: MockData };

export const getMockStore = (): MockData => {
  globalForMockStore.bookMentorMockStore ??= createMockData(
    readScenario(),
    new Date(),
  );

  return globalForMockStore.bookMentorMockStore;
};
