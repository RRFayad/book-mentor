"use server";

import { backendClient } from "./client";

export type HealthStatus = {
  status: string;
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const response = await backendClient.get<HealthStatus>("/healthcheck");
  return response.data;
};
