"use server";

import type { DashboardResponse } from "@app/shared/schemas";

import { fetchBackendData } from "./client";

// Sample endpoint; its response shape is defined in @app/shared/schemas.
export const fetchDashboardData =
  async (): Promise<DashboardResponse | null> => {
    return fetchBackendData<DashboardResponse>("/dashboard");
  };
