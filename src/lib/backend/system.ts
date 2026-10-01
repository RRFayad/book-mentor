"use server";

import { backendClient } from "./client";

export type HealthStatus = {
  status: string;
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const response = await backendClient.get<HealthStatus>("/healthy");
  return response.data;
};
