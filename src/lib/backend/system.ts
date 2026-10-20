"use server";

import type { HealthcheckResponse } from "@app/shared/schemas";

import { backendClient } from "./client";

export const getHealthStatus = async (): Promise<HealthcheckResponse> => {
  const response = await backendClient.get<HealthcheckResponse>("/healthcheck");
  return response.data;
};
